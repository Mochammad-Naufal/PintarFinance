"use client";

import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
  Edit2,
  HandCoins,
  Receipt,
  Scale,
  Target,
  Trash2,
  Wallet as WalletIcon,
} from "lucide-react";
import { type Debt } from "@/types/finance";
import { formatCurrency, formatDate } from "@/lib/utils";

interface DebtCardProps {
  debt: Debt;
  onPay: (debt: Debt) => void;
  onEdit: (debt: Debt) => void;
  onDelete: (debt: Debt) => void;
}

export function DebtCard({ debt, onPay, onEdit, onDelete }: DebtCardProps) {
  const isDebt = debt.type === "debt";
  const isPaid = debt.status === "paid" || debt.remaining_amount <= 0;

  const paidAmount = Math.max(0, debt.total_amount - debt.remaining_amount);
  const percentagePaid = Math.min(
    100,
    Math.round((paidAmount / (debt.total_amount || 1)) * 100)
  );

  // Due Date calculation
  let dueDateText: string | null = null;
  let isOverdue = false;
  let isDueSoon = false;

  if (debt.due_date && !isPaid) {
    const due = new Date(debt.due_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    due.setHours(0, 0, 0, 0);

    const diffDays = Math.ceil(
      (due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays < 0) {
      isOverdue = true;
      dueDateText = `Terlambat ${Math.abs(diffDays)} hari (${formatDate(
        debt.due_date
      )})`;
    } else if (diffDays === 0) {
      isDueSoon = true;
      dueDateText = `Jatuh tempo Hari Ini!`;
    } else if (diffDays <= 7) {
      isDueSoon = true;
      dueDateText = `${diffDays} hari lagi (${formatDate(debt.due_date)})`;
    } else {
      dueDateText = formatDate(debt.due_date);
    }
  }

  return (
    <div className="p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800/80 shadow-xs space-y-4 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all flex flex-col justify-between">
      {/* Top: Type Badge + Title + Status */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
              isDebt
                ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
            }`}
          >
            {isDebt ? <CreditCard className="w-3 h-3" /> : <HandCoins className="w-3 h-3" />}
            <span>{isDebt ? "Hutang Saya" : "Piutang Saya"}</span>
          </span>

          <div className="flex items-center gap-1">
            {isPaid ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                <CheckCircle2 className="w-3 h-3" />
                <span>Lunas</span>
              </span>
            ) : debt.status === "partial" ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 text-[10px] font-bold">
                <Clock className="w-3 h-3" />
                <span>Cicilan Berjalan</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-[10px] font-bold">
                <span>Belum Lunas</span>
              </span>
            )}
          </div>
        </div>

        <div>
          <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 line-clamp-1">
            {debt.title}
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            {isDebt ? "Kreditur: " : "Peminjam: "}
            <strong className="text-zinc-700 dark:text-zinc-300 font-semibold">
              {debt.counterparty_name}
            </strong>
          </p>
        </div>

        {/* Monthly Installment Highlight Box */}
        {(debt.monthly_installment && debt.monthly_installment > 0) ? (
          <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200/80 dark:border-zinc-800/80 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[10px] uppercase font-bold tracking-wider text-zinc-400">
                {isDebt ? "Tagihan Cicilan" : "Penerimaan Cicilan"}
              </p>
              <p className="text-xs sm:text-sm font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                {formatCurrency(debt.monthly_installment)}{" "}
                <span className="text-[10px] font-normal text-zinc-400">/ bln</span>
              </p>
            </div>
            {debt.due_day && (
              <div className="text-right">
                <p className="text-[9px] text-zinc-400 font-medium">Jatuh Tempo</p>
                <p className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300">
                  Tiap tgl {debt.due_day}
                </p>
              </div>
            )}
          </div>
        ) : null}
      </div>

      {/* Progress & Remaining Figure */}
      <div className="space-y-2 pt-1">
        <div className="flex items-baseline justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-zinc-400">
              Sisa Pokok
            </p>
            <p className="text-xl font-bold font-mono tabular-nums text-zinc-900 dark:text-zinc-100">
              {formatCurrency(debt.remaining_amount)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-zinc-400 font-mono">
              Total: {formatCurrency(debt.total_amount)}
            </p>
            <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono">
              {percentagePaid}% Terbayar
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-2 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isPaid
                ? "bg-emerald-500"
                : isDebt
                ? "bg-rose-500"
                : "bg-emerald-500"
            }`}
            style={{ width: `${percentagePaid}%` }}
          />
        </div>

        {/* Target Payoff Date & Wallet Tag */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] pt-1">
          {debt.target_payoff_date ? (
            <div className="inline-flex items-center gap-1 text-zinc-500 dark:text-zinc-400 text-[10px]">
              <Target className="w-3 h-3 text-emerald-500" />
              <span>Target Lunas: {formatDate(debt.target_payoff_date)}</span>
            </div>
          ) : dueDateText ? (
            <div
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg ${
                isOverdue
                  ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold"
                  : isDueSoon
                  ? "bg-amber-500/10 text-amber-700 dark:text-amber-300 font-semibold"
                  : "text-zinc-500 dark:text-zinc-400"
              }`}
            >
              <Calendar className="w-3 h-3" />
              <span>{dueDateText}</span>
            </div>
          ) : null}

          {debt.wallet_name && (
            <div className="inline-flex items-center gap-1 text-zinc-500 dark:text-zinc-400 text-[10px]">
              <WalletIcon className="w-3 h-3 text-zinc-400" />
              <span>{debt.wallet_name}</span>
            </div>
          )}
        </div>

        {debt.notes && (
          <p className="text-[11px] text-zinc-400 dark:text-zinc-500 italic line-clamp-1 border-t border-zinc-100 dark:border-zinc-800/80 pt-1.5">
            &ldquo;{debt.notes}&rdquo;
          </p>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800/80">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onEdit(debt)}
            className="p-2 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            title="Edit Pos Tagihan & Cicilan"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(debt)}
            className="p-2 rounded-xl text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
            title="Hapus Pos Tagihan & Cicilan"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {!isPaid ? (
          <button
            type="button"
            onClick={() => onPay(debt)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold active:scale-95 transition-all shadow-xs cursor-pointer"
          >
            <HandCoins className="w-3.5 h-3.5" />
            <span>{isDebt ? "Bayar Cicilan" : "Terima Bayaran"}</span>
          </button>
        ) : (
          <span className="text-xs text-zinc-400 font-semibold px-2 py-1">
            ✓ Sudah Selesai
          </span>
        )}
      </div>
    </div>
  );
}
