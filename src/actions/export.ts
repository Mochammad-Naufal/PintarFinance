"use server";

import { sql } from "@/db";
import { getCurrentUser } from "@/lib/supabase/user";
import { type ActionResult, type TransactionType } from "@/types/finance";
import { formatDate } from "@/lib/utils";

export interface ExportFilter {
  period?: string; // "YYYY-MM" or "all"
  type?: TransactionType | "all";
  walletId?: string;
  startDate?: string;
  endDate?: string;
}

export interface ExportTransactionRecord {
  id: string;
  type: TransactionType;
  typeLabel: string;
  amount: number;
  adminFee: number;
  transactionDate: string;
  formattedDate: string;
  description: string;
  categoryName: string;
  walletName: string;
  destinationName: string;
}

export interface ExportReportData {
  periodLabel: string;
  generatedAt: string;
  userName: string;
  totalIncome: number;
  totalExpense: number;
  netCashflow: number;
  totalTransactions: number;
  records: ExportTransactionRecord[];
}

const TYPE_LABEL_MAP: Record<TransactionType, string> = {
  expense: "Pengeluaran",
  income: "Pemasukan",
  transfer: "Transfer",
  saving: "Menabung",
};

export async function getExportReportData(
  filters?: ExportFilter
): Promise<ActionResult<ExportReportData>> {
  try {
    const user = await getCurrentUser();
    let startDate = filters?.startDate;
    let endDate = filters?.endDate;
    let periodLabel = "Semua Riwayat Transaksi";

    // If period is provided in "YYYY-MM" format and not "all"
    if (filters?.period && filters.period !== "all" && !startDate && !endDate) {
      const [year, month] = filters.period.split("-").map(Number);
      startDate = `${filters.period}-01T00:00:00Z`;
      const nextMonthDate = new Date(Date.UTC(year, month, 1));
      endDate = nextMonthDate.toISOString();

      const dateObj = new Date(year, month - 1, 1);
      periodLabel = formatDate(dateObj, "MMMM yyyy");
    } else if (startDate && endDate) {
      periodLabel = `${formatDate(startDate, "d MMM yyyy")} - ${formatDate(endDate, "d MMM yyyy")}`;
    }

    const rows = await sql`
      SELECT 
        t.id,
        t.type,
        t.amount,
        t.admin_fee,
        t.transaction_date::text,
        t.description,
        w.name AS wallet_name,
        dw.name AS destination_wallet_name,
        c.name AS category_name,
        sg.name AS savings_goal_name
      FROM transactions t
      LEFT JOIN wallets w ON w.id = t.wallet_id
      LEFT JOIN wallets dw ON dw.id = t.destination_wallet_id
      LEFT JOIN categories c ON c.id = t.category_id
      LEFT JOIN savings_goals sg ON sg.id = t.savings_goal_id
      WHERE t.user_id = ${user.id}
        AND t.deleted_at IS NULL
        ${
          filters?.walletId && filters.walletId !== "all"
            ? sql`AND (t.wallet_id = ${filters.walletId} OR t.destination_wallet_id = ${filters.walletId})`
            : sql``
        }
        ${
          filters?.type && filters.type !== "all"
            ? sql`AND t.type = ${filters.type}`
            : sql``
        }
        ${
          startDate
            ? sql`AND t.transaction_date >= ${startDate}::timestamptz`
            : sql``
        }
        ${
          endDate
            ? sql`AND t.transaction_date < ${endDate}::timestamptz`
            : sql``
        }
      ORDER BY t.transaction_date DESC, t.created_at DESC
    `;

    let totalIncome = 0;
    let totalExpense = 0;

    const records: ExportTransactionRecord[] = rows.map((r) => {
      const rawType = r.type as TransactionType;
      const amount = Number(r.amount) || 0;
      const adminFee = Number(r.admin_fee) || 0;
      const rawDate = r.transaction_date as string;

      if (rawType === "income") {
        totalIncome += amount;
      } else if (rawType === "expense") {
        totalExpense += amount + adminFee;
      }

      const destOrGoal =
        (r.destination_wallet_name as string) ||
        (r.savings_goal_name as string) ||
        "-";

      return {
        id: r.id as string,
        type: rawType,
        typeLabel: TYPE_LABEL_MAP[rawType] ?? rawType,
        amount,
        adminFee,
        transactionDate: rawDate,
        formattedDate: rawDate ? formatDate(rawDate, "d MMM yyyy, HH:mm") : "-",
        description: (r.description as string) || "-",
        categoryName: (r.category_name as string) || "-",
        walletName: (r.wallet_name as string) || "-",
        destinationName: destOrGoal,
      };
    });

    const netCashflow = totalIncome - totalExpense;
    const now = new Date();
    const generatedAt = `${formatDate(now, "d MMMM yyyy, HH:mm")} WIB`;

    return {
      success: true,
      data: {
        periodLabel,
        generatedAt,
        userName: user.name,
        totalIncome,
        totalExpense,
        netCashflow,
        totalTransactions: records.length,
        records,
      },
    };
  } catch (error) {
    console.error("Error generating report data:", error);
    return {
      success: false,
      error: "Gagal mengambil data laporan transaksi",
    };
  }
}
