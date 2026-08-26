"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, Pencil, Trash2 } from "lucide-react";
import { type SavingsGoal } from "@/types/finance";
import { formatCurrency, formatDate } from "@/lib/utils";
import { DynamicIcon } from "@/lib/icons";

interface SavingsGoalCardProps {
  goal: SavingsGoal;
  onEdit: (goal: SavingsGoal) => void;
  onDelete: (id: string) => Promise<void>;
}

export function SavingsGoalCard({
  goal,
  onEdit,
  onDelete,
}: SavingsGoalCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const percentage = Math.min(
    100,
    Math.round((goal.current_amount / (goal.target_amount || 1)) * 100)
  );

  const remaining = Math.max(0, goal.target_amount - goal.current_amount);
  const isCompleted = goal.is_completed || goal.current_amount >= goal.target_amount;

  const handleDelete = async () => {
    if (confirm(`Yakin ingin menghapus pos impian "${goal.name}"?`)) {
      setIsDeleting(true);
      try {
        await onDelete(goal.id);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  return (
    <div className="relative p-5 rounded-2xl bg-zinc-900 border border-zinc-800/60 hover:border-zinc-700/80 transition-all duration-150 flex flex-col justify-between overflow-hidden">
      {/* Top accent bar */}
      <div
        className="absolute top-0 left-0 right-0 h-1"
        style={{ backgroundColor: goal.color || "#3b82f6" }}
      />

      {/* Header: Icon, Name, Completion badge, Actions */}
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{
                backgroundColor: `${goal.color || "#3b82f6"}20`,
                color: goal.color || "#3b82f6",
              }}
            >
              <DynamicIcon name={goal.icon} className="w-5 h-5" strokeWidth={1.75} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-zinc-100 truncate">
                  {goal.name}
                </h3>
                {isCompleted && (
                  <span className="flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 shrink-0">
                    <CheckCircle2 className="w-3 h-3" />
                    Tercapai
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-500 mt-0.5">
                {goal.target_date
                  ? `Tenggat: ${formatDate(goal.target_date)}`
                  : "Target Fleksibel"}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => onEdit(goal)}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 active:scale-[0.95] transition-all"
              title="Edit Target"
            >
              <Pencil className="w-4 h-4" strokeWidth={1.75} />
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 active:scale-[0.95] transition-all disabled:opacity-50"
              title="Hapus Target"
            >
              {isDeleting ? (
                <Loader2 className="w-4 h-4 animate-spin text-rose-400" strokeWidth={1.75} />
              ) : (
                <Trash2 className="w-4 h-4" strokeWidth={1.75} />
              )}
            </button>
          </div>
        </div>

        {/* Progress Bar & Percent */}
        <div className="mt-5 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-zinc-200 tabular-nums">
              {percentage}%
            </span>
            <span className="text-zinc-500">
              {isCompleted
                ? "Target Terpenuhi!"
                : `Kurang ${formatCurrency(remaining)}`}
            </span>
          </div>

          <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500 ease-out"
              style={{
                width: `${percentage}%`,
                backgroundColor: goal.color || "#3b82f6",
              }}
            />
          </div>
        </div>
      </div>

      {/* Amounts */}
      <div className="mt-5 pt-4 border-t border-zinc-800/40 flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase font-medium text-zinc-500">
            Terkumpul
          </p>
          <p className="text-base font-bold text-zinc-100 tabular-nums mt-0.5">
            {formatCurrency(goal.current_amount)}
          </p>
        </div>

        <div className="text-right">
          <p className="text-[10px] uppercase font-medium text-zinc-500">
            Target
          </p>
          <p className="text-base font-medium text-zinc-400 tabular-nums mt-0.5">
            {formatCurrency(goal.target_amount)}
          </p>
        </div>
      </div>
    </div>
  );
}
