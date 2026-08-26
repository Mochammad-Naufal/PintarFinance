"use client";

import { AlertTriangle, CheckCircle2, ShieldAlert } from "lucide-react";
import { type Budget } from "@/types/finance";
import { formatCurrency } from "@/lib/utils";

interface BudgetSummaryProps {
  budgets: Budget[];
}

export function BudgetSummary({ budgets }: BudgetSummaryProps) {
  const totalLimit = budgets.reduce((acc, b) => acc + b.limit_amount, 0);
  const totalSpent = budgets.reduce((acc, b) => acc + b.spent_amount, 0);
  const totalRemaining = totalLimit - totalSpent;
  const overallPercentage =
    totalLimit > 0 ? Math.round((totalSpent / totalLimit) * 100) : 0;

  let statusConfig = {
    label: "Anggaran Terkendali",
    badgeBg: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
    barColor: "bg-emerald-500",
    icon: CheckCircle2,
  };

  if (overallPercentage >= 100) {
    statusConfig = {
      label: "Melebihi Anggaran",
      badgeBg: "bg-rose-500/15 text-rose-600 dark:text-rose-400",
      barColor: "bg-rose-500",
      icon: ShieldAlert,
    };
  } else if (overallPercentage >= 75) {
    statusConfig = {
      label: "Mendekati Batas",
      badgeBg: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
      barColor: "bg-amber-500",
      icon: AlertTriangle,
    };
  }

  const StatusIcon = statusConfig.icon;

  return (
    <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/80 shadow-xs space-y-4">
      {/* Top Header & Status Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Kesehatan Anggaran Periode Ini
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span
              className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${statusConfig.badgeBg}`}
            >
              <StatusIcon className="w-3.5 h-3.5" />
              {statusConfig.label}
            </span>
            <span className="text-xs text-zinc-500 dark:text-zinc-400 font-mono tabular-nums">
              ({overallPercentage}% terpakai)
            </span>
          </div>
        </div>

        <div className="text-right">
          <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Sisa Kuota Terbuka
          </p>
          <p
            className={`text-xl font-bold font-mono tabular-nums mt-0.5 ${
              totalRemaining >= 0
                ? "text-zinc-900 dark:text-white"
                : "text-rose-600 dark:text-rose-400"
            }`}
          >
            {formatCurrency(totalRemaining)}
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1.5">
        <div className="w-full h-2.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${statusConfig.barColor}`}
            style={{ width: `${Math.min(100, overallPercentage)}%` }}
          />
        </div>
      </div>

      {/* Key Numbers Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-3 border-t border-zinc-100 dark:border-zinc-800/40">
        <div>
          <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
            Total Dialokasikan
          </p>
          <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 font-mono tabular-nums mt-0.5">
            {formatCurrency(totalLimit)}
          </p>
        </div>

        <div>
          <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
            Total Realisasi
          </p>
          <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 font-mono tabular-nums mt-0.5">
            {formatCurrency(totalSpent)}
          </p>
        </div>

        <div className="col-span-2 sm:col-span-1">
          <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
            Pos Kategori Aktif
          </p>
          <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 font-mono tabular-nums mt-0.5">
            {budgets.length} Kategori
          </p>
        </div>
      </div>
    </div>
  );
}
