"use client";

import { useRef, useState } from "react";
import { Scale, TrendingUp } from "lucide-react";
import { type MonthlyCashflowTrend } from "@/types/finance";
import { formatCurrency } from "@/lib/utils";

interface CashflowChartProps {
  data: MonthlyCashflowTrend[];
}

const CHART_H = 160;   // px height of the SVG drawing area
const CHART_PAD = 12;  // horizontal padding inside SVG

/**
 * Maps data points to (x, y) SVG coordinates.
 */
function buildPoints(
  values: number[],
  maxVal: number,
  width: number
): { x: number; y: number }[] {
  const n = values.length;
  if (n === 0) return [];
  const step = (width - CHART_PAD * 2) / Math.max(n - 1, 1);
  return values.map((v, i) => ({
    x: CHART_PAD + i * step,
    y: CHART_H - Math.max(4, Math.round((v / (maxVal || 1)) * (CHART_H - 16))) - 4,
  }));
}

/** Build smooth SVG path (cubic bezier) */
function toSmooth(pts: { x: number; y: number }[]): string {
  if (pts.length < 2) return "";
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) {
    const prev = pts[i - 1];
    const curr = pts[i];
    const cx = (prev.x + curr.x) / 2;
    d += ` C ${cx} ${prev.y}, ${cx} ${curr.y}, ${curr.x} ${curr.y}`;
  }
  return d;
}

