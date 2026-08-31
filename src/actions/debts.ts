"use server";

import { revalidatePath } from "next/cache";
import { sql } from "@/db";
import { getCurrentUser } from "@/lib/supabase/user";
import {
  type ActionResult,
  type Debt,
  type DebtInput,
  type DebtPayment,
  type DebtType,
  type PayDebtInput,
  debtSchema,
  payDebtSchema,
} from "@/types/finance";
import { createTransaction } from "./transactions";

// ─── Ensure Debts & Debt Payments Tables Exist ───────────────────────────────
async function ensureDebtsTable() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS debts (
        id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id              UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type                 VARCHAR(20) NOT NULL CHECK (type IN ('debt', 'receivable')),
        counterparty_name    VARCHAR(100) NOT NULL,
        title                VARCHAR(150) NOT NULL,
        total_amount         BIGINT NOT NULL,
        remaining_amount     BIGINT NOT NULL,
        monthly_installment  BIGINT DEFAULT 0,
        due_day              INT DEFAULT 1,
        due_date             DATE,
        target_payoff_date   DATE,
        status               VARCHAR(20) NOT NULL CHECK (status IN ('unpaid', 'partial', 'paid')) DEFAULT 'unpaid',
        wallet_id            UUID REFERENCES wallets(id) ON DELETE SET NULL,
        notes                TEXT,
        created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
        deleted_at           TIMESTAMPTZ
      )
    `;

    // Defensive migration in case table was created with older schema
    await sql`ALTER TABLE debts ADD COLUMN IF NOT EXISTS monthly_installment BIGINT DEFAULT 0`;
    await sql`ALTER TABLE debts ADD COLUMN IF NOT EXISTS due_day INT DEFAULT 1`;
    await sql`ALTER TABLE debts ADD COLUMN IF NOT EXISTS target_payoff_date DATE`;

    await sql`CREATE INDEX IF NOT EXISTS idx_debts_user_status ON debts (user_id, status)`;

    // Create debt_payments table for payment history logs
    await sql`
      CREATE TABLE IF NOT EXISTS debt_payments (
        id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        debt_id          UUID NOT NULL REFERENCES debts(id) ON DELETE CASCADE,
        user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        amount           BIGINT NOT NULL,
        wallet_id        UUID REFERENCES wallets(id) ON DELETE SET NULL,
        payment_date     TIMESTAMPTZ NOT NULL DEFAULT now(),
        remaining_after  BIGINT NOT NULL,
        notes            TEXT,
        created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_debt_payments_debt ON debt_payments (debt_id, payment_date DESC)`;
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
        COALESCE(d.monthly_installment, 0) AS monthly_installment,
        COALESCE(d.due_day, 1) AS due_day,
        d.due_date::text,
        d.target_payoff_date::text,
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
        d.due_day ASC NULLS LAST,
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
      monthly_installment: Number(r.monthly_installment || 0),
      due_day: Number(r.due_day || 1),
      due_date: r.due_date as string | null,
      target_payoff_date: r.target_payoff_date as string | null,
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

// ─── Query Debt Payments History ─────────────────────────────────────────────
export async function getDebtPayments(debtId?: string): Promise<DebtPayment[]> {
  try {
    const user = await getCurrentUser();
    await ensureDebtsTable();

    const rows = await sql`
      SELECT 
        dp.id,
        dp.debt_id,
        dp.user_id,
        dp.amount,
        dp.wallet_id,
        dp.payment_date::text,
        dp.remaining_after,
        dp.notes,
        dp.created_at::text,
        d.title AS debt_title,
        d.counterparty_name,
        d.type AS debt_type,
        w.name AS wallet_name
      FROM debt_payments dp
      JOIN debts d ON d.id = dp.debt_id
      LEFT JOIN wallets w ON w.id = dp.wallet_id
      WHERE dp.user_id = ${user.id}
        ${debtId ? sql`AND dp.debt_id = ${debtId}` : sql``}
      ORDER BY dp.payment_date DESC, dp.created_at DESC
      LIMIT 100
    `;

    return rows.map((r) => ({
      id: r.id as string,
      debt_id: r.debt_id as string,
      user_id: r.user_id as string,
      amount: Number(r.amount),
      wallet_id: r.wallet_id as string | null,
      wallet_name: (r.wallet_name as string) || "Dompet",
      debt_title: (r.debt_title as string) || "Hutang/Piutang",
      counterparty_name: (r.counterparty_name as string) || "-",
      debt_type: r.debt_type as DebtType,
      payment_date: r.payment_date as string,
      remaining_after: Number(r.remaining_after),
      notes: r.notes as string | null,
      created_at: r.created_at as string,
    }));
  } catch (error) {
    console.error("Error fetching debt payments:", error);
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
        monthly_installment,
        due_day,
        due_date,
        target_payoff_date,
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
        ${validated.monthly_installment || 0},
        ${validated.due_day || 1},
        ${validated.due_date ? sql`${validated.due_date}::date` : null},
        ${validated.target_payoff_date ? sql`${validated.target_payoff_date}::date` : null},
        ${status},
        ${validated.wallet_id || null},
        ${validated.notes || null}
      )
      RETURNING 
        id, user_id, type, counterparty_name, title,
        total_amount, remaining_amount, monthly_installment, due_day,
        due_date::text, target_payoff_date::text,
        status, wallet_id, notes, created_at::text, updated_at::text
    `;

    revalidatePath("/debts");
    revalidatePath("/transactions");
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
        monthly_installment: Number(row.monthly_installment || 0),
        due_day: Number(row.due_day || 1),
        due_date: row.due_date as string | null,
        target_payoff_date: row.target_payoff_date as string | null,
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
        monthly_installment = ${validated.monthly_installment || 0},
        due_day = ${validated.due_day || 1},
        due_date = ${validated.due_date ? sql`${validated.due_date}::date` : null},
        target_payoff_date = ${validated.target_payoff_date ? sql`${validated.target_payoff_date}::date` : null},
        status = ${status},
        wallet_id = ${validated.wallet_id || null},
        notes = ${validated.notes || null},
        updated_at = now()
      WHERE id = ${id} AND user_id = ${user.id}
      RETURNING 
        id, user_id, type, counterparty_name, title,
        total_amount, remaining_amount, monthly_installment, due_day,
        due_date::text, target_payoff_date::text,
        status, wallet_id, notes, created_at::text, updated_at::text
    `;

    revalidatePath("/debts");
    revalidatePath("/transactions");
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
        monthly_installment: Number(row.monthly_installment || 0),
        due_day: Number(row.due_day || 1),
        due_date: row.due_date as string | null,
        target_payoff_date: row.target_payoff_date as string | null,
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
    revalidatePath("/transactions");
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

// ─── Pay Debt / Settle (Integrates Transaction + Wallet Balance + Payments Log) ───
export async function payDebt(
  rawInput: PayDebtInput
): Promise<ActionResult<Debt>> {
  try {
    const user = await getCurrentUser();
    await ensureDebtsTable();
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
        total_amount, remaining_amount, monthly_installment, due_day,
        due_date::text, target_payoff_date::text,
        status, wallet_id, notes, created_at::text, updated_at::text
    `;

    // 2. Insert record into debt_payments history
    await sql`
      INSERT INTO debt_payments (
        debt_id,
        user_id,
        amount,
        wallet_id,
        payment_date,
        remaining_after,
        notes
      ) VALUES (
        ${validated.debt_id},
        ${user.id},
        ${payAmount},
        ${validated.wallet_id},
        ${new Date(validated.transaction_date).toISOString()}::timestamptz,
        ${newRemaining},
        ${validated.notes || null}
      )
    `;

    // 3. Automatically record financial transaction
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
        monthly_installment: Number(updatedDebt.monthly_installment || 0),
        due_day: Number(updatedDebt.due_day || 1),
        due_date: updatedDebt.due_date as string | null,
        target_payoff_date: updatedDebt.target_payoff_date as string | null,
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
