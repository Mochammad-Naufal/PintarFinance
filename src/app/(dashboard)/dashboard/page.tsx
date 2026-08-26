import Link from "next/link";
import { getWallets } from "@/actions/wallets";
import { getSavingsGoals } from "@/actions/savings";
import { formatCurrency } from "@/lib/utils";
import { DynamicIcon } from "@/lib/icons";
import {
  ArrowRight,
  CreditCard,
  PiggyBank,
  TrendingUp,
  Wallet,
} from "lucide-react";

export const metadata = {
  title: "Dashboard",
  description: "Ringkasan finansial, saldo terkumpul, dan pemantauan impian keuangan.",
};

export default async function DashboardPage() {
  const [wallets, goals] = await Promise.all([
    getWallets(),
    getSavingsGoals(),
  ]);

  const totalBalance = wallets.reduce((acc, w) => acc + w.balance, 0);
  const totalSavings = goals.reduce((acc, g) => acc + g.current_amount, 0);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* ── Summary stat cards ─────────────────────────────────────────── */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Saldo */}
        <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800/60 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
              Total Likuiditas Saldo
            </p>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Wallet className="w-4 h-4" strokeWidth={1.75} />
            </div>
          </div>
          <p className="text-2xl font-bold tracking-tight tabular-nums text-emerald-400">
            {formatCurrency(totalBalance)}
          </p>
          <p className="text-xs text-zinc-500">
            Tersebar di {wallets.length} dompet aktif
          </p>
        </div>

        {/* Tabungan Impian */}
        <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800/60 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
              Dana di Pos Impian
            </p>
            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400">
              <PiggyBank className="w-4 h-4" strokeWidth={1.75} />
            </div>
          </div>
          <p className="text-2xl font-bold tracking-tight tabular-nums text-blue-400">
            {formatCurrency(totalSavings)}
          </p>
          <p className="text-xs text-zinc-500">
            Dari {goals.length} target impian
          </p>
        </div>

        {/* Net Worth */}
        <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800/60 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
              Estimasi Kekayaan Bersih
            </p>
            <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400">
              <TrendingUp className="w-4 h-4" strokeWidth={1.75} />
            </div>
          </div>
          <p className="text-2xl font-bold tracking-tight tabular-nums text-purple-400">
            {formatCurrency(totalBalance + totalSavings)}
          </p>
          <p className="text-xs text-zinc-500">Saldo + Pos Tabungan</p>
        </div>
      </section>

      {/* ── Wallets & Savings Quick Preview ────────────────────────────── */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Dompet Preview */}
        <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800/60 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-400" />
              <h2 className="text-sm font-semibold text-zinc-100">
                Dompet & Rekening
              </h2>
            </div>
            <Link
              href="/wallets"
              className="text-xs font-medium text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
            >
              Kelola <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-2.5">
            {wallets.slice(0, 3).map((w) => (
              <div
                key={w.id}
                className="flex items-center justify-between p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/40"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{
                      backgroundColor: `${w.color}20`,
                      color: w.color,
                    }}
                  >
                    <DynamicIcon name={w.icon} className="w-4 h-4" strokeWidth={1.75} />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-zinc-200">{w.name}</p>
                    <p className="text-[10px] text-zinc-500 capitalize">{w.type}</p>
                  </div>
                </div>
                <p className="text-sm font-bold text-zinc-100 tabular-nums">
                  {formatCurrency(w.balance)}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Pos Impian Preview */}
        <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800/60 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PiggyBank className="w-4 h-4 text-blue-400" />
              <h2 className="text-sm font-semibold text-zinc-100">
                Pos Tabungan & Impian
              </h2>
            </div>
            <Link
              href="/savings"
              className="text-xs font-medium text-blue-400 hover:text-blue-300 flex items-center gap-1"
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
                  className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/40 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center"
                        style={{
                          backgroundColor: `${g.color}20`,
                          color: g.color,
                        }}
                      >
                        <DynamicIcon name={g.icon} className="w-3.5 h-3.5" strokeWidth={1.75} />
                      </div>
                      <p className="text-xs font-medium text-zinc-200">{g.name}</p>
                    </div>
                    <span className="text-xs font-bold text-zinc-300 tabular-nums">
                      {pct}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
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
    </div>
  );
}
