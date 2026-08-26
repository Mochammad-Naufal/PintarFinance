"use client";

import { useState } from "react";
import {
  Calendar,
  CheckCircle2,
  Edit2,
  Loader2,
  Pause,
  Play,
  Repeat,
  Trash2,
  Wallet as WalletIcon,
  Zap,
} from "lucide-react";
import { type RecurringTransaction } from "@/types/finance";
import { formatCurrency, formatDate } from "@/lib/utils";

interface RecurringCardProps {
  item: RecurringTransaction;
  onEdit: (item: RecurringTransaction) => void;
  onDelete: (id: string) => Promise<void>;
  onProcessNow: (id: string) => Promise<void>;
  onToggleStatus: (id: string, isActive: boolean) => Promise<void>;
}

function getDueDaysStatus(nextRunDateStr: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const due = new Date(nextRunDateStr);
  due.setHours(0, 0, 0, 0);

  const diffTime = due.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return {
      label: `Tertunda ${Math.abs(diffDays)} hari`,
      tone: "overdue",
      isDue: true,
    };
  } else if (diffDays === 0) {
    return {
      label: "Jatuh Tempo Hari Ini",
      tone: "today",
      isDue: true,
    };
  } else if (diffDays === 1) {
    return {
      label: "Jatuh Tempo Besok",
      tone: "tomorrow",
      isDue: true,
    };
  } else {
    return {
      label: `Dalam ${diffDays} hari`,
      tone: "future",
      isDue: false,
    };
  }
}

const FREQUENCY_LABELS: Record<string, string> = {
  daily: "Harian",
  weekly: "Mingguan",
  monthly: "Bulanan",
  yearly: "Tahunan",
};

export function RecurringCard({
  item,
  onEdit,
  onDelete,
  onProcessNow,
  onToggleStatus,
}: RecurringCardProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  const dueStatus = getDueDaysStatus(item.next_run_date);
  const isExpense = item.type === "expense";

  const handleProcess = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      await onProcessNow(item.id);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleToggle = async () => {
    if (isToggling) return;
    setIsToggling(true);
    try {
      await onToggleStatus(item.id, !item.is_active);
    } finally {
      setIsToggling(false);
    }
  };

  const handleDelete = async () => {
    if (confirm(`Hapus jadwal transaksi "${item.description}"?`)) {
      setIsDeleting(true);
      try {
        await onDelete(item.id);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  return (
    <div
      className={`p-4 sm:p-5 rounded-2xl border transition-all duration-150 relative ${
        !item.is_active
          ? "bg-zinc-100/50 dark:bg-zinc-900/30 border-zinc-200 dark:border-zinc-800/60 opacity-70"
          : dueStatus.isDue
          ? "bg-white dark:bg-zinc-900 border-amber-500/30 shadow-xs ring-1 ring-amber-500/20"
          : "bg-white dark:bg-zinc-900/80 border-zinc-200 dark:border-zinc-800/80 shadow-xs hover:border-zinc-300 dark:hover:border-zinc-700"
      }`}
    >
      {/* Top Meta Row */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
              isExpense
                ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
            }`}
          >
            <Repeat className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
              {item.description}
            </h3>
            <div className="flex items-center gap-2 mt-0.5 text-[11px] text-zinc-500 dark:text-zinc-400">
              <span className="flex items-center gap-1">
                <WalletIcon className="w-3 h-3" />
                <span>{item.wallet_name}</span>
              </span>
              {item.category_name && (
                <>
                  <span>•</span>
                  <span>{item.category_name}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Frequency & Auto-debit Pill */}
        <div className="flex items-center gap-1.5 shrink-0">
          {item.auto_create && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <Zap className="w-2.5 h-2.5" />
              <span>Auto</span>
            </span>
          )}
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
            {FREQUENCY_LABELS[item.frequency] || item.frequency}
          </span>
        </div>
      </div>

      {/* Amount & Due Date Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 pb-3 border-t border-zinc-100 dark:border-zinc-800/80">
        <div>
          <span className="text-[10px] uppercase font-semibold text-zinc-400">
            Nominal Per Siklus
          </span>
          <p
            className={`text-base font-mono font-bold tabular-nums ${
              isExpense
                ? "text-zinc-900 dark:text-zinc-100"
                : "text-emerald-600 dark:text-emerald-400"
            }`}
          >
            {isExpense ? "-" : "+"} {formatCurrency(item.amount)}
          </p>
        </div>

        <div className="text-left sm:text-right">
          <span className="text-[10px] uppercase font-semibold text-zinc-400 flex items-center sm:justify-end gap-1">
            <Calendar className="w-3 h-3" />
            <span>Jatuh Tempo Berikutnya</span>
          </span>
          <div className="flex items-center sm:justify-end gap-1.5 mt-0.5">
            <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
              {formatDate(item.next_run_date, "d MMM yyyy")}
            </span>
            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                dueStatus.tone === "overdue"
                  ? "bg-rose-500/15 text-rose-600 dark:text-rose-400"
                  : dueStatus.tone === "today"
                  ? "bg-amber-500/20 text-amber-700 dark:text-amber-300"
                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400"
              }`}
            >
              {dueStatus.label}
            </span>
          </div>
        </div>
      </div>

      {/* Action Buttons Row */}
      <div className="flex items-center justify-between gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800/80">
        {/* Left: Active Toggle */}
        <button
          type="button"
          disabled={isToggling}
          onClick={handleToggle}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
            item.is_active
              ? "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              : "text-amber-600 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 font-semibold"
          }`}
        >
          {item.is_active ? (
            <>
              <Pause className="w-3 h-3" />
              <span>Jeda</span>
            </>
          ) : (
            <>
              <Play className="w-3 h-3" />
              <span>Aktifkan</span>
            </>
          )}
        </button>

        {/* Right: Actions (Process Now, Edit, Delete) */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onEdit(item)}
            className="p-2 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            title="Edit Jadwal"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            disabled={isDeleting}
            onClick={handleDelete}
            className="p-2 rounded-lg text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
            title="Hapus Jadwal"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            disabled={isProcessing || !item.is_active}
            onClick={handleProcess}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 dark:bg-emerald-500 text-white hover:bg-emerald-500 dark:hover:bg-emerald-400 active:scale-[0.98] transition-all disabled:opacity-50 shadow-xs"
          >
            {isProcessing ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <CheckCircle2 className="w-3.5 h-3.5" />
            )}
            <span>Catat Sekarang</span>
          </button>
        </div>
      </div>
    </div>
  );
}
