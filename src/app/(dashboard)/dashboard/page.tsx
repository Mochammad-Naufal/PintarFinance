import { formatCurrency } from "@/lib/utils";
import {
  ArrowDownLeft,
  ArrowUpRight,
  TrendingUp,
  Wallet,
} from "lucide-react";

// ─── Stat Cards data (static placeholder — Phase 3 will pull from DB) ─────────

const STATS = [
  {
    label: "Total Saldo",
    value: 13_250_000,
    sub: "3 Dompet Aktif",
    icon: Wallet,
    color: "text-zinc-50",
    iconBg: "bg-zinc-700/50",
    iconColor: "text-zinc-300",
  },
  {
    label: "Pemasukan Bulan Ini",
    value: 10_000_000,
    sub: "2 transaksi masuk",
    icon: ArrowDownLeft,
    color: "text-emerald-400",
    iconBg: "bg-emerald-500/10",
    iconColor: "text-emerald-400",
  },
  {
    label: "Pengeluaran Bulan Ini",
    value: 3_239_000,
    sub: "12 transaksi keluar",
    icon: ArrowUpRight,
    color: "text-rose-400",
    iconBg: "bg-rose-500/10",
    iconColor: "text-rose-400",
  },
] as const;

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* ── Summary stat cards ─────────────────────────────────────────── */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {STATS.map(({ label, value, sub, icon: Icon, color, iconBg, iconColor }) => (
          <div
            key={label}
            className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800/60 space-y-3"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                {label}
              </p>
              <div className={`p-1.5 rounded-lg ${iconBg}`}>
                <Icon className={`w-4 h-4 ${iconColor}`} strokeWidth={1.75} />
              </div>
            </div>
            <p className={`text-2xl font-bold tracking-tight tabular-nums ${color}`}>
              {formatCurrency(value)}
            </p>
            <p className="text-xs text-zinc-600">{sub}</p>
          </div>
        ))}
      </section>

      {/* ── Placeholder: coming in Phase 3 ────────────────────────────── */}
      <section className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Chart placeholder */}
        <div className="lg:col-span-3 p-5 rounded-2xl bg-zinc-900 border border-zinc-800/60 border-dashed min-h-52 flex flex-col items-center justify-center gap-2">
          <TrendingUp className="w-8 h-8 text-zinc-700" strokeWidth={1.5} />
          <p className="text-sm text-zinc-500 font-medium">Grafik Pengeluaran</p>
          <p className="text-xs text-zinc-700 text-center max-w-xs">
            Recharts bar/line chart akan ditampilkan di sini pada Phase 3
          </p>
        </div>

        {/* Recent transactions placeholder */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-zinc-900 border border-zinc-800/60 border-dashed min-h-52 flex flex-col items-center justify-center gap-2">
          <ArrowUpRight className="w-8 h-8 text-zinc-700" strokeWidth={1.5} />
          <p className="text-sm text-zinc-500 font-medium">Transaksi Terbaru</p>
          <p className="text-xs text-zinc-700 text-center max-w-xs">
            5 transaksi terakhir akan muncul di sini
          </p>
        </div>
      </section>
    </div>
  );
}
