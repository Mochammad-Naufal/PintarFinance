"use client";

import { useState } from "react";
import { BarChart3 } from "lucide-react";
import { type MonthlyCashflowTrend } from "@/types/finance";
import { formatCurrency } from "@/lib/utils";

interface CashflowChartProps {
  data: MonthlyCashflowTrend[];
}

export function CashflowChart({ data }: CashflowChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Find max value for dynamic scaling
  const maxVal = Math.max(
    ...data.map((d) => Math.max(d.income, d.expense)),
    1000000
  );

  return (
    <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/80 shadow-xs flex flex-col justify-between space-y-4">
      {/* Header & Legend */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Tren Arus Kas (6 Bulan Terakhir)
          </h2>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs font-medium text-zinc-600 dark:text-zinc-400">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span>Pemasukan</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <span>Pengeluaran</span>
          </div>
        </div>
      </div>

      {/* Chart Visual Bars Area */}
      <div className="relative pt-6 pb-2">
        {/* Subtle Horizontal Grid lines */}
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20 dark:opacity-10 pb-8">
          <div className="border-b border-zinc-400 dark:border-zinc-600 w-full" />
          <div className="border-b border-zinc-400 dark:border-zinc-600 w-full" />
          <div className="border-b border-zinc-400 dark:border-zinc-600 w-full" />
        </div>

        {/* Bars Container */}
        <div className="grid grid-cols-6 gap-2 sm:gap-4 items-end h-48 relative z-10">
          {data.map((item, idx) => {
            const incomeHeight = Math.max(4, Math.round((item.income / maxVal) * 100));
            const expenseHeight = Math.max(4, Math.round((item.expense / maxVal) * 100));
            const isHovered = hoveredIndex === idx;

            return (
              <div
                key={item.month}
                className="flex flex-col items-center h-full justify-end group cursor-pointer relative"
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {/* Floating Tooltip */}
                {isHovered && (
                  <div className="absolute -top-16 z-30 p-2.5 rounded-xl bg-zinc-900 dark:bg-zinc-800 text-white shadow-xl text-[11px] whitespace-nowrap pointer-events-none animate-in fade-in zoom-in-95 duration-100 border border-zinc-700/50">
                    <p className="font-semibold text-zinc-300 mb-1">{item.label}</p>
                    <div className="flex items-center justify-between gap-3 text-emerald-400 font-mono tabular-nums">
                      <span>Masuk:</span>
                      <span>{formatCurrency(item.income)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3 text-rose-400 font-mono tabular-nums">
                      <span>Keluar:</span>
                      <span>{formatCurrency(item.expense)}</span>
                    </div>
                  </div>
                )}

                {/* Dual Bars */}
                <div className="flex items-end gap-1 sm:gap-1.5 w-full justify-center h-full">
                  {/* Income bar */}
                  <div
                    className={`w-3 sm:w-5 rounded-t-md bg-emerald-500 transition-all duration-300 ${
                      isHovered ? "opacity-100 brightness-110" : "opacity-90"
                    }`}
                    style={{ height: `${incomeHeight}%` }}
                  />

                  {/* Expense bar */}
                  <div
                    className={`w-3 sm:w-5 rounded-t-md bg-rose-500 transition-all duration-300 ${
                      isHovered ? "opacity-100 brightness-110" : "opacity-85"
                    }`}
                    style={{ height: `${expenseHeight}%` }}
                  />
                </div>

                {/* Month Label */}
                <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mt-2 truncate w-full text-center">
                  {item.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
