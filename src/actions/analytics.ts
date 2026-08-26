"use server";

import { sql } from "@/db";
import { getCurrentUser } from "@/lib/supabase/user";
import {
  type CategoryExpenseBreakdown,
  type DashboardAnalytics,
  type MonthlyCashflowTrend,
  type SavingsGoal,
} from "@/types/finance";
import { getTransactions } from "./transactions";
import { getCurrentPeriod } from "./budgets";
import { formatDate } from "@/lib/utils";

function getMonthLabel(periodStr: string): string {
  const [yearStr, monthStr] = periodStr.split("-");
  const date = new Date(parseInt(yearStr, 10), parseInt(monthStr, 10) - 1, 1);
  return formatDate(date.toISOString(), "MMM yy");
}

function getLast6Periods(currentPeriod: string): string[] {
  const [yearStr, monthStr] = currentPeriod.split("-");
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);

  const periods: string[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(Date.UTC(year, month - 1 - i, 1));
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, "0");
    periods.push(`${y}-${m}`);
  }
  return periods;
}

export async function getDashboardAnalytics(
  period?: string
): Promise<DashboardAnalytics> {
  const user = await getCurrentUser();
  const currentPeriod = period || (await getCurrentPeriod());
  const [yearStr, monthStr] = currentPeriod.split("-");
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);

  const startDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0)).toISOString();
  const nextMonthDate = new Date(Date.UTC(year, month, 1, 0, 0, 0)).toISOString();

  const sixMonthPeriods = getLast6Periods(currentPeriod);
  const sixMonthsStartDate = new Date(
    Date.UTC(
      parseInt(sixMonthPeriods[0].split("-")[0], 10),
      parseInt(sixMonthPeriods[0].split("-")[1], 10) - 1,
      1,
      0,
      0,
      0
    )
  ).toISOString();

  try {
    const [
      walletRows,
      savingsRows,
      topSavingsRows,
      monthlyIncomeRows,
      monthlyExpenseRows,
      categoryExpenseRows,
      trendRows,
      recentTransactions,
    ] = await Promise.all([
      // 1. Total liquid balance
      sql`
        SELECT COALESCE(SUM(balance), 0) AS total_balance
        FROM wallets
        WHERE user_id = ${user.id}
          AND deleted_at IS NULL
          AND is_active = true
      `,
      // 2. Total savings
      sql`
        SELECT COALESCE(SUM(current_amount), 0) AS total_savings
        FROM savings_goals
        WHERE user_id = ${user.id}
          AND deleted_at IS NULL
      `,
      // 3. Top 3 savings goals
      sql`
        SELECT 
          id,
          user_id,
          name,
          target_amount,
          current_amount,
          target_date::text,
          icon,
          color,
          is_completed,
          created_at::text,
          updated_at::text,
          deleted_at::text
        FROM savings_goals
        WHERE user_id = ${user.id}
          AND deleted_at IS NULL
        ORDER BY (current_amount::numeric / GREATEST(target_amount, 1)::numeric) DESC, created_at ASC
        LIMIT 3
      `,
      // 4. Monthly Income
      sql`
        SELECT COALESCE(SUM(amount), 0) AS total_income
        FROM transactions
        WHERE user_id = ${user.id}
          AND deleted_at IS NULL
          AND type = 'income'
          AND transaction_date >= ${startDate}::timestamptz
          AND transaction_date < ${nextMonthDate}::timestamptz
      `,
      // 5. Monthly Expense
      sql`
        SELECT COALESCE(SUM(amount + admin_fee), 0) AS total_expense
        FROM transactions
        WHERE user_id = ${user.id}
          AND deleted_at IS NULL
          AND type = 'expense'
          AND transaction_date >= ${startDate}::timestamptz
          AND transaction_date < ${nextMonthDate}::timestamptz
      `,
      // 6. Category Expense Breakdown
      sql`
        SELECT 
          c.id AS category_id,
          c.name AS category_name,
          c.icon AS category_icon,
          c.color AS category_color,
          SUM(t.amount + t.admin_fee) AS amount
        FROM transactions t
        JOIN categories c ON c.id = t.category_id
        WHERE t.user_id = ${user.id}
          AND t.deleted_at IS NULL
          AND t.type = 'expense'
          AND transaction_date >= ${startDate}::timestamptz
          AND transaction_date < ${nextMonthDate}::timestamptz
        GROUP BY c.id, c.name, c.icon, c.color
        ORDER BY amount DESC
      `,
      // 7. 6-Month Cashflow Trend
      sql`
        SELECT 
          TO_CHAR(transaction_date AT TIME ZONE 'UTC', 'YYYY-MM') AS period,
          type,
          SUM(amount + (CASE WHEN type = 'expense' THEN admin_fee ELSE 0 END)) AS total
        FROM transactions
        WHERE user_id = ${user.id}
          AND deleted_at IS NULL
          AND (type = 'income' OR type = 'expense')
          AND transaction_date >= ${sixMonthsStartDate}::timestamptz
          AND transaction_date < ${nextMonthDate}::timestamptz
        GROUP BY TO_CHAR(transaction_date AT TIME ZONE 'UTC', 'YYYY-MM'), type
      `,
      // 8. Recent 5 Transactions
      getTransactions({ limit: 5 }),
    ]);

    const totalBalance = Number(walletRows[0]?.total_balance || 0);
    const totalSavings = Number(savingsRows[0]?.total_savings || 0);
    const netWorth = totalBalance + totalSavings;
    const savingsRatio =
      netWorth > 0 ? Math.round((totalSavings / netWorth) * 100) : 0;

    const monthlyIncome = Number(monthlyIncomeRows[0]?.total_income || 0);
    const monthlyExpense = Number(monthlyExpenseRows[0]?.total_expense || 0);
    const monthlyNet = monthlyIncome - monthlyExpense;

    // Category Breakdown Calculation
    const categoryBreakdown: CategoryExpenseBreakdown[] = categoryExpenseRows.map(
      (r) => {
        const amount = Number(r.amount);
        const percentage =
          monthlyExpense > 0 ? Math.round((amount / monthlyExpense) * 100) : 0;
        return {
          category_id: r.category_id as string,
          category_name: r.category_name as string,
          category_icon: r.category_icon as string,
          category_color: r.category_color as string,
          amount,
          percentage,
        };
      }
    );

    // Build 6-Month Trend Array
    const trendMap = new Map<string, { income: number; expense: number }>();
    for (const p of sixMonthPeriods) {
      trendMap.set(p, { income: 0, expense: 0 });
    }

    for (const row of trendRows) {
      const p = row.period as string;
      const type = row.type as string;
      const total = Number(row.total || 0);

      if (trendMap.has(p)) {
        const curr = trendMap.get(p)!;
        if (type === "income") curr.income = total;
        if (type === "expense") curr.expense = total;
      }
    }

    const cashflowTrend: MonthlyCashflowTrend[] = sixMonthPeriods.map((p) => {
      const data = trendMap.get(p) || { income: 0, expense: 0 };
      return {
        month: p,
        label: getMonthLabel(p),
        income: data.income,
        expense: data.expense,
        net: data.income - data.expense,
      };
    });

    const topSavingsGoals: SavingsGoal[] = topSavingsRows.map((r) => ({
      id: r.id as string,
      user_id: r.user_id as string,
      name: r.name as string,
      target_amount: Number(r.target_amount),
      current_amount: Number(r.current_amount),
      target_date: r.target_date as string | null,
      icon: r.icon as string,
      color: r.color as string,
      is_completed: Boolean(r.is_completed),
      created_at: r.created_at as string,
      updated_at: r.updated_at as string,
      deleted_at: r.deleted_at as string | null,
    }));

    return {
      totalBalance,
      totalSavings,
      netWorth,
      savingsRatio,
      monthlyIncome,
      monthlyExpense,
      monthlyNet,
      cashflowTrend,
      categoryBreakdown,
      topSavingsGoals,
      recentTransactions,
      currentPeriod,
    };
  } catch (error) {
    console.error("Error fetching dashboard analytics:", error);
    return {
      totalBalance: 0,
      totalSavings: 0,
      netWorth: 0,
      savingsRatio: 0,
      monthlyIncome: 0,
      monthlyExpense: 0,
      monthlyNet: 0,
      cashflowTrend: [],
      categoryBreakdown: [],
      topSavingsGoals: [],
      recentTransactions: [],
      currentPeriod,
    };
  }
}
