"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, X } from "lucide-react";
import {
  type ActionResult,
  type Debt,
  type PayDebtInput,
  type Wallet,
} from "@/types/finance";
import { formatCurrency } from "@/lib/utils";
import { useCurrencyInput } from "@/lib/useCurrencyInput";

interface PayDebtModalProps {
  isOpen: boolean;
  onClose: () => void;
  debt: Debt | null;
  wallets: Wallet[];
  onPay: (data: PayDebtInput) => Promise<ActionResult<Debt>>;
}

export function PayDebtModal({
  isOpen,
  onClose,
  debt,
  wallets,
  onPay,
}: PayDebtModalProps) {
  const [walletId, setWalletId] = useState(
    debt?.wallet_id || wallets[0]?.id || ""
  );
  const [transactionDate, setTransactionDate] = useState(() => {
    const now = new Date();
    return new Date(now.getTime() - now.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
  });
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remaining = debt ? debt.remaining_amount : 0;
  const {
    displayValue: amount,
    rawValue: rawAmount,
    onChange: onAmountChange,
    onBlur: onAmountBlur,
    setValue: setAmountValue,
  } = useCurrencyInput(remaining);

  useEffect(() => {
    if (debt) {
      setAmountValue(debt.remaining_amount);
      setWalletId(debt.wallet_id || wallets[0]?.id || "");
      setNotes("");
      setError(null);
    }
  }, [debt, wallets, setAmountValue]);

  if (!isOpen || !debt) return null;

  const isDebt = debt.type === "debt";
  const newRemaining = Math.max(0, remaining - rawAmount);
  const willBeFullyPaid = newRemaining === 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawAmount || rawAmount <= 0) {
      setError("Nominal pembayaran harus lebih dari 0");
      return;
    }

    if (!walletId) {
      setError("Silakan pilih dompet untuk transaksi");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const payload: PayDebtInput = {
        debt_id: debt.id,
        amount: rawAmount,
        wallet_id: walletId,
        transaction_date: new Date(transactionDate).toISOString(),
        notes: notes.trim() || null,
      };

      const res = await onPay(payload);
      if (res.success) {
        onClose();
      } else {
        setError(res.error ?? "Gagal memproses pembayaran");
      }
    } catch {
      setError("Terjadi kesalahan teknis");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl bg-white dark:bg-zinc-900 border-t sm:border border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col max-h-[90dvh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/70 dark:bg-zinc-950/70 shrink-0">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100">
              {isDebt ? "Bayar Cicilan / Lunasi Hutang" : "Terima Pembayaran Piutang"}
            </h2>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
              {debt.title} ({debt.counterparty_name})
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 overscroll-contain">
            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-600 dark:text-rose-400 font-medium">
                {error}
              </div>
            )}

            {/* Current Debt Info Box */}
            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200/80 dark:border-zinc-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-500 dark:text-zinc-400">Total Pokok Awal:</span>
                <span className="font-semibold text-zinc-900 dark:text-zinc-100 font-mono">
                  {formatCurrency(debt.total_amount)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-500 dark:text-zinc-400">Sisa Pokok Saat Ini:</span>
                <span className="font-bold text-rose-600 dark:text-rose-400 font-mono">
                  {formatCurrency(debt.remaining_amount)}
                </span>
              </div>
            </div>

            {/* Payment Amount */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Nominal Pembayaran (IDR)
                </label>
                <button
                  type="button"
                  onClick={() => setAmountValue(debt.remaining_amount)}
                  className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                >
                  Lunasi Penuh ({formatCurrency(debt.remaining_amount)})
                </button>
              </div>

              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-zinc-400 font-mono">
                  Rp
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  required
                  placeholder="0"
                  value={amount}
                  onChange={onAmountChange}
                  onBlur={onAmountBlur}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-base font-bold text-zinc-900 dark:text-zinc-100 font-mono tabular-nums focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Status Simulation */}
              {rawAmount > 0 && (
                <div className="flex items-center justify-between mt-2 text-xs px-1">
                  <span className="text-zinc-500">Estimasi Sisa Pokok:</span>
                  <span
                    className={`font-bold font-mono ${
                      willBeFullyPaid
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-zinc-900 dark:text-zinc-100"
                    }`}
                  >
                    {willBeFullyPaid ? "LUNAS (Rp 0)" : formatCurrency(newRemaining)}
                  </span>
                </div>
              )}
            </div>

            {/* Wallet Selection */}
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                {isDebt ? "Potong dari Dompet" : "Simpan ke Dompet"}
              </label>
              <select
                value={walletId}
                onChange={(e) => setWalletId(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-emerald-500"
              >
                {wallets.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({formatCurrency(w.balance)})
                  </option>
                ))}
              </select>
            </div>

            {/* Transaction Date */}
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                Tanggal Pembayaran
              </label>
              <input
                type="datetime-local"
                value={transactionDate}
                onChange={(e) => setTransactionDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                Catatan (Opsional)
              </label>
              <input
                type="text"
                placeholder="Contoh: Cicilan ke-3, Transfer via m-BCA..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-2 px-5 sm:px-6 py-3.5 sm:py-4 border-t border-zinc-200 dark:border-zinc-800/80 bg-zinc-50/90 dark:bg-zinc-900/90 backdrop-blur-xs shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 active:scale-95 transition-all"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isLoading || rawAmount <= 0}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold disabled:opacity-50 active:scale-95 transition-all shadow-xs cursor-pointer"
            >
              {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>
                {willBeFullyPaid ? "Konfirmasi Pelunasan" : "Catat Pembayaran Cicilan"}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
