import Link from "next/link";
import { getDashboardAnalytics } from "@/actions/analytics";
import { getBudgets } from "@/actions/budgets";
import { getWallets } from "@/actions/wallets";
import { formatCurrency, formatDate } from "@/lib/utils";
import { DynamicIcon } from "@/lib/icons";
import { NetWorthBanner } from "@/components/modules/analytics/NetWorthBanner";
import { CashflowChart } from "@/components/modules/analytics/CashflowChart";
import { ExpenseCategoryChart } from "@/components/modules/analytics/ExpenseCategoryChart";
import { AIContextCard } from "@/components/modules/ai/AIContextCard";
import {
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  CreditCard,
  GraduationCap,
  PiggyBank,
  Receipt,
  Scale,
} from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Dashboard Analitik",
  description: "Ringkasan finansial cerdas, visualisasi arus kas, dan pemantauan impian keuangan.",
};

export default async function DashboardPage() {
  const [analytics, budgets, wallets] = await Promise.all([
    getDashboardAnalytics(),
    getBudgets(),
    getWallets(),
  ]);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* ── Baris 1: Hero Net Worth Banner ──────────────────────────────── */}
      <NetWorthBanner analytics={analytics} />

      {/* ── AI Contextual Advisor ────────────────────────────────────────── */}
      <AIContextCard moduleType="dashboard" moduleName="Dashboard Finansial" />

      {/* ── Quick Monthly Cashflow Cards ─────────────────────────────────── */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Pemasukan */}
        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Pemasukan Bulan Ini
            </p>
            <div className="p-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <ArrowDownLeft className="w-3.5 h-3.5" strokeWidth={1.75} />
            </div>
          </div>
          <p className="text-xl font-bold tracking-tight font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
            {formatCurrency(analytics.monthlyIncome)}
          </p>
        </div>

        {/* Pengeluaran */}
        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Pengeluaran Bulan Ini
            </p>
            <div className="p-1 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400">
              <ArrowUpRight className="w-3.5 h-3.5" strokeWidth={1.75} />
            </div>
          </div>
          <p className="text-xl font-bold tracking-tight font-mono tabular-nums text-zinc-900 dark:text-zinc-100">
            {formatCurrency(analytics.monthlyExpense)}
          </p>
        </div>

        {/* Arus Kas Bersih */}
        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Arus Kas Bersih
            </p>
            <div className="p-1 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <Scale className="w-3.5 h-3.5" strokeWidth={1.75} />
            </div>
          </div>
          <p
            className={`text-xl font-bold tracking-tight font-mono tabular-nums ${
              analytics.monthlyNet >= 0
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-rose-600 dark:text-rose-400"
            }`}
          >
            {analytics.monthlyNet > 0 ? "+" : ""}
            {formatCurrency(analytics.monthlyNet)}
          </p>
        </div>
      </section>

      {/* ── Baris 2: Data Visualizations (6-Month Trend + Category Donut) ── */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: Cashflow 6-Month Trend */}
        <div className="lg:col-span-7">
          <CashflowChart data={analytics.cashflowTrend} />
        </div>

        {/* Right: Category Expense Composition */}
        <div className="lg:col-span-5">
          <ExpenseCategoryChart
            categories={analytics.categoryBreakdown}
            totalExpense={analytics.monthlyExpense}
          />
        </div>
      </section>

      {/* ── Baris 3: Budget Status + Pos Impian + Dompet Preview ───────── */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Dompet Preview */}
        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Dompet & Kas
              </h2>
            </div>
            <Link
              href="/wallets"
              className="text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-0.5"
            >
              Kelola <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-2">
            {wallets.slice(0, 3).map((w) => (
              <div
                key={w.id}
                className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200/80 dark:border-zinc-800/60"
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
                    <p className="text-xs font-medium text-zinc-800 dark:text-zinc-200 truncate">{w.name}</p>
                  </div>
                </div>
                <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 font-mono tabular-nums">
                  {formatCurrency(w.balance)}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Pos Impian Preview */}
        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PiggyBank className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Pos Tabungan Impian
              </h2>
            </div>
            <Link
              href="/savings"
              className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5"
            >
              Semua <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-2">
            {analytics.topSavingsGoals.map((g) => {
              const pct = Math.min(
                100,
                Math.round((g.current_amount / (g.target_amount || 1)) * 100)
              );
              return (
                <div
                  key={g.id}
                  className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200/80 dark:border-zinc-800/60 space-y-1.5"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-zinc-800 dark:text-zinc-200 truncate max-w-[130px]">
                      {g.name}
                    </span>
                    <span className="font-bold text-zinc-700 dark:text-zinc-300 font-mono tabular-nums">
                      {pct}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-blue-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Status Anggaran Preview */}
        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Anggaran Bulan Ini
              </h2>
            </div>
            <Link
              href="/budgets"
              className="text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-0.5"
            >
              Atur <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-2">
            {budgets.slice(0, 3).map((b) => {
              const isOver = b.spent_amount > b.limit_amount;
              const isWarn = b.percentage >= 75 && !isOver;
              const barColor = isOver
                ? "bg-rose-500"
                : isWarn
                ? "bg-amber-500"
                : "bg-emerald-500";

              return (
                <div
                  key={b.id}
                  className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200/80 dark:border-zinc-800/60 space-y-1.5"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-zinc-800 dark:text-zinc-200 truncate max-w-[130px]">
                      {b.category_name}
                    </span>
                    <span
                      className={`font-bold font-mono tabular-nums ${
                        isOver
                          ? "text-rose-600 dark:text-rose-400"
                          : isWarn
                          ? "text-amber-600 dark:text-amber-400"
                          : "text-zinc-700 dark:text-zinc-300"
                      }`}
                    >
                      {b.percentage}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${barColor}`}
                      style={{ width: `${Math.min(100, b.percentage)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Baris 4: Recent Transactions Live Feed ────────────────────── */}
      <section className="p-5 rounded-2xl bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Transaksi Terakhir
            </h2>
          </div>
          <Link
            href="/transactions"
            className="text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 dark:hover:text-emerald-300 flex items-center gap-1"
          >
            Semua Transaksi <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {analytics.recentTransactions.length === 0 ? (
          <p className="text-xs text-zinc-500 text-center py-6">
            Belum ada transaksi tercatat.
          </p>
        ) : (
          <div className="space-y-2">
            {analytics.recentTransactions.map((tx) => {
              const isIncome = tx.type === "income";
              const isSaving = tx.type === "saving";
              const isTransfer = tx.type === "transfer";

              return (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200/80 dark:border-zinc-800/60"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                      style={{
                        backgroundColor: isIncome
                          ? "rgba(16, 185, 129, 0.15)"
                          : isSaving
                          ? "rgba(59, 130, 246, 0.15)"
                          : isTransfer
                          ? "rgba(139, 92, 246, 0.15)"
                          : "rgba(249, 115, 22, 0.15)",
                        color: isIncome
                          ? "#10b981"
                          : isSaving
                          ? "#3b82f6"
                          : isTransfer
                          ? "#8b5cf6"
                          : "#f97316",
                      }}
                    >
                      <DynamicIcon
                        name={
                          isIncome
                            ? tx.category_icon || "arrow-down-left"
                            : isSaving
                            ? tx.savings_goal_icon || "target"
                            : isTransfer
                            ? "arrow-left-right"
                            : tx.category_icon || "arrow-up-right"
                        }
                        className="w-4 h-4"
                        strokeWidth={1.75}
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 truncate">
                        {tx.description || tx.category_name || (isTransfer ? "Transfer Dompet" : "Transaksi")}
                      </p>
                      <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                        {tx.wallet_name} • {formatDate(tx.transaction_date, "d MMM, HH:mm")}
                      </p>
                    </div>
                  </div>

                  <p
                    className={`text-xs font-bold font-mono tabular-nums shrink-0 ml-3 ${
                      isIncome
                        ? "text-emerald-600 dark:text-emerald-400"
                        : isSaving
                        ? "text-blue-600 dark:text-blue-400"
                        : "text-zinc-900 dark:text-zinc-100"
                    }`}
                  >
                    {isIncome
                      ? `+ ${formatCurrency(tx.amount)}`
                      : isSaving
                      ? `🎯 ${formatCurrency(tx.amount)}`
                      : isTransfer
                      ? `⇄ ${formatCurrency(tx.amount)}`
                      : `- ${formatCurrency(tx.amount)}`}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
