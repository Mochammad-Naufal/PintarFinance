"use server";

import { sql, DEMO_USER_ID } from "@/db";
import { type ActionResult, type TransactionType } from "@/types/finance";

export interface ExportFilter {
  period?: string; // "YYYY-MM" or "all"
  type?: TransactionType | "all";
  walletId?: string;
  startDate?: string;
  endDate?: string;
}

export interface ExportData {
  csvContent: string;
  filename: string;
  totalRows: number;
}

function escapeCSV(val: string | number | null | undefined): string {
  if (val === null || val === undefined) return "";
  const str = String(val);
  if (
    str.includes(",") ||
    str.includes('"') ||
    str.includes("\n") ||
    str.includes("\r")
  ) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

const TYPE_LABEL_MAP: Record<TransactionType, string> = {
  expense: "Pengeluaran",
  income: "Pemasukan",
  transfer: "Transfer",
  saving: "Menabung",
};

export async function exportTransactionsToCSV(
  filters?: ExportFilter
): Promise<ActionResult<ExportData>> {
  try {
    let startDate = filters?.startDate;
    let endDate = filters?.endDate;

    // If period is provided in "YYYY-MM" format and not "all"
    if (filters?.period && filters.period !== "all" && !startDate && !endDate) {
      startDate = `${filters.period}-01T00:00:00Z`;
      // Compute next month first day
      const [year, month] = filters.period.split("-").map(Number);
      const nextMonthDate = new Date(Date.UTC(year, month, 1));
      endDate = nextMonthDate.toISOString();
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
      WHERE t.user_id = ${DEMO_USER_ID}
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

    // CSV Headers
    const headers = [
      "Tanggal",
      "Tipe Mutasi",
      "Kategori",
      "Dompet Sumber",
      "Dompet Tujuan / Pos Impian",
      "Nominal (IDR)",
      "Biaya Admin (IDR)",
      "Catatan / Merchant",
    ];

    const csvLines: string[] = [];
    csvLines.push(headers.map(escapeCSV).join(","));

    for (const r of rows) {
      // Format date: YYYY-MM-DD HH:mm
      const rawDate = r.transaction_date as string;
      const dateFormatted = rawDate
        ? new Date(rawDate).toISOString().replace("T", " ").slice(0, 16)
        : "";

      const rawType = r.type as TransactionType;
      const typeLabel = TYPE_LABEL_MAP[rawType] ?? rawType;
      const category = (r.category_name as string) || "-";
      const sourceWallet = (r.wallet_name as string) || "-";
      const destOrGoal =
        (r.destination_wallet_name as string) ||
        (r.savings_goal_name as string) ||
        "-";
      const amount = Number(r.amount) || 0;
      const adminFee = Number(r.admin_fee) || 0;
      const description = (r.description as string) || "-";

      const line = [
        escapeCSV(dateFormatted),
        escapeCSV(typeLabel),
        escapeCSV(category),
        escapeCSV(sourceWallet),
        escapeCSV(destOrGoal),
        escapeCSV(amount),
        escapeCSV(adminFee),
        escapeCSV(description),
      ].join(",");

      csvLines.push(line);
    }

    // Add UTF-8 Byte Order Mark (\uFEFF) for Excel Indonesian/international compatibility
    const csvContent = "\uFEFF" + csvLines.join("\r\n");

    // Filename generation
    const timestamp = new Date().toISOString().slice(0, 10);
    let filename = `laporan-transaksi-${timestamp}.csv`;
    if (filters?.period && filters.period !== "all") {
      filename = `laporan-transaksi-${filters.period}.csv`;
    }

    return {
      success: true,
      data: {
        csvContent,
        filename,
        totalRows: rows.length,
      },
    };
  } catch (error) {
    console.error("Error exporting transactions to CSV:", error);
    return {
      success: false,
      error: "Gagal mengekspor data transaksi ke format CSV",
    };
  }
}
