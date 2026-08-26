"use client";

import { PiggyBank, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { type DashboardAnalytics } from "@/types/finance";
import { formatCurrency } from "@/lib/utils";

interface NetWorthBannerProps {
  analytics: DashboardAnalytics;
}

export function NetWorthBanner({ analytics }: NetWorthBannerProps) {
  const isNetPositive = analytics.monthlyNet >= 0;

  return (
    <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/80 shadow-xs space-y-6">
      {/* Top: Net Worth Main Figure & Monthly Cashflow Growth Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Total Estimasi Kekayaan Bersih (Net Worth)
          </p>
          <div className="flex items-baseline gap-3 mt-1.5 flex-wrap">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight font-mono tabular-nums text-zinc-900 dark:text-white">
              {formatCurrency(analytics.netWorth)}
            </h1>

            {/* Monthly cashflow delta */}
            <div
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold font-mono tabular-nums ${
                isNetPositive
                  ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                  : "bg-rose-500/15 text-rose-600 dark:text-rose-400"
              }`}
            >
              {isNetPositive ? (
                <TrendingUp className="w-3.5 h-3.5" />
              ) : (
                <TrendingDown className="w-3.5 h-3.5" />
              )}
              {isNetPositive ? "+" : ""}
              {formatCurrency(analytics.monthlyNet)} bulan ini
            </div>
          </div>
        </div>

        {/* Savings Goal Allocation Ratio Badge */}
        <div className="text-left sm:text-right">
          <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Alokasi Tabungan Impian
          </p>
          <p className="text-lg font-bold text-blue-600 dark:text-blue-400 font-mono tabular-nums mt-0.5">
            {analytics.savingsRatio}% dari Total Aset
          </p>
        </div>
      </div>

      {/* Asset Composition Visual Ratio Bar */}
      <div className="space-y-2">
        <div className="w-full h-3 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden flex">
          {/* Liquid Wallets portion */}
          <div
            className="h-full bg-emerald-500 transition-all duration-500"
            style={{ width: `${100 - analytics.savingsRatio}%` }}
            title={`Likuiditas: ${100 - analytics.savingsRatio}%`}
          />
          {/* Savings Goals portion */}
          <div
            className="h-full bg-blue-500 transition-all duration-500"
            style={{ width: `${analytics.savingsRatio}%` }}
            title={`Pos Impian: ${analytics.savingsRatio}%`}
          />
        </div>

        {/* Sub-breakdown Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200/80 dark:border-zinc-800/60">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Wallet className="w-4 h-4" strokeWidth={1.75} />
            </div>
            <div>
              <p className="text-[10px] uppercase font-medium text-zinc-500 dark:text-zinc-400">
                Likuiditas Kas & Dompet ({100 - analytics.savingsRatio}%)
              </p>
              <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 font-mono tabular-nums mt-0.5">
                {formatCurrency(analytics.totalBalance)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200/80 dark:border-zinc-800/60">
            <div className="w-8 h-8 rounded-lg bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <PiggyBank className="w-4 h-4" strokeWidth={1.75} />
            </div>
            <div>
              <p className="text-[10px] uppercase font-medium text-zinc-500 dark:text-zinc-400">
                Terkunci di Pos Impian ({analytics.savingsRatio}%)
              </p>
              <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 font-mono tabular-nums mt-0.5">
                {formatCurrency(analytics.totalSavings)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
