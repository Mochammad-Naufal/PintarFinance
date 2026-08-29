"use client";

import { useState } from "react";
import { Loader2, Pencil, Trash2 } from "lucide-react";
import { type Budget } from "@/types/finance";
import { formatCurrency } from "@/lib/utils";
import { DynamicIcon } from "@/lib/icons";

interface BudgetCardProps {
  budget: Budget;
  onEdit: (budget: Budget) => void;
  onDelete: (id: string) => Promise<void>;
}

export function BudgetCard({ budget, onEdit, onDelete }: BudgetCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const isOverbudget = budget.spent_amount > budget.limit_amount;
  const isWarning = budget.percentage >= 75 && !isOverbudget;

  let progressColor = "bg-emerald-500";
  let statusBadge = {
    label: "Aman",
    className: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  };

  if (isOverbudget) {
    progressColor = "bg-rose-500";
    statusBadge = {
      label: "Overbudget",
      className: "bg-rose-500/15 text-rose-600 dark:text-rose-400",
    };
  } else if (isWarning) {
    progressColor = "bg-amber-500";
    statusBadge = {
      label: "Waspada",
      className: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
    };
  }

  const handleDelete = async () => {
    if (confirm(`Yakin ingin menghapus batas anggaran kategori "${budget.category_name}"?`)) {
      setIsDeleting(true);
      try {
        await onDelete(budget.id);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  return (
    <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/80 shadow-xs hover:border-zinc-300 dark:hover:border-zinc-700/80 transition-all duration-150 flex flex-col justify-between space-y-4">
      {/* Header: Icon, Category Name, Status Badge, Actions */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{
              backgroundColor: `${budget.category_color || "#64748b"}15`,
              color: budget.category_color || "#64748b",
            }}
          >
            <DynamicIcon
              name={budget.category_icon || "tag"}
              className="w-5 h-5"
              strokeWidth={1.75}
            />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                {budget.category_name}
              </h3>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 w-fit rounded-full text-xs font-semibold ${statusBadge.className}`}
              >
                {statusBadge.label}
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Limit: {formatCurrency(budget.limit_amount)}
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onEdit(budget)}
            className="p-1.5 rounded-lg text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 active:scale-[0.95] transition-all"
            title="Edit Anggaran"
          >
            <Pencil className="w-4 h-4" strokeWidth={1.75} />
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="p-1.5 rounded-lg text-zinc-500 dark:text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 active:scale-[0.95] transition-all disabled:opacity-50"
            title="Hapus Anggaran"
          >
            {isDeleting ? (
              <Loader2 className="w-4 h-4 animate-spin text-rose-500" strokeWidth={1.75} />
            ) : (
              <Trash2 className="w-4 h-4" strokeWidth={1.75} />
            )}
          </button>
        </div>
      </div>

      {/* Progress & Percent */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-zinc-800 dark:text-zinc-200 font-mono tabular-nums">
            {budget.percentage}% terpakai
          </span>
          <span
            className={`font-mono text-[11px] font-medium tabular-nums ${
              isOverbudget
                ? "text-rose-600 dark:text-rose-400 font-semibold"
                : "text-zinc-500 dark:text-zinc-400"
            }`}
          >
            {isOverbudget
              ? `Lebih ${formatCurrency(Math.abs(budget.remaining_amount))}`
              : `Sisa ${formatCurrency(budget.remaining_amount)}`}
          </span>
        </div>

        <div className="w-full h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${progressColor}`}
            style={{ width: `${Math.min(100, budget.percentage)}%` }}
          />
        </div>
      </div>

      {/* Terpakai & Batas Row */}
      <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800/40 flex items-center justify-between text-xs">
        <div>
          <p className="text-[10px] uppercase font-medium text-zinc-500 dark:text-zinc-400">
            Realisasi Pengeluaran
          </p>
          <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 font-mono tabular-nums mt-0.5">
            {formatCurrency(budget.spent_amount)}
          </p>
        </div>

        <div className="text-right">
          <p className="text-[10px] uppercase font-medium text-zinc-500 dark:text-zinc-400">
            Batas Anggaran
          </p>
          <p className="text-sm font-semibold text-zinc-600 dark:text-zinc-400 font-mono tabular-nums mt-0.5">
            {formatCurrency(budget.limit_amount)}
          </p>
        </div>
      </div>
    </div>
  );
}
