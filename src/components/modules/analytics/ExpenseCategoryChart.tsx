"use client";

import { PieChart } from "lucide-react";
import { type CategoryExpenseBreakdown } from "@/types/finance";
import { formatCurrency } from "@/lib/utils";
import { DynamicIcon } from "@/lib/icons";

interface ExpenseCategoryChartProps {
  categories: CategoryExpenseBreakdown[];
  totalExpense: number;
}

export function ExpenseCategoryChart({
  categories,
  totalExpense,
}: ExpenseCategoryChartProps) {
  // SVG Donut Calculations
  const radius = 38;
  const circumference = 2 * Math.PI * radius;

  // Purely pre-calculate cumulative percentage and dash offset for each slice
  const slices = categories.reduce<
    Array<
      CategoryExpenseBreakdown & {
        strokeDasharray: string;
        strokeDashoffset: number;
      }
    >
  >((acc, cat) => {
    const prevOffset =
      acc.length > 0
        ? acc[acc.length - 1].strokeDashoffset -
          (acc[acc.length - 1].percentage / 100) * circumference
        : 0;

    acc.push({
      ...cat,
      strokeDasharray: `${(cat.percentage / 100) * circumference} ${circumference}`,
      strokeDashoffset: prevOffset,
    });
    return acc;
  }, []);

  return (
    <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/80 shadow-xs flex flex-col justify-between space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <PieChart className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Komposisi Pengeluaran Bulan Ini
          </h2>
        </div>
        <span className="text-xs font-mono font-bold text-zinc-900 dark:text-zinc-100 tabular-nums">
          {formatCurrency(totalExpense)}
        </span>
      </div>

      {/* Main Visual Donut & Category Breakdown */}
      {categories.length === 0 ? (
        <p className="text-xs text-zinc-500 text-center py-10">
          Belum ada data pengeluaran di periode ini.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
          {/* SVG Donut Circle (sm:col-span-5) */}
          <div className="sm:col-span-5 flex items-center justify-center relative">
            <svg
              className="w-32 h-32 -rotate-90 transform"
              viewBox="0 0 100 100"
            >
              {/* Background Track Circle */}
              <circle
                cx="50"
                cy="50"
                r={radius}
                className="stroke-zinc-100 dark:stroke-zinc-800"
                strokeWidth="12"
                fill="none"
              />

              {/* Category Slices */}
              {slices.map((cat) => (
                <circle
                  key={cat.category_id}
                  cx="50"
                  cy="50"
                  r={radius}
                  stroke={cat.category_color || "#10b981"}
                  strokeWidth="12"
                  strokeDasharray={cat.strokeDasharray}
                  strokeDashoffset={cat.strokeDashoffset}
                  fill="none"
                  className="transition-all duration-500 hover:opacity-80"
                />
              ))}
            </svg>

            {/* Inner Center Label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase font-medium">
                Kategori
              </span>
              <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100 font-mono">
                {categories.length} Pos
              </span>
            </div>
          </div>

          {/* Breakdown Legend List (sm:col-span-7) */}
          <div className="sm:col-span-7 space-y-2 max-h-48 overflow-y-auto pr-1">
            {categories.slice(0, 5).map((cat) => (
              <div
                key={cat.category_id}
                className="flex items-center justify-between text-xs p-1.5 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className="w-5 h-5 rounded-md flex items-center justify-center shrink-0"
                    style={{
                      backgroundColor: `${cat.category_color}15`,
                      color: cat.category_color,
                    }}
                  >
                    <DynamicIcon name={cat.category_icon} className="w-3 h-3" />
                  </div>
                  <span className="text-zinc-800 dark:text-zinc-200 truncate font-medium max-w-[110px]">
                    {cat.category_name}
                  </span>
                </div>

                <div className="text-right flex items-center gap-2 shrink-0">
                  <span className="text-zinc-500 dark:text-zinc-400 font-mono text-[11px] tabular-nums">
                    {cat.percentage}%
                  </span>
                  <span className="font-bold text-zinc-900 dark:text-zinc-100 font-mono tabular-nums">
                    {formatCurrency(cat.amount)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
