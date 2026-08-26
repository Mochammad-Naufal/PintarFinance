"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Loader2,
  LogOut,
  Pencil,
  Plus,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";
import { type SavingsGoal } from "@/types/finance";
import { formatCurrency, formatDate } from "@/lib/utils";
import { DynamicIcon } from "@/lib/icons";

interface SavingsGoalCardProps {
  goal: SavingsGoal;
  onEdit: (goal: SavingsGoal) => void;
  onDelete: (id: string) => Promise<void>;
  onLeave?: (id: string) => Promise<void>;
  onInvite: (goal: SavingsGoal) => void;
}

export function SavingsGoalCard({
  goal,
  onEdit,
  onDelete,
  onLeave,
  onInvite,
}: SavingsGoalCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [showMembers, setShowMembers] = useState(false);

  const percentage = Math.min(
    100,
    Math.round((goal.current_amount / (goal.target_amount || 1)) * 100)
  );

  const remaining = Math.max(0, goal.target_amount - goal.current_amount);
  const isCompleted = goal.is_completed || goal.current_amount >= goal.target_amount;
  const isOwner = goal.user_role === "owner";
  const members = goal.members || [];
  const isShared = members.length > 1;

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

  const handleLeave = async () => {
    if (confirm(`Yakin ingin keluar dari pos tabungan bersama "${goal.name}"?`)) {
      if (!onLeave) return;
      setIsLeaving(true);
      try {
        await onLeave(goal.id);
      } finally {
        setIsLeaving(false);
      }
    }
  };

  return (
    <div className="relative p-5 rounded-2xl bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/80 shadow-xs hover:border-zinc-300 dark:hover:border-zinc-700/80 transition-all duration-150 flex flex-col justify-between overflow-hidden">
      {/* Top accent bar */}
      <div
        className="absolute top-0 left-0 right-0 h-1"
        style={{ backgroundColor: goal.color || "#3b82f6" }}
      />

      {/* Header: Icon, Name, Badges, Actions */}
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{
                backgroundColor: `${goal.color || "#3b82f6"}15`,
                color: goal.color || "#3b82f6",
              }}
            >
              <DynamicIcon name={goal.icon} className="w-5 h-5" strokeWidth={1.75} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                  {goal.name}
                </h3>
                {isShared && (
                  <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400 shrink-0">
                    <Users className="w-2.5 h-2.5" />
                    Bersama ({members.length})
                  </span>
                )}
                {isCompleted && (
                  <span className="flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 shrink-0">
                    <CheckCircle2 className="w-3 h-3" />
                    Tercapai
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                <span>
                  {goal.target_date
                    ? `Tenggat: ${formatDate(goal.target_date)}`
                    : "Target Fleksibel"}
                </span>
                {!isOwner && goal.owner_name && (
                  <>
                    <span>•</span>
                    <span className="text-[11px] text-zinc-400">
                      Oleh {goal.owner_name}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Invite Button */}
            <button
              type="button"
              onClick={() => onInvite(goal)}
              className="p-1.5 rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 active:scale-[0.95] transition-all"
              title="Undang Anggota"
            >
              <UserPlus className="w-4 h-4" strokeWidth={1.75} />
            </button>

            {isOwner ? (
              <>
                <button
                  type="button"
                  onClick={() => onEdit(goal)}
                  className="p-1.5 rounded-lg text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 active:scale-[0.95] transition-all"
                  title="Edit Target"
                >
                  <Pencil className="w-4 h-4" strokeWidth={1.75} />
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="p-1.5 rounded-lg text-zinc-500 dark:text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 active:scale-[0.95] transition-all disabled:opacity-50"
                  title="Hapus Target"
                >
                  {isDeleting ? (
                    <Loader2 className="w-4 h-4 animate-spin text-rose-500" strokeWidth={1.75} />
                  ) : (
                    <Trash2 className="w-4 h-4" strokeWidth={1.75} />
                  )}
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={handleLeave}
                disabled={isLeaving}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10 active:scale-[0.95] transition-all disabled:opacity-50"
                title="Keluar dari Tabungan Bersama"
              >
                {isLeaving ? (
                  <Loader2 className="w-4 h-4 animate-spin text-rose-500" />
                ) : (
                  <LogOut className="w-4 h-4" />
                )}
              </button>
            )}
          </div>
        </div>

        {/* Progress Bar & Percent */}
        <div className="mt-5 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-zinc-800 dark:text-zinc-200 font-mono tabular-nums">
              {percentage}%
            </span>
            <span className="text-zinc-500 dark:text-zinc-400">
              {isCompleted
                ? "Target Terpenuhi!"
                : `Kurang ${formatCurrency(remaining)}`}
            </span>
          </div>

          <div className="w-full h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
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

      {/* Stacked Member Avatars & Contributions trigger */}
      <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800/50 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {/* Stacked Avatars */}
          <div className="flex -space-x-1.5 overflow-hidden">
            {members.slice(0, 4).map((m) => (
              <div
                key={m.id}
                title={m.user_name || "Anggota"}
                className="inline-block h-6 w-6 rounded-full ring-2 ring-white dark:ring-zinc-900 bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold text-[9px] flex items-center justify-center shrink-0 shadow-xs"
              >
                {m.user_name?.slice(0, 2).toUpperCase() || "U"}
              </div>
            ))}
          </div>

          {members.length > 0 && (
            <button
              type="button"
              onClick={() => setShowMembers(!showMembers)}
              className="flex items-center gap-1 text-[11px] font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
            >
              <span>{members.length} Anggota</span>
              {showMembers ? (
                <ChevronUp className="w-3 h-3" />
              ) : (
                <ChevronDown className="w-3 h-3" />
              )}
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() => onInvite(goal)}
          className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
        >
          <Plus className="w-3 h-3" />
          <span>Undang</span>
        </button>
      </div>

      {/* Expandable Member Contribution Breakdown */}
      {showMembers && members.length > 0 && (
        <div className="mt-3 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-2 text-xs animate-in fade-in duration-150">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
            Rincian Setoran Anggota
          </p>
          <div className="space-y-1.5 divide-y divide-zinc-100 dark:divide-zinc-800/60">
            {members.map((m) => {
              const contPercent = Math.round(
                ((m.total_contributed || 0) / (goal.target_amount || 1)) * 100
              );
              return (
                <div
                  key={m.id}
                  className="pt-1.5 first:pt-0 flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-zinc-800 dark:text-zinc-200 truncate">
                      {m.user_name || "Anggota"}
                      {m.role === "owner" && (
                        <span className="ml-1 text-[9px] font-normal text-zinc-400">
                          (Owner)
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-mono font-bold text-zinc-900 dark:text-zinc-100 tabular-nums">
                      {formatCurrency(m.total_contributed || 0)}
                    </p>
                    <p className="text-[10px] text-zinc-400 tabular-nums">
                      {contPercent}% dari target
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Amounts */}
      <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800/40 flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase font-medium text-zinc-500 dark:text-zinc-400">
            Terkumpul
          </p>
          <p className="text-base font-bold text-zinc-900 dark:text-zinc-100 font-mono tabular-nums mt-0.5">
            {formatCurrency(goal.current_amount)}
          </p>
        </div>

        <div className="text-right">
          <p className="text-[10px] uppercase font-medium text-zinc-500 dark:text-zinc-400">
            Target
          </p>
          <p className="text-base font-medium text-zinc-600 dark:text-zinc-400 font-mono tabular-nums mt-0.5">
            {formatCurrency(goal.target_amount)}
          </p>
        </div>
      </div>
    </div>
  );
}
