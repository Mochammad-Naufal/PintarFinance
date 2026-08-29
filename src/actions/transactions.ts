"use server";

import { revalidatePath } from "next/cache";
import { sql } from "@/db";
import { getCurrentUser } from "@/lib/supabase/user";
import {
  type ActionResult,
  type Category,
  type Transaction,
  type TransactionFilter,
  type TransactionInput,
  transactionSchema,
} from "@/types/finance";

// ─── Query Categories ─────────────────────────────────────────────────────────

export async function getCategories(
  type?: "expense" | "income"
): Promise<Category[]> {
  try {
    const user = await getCurrentUser();
    const rows = await sql`
      SELECT 
        id,
        user_id,
        name,
        type,
        icon,
        color,
        created_at::text
      FROM categories
      WHERE (user_id = ${user.id} OR user_id IS NULL)
        ${type ? sql`AND type = ${type}` : sql``}
      ORDER BY 
        CASE WHEN user_id = ${user.id} THEN 0 ELSE 1 END,
        name ASC
    `;

    // Deduplicate categories by (type + lower(name)) prioritizing user-specific categories
    const categoryMap = new Map<string, Category>();
    for (const row of rows) {
      const cat: Category = {
        id: row.id as string,
        user_id: row.user_id as string | null,
        name: row.name as string,
        type: row.type as Category["type"],
        icon: row.icon as string,
        color: row.color as string,
        created_at: row.created_at as string,
      };
      const key = `${cat.type}-${cat.name.trim().toLowerCase()}`;
      if (!categoryMap.has(key)) {
        categoryMap.set(key, cat);
      }
    }

    return Array.from(categoryMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name, "id")
    );
  } catch (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
}

// ─── Query Transactions with Joins & Dynamic Filters ──────────────────────────

