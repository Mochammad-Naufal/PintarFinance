"use server";

import { revalidatePath } from "next/cache";
import { sql, DEMO_USER_ID } from "@/db";
import {
  type ActionResult,
  type Budget,
  type BudgetInput,
  type BudgetStatus,
  budgetSchema,
} from "@/types/finance";

// ─── Helpers ──────────────────────────────────────────────────────────────────

export async function getCurrentPeriod(): Promise<string> {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function getPeriodDateRange(period: string) {
  const [yearStr, monthStr] = period.split("-");
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);

  const startDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0)).toISOString();
  const nextMonthDate = new Date(Date.UTC(year, month, 1, 0, 0, 0)).toISOString();

  return { startDate, nextMonthDate };
}

// ─── Get Budgets with Computed Spending & Utilization ─────────────────────────

export async function getBudgets(period?: string): Promise<Budget[]> {
  try {
    const targetPeriod = period || (await getCurrentPeriod());
    const { startDate, nextMonthDate } = getPeriodDateRange(targetPeriod);

    const rows = await sql`
      SELECT 
        b.id,
        b.user_id,
        b.category_id,
        b.period,
        b.limit_amount,
        b.created_at::text,
        b.updated_at::text,
        c.name AS category_name,
        c.icon AS category_icon,
        c.color AS category_color,
        COALESCE(SUM(t.amount + t.admin_fee), 0) AS spent_amount
      FROM budgets b
      JOIN categories c ON c.id = b.category_id
      LEFT JOIN transactions t ON t.category_id = b.category_id
        AND t.user_id = ${DEMO_USER_ID}
        AND t.deleted_at IS NULL
        AND t.type = 'expense'
        AND t.transaction_date >= ${startDate}::timestamptz
        AND t.transaction_date < ${nextMonthDate}::timestamptz
      WHERE b.user_id = ${DEMO_USER_ID}
        AND b.period = ${targetPeriod}
      GROUP BY 
        b.id, 
        b.user_id, 
        b.category_id, 
        b.period, 
        b.limit_amount, 
        b.created_at, 
        b.updated_at, 
        c.name, 
        c.icon, 
        c.color
      ORDER BY (COALESCE(SUM(t.amount + t.admin_fee), 0)::numeric / GREATEST(b.limit_amount, 1)::numeric) DESC, b.limit_amount DESC
    `;

    return rows.map((row) => {
      const limitAmount = Number(row.limit_amount);
      const spentAmount = Number(row.spent_amount);
      const remainingAmount = limitAmount - spentAmount;
      const percentage =
        limitAmount > 0 ? Math.round((spentAmount / limitAmount) * 100) : 0;

      let status: BudgetStatus = "safe";
      if (percentage >= 100) {
        status = "danger";
      } else if (percentage >= 75) {
        status = "warning";
      }

      return {
        id: row.id as string,
        user_id: row.user_id as string,
        category_id: row.category_id as string,
        period: row.period as string,
        limit_amount: limitAmount,
        spent_amount: spentAmount,
        remaining_amount: remainingAmount,
        percentage,
        status,
        category_name: row.category_name as string,
        category_icon: row.category_icon as string,
        category_color: row.category_color as string,
        created_at: row.created_at as string,
        updated_at: row.updated_at as string,
      };
    });
  } catch (error) {
    console.error("Error fetching budgets:", error);
    return [];
  }
}

// ─── Upsert Budget ────────────────────────────────────────────────────────────

export async function upsertBudget(
  data: BudgetInput
): Promise<ActionResult<Budget>> {
  const parsed = budgetSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Validasi data gagal",
    };
  }

  const { category_id, period, limit_amount } = parsed.data;

  try {
    // Check if a budget exists for this category & period
    const [existing] = await sql`
      SELECT id FROM budgets
      WHERE user_id = ${DEMO_USER_ID}
        AND category_id = ${category_id}
        AND period = ${period}
    `;

    let budgetId = "";

    if (existing) {
      const [updated] = await sql`
        UPDATE budgets
        SET 
          limit_amount = ${limit_amount},
          updated_at = now()
        WHERE id = ${existing.id}
          AND user_id = ${DEMO_USER_ID}
        RETURNING id
      `;
      budgetId = updated.id as string;
    } else {
      const [inserted] = await sql`
        INSERT INTO budgets (
          user_id,
          category_id,
          period,
          limit_amount
        ) VALUES (
          ${DEMO_USER_ID},
          ${category_id},
          ${period},
          ${limit_amount}
        )
        RETURNING id
      `;
      budgetId = inserted.id as string;
    }

    revalidatePath("/budgets");
    revalidatePath("/dashboard");

    // Fetch the updated budget item with category & computation
    const allBudgets = await getBudgets(period);
    const resultItem = allBudgets.find((b) => b.id === budgetId);

    return {
      success: true,
      data: resultItem,
    };
  } catch (error) {
    console.error("Error upserting budget:", error);
    return {
      success: false,
      error: "Gagal menyimpan batas anggaran.",
    };
  }
}

// ─── Delete Budget ────────────────────────────────────────────────────────────

export async function deleteBudget(id: string): Promise<ActionResult> {
  try {
    const result = await sql`
      DELETE FROM budgets
      WHERE id = ${id}
        AND user_id = ${DEMO_USER_ID}
      RETURNING id
    `;

    if (result.length === 0) {
      return {
        success: false,
        error: "Anggaran tidak ditemukan atau sudah dihapus.",
      };
    }

    revalidatePath("/budgets");
    revalidatePath("/dashboard");

    return { success: true };
  } catch (error) {
    console.error("Error deleting budget:", error);
    return {
      success: false,
      error: "Gagal menghapus batas anggaran.",
    };
  }
}
