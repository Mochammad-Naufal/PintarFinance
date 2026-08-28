import Link from "next/link";
import { Calculator, Sparkles, ArrowRight } from "lucide-react";
import { getSavingsGoals } from "@/actions/savings";
import { SavingsGoalList } from "@/components/modules/savings/SavingsGoalList";
import { AIContextCard } from "@/components/modules/ai/AIContextCard";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Pos Tabungan & Impian",
  description: "Rencanakan dan pantau progres pencapaian target tabungan impianmu.",
};

export default async function SavingsPage() {
  const goals = await getSavingsGoals();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
          Pos Tabungan & Impian
        </h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
          Kumpulkan dana untuk impian, kebutuhan masa depan, atau dana darurat secara terstruktur.
        </p>
      </div>

      {/* ── Interactive Compound Interest & Savings Calculator Banner ── */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-linear-to-r from-emerald-600 via-teal-600 to-emerald-700 p-5 sm:p-6 text-white shadow-lg shadow-emerald-600/15">
        <div className="absolute -right-8 -top-8 h-48 w-48 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="absolute -left-8 -bottom-8 h-48 w-48 rounded-full bg-teal-400/20 blur-2xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-xl">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-0.5 text-[11px] font-semibold backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Simulasi Cerdas</span>
            </div>
            <h2 className="text-base sm:text-lg font-bold tracking-tight text-white">
              Simulasi Bunga Majemuk & Target Tabungan
            </h2>
            <p className="text-xs sm:text-sm text-emerald-50/90 leading-relaxed">
              Hitung estimasi waktu dan pertumbuhan dana tabungan impianmu dengan efek eksponensial bunga majemuk (*compound interest*).
            </p>
          </div>

          <Link
            href="/calculator"
            prefetch={true}
            className="inline-flex items-center justify-center gap-2 self-start md:self-center px-4 py-2.5 rounded-xl bg-white text-emerald-800 hover:bg-emerald-50 active:scale-[0.98] transition-all text-xs sm:text-sm font-semibold shadow-md shrink-0 group"
          >
            <Calculator className="w-4 h-4 text-emerald-700" />
            <span>Buka Kalkulator Simulasi</span>
            <ArrowRight className="w-3.5 h-3.5 text-emerald-700 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>

      {/* AI Contextual Advisor */}
      <AIContextCard moduleType="savings" moduleName="Target Impian & Tabungan" />

      <SavingsGoalList initialGoals={goals} />
    </div>
  );
}
