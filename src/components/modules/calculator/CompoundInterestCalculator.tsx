"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Calculator,
  ChevronDown,
  ChevronUp,
  Percent,
  PiggyBank,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface YearlyData {
  year: number;
  totalInvested: number;
  totalInterest: number;
  totalValue: number;
}

// ─── Input Sanitizer: Strips leading zeros and unwanted characters ───────────

function sanitizeNumber(val: string, allowDecimals: boolean = false): string {
  if (!val) return "";
  let clean = allowDecimals
    ? val.replace(/[^0-9.]/g, "")
    : val.replace(/[^0-9]/g, "");

  if (allowDecimals) {
    const parts = clean.split(".");
    if (parts.length > 2) {
      clean = parts[0] + "." + parts.slice(1).join("");
    }
  }

  // Strip leading zeros (e.g. "09999" -> "9999", "00" -> "0")
  if (clean.length > 1 && clean.startsWith("0") && !clean.startsWith("0.")) {
    clean = clean.replace(/^0+/, "");
    if (clean === "") clean = "0";
  }

  return clean;
}

export function CompoundInterestCalculator() {
  const [principal, setPrincipal] = useState<string>("10000000");
  const [monthlyContribution, setMonthlyContribution] = useState<string>("1500000");
  const [annualRate, setAnnualRate] = useState<string>("10");
  const [years, setYears] = useState<string>("10");
  const [frequency, setFrequency] = useState<"monthly" | "annually">("monthly");
  const [showTable, setShowTable] = useState<boolean>(false);

  // Calculation Engine
  const {
    P_val,
    PMT_val,
    t_val,
    yearlyBreakdown,
    finalTotalValue,
    finalInvested,
    finalInterest,
    multiplier,
  } = useMemo(() => {
    const P = Math.max(0, parseFloat(principal.replace(/[^0-9.]/g, "")) || 0);
    const PMT = Math.max(0, parseFloat(monthlyContribution.replace(/[^0-9.]/g, "")) || 0);
    const r = Math.max(0, parseFloat(annualRate.replace(/[^0-9.]/g, "")) || 0) / 100;
    const t = Math.max(1, Math.min(50, parseInt(years.replace(/[^0-9]/g, ""), 10) || 1));
    const n = frequency === "monthly" ? 12 : 1;

    const breakdown: YearlyData[] = [];

    for (let k = 1; k <= t; k++) {
      let totalVal = 0;
      const totalInvested = P + PMT * 12 * k;

      if (r === 0) {
        totalVal = totalInvested;
      } else {
        // Future value of principal
        const principalFV = P * Math.pow(1 + r / n, n * k);

        // Future value of regular monthly contributions
        let contributionsFV = 0;
        if (frequency === "monthly") {
          contributionsFV = PMT * ((Math.pow(1 + r / 12, 12 * k) - 1) / (r / 12));
        } else {
          const annualContribution = PMT * 12;
          contributionsFV = annualContribution * ((Math.pow(1 + r, k) - 1) / r);
        }

        totalVal = Math.round(principalFV + contributionsFV);
      }

      const totalInterest = Math.max(0, totalVal - totalInvested);

      breakdown.push({
        year: k,
        totalInvested,
        totalInterest,
        totalValue: totalVal,
      });
    }

    const finalItem = breakdown[breakdown.length - 1] || {
      totalInvested: P,
      totalInterest: 0,
      totalValue: P,
    };

    const finalVal = finalItem.totalValue;
    const finalInv = finalItem.totalInvested;
    const finalInt = finalItem.totalInterest;
    const mult = finalInv > 0 ? (finalVal / finalInv).toFixed(1) : "1.0";

    return {
      P_val: P,
      PMT_val: PMT,
      t_val: t,
      yearlyBreakdown: breakdown,
      finalTotalValue: finalVal,
      finalInvested: finalInv,
      finalInterest: finalInt,
      multiplier: mult,
    };
  }, [principal, monthlyContribution, annualRate, years, frequency]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-linear-to-br from-emerald-600 to-teal-700 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold">
            <Calculator className="w-3.5 h-3.5" />
            <span>Kalkulator Investasi Pintar</span>
          </div>
          <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight">
            Simulasi Keajaiban Bunga Majemuk
          </h1>
          <p className="text-xs sm:text-sm text-emerald-100 max-w-xl leading-relaxed">
            Hitung eksponensial pertumbuhan aset Anda melalui kombinasi modal awal, disiplin setoran bulanan, dan imbal hasil bunga majemuk (*Compound Interest*).
          </p>
        </div>
      </div>

      {/* Grid: Inputs Form & Visual Output Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form Inputs (5 cols) */}
        <div className="lg:col-span-5 p-5 sm:p-6 rounded-2xl bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/80 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800/80 pb-3">
            <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              Parameter Investasi
            </h2>
            <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Ubah angka untuk simulasi
            </span>
          </div>

          {/* Modal Awal (Principal) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <label className="font-medium text-zinc-700 dark:text-zinc-300">
                Modal Awal / Pokok (IDR)
              </label>
              <span className="font-mono text-zinc-500 font-semibold">
                {formatCurrency(P_val)}
              </span>
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-400 font-mono">
                Rp
              </span>
              <input
                type="text"
                inputMode="numeric"
                placeholder="0"
                value={principal}
                onFocus={(e) => e.target.select()}
                onChange={(e) => setPrincipal(sanitizeNumber(e.target.value))}
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-sm font-mono font-bold text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-emerald-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
            {/* Quick Chips */}
            <div className="flex items-center gap-1.5 pt-1 overflow-x-auto no-scrollbar">
              {[0, 5000000, 10000000, 25000000, 50000000].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setPrincipal(String(preset))}
                  className="px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-[10px] font-mono text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors shrink-0"
                >
                  {preset === 0 ? "Nol" : `${preset / 1000000}Jt`}
                </button>
              ))}
            </div>
          </div>

          {/* Setoran Bulanan (PMT) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <label className="font-medium text-zinc-700 dark:text-zinc-300">
                Setoran Rutin Bulanan (IDR)
              </label>
              <span className="font-mono text-zinc-500 font-semibold">
                {formatCurrency(PMT_val)}
              </span>
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-400 font-mono">
                Rp
              </span>
              <input
                type="text"
                inputMode="numeric"
                placeholder="0"
                value={monthlyContribution}
                onFocus={(e) => e.target.select()}
                onChange={(e) => setMonthlyContribution(sanitizeNumber(e.target.value))}
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-sm font-mono font-bold text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-emerald-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
            {/* Quick Chips */}
            <div className="flex items-center gap-1.5 pt-1 overflow-x-auto no-scrollbar">
              {[500000, 1000000, 1500000, 3000000, 5000000].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setMonthlyContribution(String(preset))}
                  className="px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-[10px] font-mono text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors shrink-0"
                >
                  {preset >= 1000000 ? `${preset / 1000000}Jt` : `${preset / 1000}Rb`}
                </button>
              ))}
            </div>
          </div>

          {/* Imbal Hasil & Durasi (2-col grid) */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-1">
                <Percent className="w-3.5 h-3.5 text-zinc-400" />
                <span>Return / Thn (%)</span>
              </label>
              <input
                type="text"
                inputMode="decimal"
                placeholder="0"
                value={annualRate}
                onFocus={(e) => e.target.select()}
                onChange={(e) => setAnnualRate(sanitizeNumber(e.target.value, true))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-sm font-mono font-bold text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-emerald-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <div className="flex items-center gap-1 pt-0.5">
                {[6, 10, 15].map((rate) => (
                  <button
                    key={rate}
                    type="button"
                    onClick={() => setAnnualRate(String(rate))}
                    className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-[9px] font-mono text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200"
                  >
                    {rate}%
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-zinc-400" />
                <span>Durasi (Tahun)</span>
              </label>
              <input
                type="text"
                inputMode="numeric"
                placeholder="1"
                value={years}
                onFocus={(e) => e.target.select()}
                onChange={(e) => setYears(sanitizeNumber(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-sm font-mono font-bold text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-emerald-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <div className="flex items-center gap-1 pt-0.5">
                {[5, 10, 20].map((yr) => (
                  <button
                    key={yr}
                    type="button"
                    onClick={() => setYears(String(yr))}
                    className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-[9px] font-mono text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200"
                  >
                    {yr}th
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Frekuensi Bunga */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
              Frekuensi Penggandaan (Compounding)
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFrequency("monthly")}
                className={`py-2 px-3 rounded-xl text-xs font-semibold transition-all ${
                  frequency === "monthly"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900"
                }`}
              >
                Bulanan (12x/thn)
              </button>
              <button
                type="button"
                onClick={() => setFrequency("annually")}
                className={`py-2 px-3 rounded-xl text-xs font-semibold transition-all ${
                  frequency === "annually"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900"
                }`}
              >
                Tahunan (1x/thn)
              </button>
            </div>
          </div>
        </div>

        {/* Results & Growth Visualization (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Main Big Result Card */}
          <div className="p-6 rounded-2xl bg-zinc-900 text-white shadow-lg space-y-4 border border-zinc-800 relative overflow-hidden">
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span className="uppercase font-semibold tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Estimasi Total Dana Akhir ({t_val} Tahun)
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                Tumbuh {multiplier}x Lipat
              </span>
            </div>

            <div className="text-3xl sm:text-4xl font-extrabold font-mono tabular-nums text-white tracking-tight">
              {formatCurrency(finalTotalValue)}
            </div>

            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-zinc-800 text-xs">
              <div>
                <span className="text-zinc-400 block text-[11px]">Total Modal Disetor:</span>
                <span className="font-mono font-bold text-zinc-200 text-sm tabular-nums">
                  {formatCurrency(finalInvested)}
                </span>
              </div>
              <div className="text-right">
                <span className="text-emerald-400 block text-[11px]">Keuntungan Bunga Majemuk:</span>
                <span className="font-mono font-bold text-emerald-400 text-sm tabular-nums">
                  +{formatCurrency(finalInterest)}
                </span>
              </div>
            </div>
          </div>

          {/* Visual Growth Chart (SVG Bars) */}
          <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between text-xs">
              <h3 className="font-bold text-zinc-900 dark:text-zinc-100">
                Proyeksi Pertumbuhan per Tahun
              </h3>
              <div className="flex items-center gap-3 text-[10px]">
                <span className="flex items-center gap-1 text-zinc-500">
                  <span className="w-2.5 h-2.5 rounded-xs bg-zinc-400 dark:bg-zinc-600" /> Modal Pokok
                </span>
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                  <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500" /> Bunga Majemuk
                </span>
              </div>
            </div>

            {/* Projection Bars */}
            <div className="h-44 flex items-end gap-1.5 sm:gap-2 pt-4 pb-2 border-b border-zinc-100 dark:border-zinc-800 overflow-x-auto">
              {yearlyBreakdown.map((item) => {
                const maxVal = finalTotalValue || 1;
                const totalHeightPct = Math.round((item.totalValue / maxVal) * 100);
                const investedHeightPct = Math.round((item.totalInvested / maxVal) * 100);
                const interestHeightPct = Math.max(0, totalHeightPct - investedHeightPct);

                return (
                  <div
                    key={item.year}
                    className="flex-1 min-w-[20px] max-w-[42px] flex flex-col items-center gap-1 h-full justify-end group relative"
                  >
                    {/* Tooltip on hover */}
                    <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col p-2 rounded-lg bg-zinc-900 text-white text-[10px] font-mono whitespace-nowrap shadow-xl z-20 pointer-events-none">
                      <span className="font-bold text-emerald-400">Thn {item.year}: {formatCurrency(item.totalValue)}</span>
                      <span className="text-zinc-400">Pokok: {formatCurrency(item.totalInvested)}</span>
                      <span className="text-emerald-300">Bunga: +{formatCurrency(item.totalInterest)}</span>
                    </div>

                    <div className="w-full flex flex-col justify-end h-full">
                      {/* Interest Portion */}
                      <div
                        style={{ height: `${interestHeightPct}%` }}
                        className="w-full bg-emerald-500 rounded-t-xs transition-all duration-300 group-hover:brightness-110"
                      />
                      {/* Invested Portion */}
                      <div
                        style={{ height: `${investedHeightPct}%` }}
                        className="w-full bg-zinc-300 dark:bg-zinc-700 transition-all duration-300"
                      />
                    </div>

                    <span className="text-[9px] text-zinc-400 font-mono">
                      {item.year}th
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Action to Savings */}
            <div className="pt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowTable(!showTable)}
                className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors"
              >
                <span>{showTable ? "Sembunyikan" : "Lihat"} Rincian Tabel</span>
                {showTable ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              <Link
                href="/savings"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs active:scale-[0.98] transition-all"
              >
                <PiggyBank className="w-3.5 h-3.5" />
                <span>Terapkan ke Pos Impian</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Expandable Yearly Breakdown Table */}
      {showTable && (
        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/80 shadow-xs space-y-3 animate-in fade-in duration-200">
          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
            Tabel Akumulasi Pertumbuhan Tahunan
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-400 font-semibold uppercase text-[10px]">
                  <th className="py-2.5 px-3">Tahun</th>
                  <th className="py-2.5 px-3">Total Modal Pokok</th>
                  <th className="py-2.5 px-3 text-emerald-600 dark:text-emerald-400">Total Bunga/Return</th>
                  <th className="py-2.5 px-3 text-right">Saldo Akhir Tahun</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60 font-mono tabular-nums">
                {yearlyBreakdown.map((row) => (
                  <tr key={row.year} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/40">
                    <td className="py-2.5 px-3 font-bold text-zinc-700 dark:text-zinc-300">
                      Tahun ke-{row.year}
                    </td>
                    <td className="py-2.5 px-3 text-zinc-600 dark:text-zinc-400">
                      {formatCurrency(row.totalInvested)}
                    </td>
                    <td className="py-2.5 px-3 text-emerald-600 dark:text-emerald-400 font-semibold">
                      +{formatCurrency(row.totalInterest)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-zinc-900 dark:text-zinc-100">
                      {formatCurrency(row.totalValue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
