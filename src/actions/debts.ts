"use server";

import { revalidatePath } from "next/cache";
import { sql } from "@/db";
import { getCurrentUser } from "@/lib/supabase/user";
import {
  type ActionResult,
  type Debt,
  type DebtInput,
  type DebtType,
  type PayDebtInput,
  debtSchema,
  payDebtSchema,
} from "@/types/finance";
import { createTransaction } from "./transactions";

// ─── Ensure Debts Table Exists ───────────────────────────────────────────────
async function ensureDebtsTable() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS debts (
        id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id            UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type               VARCHAR(20) NOT NULL CHECK (type IN ('debt', 'receivable')),
        counterparty_name  VARCHAR(100) NOT NULL,
        title              VARCHAR(150) NOT NULL,
        total_amount       BIGINT NOT NULL,
        remaining_amount   BIGINT NOT NULL,
        due_date           DATE,
        status             VARCHAR(20) NOT NULL CHECK (status IN ('unpaid', 'partial', 'paid')) DEFAULT 'unpaid',
        wallet_id          UUID REFERENCES wallets(id) ON DELETE SET NULL,
        notes              TEXT,
        created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
        deleted_at         TIMESTAMPTZ
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_debts_user_status ON debts (user_id, status)`;
  } catch (err) {
    console.warn("Could not ensure debts table:", err);
  }
}

// ─── Query Debts ─────────────────────────────────────────────────────────────
export async function getDebts(type?: DebtType): Promise<Debt[]> {
  try {
    const user = await getCurrentUser();
    await ensureDebtsTable();

    const rows = await sql`
      SELECT 
        d.id,
        d.user_id,
        d.type,
        d.counterparty_name,
        d.title,
        d.total_amount,
        d.remaining_amount,
        d.due_date::text,
        d.status,
        d.wallet_id,
        d.notes,
        d.created_at::text,
        d.updated_at::text,
        d.deleted_at::text,
        w.name AS wallet_name,
        w.icon AS wallet_icon,
        w.color AS wallet_color
      FROM debts d
      LEFT JOIN wallets w ON w.id = d.wallet_id AND w.deleted_at IS NULL
      WHERE d.user_id = ${user.id}
        AND d.deleted_at IS NULL
        ${type ? sql`AND d.type = ${type}` : sql``}
      ORDER BY 
        CASE WHEN d.status = 'paid' THEN 1 ELSE 0 END ASC,
        d.due_date ASC NULLS LAST,
        d.created_at DESC
    `;

    return rows.map((r) => ({
      id: r.id as string,
      user_id: r.user_id as string,
      type: r.type as Debt["type"],
      counterparty_name: r.counterparty_name as string,
      title: r.title as string,
      total_amount: Number(r.total_amount),
      remaining_amount: Number(r.remaining_amount),
      due_date: r.due_date as string | null,
      status: r.status as Debt["status"],
      wallet_id: r.wallet_id as string | null,
      notes: r.notes as string | null,
      wallet_name: r.wallet_name as string | undefined,
      wallet_icon: r.wallet_icon as string | undefined,
      wallet_color: r.wallet_color as string | undefined,
      created_at: r.created_at as string,
      updated_at: r.updated_at as string,
      deleted_at: r.deleted_at as string | null,
    }));
  } catch (error) {
    console.error("Error fetching debts:", error);
    return [];
  }
}

// ─── Create Debt ─────────────────────────────────────────────────────────────
export async function createDebt(
  rawInput: DebtInput
): Promise<ActionResult<Debt>> {
  try {
    const user = await getCurrentUser();
    await ensureDebtsTable();
    const validated = debtSchema.parse(rawInput);

    const remainingAmount =
      validated.remaining_amount !== undefined
        ? validated.remaining_amount
        : validated.total_amount;

    const status =
      remainingAmount <= 0
        ? "paid"
        : remainingAmount < validated.total_amount
        ? "partial"
        : "unpaid";

    const [row] = await sql`
      INSERT INTO debts (
        user_id,
        type,
        counterparty_name,
        title,
        total_amount,
        remaining_amount,
        due_date,
        status,
        wallet_id,
        notes
      ) VALUES (
        ${user.id},
        ${validated.type},
        ${validated.counterparty_name.trim()},
        ${validated.title.trim()},
        ${validated.total_amount},
        ${remainingAmount},
        ${validated.due_date ? sql`${validated.due_date}::date` : null},
        ${status},
        ${validated.wallet_id || null},
        ${validated.notes || null}
      )
      RETURNING 
        id, user_id, type, counterparty_name, title,
        total_amount, remaining_amount, due_date::text,
        status, wallet_id, notes, created_at::text, updated_at::text
    `;

    revalidatePath("/debts");
    revalidatePath("/dashboard");

    return {
      success: true,
      data: {
        id: row.id as string,
        user_id: row.user_id as string,
        type: row.type as Debt["type"],
        counterparty_name: row.counterparty_name as string,
        title: row.title as string,
        total_amount: Number(row.total_amount),
        remaining_amount: Number(row.remaining_amount),
        due_date: row.due_date as string | null,
        status: row.status as Debt["status"],
        wallet_id: row.wallet_id as string | null,
        notes: row.notes as string | null,
        created_at: row.created_at as string,
        updated_at: row.updated_at as string,
        deleted_at: null,
      },
    };
  } catch (error) {
    console.error("Error creating debt:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal mencatat data hutang/piutang.",
    };
  }
}

// ─── Update Debt ─────────────────────────────────────────────────────────────
export async function updateDebt(
  id: string,
  rawInput: DebtInput
): Promise<ActionResult<Debt>> {
  try {
    const user = await getCurrentUser();
    const validated = debtSchema.parse(rawInput);

    const [existing] = await sql`
      SELECT id, user_id, remaining_amount, total_amount FROM debts WHERE id = ${id} AND deleted_at IS NULL
    `;

    if (!existing || existing.user_id !== user.id) {
      return { success: false, error: "Data hutang/piutang tidak ditemukan." };
    }

    const remainingAmount =
      validated.remaining_amount !== undefined
        ? validated.remaining_amount
        : Number(existing.remaining_amount);

    const status =
      remainingAmount <= 0
        ? "paid"
        : remainingAmount < validated.total_amount
        ? "partial"
        : "unpaid";

    const [row] = await sql`
      UPDATE debts
      SET 
        type = ${validated.type},
        counterparty_name = ${validated.counterparty_name.trim()},
        title = ${validated.title.trim()},
        total_amount = ${validated.total_amount},
        remaining_amount = ${remainingAmount},
        due_date = ${validated.due_date ? sql`${validated.due_date}::date` : null},
        status = ${status},
        wallet_id = ${validated.wallet_id || null},
        notes = ${validated.notes || null},
        updated_at = now()
      WHERE id = ${id} AND user_id = ${user.id}
      RETURNING 
        id, user_id, type, counterparty_name, title,
        total_amount, remaining_amount, due_date::text,
        status, wallet_id, notes, created_at::text, updated_at::text
    `;

    revalidatePath("/debts");
    revalidatePath("/dashboard");

    return {
      success: true,
      data: {
        id: row.id as string,
        user_id: row.user_id as string,
        type: row.type as Debt["type"],
        counterparty_name: row.counterparty_name as string,
        title: row.title as string,
        total_amount: Number(row.total_amount),
        remaining_amount: Number(row.remaining_amount),
        due_date: row.due_date as string | null,
        status: row.status as Debt["status"],
        wallet_id: row.wallet_id as string | null,
        notes: row.notes as string | null,
        created_at: row.created_at as string,
        updated_at: row.updated_at as string,
        deleted_at: null,
      },
    };
  } catch (error) {
    console.error("Error updating debt:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal memperbarui data hutang/piutang.",
    };
  }
}

// ─── Delete Debt ─────────────────────────────────────────────────────────────
export async function deleteDebt(id: string): Promise<ActionResult<boolean>> {
  try {
    const user = await getCurrentUser();

    await sql`
      UPDATE debts
      SET deleted_at = now(), updated_at = now()
      WHERE id = ${id} AND user_id = ${user.id}
    `;

    revalidatePath("/debts");
    revalidatePath("/dashboard");

    return { success: true, data: true };
  } catch (error) {
    console.error("Error deleting debt:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal menghapus data hutang.",
    };
  }
}

// ─── Pay Debt / Settle (Integrates Transaction + Wallet Balance) ──────────────
export async function payDebt(
  rawInput: PayDebtInput
): Promise<ActionResult<Debt>> {
  try {
    const user = await getCurrentUser();
    const validated = payDebtSchema.parse(rawInput);

    const [debt] = await sql`
      SELECT id, user_id, type, counterparty_name, title, total_amount, remaining_amount, status
      FROM debts
      WHERE id = ${validated.debt_id} AND user_id = ${user.id} AND deleted_at IS NULL
    `;

    if (!debt) {
      return { success: false, error: "Data hutang/piutang tidak ditemukan." };
    }

    const currentRemaining = Number(debt.remaining_amount);
    if (currentRemaining <= 0) {
      return { success: false, error: "Pos hutang ini sudah lunas sepenuhnya." };
    }

    const payAmount = Math.min(validated.amount, currentRemaining);
    const newRemaining = Math.max(0, currentRemaining - payAmount);
    const newStatus = newRemaining === 0 ? "paid" : "partial";

    // 1. Update debt record
    const [updatedDebt] = await sql`
      UPDATE debts
      SET 
        remaining_amount = ${newRemaining},
        status = ${newStatus},
        updated_at = now()
      WHERE id = ${validated.debt_id} AND user_id = ${user.id}
      RETURNING 
        id, user_id, type, counterparty_name, title,
        total_amount, remaining_amount, due_date::text,
        status, wallet_id, notes, created_at::text, updated_at::text
    `;

    // 2. Automatically record transaction
    const isDebt = debt.type === "debt";
    const transactionType = isDebt ? "expense" : "income";
    const txDescription = isDebt
      ? `Bayar Cicilan/Pelunasan Hutang: ${debt.title} (${debt.counterparty_name})`
      : `Penerimaan Pembayaran Piutang: ${debt.title} (${debt.counterparty_name})`;

    // Look for appropriate category (e.g. Cicilan & Hutang or Lain-lain)
    const categoryRows = await sql`
      SELECT id FROM categories
      WHERE (user_id = ${user.id} OR user_id IS NULL)
        AND type = ${transactionType}
        AND (LOWER(name) LIKE '%hutang%' OR LOWER(name) LIKE '%cicilan%' OR LOWER(name) LIKE '%lain%')
      ORDER BY CASE WHEN LOWER(name) LIKE '%hutang%' THEN 0 ELSE 1 END
      LIMIT 1
    `;

    const categoryId = categoryRows[0]?.id as string | undefined;

    await createTransaction({
      type: transactionType,
      wallet_id: validated.wallet_id,
      category_id: categoryId || null,
      amount: payAmount,
      admin_fee: 0,
      transaction_date: new Date(validated.transaction_date).toISOString(),
      description: validated.notes ? `${txDescription} — ${validated.notes}` : txDescription,
      destination_wallet_id: null,
      savings_goal_id: null,
      receipt_url: null,
    });

    revalidatePath("/debts");
    revalidatePath("/transactions");
    revalidatePath("/wallets");
    revalidatePath("/dashboard");

    return {
      success: true,
      data: {
        id: updatedDebt.id as string,
        user_id: updatedDebt.user_id as string,
        type: updatedDebt.type as Debt["type"],
        counterparty_name: updatedDebt.counterparty_name as string,
        title: updatedDebt.title as string,
        total_amount: Number(updatedDebt.total_amount),
        remaining_amount: Number(updatedDebt.remaining_amount),
        due_date: updatedDebt.due_date as string | null,
        status: updatedDebt.status as Debt["status"],
        wallet_id: updatedDebt.wallet_id as string | null,
        notes: updatedDebt.notes as string | null,
        created_at: updatedDebt.created_at as string,
        updated_at: updatedDebt.updated_at as string,
        deleted_at: null,
      },
    };
  } catch (error) {
    console.error("Error paying debt:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal memproses pembayaran cicilan.",
    };
  }
}
