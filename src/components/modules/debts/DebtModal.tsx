"use client";

import { useEffect, useState } from "react";
import { Loader2, X } from "lucide-react";
import {
  type ActionResult,
  type Debt,
  type DebtInput,
  type DebtType,
  type Wallet,
} from "@/types/finance";
import { formatCurrency } from "@/lib/utils";
import { useCurrencyInput } from "@/lib/useCurrencyInput";

interface DebtModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: DebtInput) => Promise<ActionResult<Debt>>;
  initialData?: Debt | null;
  defaultType?: DebtType;
  wallets: Wallet[];
}

export function DebtModal({
  isOpen,
  onClose,
  onSave,
  initialData,
  defaultType = "debt",
  wallets,
}: DebtModalProps) {
  const [type, setType] = useState<DebtType>(
    initialData?.type ?? defaultType
  );
  const [counterpartyName, setCounterpartyName] = useState(
    initialData?.counterparty_name ?? ""
  );
  const [title, setTitle] = useState(initialData?.title ?? "");

  const {
    displayValue: totalAmount,
    rawValue: rawTotalAmount,
    onChange: onTotalChange,
    onBlur: onTotalBlur,
    setValue: setTotalValue,
  } = useCurrencyInput(initialData?.total_amount ?? 0);

  const {
    displayValue: remainingAmount,
    rawValue: rawRemainingAmount,
    onChange: onRemainingChange,
    onBlur: onRemainingBlur,
    setValue: setRemainingValue,
  } = useCurrencyInput(initialData?.remaining_amount ?? 0);

  const [dueDate, setDueDate] = useState(
    initialData?.due_date ? initialData.due_date.slice(0, 10) : ""
  );
  const [walletId, setWalletId] = useState(
    initialData?.wallet_id ?? (wallets[0]?.id || "")
  );
  const [notes, setNotes] = useState(initialData?.notes ?? "");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setType(initialData.type);
      setCounterpartyName(initialData.counterparty_name);
      setTitle(initialData.title);
      setTotalValue(initialData.total_amount);
      setRemainingValue(initialData.remaining_amount);
      setDueDate(initialData.due_date ? initialData.due_date.slice(0, 10) : "");
      setWalletId(initialData.wallet_id || (wallets[0]?.id ?? ""));
      setNotes(initialData.notes || "");
    } else {
      setType(defaultType);
      setCounterpartyName("");
      setTitle("");
      setTotalValue(0);
      setRemainingValue(0);
      setDueDate("");
      setWalletId(wallets[0]?.id || "");
      setNotes("");
    }
    setError(null);
  }, [initialData, defaultType, isOpen, wallets, setTotalValue, setRemainingValue]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!counterpartyName.trim()) {
      setError(
        type === "debt"
          ? "Nama kreditur/lembaga wajib diisi"
          : "Nama debitur/peminjam wajib diisi"
      );
      return;
    }

    if (!title.trim()) {
      setError("Keterangan/tujuan pinjaman wajib diisi");
      return;
    }

    if (!rawTotalAmount || rawTotalAmount <= 0) {
      setError("Nominal pokok harus lebih dari 0");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const payload: DebtInput = {
        type,
        counterparty_name: counterpartyName.trim(),
        title: title.trim(),
        total_amount: rawTotalAmount,
        remaining_amount:
          initialData && rawRemainingAmount !== undefined
            ? rawRemainingAmount
            : rawTotalAmount,
        due_date: dueDate || null,
        wallet_id: walletId || null,
        notes: notes.trim() || null,
      };

      const res = await onSave(payload);
      if (res.success) {
        onClose();
      } else {
        setError(res.error ?? "Gagal menyimpan pos hutang/piutang");
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
      <div className="w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl bg-white dark:bg-zinc-900 border-t sm:border border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col max-h-[90dvh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/70 dark:bg-zinc-950/70 shrink-0">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100">
              {initialData
                ? "Edit Pos Liabilitas"
                : type === "debt"
                ? "Catat Hutang Baru (Liabilitas)"
                : "Catat Piutang Baru (Hak Tagih)"}
            </h2>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
              {type === "debt"
                ? "Kewajiban pembayaran yang harus Anda lunasi"
                : "Uang Anda yang dipinjam oleh pihak lain"}
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

            {/* Type Selector (only on create) */}
            {!initialData && (
              <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setType("debt")}
                  className={`py-2 rounded-lg text-xs font-semibold transition-all ${
                    type === "debt"
                      ? "bg-white dark:bg-zinc-800 text-rose-600 dark:text-rose-400 shadow-xs"
                      : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800"
                  }`}
                >
                  💳 Hutang Saya (Kewajiban)
                </button>
                <button
                  type="button"
                  onClick={() => setType("receivable")}
                  className={`py-2 rounded-lg text-xs font-semibold transition-all ${
                    type === "receivable"
                      ? "bg-white dark:bg-zinc-800 text-emerald-600 dark:text-emerald-400 shadow-xs"
                      : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800"
                  }`}
                >
                  🤝 Piutang (Orang Berhutang)
                </button>
              </div>
            )}

            {/* Counterparty Name */}
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                {type === "debt" ? "Pemberi Pinjaman / Bank / Lembaga" : "Peminjam / Nama Orang / Lembaga"}
              </label>
              <input
                type="text"
                required
                maxLength={100}
                placeholder={type === "debt" ? "Contoh: Bank BCA, Teman (Budi), Kredivo..." : "Contoh: Andi, Toko Berkah..."}
                value={counterpartyName}
                onChange={(e) => setCounterpartyName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Title / Description */}
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                Judul / Keterangan Pos
              </label>
              <input
                type="text"
                required
                maxLength={150}
                placeholder="Contoh: Cicilan Laptop Kerja, Pinjaman Modal Usaha..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Total Principal Amount */}
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                Total Pokok Nominal (IDR)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-zinc-400 font-mono">
                  Rp
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  required
                  placeholder="0"
                  value={totalAmount}
                  onChange={onTotalChange}
                  onBlur={onTotalBlur}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-base font-bold text-zinc-900 dark:text-zinc-100 font-mono tabular-nums focus:outline-none focus:border-emerald-500"
                />
              </div>
              {rawTotalAmount > 0 && (
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 font-mono">
                  = {formatCurrency(rawTotalAmount)}
                </p>
              )}
            </div>

            {/* Sisa Pokok (Only on edit) */}
            {initialData && (
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Sisa Pokok Saat Ini (IDR)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-zinc-400 font-mono">
                    Rp
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="0"
                    value={remainingAmount}
                    onChange={onRemainingChange}
                    onBlur={onRemainingBlur}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-sm font-bold text-zinc-900 dark:text-zinc-100 font-mono tabular-nums focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            )}

            {/* Due Date & Wallet */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Due Date */}
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Tanggal Jatuh Tempo (Opsional)
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Linked Wallet */}
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Dompet Terkait
                </label>
                <select
                  value={walletId}
                  onChange={(e) => setWalletId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-emerald-500"
                >
                  <option value="">-- Tanpa Dompet Khusus --</option>
                  {wallets.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({formatCurrency(w.balance)})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                Catatan Tambahan (Opsional)
              </label>
              <textarea
                rows={2}
                placeholder="Nomor kontrak, bunga, tenor, atau perjanjian..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-emerald-500 resize-none"
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
              disabled={isLoading || !counterpartyName.trim() || !title.trim() || rawTotalAmount <= 0}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold disabled:opacity-50 active:scale-95 transition-all shadow-xs cursor-pointer"
            >
              {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{initialData ? "Simpan Perubahan" : "Simpan Data"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
