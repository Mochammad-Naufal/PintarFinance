"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  ArrowUpWideNarrow,
  ChevronDown,
  CreditCard,
  PiggyBank,
  Plus,
  Scale,
  TrendingDown,
  TrendingUp,
  Wallet as WalletIcon,
} from "lucide-react";
import {
  type DashboardAnalytics,
  type Debt,
  type SavingsGoal,
  type Wallet,
} from "@/types/finance";
import { formatCurrency } from "@/lib/utils";
import { DynamicIcon } from "@/lib/icons";

interface NetWorthBannerProps {
  analytics: DashboardAnalytics;
  wallets?: Wallet[];
}

export function NetWorthBanner({
  analytics,
  wallets = [],
}: NetWorthBannerProps) {
  const [isWalletsOpen, setIsWalletsOpen] = useState(false);
  const [isSavingsOpen, setIsSavingsOpen] = useState(false);
  const [isDebtsOpen, setIsDebtsOpen] = useState(false);

  const isNetPositive = analytics.monthlyNet >= 0;

  // 1. Sort wallets ascending (smallest balance to highest)
  const sortedWallets = useMemo(() => {
    return [...wallets].sort((a, b) => a.balance - b.balance);
  }, [wallets]);

  // 2. Savings goals list
  const savingsGoals: SavingsGoal[] = analytics.topSavingsGoals || [];
  const hasSavings = savingsGoals.length > 0 && analytics.totalSavings > 0;

  // 3. Active Debts (Liabilities)
  const topDebts: Debt[] = analytics.topDebts || [];
  const totalDebts = analytics.totalDebts || 0;
  const hasDebts = totalDebts > 0;

  const grossAssets = analytics.totalBalance + analytics.totalSavings;

  return (
    <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/80 shadow-xs space-y-6">
      {/* Top: Net Worth Main Figure & Monthly Cashflow Growth Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Total Estimasi Kekayaan Bersih (Net Worth)
          </p>
          <div className="flex items-baseline gap-3 mt-1.5 flex-wrap">
            <h1
              className={`text-3xl sm:text-4xl font-bold tracking-tight font-mono tabular-nums ${
                analytics.netWorth < 0
                  ? "text-rose-600 dark:text-rose-400"
                  : "text-zinc-900 dark:text-white"
              }`}
            >
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

        {/* Savings & Liabilities Quick Metrics */}
        <div className="flex items-center gap-4 text-left sm:text-right">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Total Aset Kotor
            </p>
            <p className="text-base font-bold text-zinc-900 dark:text-zinc-100 font-mono tabular-nums mt-0.5">
              {formatCurrency(grossAssets)}
            </p>
          </div>
          <div className="w-px h-8 bg-zinc-200 dark:bg-zinc-800" />
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wider text-rose-500 dark:text-rose-400">
              Sisa Hutang
            </p>
            <p className="text-base font-bold text-rose-600 dark:text-rose-400 font-mono tabular-nums mt-0.5">
              -{formatCurrency(totalDebts)}
            </p>
          </div>
        </div>
      </div>

      {/* Asset Composition Visual Ratio Bar */}
      <div className="space-y-2">
        <div className="w-full h-3 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden flex">
          {/* Liquid Wallets portion */}
          <div
            className="h-full bg-emerald-500 transition-all duration-500"
            style={{
              width: `${
                grossAssets > 0
                  ? Math.round((analytics.totalBalance / grossAssets) * 100)
                  : 50
              }%`,
            }}
            title={`Likuiditas Kas: ${formatCurrency(analytics.totalBalance)}`}
          />
          {/* Savings Goals portion */}
          <div
            className="h-full bg-blue-500 transition-all duration-500"
            style={{
              width: `${
                grossAssets > 0
                  ? Math.round((analytics.totalSavings / grossAssets) * 100)
                  : 50
              }%`,
            }}
            title={`Pos Impian: ${formatCurrency(analytics.totalSavings)}`}
          />
        </div>

        {/* Interactive Collapsible / Accordion Grid (3 Columns) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 text-xs items-start">
          {/* ── Accordion 1: Likuiditas Kas & Dompet ── */}
          <div className="rounded-2xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200/80 dark:border-zinc-800/60 overflow-hidden transition-all">
            <button
              type="button"
              onClick={() => setIsWalletsOpen((prev) => !prev)}
              aria-expanded={isWalletsOpen}
              className="w-full flex items-center justify-between p-3.5 text-left hover:bg-zinc-100/70 dark:hover:bg-zinc-900/60 active:scale-[0.99] transition-all group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <WalletIcon className="w-4 h-4" strokeWidth={1.75} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] uppercase font-medium text-zinc-500 dark:text-zinc-400">
                    Likuiditas Kas &amp; Dompet
                  </p>
                  <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 font-mono tabular-nums mt-0.5">
                    {formatCurrency(analytics.totalBalance)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 ml-2">
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-zinc-200/70 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                  {sortedWallets.length} Dompet
                </span>
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-zinc-400 group-hover:text-zinc-700 dark:group-hover:text-zinc-200 transition-transform duration-200 ${
                    isWalletsOpen ? "rotate-180 text-emerald-600 dark:text-emerald-400" : ""
                  }`}
                >
                  <ChevronDown className="w-4 h-4" />
                </div>
              </div>
            </button>

            {isWalletsOpen && (
              <div className="border-t border-zinc-200/70 dark:border-zinc-800/70 p-3.5 space-y-3 bg-white/70 dark:bg-zinc-900/40 animate-in fade-in slide-in-from-top-1 duration-200">
                <div className="flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400 px-0.5">
                  <span className="flex items-center gap-1 font-medium">
                    <ArrowUpWideNarrow className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    Urutan Saldo Terendah:
                  </span>
                </div>

                {sortedWallets.length === 0 ? (
                  <div className="p-3 text-center rounded-xl bg-zinc-50 dark:bg-zinc-950/40 border border-dashed border-zinc-200 dark:border-zinc-800">
                    <p className="text-xs text-zinc-500">Belum ada dompet terdaftar.</p>
                    <Link
                      href="/wallets"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-1 hover:underline"
                    >
                      <Plus className="w-3 h-3" /> Tambah Dompet
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-60 overflow-y-auto pr-0.5">
                    {sortedWallets.map((w, index) => {
                      const isLowBalance = w.balance < 50000;
                      const isZero = w.balance <= 0;

                      return (
                        <div
                          key={w.id}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200/70 dark:border-zinc-800/60 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div
                              className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                              style={{
                                backgroundColor: `${w.color}15`,
                                color: w.color,
                              }}
                            >
                              <DynamicIcon name={w.icon} className="w-3.5 h-3.5" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                                  {w.name}
                                </p>
                                {index === 0 && (
                                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400 font-semibold shrink-0">
                                    Terendah
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-zinc-500 dark:text-zinc-400 capitalize">
                                {w.type}
                              </p>
                            </div>
                          </div>

                          <div className="text-right shrink-0 ml-2">
                            <p
                              className={`text-xs font-bold font-mono tabular-nums ${
                                isZero
                                  ? "text-rose-600 dark:text-rose-400"
                                  : isLowBalance
                                  ? "text-amber-600 dark:text-amber-400"
                                  : "text-zinc-900 dark:text-zinc-100"
                              }`}
                            >
                              {formatCurrency(w.balance)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="pt-1 text-right">
                  <Link
                    href="/wallets"
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                  >
                    Kelola Dompet <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* ── Accordion 2: Terkunci di Pos Impian ── */}
          <div className="rounded-2xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200/80 dark:border-zinc-800/60 overflow-hidden transition-all">
            <button
              type="button"
              onClick={() => setIsSavingsOpen((prev) => !prev)}
              aria-expanded={isSavingsOpen}
              className="w-full flex items-center justify-between p-3.5 text-left hover:bg-zinc-100/70 dark:hover:bg-zinc-900/60 active:scale-[0.99] transition-all group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <PiggyBank className="w-4 h-4" strokeWidth={1.75} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] uppercase font-medium text-zinc-500 dark:text-zinc-400">
                    Terkunci di Pos Impian
                  </p>
                  <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 font-mono tabular-nums mt-0.5">
                    {formatCurrency(analytics.totalSavings)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 ml-2">
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-zinc-200/70 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                  {savingsGoals.length} Pos
                </span>
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-zinc-400 group-hover:text-zinc-700 dark:group-hover:text-zinc-200 transition-transform duration-200 ${
                    isSavingsOpen ? "rotate-180 text-blue-600 dark:text-blue-400" : ""
                  }`}
                >
                  <ChevronDown className="w-4 h-4" />
                </div>
              </div>
            </button>

            {isSavingsOpen && (
              <div className="border-t border-zinc-200/70 dark:border-zinc-800/70 p-3.5 space-y-3 bg-white/70 dark:bg-zinc-900/40 animate-in fade-in slide-in-from-top-1 duration-200">
                {!hasSavings ? (
                  <div className="p-4 text-center rounded-xl bg-zinc-50 dark:bg-zinc-950/40 border border-dashed border-zinc-200 dark:border-zinc-800 space-y-1.5">
                    <p className="text-xs font-medium text-zinc-600 dark:text-zinc-300">
                      Belum ada alokasi pos impian
                    </p>
                    <Link
                      href="/savings"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 pt-1 hover:underline"
                    >
                      <Plus className="w-3 h-3" /> Buat Target Impian
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-0.5">
                    {savingsGoals.map((g) => {
                      const pct = Math.min(
                        100,
                        Math.round((g.current_amount / (g.target_amount || 1)) * 100)
                      );

                      return (
                        <div
                          key={g.id}
                          className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200/70 dark:border-zinc-800/60 space-y-2 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <div
                                className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                                style={{
                                  backgroundColor: `${g.color || "#3b82f6"}15`,
                                  color: g.color || "#3b82f6",
                                }}
                              >
                                <DynamicIcon name={g.icon || "target"} className="w-3.5 h-3.5" />
                              </div>
                              <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                                {g.name}
                              </span>
                            </div>

                            <div className="text-right shrink-0">
                              <span className="text-xs font-bold font-mono tabular-nums text-blue-600 dark:text-blue-400">
                                {formatCurrency(g.current_amount)}
                              </span>
                              <span className="text-[10px] text-zinc-400 ml-1">
                                ({pct}%)
                              </span>
                            </div>
                          </div>

                          <div className="w-full h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-blue-500 transition-all duration-300"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="pt-1 text-right">
                  <Link
                    href="/savings"
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Lihat Pos Impian <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* ── Accordion 3: Liabilitas & Hutang Aktif ── */}
          <div className="rounded-2xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200/80 dark:border-zinc-800/60 overflow-hidden transition-all">
            <button
              type="button"
              onClick={() => setIsDebtsOpen((prev) => !prev)}
              aria-expanded={isDebtsOpen}
              className="w-full flex items-center justify-between p-3.5 text-left hover:bg-zinc-100/70 dark:hover:bg-zinc-900/60 active:scale-[0.99] transition-all group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <CreditCard className="w-4 h-4" strokeWidth={1.75} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] uppercase font-medium text-rose-600 dark:text-rose-400">
                    Liabilitas &amp; Hutang Aktif
                  </p>
                  <p className="text-sm font-bold text-rose-600 dark:text-rose-400 font-mono tabular-nums mt-0.5">
                    -{formatCurrency(totalDebts)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 ml-2">
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-zinc-200/70 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                  {topDebts.length} Hutang
                </span>
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-zinc-400 group-hover:text-zinc-700 dark:group-hover:text-zinc-200 transition-transform duration-200 ${
                    isDebtsOpen ? "rotate-180 text-rose-600 dark:text-rose-400" : ""
                  }`}
                >
                  <ChevronDown className="w-4 h-4" />
                </div>
              </div>
            </button>

            {isDebtsOpen && (
              <div className="border-t border-zinc-200/70 dark:border-zinc-800/70 p-3.5 space-y-3 bg-white/70 dark:bg-zinc-900/40 animate-in fade-in slide-in-from-top-1 duration-200">
                {!hasDebts ? (
                  <div className="p-3 text-center rounded-xl bg-zinc-50 dark:bg-zinc-950/40 border border-dashed border-zinc-200 dark:border-zinc-800">
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                      Bebas Hutang!
                    </p>
                    <p className="text-[11px] text-zinc-500 mt-0.5">
                      Anda tidak memiliki liabilitas atau hutang aktif saat ini.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-0.5">
                    {topDebts.map((d) => (
                      <div
                        key={d.id}
                        className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200/70 dark:border-zinc-800/60 flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                            {d.title}
                          </p>
                          <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                            {d.counterparty_name}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xs font-bold text-rose-600 dark:text-rose-400 font-mono tabular-nums">
                            {formatCurrency(d.remaining_amount)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="pt-1 text-right">
                  <Link
                    href="/debts"
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400 hover:underline"
                  >
                    Kelola Hutang &amp; Piutang <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
