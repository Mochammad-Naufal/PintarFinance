import Link from "next/link";
import { getWallets } from "@/actions/wallets";
import { getSavingsGoals } from "@/actions/savings";
import { getTransactions } from "@/actions/transactions";
import { formatCurrency, formatDate } from "@/lib/utils";
import { DynamicIcon } from "@/lib/icons";
import {
  ArrowRight,
  CreditCard,
  PiggyBank,
  Receipt,
  TrendingUp,
  Wallet,
} from "lucide-react";

export const metadata = {
  title: "Dashboard",
  description: "Ringkasan finansial, saldo terkumpul, dan pemantauan impian keuangan.",
};

export default async function DashboardPage() {
  const [wallets, goals, recentTransactions] = await Promise.all([
    getWallets(),
    getSavingsGoals(),
    getTransactions({ limit: 5 }),
  ]);

  const totalBalance = wallets.reduce((acc, w) => acc + w.balance, 0);
  const totalSavings = goals.reduce((acc, g) => acc + g.current_amount, 0);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* ── Summary stat cards (Solid monochrome nominals) ─────────────── */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Saldo */}
        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Total Likuiditas Saldo
            </p>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Wallet className="w-4 h-4" strokeWidth={1.75} />
            </div>
          </div>
          <p className="text-2xl font-bold tracking-tight font-mono tabular-nums text-zinc-900 dark:text-white">
            {formatCurrency(totalBalance)}
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Tersebar di {wallets.length} dompet aktif
          </p>
        </div>

        {/* Tabungan Impian */}
        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Dana di Pos Impian
            </p>
            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <PiggyBank className="w-4 h-4" strokeWidth={1.75} />
            </div>
          </div>
          <p className="text-2xl font-bold tracking-tight font-mono tabular-nums text-zinc-900 dark:text-white">
            {formatCurrency(totalSavings)}
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Dari {goals.length} target impian
          </p>
        </div>

        {/* Net Worth */}
        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Estimasi Kekayaan Bersih
            </p>
            <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <TrendingUp className="w-4 h-4" strokeWidth={1.75} />
            </div>
          </div>
          <p className="text-2xl font-bold tracking-tight font-mono tabular-nums text-zinc-900 dark:text-white">
            {formatCurrency(totalBalance + totalSavings)}
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Saldo + Pos Tabungan</p>
        </div>
      </section>

      {/* ── Wallets & Savings Quick Preview ────────────────────────────── */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Dompet Preview */}
        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Dompet & Rekening
              </h2>
            </div>
            <Link
              href="/wallets"
              className="text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 dark:hover:text-emerald-300 flex items-center gap-1"
            >
              Kelola <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-2.5">
            {wallets.slice(0, 3).map((w) => (
              <div
                key={w.id}
                className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/60"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{
                      backgroundColor: `${w.color}15`,
                      color: w.color,
                    }}
                  >
                    <DynamicIcon name={w.icon} className="w-4 h-4" strokeWidth={1.75} />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-zinc-800 dark:text-zinc-200">{w.name}</p>
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400 capitalize">{w.type}</p>
                  </div>
                </div>
                <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 font-mono tabular-nums">
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
                Pos Tabungan & Impian
              </h2>
            </div>
            <Link
              href="/savings"
              className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 flex items-center gap-1"
            >
              Lihat Semua <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-2.5">
            {goals.slice(0, 3).map((g) => {
              const pct = Math.min(
                100,
                Math.round((g.current_amount / (g.target_amount || 1)) * 100)
              );
              return (
                <div
                  key={g.id}
                  className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/60 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center"
                        style={{
                          backgroundColor: `${g.color}15`,
                          color: g.color,
                        }}
                      >
                        <DynamicIcon name={g.icon} className="w-3.5 h-3.5" strokeWidth={1.75} />
                      </div>
                      <p className="text-xs font-medium text-zinc-800 dark:text-zinc-200">{g.name}</p>
                    </div>
                    <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 font-mono tabular-nums">
                      {pct}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: g.color,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Recent Transactions Live Widget ───────────────────────────── */}
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

        {recentTransactions.length === 0 ? (
          <p className="text-xs text-zinc-500 text-center py-6">
            Belum ada transaksi tercatat.
          </p>
        ) : (
          <div className="space-y-2">
            {recentTransactions.map((tx) => {
              const isIncome = tx.type === "income";
              const isSaving = tx.type === "saving";
              const isTransfer = tx.type === "transfer";

              return (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/60"
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