export async function getTransactions(
  filters?: TransactionFilter
): Promise<Transaction[]> {
  try {
    const user = await getCurrentUser();
    const limit = filters?.limit ?? 50;
    const offset = filters?.offset ?? 0;

    const rows = await sql`
      SELECT 
        t.id,
        t.user_id,
        t.wallet_id,
        t.destination_wallet_id,
        t.category_id,
        t.savings_goal_id,
        t.type,
        t.amount,
        t.admin_fee,
        t.transaction_date::text,
        t.description,
        t.receipt_url,
        t.created_at::text,
        t.updated_at::text,
        t.deleted_at::text,
        -- Joined Source Wallet
        w.name AS wallet_name,
        w.color AS wallet_color,
        w.icon AS wallet_icon,
        -- Joined Destination Wallet
        dw.name AS destination_wallet_name,
        dw.color AS destination_wallet_color,
        dw.icon AS destination_wallet_icon,
        -- Joined Category
        c.name AS category_name,
        c.icon AS category_icon,
        c.color AS category_color,
        -- Joined Savings Goal
        sg.name AS savings_goal_name,
        sg.icon AS savings_goal_icon,
        sg.color AS savings_goal_color
      FROM transactions t
      LEFT JOIN wallets w ON w.id = t.wallet_id
      LEFT JOIN wallets dw ON dw.id = t.destination_wallet_id
      LEFT JOIN categories c ON c.id = t.category_id
      LEFT JOIN savings_goals sg ON sg.id = t.savings_goal_id
      WHERE t.user_id = ${user.id}
        AND t.deleted_at IS NULL
        ${
          filters?.walletId
            ? sql`AND (t.wallet_id = ${filters.walletId} OR t.destination_wallet_id = ${filters.walletId})`
            : sql``
        }
        ${
          filters?.categoryId
            ? sql`AND t.category_id = ${filters.categoryId}`
            : sql``
        }
        ${
          filters?.type && filters.type !== "all"
            ? sql`AND t.type = ${filters.type}`
            : sql``
        }
        ${
          filters?.startDate
            ? sql`AND t.transaction_date >= ${filters.startDate}::timestamptz`
            : sql``
        }
        ${
          filters?.endDate
            ? sql`AND t.transaction_date <= ${filters.endDate}::timestamptz`
            : sql``
        }
        ${
          filters?.search
            ? sql`AND (t.description ILIKE ${"%" + filters.search + "%"} OR c.name ILIKE ${"%" + filters.search + "%"})`
            : sql``
        }
      ORDER BY t.transaction_date DESC, t.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    return rows.map((row) => ({
      id: row.id as string,
      user_id: row.user_id as string,
      wallet_id: row.wallet_id as string,
      destination_wallet_id: row.destination_wallet_id as string | null,
      category_id: row.category_id as string | null,
      savings_goal_id: row.savings_goal_id as string | null,
      type: row.type as Transaction["type"],
      amount: Number(row.amount),
      admin_fee: Number(row.admin_fee || 0),
      transaction_date: row.transaction_date as string,
      description: row.description as string | null,
      receipt_url: row.receipt_url as string | null,
      created_at: row.created_at as string,
      updated_at: row.updated_at as string,
      deleted_at: row.deleted_at as string | null,
      // Joined fields
      wallet_name: (row.wallet_name as string) ?? undefined,
      wallet_color: (row.wallet_color as string) ?? undefined,
      wallet_icon: (row.wallet_icon as string) ?? undefined,
      destination_wallet_name: (row.destination_wallet_name as string) ?? undefined,
      destination_wallet_color: (row.destination_wallet_color as string) ?? undefined,
      destination_wallet_icon: (row.destination_wallet_icon as string) ?? undefined,
      category_name: (row.category_name as string) ?? undefined,
      category_icon: (row.category_icon as string) ?? undefined,
      category_color: (row.category_color as string) ?? undefined,
      savings_goal_name: (row.savings_goal_name as string) ?? undefined,
      savings_goal_icon: (row.savings_goal_icon as string) ?? undefined,
      savings_goal_color: (row.savings_goal_color as string) ?? undefined,
    }));
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return [];
  }
}

// ─── Create Transaction with ACID Atomic Ledger Mutations ────────────────────

export async function createTransaction(
  data: TransactionInput
): Promise<ActionResult<Transaction>> {
  const parsed = transactionSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Validasi data gagal",
    };
  }

  const {
    type,
    wallet_id,
    destination_wallet_id,
    category_id,
    savings_goal_id,
    amount,
    admin_fee,
    transaction_date,
    description,
    receipt_url,
  } = parsed.data;

  try {
    const user = await getCurrentUser();
    const result = await sql.begin(async (tx) => {
      // 1. Insert transaction record
      const [inserted] = await tx`
        INSERT INTO transactions (
          user_id,
          wallet_id,
          destination_wallet_id,
          category_id,
          savings_goal_id,
          type,
          amount,
          admin_fee,
          transaction_date,
          description,
          receipt_url
        ) VALUES (
          ${user.id},
          ${wallet_id},
          ${destination_wallet_id ?? null},
          ${category_id ?? null},
          ${savings_goal_id ?? null},
          ${type},
          ${amount},
          ${admin_fee},
          ${transaction_date}::timestamptz,
          ${description ?? null},
          ${receipt_url ?? null}
        )
        RETURNING 
          id,
          user_id,
          wallet_id,
          destination_wallet_id,
          category_id,
          savings_goal_id,
          type,
          amount,
          admin_fee,
          transaction_date::text,
          description,
          receipt_url,
          created_at::text,
          updated_at::text,
          deleted_at::text
      `;

      // 2. Atomic Balance Mutations
      if (type === "expense") {
        const totalDeduct = amount + admin_fee;
        await tx`
          UPDATE wallets
          SET 
            balance = balance - ${totalDeduct},
            updated_at = now()
          WHERE id = ${wallet_id}
            AND user_id = ${user.id}
        `;
      } else if (type === "income") {
        await tx`
          UPDATE wallets
          SET 
            balance = balance + ${amount},
            updated_at = now()
          WHERE id = ${wallet_id}
            AND user_id = ${user.id}
        `;
      } else if (type === "transfer" && destination_wallet_id) {
        const totalDeduct = amount + admin_fee;
        // Deduct source wallet
        await tx`
          UPDATE wallets
          SET 
            balance = balance - ${totalDeduct},
            updated_at = now()
          WHERE id = ${wallet_id}
            AND user_id = ${user.id}
        `;
        // Add to destination wallet
        await tx`
          UPDATE wallets
          SET 
            balance = balance + ${amount},
            updated_at = now()
          WHERE id = ${destination_wallet_id}
            AND user_id = ${user.id}
        `;
      } else if (type === "saving" && savings_goal_id) {
        // Deduct source wallet
        await tx`
          UPDATE wallets
          SET 
            balance = balance - ${amount},
            updated_at = now()
          WHERE id = ${wallet_id}
            AND user_id = ${user.id}
        `;
        // Add to savings goal
        await tx`
          UPDATE savings_goals
          SET 
            current_amount = current_amount + ${amount},
            is_completed = (current_amount + ${amount} >= target_amount),
            updated_at = now()
          WHERE id = ${savings_goal_id}
            AND (user_id = ${user.id} OR id IN (SELECT goal_id FROM savings_goal_members WHERE user_id = ${user.id}))
        `;
      }

      return inserted;
    });

    revalidatePath("/transactions");
    revalidatePath("/wallets");
    revalidatePath("/savings");
    revalidatePath("/dashboard");

    return {
      success: true,
      data: {
        id: result.id as string,
        user_id: result.user_id as string,
        wallet_id: result.wallet_id as string,
        destination_wallet_id: result.destination_wallet_id as string | null,
        category_id: result.category_id as string | null,
        savings_goal_id: result.savings_goal_id as string | null,
        type: result.type as Transaction["type"],
        amount: Number(result.amount),
        admin_fee: Number(result.admin_fee || 0),
        transaction_date: result.transaction_date as string,
        description: result.description as string | null,
        receipt_url: result.receipt_url as string | null,
        created_at: result.created_at as string,
        updated_at: result.updated_at as string,
        deleted_at: result.deleted_at as string | null,
      },
    };
  } catch (error) {
    console.error("Error creating transaction in atomic block:", error);
    return {
      success: false,
      error: "Gagal menyimpan transaksi. Silakan periksa saldo dan coba lagi.",
    };
  }
}

// ─── Delete Transaction with Balance Reversion (ACID Rollback) ───────────────

export async function deleteTransaction(id: string): Promise<ActionResult> {
  try {
    const user = await getCurrentUser();
    await sql.begin(async (tx) => {
      // 1. Fetch the active transaction
      const [existing] = await tx`
        SELECT 
          id,
          wallet_id,
          destination_wallet_id,
          savings_goal_id,
          type,
          amount,
          admin_fee
        FROM transactions
        WHERE id = ${id}
          AND user_id = ${user.id}
          AND deleted_at IS NULL
      `;

      if (!existing) {
        throw new Error("Transaksi tidak ditemukan atau sudah dihapus");
      }

      const amount = Number(existing.amount);
      const admin_fee = Number(existing.admin_fee || 0);
      const wallet_id = existing.wallet_id as string;
      const destination_wallet_id = existing.destination_wallet_id as string | null;
      const savings_goal_id = existing.savings_goal_id as string | null;
      const type = existing.type as Transaction["type"];

      // 2. Soft-delete the transaction
      await tx`
        UPDATE transactions
        SET 
          deleted_at = now(),
          updated_at = now()
        WHERE id = ${id}
          AND user_id = ${user.id}
      `;

      // 3. Reverse the ledger balance changes
      if (type === "expense") {
        const totalRefund = amount + admin_fee;
        await tx`
          UPDATE wallets
          SET 
            balance = balance + ${totalRefund},
            updated_at = now()
          WHERE id = ${wallet_id}
            AND user_id = ${user.id}
        `;
      } else if (type === "income") {
        await tx`
          UPDATE wallets
          SET 
            balance = balance - ${amount},
            updated_at = now()
          WHERE id = ${wallet_id}
            AND user_id = ${user.id}
        `;
      } else if (type === "transfer" && destination_wallet_id) {
        const totalRefund = amount + admin_fee;
        // Refund source wallet
        await tx`
          UPDATE wallets
          SET 
            balance = balance + ${totalRefund},
            updated_at = now()
          WHERE id = ${wallet_id}
            AND user_id = ${user.id}
        `;
        // Deduct destination wallet
        await tx`
          UPDATE wallets
          SET 
            balance = balance - ${amount},
            updated_at = now()
          WHERE id = ${destination_wallet_id}
            AND user_id = ${user.id}
        `;
      } else if (type === "saving" && savings_goal_id) {
        // Refund source wallet
        await tx`
          UPDATE wallets
          SET 
            balance = balance + ${amount},
            updated_at = now()
          WHERE id = ${wallet_id}
            AND user_id = ${user.id}
        `;
        // Deduct from savings goal
        await tx`
          UPDATE savings_goals
          SET 
            current_amount = GREATEST(0, current_amount - ${amount}),
            is_completed = (GREATEST(0, current_amount - ${amount}) >= target_amount),
            updated_at = now()
          WHERE id = ${savings_goal_id}
            AND (user_id = ${user.id} OR id IN (SELECT goal_id FROM savings_goal_members WHERE user_id = ${user.id}))
        `;
      }
    });

    revalidatePath("/transactions");
    revalidatePath("/wallets");
    revalidatePath("/savings");
    revalidatePath("/dashboard");

    return { success: true };
  } catch (error) {
    console.error("Error deleting transaction and reverting balances:", error);
    return {
      success: false,
      error: "Gagal menghapus transaksi dan mengembalikan saldo.",
    };
  }
}
