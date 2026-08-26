"use server";

import { revalidatePath } from "next/cache";
import { sql } from "@/db";
import { getCurrentUser } from "@/lib/supabase/user";
import {
  type ActionResult,
  type RecurringFrequency,
  type RecurringInput,
  type RecurringTransaction,
  recurringSchema,
} from "@/types/finance";
import { createTransaction } from "./transactions";

// ─── Ensure Table Exists Helper ───────────────────────────────────────────────

async function ensureRecurringTable() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS recurring_transactions (
        id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        wallet_id     UUID NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
        category_id   UUID REFERENCES categories(id) ON DELETE SET NULL,
        type          VARCHAR(20) NOT NULL CHECK (type IN ('expense','income')),
        amount        BIGINT NOT NULL,
        frequency     VARCHAR(20) NOT NULL CHECK (frequency IN ('daily','weekly','monthly','yearly')),
        start_date    DATE NOT NULL,
        next_run_date DATE NOT NULL,
        last_run_date DATE,
        description   VARCHAR(255) NOT NULL,
        is_active     BOOLEAN NOT NULL DEFAULT true,
        auto_create   BOOLEAN NOT NULL DEFAULT false,
        created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
        deleted_at    TIMESTAMPTZ
      )
    `;
  } catch (err) {
    console.error("Error creating recurring_transactions table:", err);
  }
}

// ─── Calculate Next Run Date Helper ───────────────────────────────────────────

export async function computeNextDate(
  currentDateStr: string,
  frequency: RecurringFrequency
): Promise<string> {
  const current = new Date(currentDateStr);
  const y = current.getUTCFullYear();
  const m = current.getUTCMonth();
  const d = current.getUTCDate();

  let nextDate: Date;

  if (frequency === "daily") {
    nextDate = new Date(Date.UTC(y, m, d + 1));
  } else if (frequency === "weekly") {
    nextDate = new Date(Date.UTC(y, m, d + 7));
  } else if (frequency === "monthly") {
    nextDate = new Date(Date.UTC(y, m + 1, d));
  } else if (frequency === "yearly") {
    nextDate = new Date(Date.UTC(y + 1, m, d));
  } else {
    nextDate = new Date(Date.UTC(y, m + 1, d));
  }

  return nextDate.toISOString().slice(0, 10);
}

// ─── Get Recurring Transactions ───────────────────────────────────────────────

export async function getRecurringTransactions(): Promise<RecurringTransaction[]> {
  try {
    await ensureRecurringTable();
    const user = await getCurrentUser();

    const rows = await sql`
      SELECT 
        r.id,
        r.user_id,
        r.wallet_id,
        r.category_id,
        r.type,
        r.amount,
        r.frequency,
        r.start_date::text,
        r.next_run_date::text,
        r.last_run_date::text,
        r.description,
        r.is_active,
        r.auto_create,
        r.created_at::text,
        r.updated_at::text,
        r.deleted_at::text,
        w.name AS wallet_name,
        w.color AS wallet_color,
        w.icon AS wallet_icon,
        c.name AS category_name,
        c.icon AS category_icon,
        c.color AS category_color
      FROM recurring_transactions r
      JOIN wallets w ON w.id = r.wallet_id
      LEFT JOIN categories c ON c.id = r.category_id
      WHERE r.user_id = ${user.id}
        AND r.deleted_at IS NULL
      ORDER BY r.is_active DESC, r.next_run_date ASC, r.created_at DESC
    `;

    return rows.map((row) => ({
      id: row.id as string,
      user_id: row.user_id as string,
      wallet_id: row.wallet_id as string,
      category_id: row.category_id as string | null,
      type: row.type as RecurringTransaction["type"],
      amount: Number(row.amount),
      frequency: row.frequency as RecurringFrequency,
      start_date: row.start_date as string,
      next_run_date: row.next_run_date as string,
      last_run_date: row.last_run_date as string | null,
      description: row.description as string,
      is_active: Boolean(row.is_active),
      auto_create: Boolean(row.auto_create),
      created_at: row.created_at as string,
      updated_at: row.updated_at as string,
      deleted_at: row.deleted_at as string | null,
      wallet_name: (row.wallet_name as string) ?? undefined,
      wallet_color: (row.wallet_color as string) ?? undefined,
      wallet_icon: (row.wallet_icon as string) ?? undefined,
      category_name: (row.category_name as string) ?? undefined,
      category_icon: (row.category_icon as string) ?? undefined,
      category_color: (row.category_color as string) ?? undefined,
    }));
  } catch (error) {
    console.error("Error fetching recurring transactions:", error);
    return [];
  }
}

// ─── Create Recurring Transaction ─────────────────────────────────────────────

export async function createRecurringTransaction(
  data: RecurringInput
): Promise<ActionResult<RecurringTransaction>> {
  const parsed = recurringSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Validasi data gagal",
    };
  }

  const {
    type,
    wallet_id,
    category_id,
    amount,
    frequency,
    start_date,
    description,
    is_active,
    auto_create,
  } = parsed.data;

  try {
    await ensureRecurringTable();
    const user = await getCurrentUser();

    // Initial next_run_date is the start_date
    const next_run_date = start_date;

    const [inserted] = await sql`
      INSERT INTO recurring_transactions (
        user_id,
        wallet_id,
        category_id,
        type,
        amount,
        frequency,
        start_date,
        next_run_date,
        description,
        is_active,
        auto_create
      ) VALUES (
        ${user.id},
        ${wallet_id},
        ${category_id ?? null},
        ${type},
        ${amount},
        ${frequency},
        ${start_date},
        ${next_run_date},
        ${description},
        ${is_active ?? true},
        ${auto_create ?? false}
      )
      RETURNING 
        id,
        user_id,
        wallet_id,
        category_id,
        type,
        amount,
        frequency,
        start_date::text,
        next_run_date::text,
        last_run_date::text,
        description,
        is_active,
        auto_create,
        created_at::text,
        updated_at::text,
        deleted_at::text
    `;

    revalidatePath("/transactions");
    revalidatePath("/dashboard");

    return {
      success: true,
      data: {
        id: inserted.id as string,
        user_id: inserted.user_id as string,
        wallet_id: inserted.wallet_id as string,
        category_id: inserted.category_id as string | null,
        type: inserted.type as RecurringTransaction["type"],
        amount: Number(inserted.amount),
        frequency: inserted.frequency as RecurringFrequency,
        start_date: inserted.start_date as string,
        next_run_date: inserted.next_run_date as string,
        last_run_date: inserted.last_run_date as string | null,
        description: inserted.description as string,
        is_active: Boolean(inserted.is_active),
        auto_create: Boolean(inserted.auto_create),
        created_at: inserted.created_at as string,
        updated_at: inserted.updated_at as string,
        deleted_at: inserted.deleted_at as string | null,
      },
    };
  } catch (error) {
    console.error("Error creating recurring transaction:", error);
    return {
      success: false,
      error: "Gagal menyimpan jadwal transaksi berulang.",
    };
  }
}

// ─── Update Recurring Transaction ─────────────────────────────────────────────

export async function updateRecurringTransaction(
  id: string,
  data: RecurringInput
): Promise<ActionResult<RecurringTransaction>> {
  const parsed = recurringSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Validasi data gagal",
    };
  }

  const {
    type,
    wallet_id,
    category_id,
    amount,
    frequency,
    start_date,
    description,
    is_active,
    auto_create,
  } = parsed.data;

  try {
    const user = await getCurrentUser();
    const [updated] = await sql`
      UPDATE recurring_transactions
      SET
        wallet_id = ${wallet_id},
        category_id = ${category_id ?? null},
        type = ${type},
        amount = ${amount},
        frequency = ${frequency},
        start_date = ${start_date},
        description = ${description},
        is_active = ${is_active ?? true},
        auto_create = ${auto_create ?? false},
        updated_at = now()
      WHERE id = ${id}
        AND user_id = ${user.id}
        AND deleted_at IS NULL
      RETURNING 
        id,
        user_id,
        wallet_id,
        category_id,
        type,
        amount,
        frequency,
        start_date::text,
        next_run_date::text,
        last_run_date::text,
        description,
        is_active,
        auto_create,
        created_at::text,
        updated_at::text,
        deleted_at::text
    `;

    if (!updated) {
      return {
        success: false,
        error: "Jadwal transaksi tidak ditemukan.",
      };
    }

    revalidatePath("/transactions");
    revalidatePath("/dashboard");

    return {
      success: true,
      data: {
        id: updated.id as string,
        user_id: updated.user_id as string,
        wallet_id: updated.wallet_id as string,
        category_id: updated.category_id as string | null,
        type: updated.type as RecurringTransaction["type"],
        amount: Number(updated.amount),
        frequency: updated.frequency as RecurringFrequency,
        start_date: updated.start_date as string,
        next_run_date: updated.next_run_date as string,
        last_run_date: updated.last_run_date as string | null,
        description: updated.description as string,
        is_active: Boolean(updated.is_active),
        auto_create: Boolean(updated.auto_create),
        created_at: updated.created_at as string,
        updated_at: updated.updated_at as string,
        deleted_at: updated.deleted_at as string | null,
      },
    };
  } catch (error) {
    console.error("Error updating recurring transaction:", error);
    return {
      success: false,
      error: "Gagal memperbarui jadwal transaksi.",
    };
  }
}

// ─── Toggle Recurring Status (Active / Paused) ────────────────────────────────

export async function toggleRecurringStatus(
  id: string,
  isActive: boolean
): Promise<ActionResult> {
  try {
    const user = await getCurrentUser();
    await sql`
      UPDATE recurring_transactions
      SET is_active = ${isActive}, updated_at = now()
      WHERE id = ${id}
        AND user_id = ${user.id}
        AND deleted_at IS NULL
    `;

    revalidatePath("/transactions");
    return { success: true };
  } catch (error) {
    console.error("Error toggling recurring status:", error);
    return { success: false, error: "Gagal mengubah status langganan." };
  }
}

// ─── Delete Recurring Transaction (Soft-delete) ───────────────────────────────

export async function deleteRecurringTransaction(id: string): Promise<ActionResult> {
  try {
    const user = await getCurrentUser();
    const [deleted] = await sql`
      UPDATE recurring_transactions
      SET 
        deleted_at = now(),
        updated_at = now()
      WHERE id = ${id}
        AND user_id = ${user.id}
        AND deleted_at IS NULL
      RETURNING id
    `;

    if (!deleted) {
      return {
        success: false,
        error: "Jadwal transaksi tidak ditemukan.",
      };
    }

    revalidatePath("/transactions");
    revalidatePath("/dashboard");

    return { success: true };
  } catch (error) {
    console.error("Error deleting recurring transaction:", error);
    return {
      success: false,
      error: "Gagal menghapus jadwal transaksi berulang.",
    };
  }
}

// ─── Process & Execute Recurring Transaction into Ledger ──────────────────────

export async function processRecurringTransactionNow(
  id: string
): Promise<ActionResult> {
  try {
    const user = await getCurrentUser();

    // 1. Fetch recurring item
    const [item] = await sql`
      SELECT 
        id,
        wallet_id,
        category_id,
        type,
        amount,
        frequency,
        next_run_date::text,
        description
      FROM recurring_transactions
      WHERE id = ${id}
        AND user_id = ${user.id}
        AND deleted_at IS NULL
    `;

    if (!item) {
      return { success: false, error: "Jadwal transaksi tidak ditemukan" };
    }

    const todayStr = new Date().toISOString().slice(0, 10);
    const txDate = `${todayStr}T12:00:00Z`;

    // 2. Execute transaction creation via atomic ledger
    const txRes = await createTransaction({
      type: item.type as "expense" | "income",
      wallet_id: item.wallet_id as string,
      destination_wallet_id: null,
      category_id: item.category_id as string | null,
      savings_goal_id: null,
      amount: Number(item.amount),
      admin_fee: 0,
      transaction_date: txDate,
      description: `[Jadwal Berulang] ${item.description}`,
      receipt_url: null,
    });

    if (!txRes.success) {
      return { success: false, error: txRes.error ?? "Gagal mengeksekusi mutasi ledger" };
    }

    // 3. Compute next run date
    const nextDate = await computeNextDate(
      (item.next_run_date as string) || todayStr,
      item.frequency as RecurringFrequency
    );

    // 4. Update recurring transaction state
    await sql`
      UPDATE recurring_transactions
      SET 
        last_run_date = ${todayStr},
        next_run_date = ${nextDate},
        updated_at = now()
      WHERE id = ${id}
        AND user_id = ${user.id}
    `;

    revalidatePath("/transactions");
    revalidatePath("/wallets");
    revalidatePath("/dashboard");

    return { success: true };
  } catch (error) {
    console.error("Error processing recurring transaction:", error);
    return {
      success: false,
      error: "Gagal mencatat transaksi berulang.",
    };
  }
}

// ─── Process Pending Auto-Debit Recurring Transactions ────────────────────────

export async function processPendingRecurringTransactions(): Promise<number> {
  try {
    await ensureRecurringTable();
    const user = await getCurrentUser();
    const todayStr = new Date().toISOString().slice(0, 10);

    const pending = await sql`
      SELECT id FROM recurring_transactions
      WHERE user_id = ${user.id}
        AND is_active = true
        AND auto_create = true
        AND next_run_date <= ${todayStr}::date
        AND deleted_at IS NULL
    `;

    let processedCount = 0;
    for (const row of pending) {
      const res = await processRecurringTransactionNow(row.id as string);
      if (res.success) {
        processedCount++;
      }
    }

    return processedCount;
  } catch (error) {
    console.error("Error processing pending recurring transactions:", error);
    return 0;
  }
}