export function CashflowChart({ data }: CashflowChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [svgWidth, setSvgWidth] = useState(320);

  // Measure actual SVG width via ResizeObserver
  const observedRef = (node: SVGSVGElement | null) => {
    if (!node) return;
    (svgRef as React.MutableRefObject<SVGSVGElement | null>).current = node;
    const ro = new ResizeObserver(([entry]) => {
      setSvgWidth(entry.contentRect.width || 320);
    });
    ro.observe(node);
  };

  const maxVal = Math.max(
    ...data.map((d) => Math.max(d.income, d.expense, d.debt || 0)),
    1_000_000
  );

  const incomePoints = buildPoints(data.map((d) => d.income), maxVal, svgWidth);
  const expensePoints = buildPoints(data.map((d) => d.expense), maxVal, svgWidth);
  const debtPoints = buildPoints(data.map((d) => d.debt || 0), maxVal, svgWidth);

  const incomePath = toSmooth(incomePoints);
  const expensePath = toSmooth(expensePoints);
  const debtPath = toSmooth(debtPoints);

  // Area fill below income line (close path to bottom)
  const incomeArea =
    incomePoints.length > 0
      ? `${incomePath} L ${incomePoints[incomePoints.length - 1].x} ${CHART_H} L ${incomePoints[0].x} ${CHART_H} Z`
      : "";
  const expenseArea =
    expensePoints.length > 0
      ? `${expensePath} L ${expensePoints[expensePoints.length - 1].x} ${CHART_H} L ${expensePoints[0].x} ${CHART_H} Z`
      : "";

  const hovered = hoveredIndex !== null ? data[hoveredIndex] : null;

  return (
    <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/80 shadow-xs flex flex-col space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Tren Arus Kas &amp; Beban Liabilitas (6 Bulan)
          </h2>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3.5 text-xs font-medium text-zinc-600 dark:text-zinc-400">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span>Pemasukan</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <span>Pengeluaran</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
            <span>Beban Hutang</span>
          </div>
        </div>
      </div>

      {/* Tooltip */}
      {hovered && (
        <div className="flex flex-wrap items-center gap-3 px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 text-xs animate-in fade-in duration-100">
          <span className="font-semibold text-zinc-700 dark:text-zinc-300 shrink-0">{hovered.label}</span>
          <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-mono tabular-nums">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            <span>Masuk: {formatCurrency(hovered.income)}</span>
          </div>
          <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-mono tabular-nums">
            <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
            <span>Keluar: {formatCurrency(hovered.expense)}</span>
          </div>
          {hovered.debt > 0 && (
            <div className="flex items-center gap-1.5 text-purple-600 dark:text-purple-400 font-mono tabular-nums">
              <span className="w-2 h-2 rounded-full bg-purple-500 shrink-0" />
              <span>Hutang: {formatCurrency(hovered.debt)}</span>
            </div>
          )}
          <div
            className={`font-mono tabular-nums font-semibold ${
              hovered.net >= 0
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-rose-600 dark:text-rose-400"
            }`}
          >
            Net: {hovered.net >= 0 ? "+" : ""}
            {formatCurrency(hovered.net)}
          </div>
        </div>
      )}

      {/* SVG Line Chart */}
      <div className="relative select-none">
        <svg
          ref={observedRef}
          width="100%"
          height={CHART_H + 24}
          className="overflow-visible"
          onMouseLeave={() => setHoveredIndex(null)}
          style={{ touchAction: "none" }}
        >
          <defs>
            <linearGradient id="income-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.02" />
            </linearGradient>
            <linearGradient id="expense-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {/* Horizontal grid lines */}
          {[0.25, 0.5, 0.75, 1].map((frac) => (
            <line
              key={frac}
              x1={CHART_PAD}
              y1={CHART_H - frac * (CHART_H - 16)}
              x2={svgWidth - CHART_PAD}
              y2={CHART_H - frac * (CHART_H - 16)}
              stroke="currentColor"
              strokeWidth="1"
              className="text-zinc-200 dark:text-zinc-700"
              strokeDasharray="4 3"
            />
          ))}

          {/* Area fills */}
          <path d={incomeArea} fill="url(#income-grad)" />
          <path d={expenseArea} fill="url(#expense-grad)" />

          {/* Lines */}
          <path
            d={incomePath}
            fill="none"
            stroke="#10b981"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d={expensePath}
            fill="none"
            stroke="#f43f5e"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d={debtPath}
            fill="none"
            stroke="#a855f7"
            strokeWidth="2"
            strokeDasharray="5 3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data points + invisible hit targets */}
          {data.map((item, idx) => {
            const ip = incomePoints[idx];
            const ep = expensePoints[idx];
            const dp = debtPoints[idx];
            const isHovered = hoveredIndex === idx;

            return ip && ep ? (
              <g key={item.month}>
                {/* Income dot */}
                <circle
                  cx={ip.x}
                  cy={ip.y}
                  r={isHovered ? 5 : 3.5}
                  fill={isHovered ? "#10b981" : "#fff"}
                  stroke="#10b981"
                  strokeWidth={isHovered ? 0 : 2}
                  className="transition-all duration-100"
                />
                {/* Expense dot */}
                <circle
                  cx={ep.x}
                  cy={ep.y}
                  r={isHovered ? 5 : 3.5}
                  fill={isHovered ? "#f43f5e" : "#fff"}
                  stroke="#f43f5e"
                  strokeWidth={isHovered ? 0 : 2}
                  className="transition-all duration-100"
                />
                {/* Debt dot (if > 0) */}
                {dp && item.debt > 0 && (
                  <circle
                    cx={dp.x}
                    cy={dp.y}
                    r={isHovered ? 4.5 : 3}
                    fill={isHovered ? "#a855f7" : "#fff"}
                    stroke="#a855f7"
                    strokeWidth={isHovered ? 0 : 2}
                    className="transition-all duration-100"
                  />
                )}

                {/* Large invisible hover target */}
                <rect
                  x={ip.x - 22}
                  y={0}
                  width={44}
                  height={CHART_H + 20}
                  fill="transparent"
                  onMouseEnter={() => setHoveredIndex(idx)}
                  onTouchStart={() => setHoveredIndex(idx)}
                  style={{ cursor: "crosshair" }}
                />

                {/* Month label at bottom */}
                <text
                  x={ip.x}
                  y={CHART_H + 18}
                  textAnchor="middle"
                  fontSize={10}
                  className="fill-zinc-500 dark:fill-zinc-400 font-medium"
                >
                  {item.label}
                </text>
              </g>
            ) : null;
          })}
        </svg>
      </div>
    </div>
  );
}
