"use client";

import { AlertCircle, ArrowDownLeft, ArrowUpRight, Scale } from "lucide-react";
import { type Debt } from "@/types/finance";
import { formatCurrency } from "@/lib/utils";

interface DebtSummaryProps {
  debts: Debt[];
}

export function DebtSummary({ debts }: DebtSummaryProps) {
  // 1. Hutang Saya (Debts I owe to others)
  const myDebts = debts.filter((d) => d.type === "debt" && d.status !== "paid");
  const totalDebtPrincipal = myDebts.reduce((sum, d) => sum + d.total_amount, 0);
  const remainingDebt = myDebts.reduce((sum, d) => sum + d.remaining_amount, 0);

  // 2. Piutang Saya (Debts others owe to me)
  const myReceivables = debts.filter((d) => d.type === "receivable" && d.status !== "paid");
  const totalReceivablePrincipal = myReceivables.reduce((sum, d) => sum + d.total_amount, 0);
  const remainingReceivable = myReceivables.reduce((sum, d) => sum + d.remaining_amount, 0);

  // Net Debt / Liability Position
  const netLiabilityPosition = remainingReceivable - remainingDebt;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
      {/* 1. Hutang Saya (Liabilitas) */}
      <div className="p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-rose-600 dark:text-rose-400">
            <div className="w-7 h-7 rounded-xl bg-rose-500/15 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </div>
            <span>Hutang Saya (Liabilitas)</span>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 font-mono">
            {myDebts.length} Pos Aktif
          </span>
        </div>

        <div>
          <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 font-mono tabular-nums">
            {formatCurrency(remainingDebt)}
          </p>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
            Total Awal: {formatCurrency(totalDebtPrincipal)}
          </p>
        </div>
      </div>

      {/* 2. Piutang Saya (Hak Tagih) */}
      <div className="p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            <div className="w-7 h-7 rounded-xl bg-emerald-500/15 flex items-center justify-center">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
            <span>Piutang Saya (Hak Tagih)</span>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono">
            {myReceivables.length} Pos Aktif
          </span>
        </div>

        <div>
          <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 font-mono tabular-nums">
            {formatCurrency(remainingReceivable)}
          </p>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
            Total Awal: {formatCurrency(totalReceivablePrincipal)}
          </p>
        </div>
      </div>

      {/* 3. Posisi Bersih Liabilitas */}
      <div className="p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            <div className="w-7 h-7 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-400">
              <Scale className="w-4 h-4" />
            </div>
            <span>Posisi Bersih Liabilitas</span>
          </div>
          <span className="text-[10px] font-medium text-zinc-400">Net Position</span>
        </div>

        <div>
          <p
            className={`text-2xl font-bold font-mono tabular-nums ${
              netLiabilityPosition >= 0
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-rose-600 dark:text-rose-400"
            }`}
          >
            {netLiabilityPosition >= 0 ? "+" : ""}
            {formatCurrency(netLiabilityPosition)}
          </p>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
            {netLiabilityPosition >= 0
              ? "Piutang lebih besar dari hutang"
              : "Hutang lebih besar dari piutang"}
          </p>
        </div>
      </div>
    </div>
  );
}
