"use client";

import { useEffect, useState } from "react";
import { Calendar, CreditCard, Loader2, X } from "lucide-react";
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

  // Total Principal
  const {
    displayValue: totalAmount,
    rawValue: rawTotalAmount,
    onChange: onTotalChange,
    onBlur: onTotalBlur,
    setValue: setTotalValue,
  } = useCurrencyInput(initialData?.total_amount ?? 0);

  // Monthly Installment
  const {
    displayValue: monthlyInstallment,
    rawValue: rawMonthlyInstallment,
    onChange: onMonthlyChange,
    onBlur: onMonthlyBlur,
    setValue: setMonthlyValue,
  } = useCurrencyInput(initialData?.monthly_installment ?? 0);

  // Remaining Principal
  const {
    displayValue: remainingAmount,
    rawValue: rawRemainingAmount,
    onChange: onRemainingChange,
    onBlur: onRemainingBlur,
    setValue: setRemainingValue,
  } = useCurrencyInput(initialData?.remaining_amount ?? 0);

  const [dueDay, setDueDay] = useState(initialData?.due_day ?? 1);
  const [targetPayoffDate, setTargetPayoffDate] = useState(
    initialData?.target_payoff_date ? initialData.target_payoff_date.slice(0, 10) : ""
  );
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
      setMonthlyValue(initialData.monthly_installment ?? 0);
      setDueDay(initialData.due_day ?? 1);
      setTargetPayoffDate(initialData.target_payoff_date ? initialData.target_payoff_date.slice(0, 10) : "");
      setDueDate(initialData.due_date ? initialData.due_date.slice(0, 10) : "");
      setWalletId(initialData.wallet_id || (wallets[0]?.id ?? ""));
      setNotes(initialData.notes || "");
    } else {
      setType(defaultType);
      setCounterpartyName("");
      setTitle("");
      setTotalValue(0);
      setRemainingValue(0);
      setMonthlyValue(0);
      setDueDay(1);
      setTargetPayoffDate("");
      setDueDate("");
      setWalletId(wallets[0]?.id || "");
      setNotes("");
    }
    setError(null);
  }, [initialData, defaultType, isOpen, wallets, setTotalValue, setRemainingValue, setMonthlyValue]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!counterpartyName.trim()) {
      setError(
        type === "debt"
          ? "Nama kreditur/lembaga pemberi pinjaman wajib diisi"
          : "Nama debitur/peminjam dana wajib diisi"
      );
      return;
    }

    if (!title.trim()) {
      setError("Judul/tujuan kewajiban cicilan wajib diisi");
      return;
    }

    if (!rawTotalAmount || rawTotalAmount <= 0) {
      setError("Total nominal pokok harus lebih dari 0");
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
        monthly_installment: rawMonthlyInstallment || 0,
        due_day: Number(dueDay) || 1,
        due_date: dueDate || null,
        target_payoff_date: targetPayoffDate || null,
        wallet_id: walletId || null,
        notes: notes.trim() || null,
      };

      const res = await onSave(payload);
      if (res.success) {
        onClose();
      } else {
        setError(res.error ?? "Gagal menyimpan pos cicilan/hutang");
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
        if (e.target === e.currentTarget && !isLoading) onClose();
      }}
    >
      <div className="w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl bg-white dark:bg-zinc-900 border-t sm:border border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col max-h-[90dvh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/70 dark:bg-zinc-950/70 shrink-0">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100">
              {initialData
                ? "Edit Pos Tagihan & Cicilan"
                : type === "debt"
                ? "Catat Tagihan & Cicilan Hutang"
                : "Catat Tagihan Piutang (Hak Tagih)"}
            </h2>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
              {type === "debt"
                ? "Skema cicilan rutin bulanan & target pelunasan kewajiban"
                : "Skema penerimaan cicilan rutin dari pihak lain"}
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

            {/* Type Selector (Clean Text-Only Labels) */}
            {!initialData && (
              <div className="grid grid-cols-2 gap-1.5 p-1 rounded-2xl bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setType("debt")}
                  className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    type === "debt"
                      ? "bg-white dark:bg-zinc-800 text-rose-600 dark:text-rose-400 shadow-xs"
                      : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
                  }`}
                >
                  Hutang
                </button>
                <button
                  type="button"
                  onClick={() => setType("receivable")}
                  className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    type === "receivable"
                      ? "bg-white dark:bg-zinc-800 text-emerald-600 dark:text-emerald-400 shadow-xs"
                      : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
                  }`}
                >
                  Piutang
                </button>
              </div>
            )}

            {/* Counterparty Name */}
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                {type === "debt" ? "Pemberi Pinjaman / Bank / Lembaga" : "Peminjam / Nama Orang / Lembaga"}
              </label>
              <input
                type="text"
                required
                maxLength={100}
                placeholder={type === "debt" ? "Contoh: Bank BCA, Leasing BAF, Budi..." : "Contoh: Andi Pratama, CV Berkah..."}
                value={counterpartyName}
                onChange={(e) => setCounterpartyName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Title / Description */}
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Judul / Keterangan Tagihan
              </label>
              <input
                type="text"
                required
                maxLength={150}
                placeholder="Contoh: Cicilan Motor Vario, Pinjaman Modal Kerja, KPR Rumah..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Monthly Installment & Total Principal (Grid) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Monthly Installment Amount */}
              <div className="p-3.5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-500/20 space-y-1.5">
                <label className="block text-xs font-bold text-emerald-800 dark:text-emerald-300">
                  Tagihan / Cicilan Bulanan
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-emerald-600 font-mono">
                    Rp
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="0"
                    value={monthlyInstallment}
                    onChange={onMonthlyChange}
                    onBlur={onMonthlyBlur}
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-emerald-500/30 text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
                {rawMonthlyInstallment > 0 && (
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">
                    = {formatCurrency(rawMonthlyInstallment)} / bulan
                  </p>
                )}
              </div>

              {/* Total Principal Amount */}
              <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 space-y-1.5">
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Total Pokok Pinjaman
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-400 font-mono">
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
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
                {rawTotalAmount > 0 && (
                  <p className="text-[10px] text-zinc-500 font-mono">
                    = {formatCurrency(rawTotalAmount)}
                  </p>
                )}
              </div>
            </div>

            {/* Monthly Due Day & Target Payoff Date (Grid) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Due Day of Month (e.g. Setiap tgl X) */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Tanggal Tagihan Tiap Bulan
                </label>
                <div className="relative">
                  <select
                    value={dueDay}
                    onChange={(e) => setDueDay(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-emerald-500"
                  >
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                      <option key={day} value={day}>
                        Setiap tanggal {day} per bulan
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Target Payoff Date */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Target Tanggal Lunas
                </label>
                <input
                  type="date"
                  value={targetPayoffDate}
                  onChange={(e) => setTargetPayoffDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Remaining Amount (If Editing) */}
            {initialData && (
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Sisa Pokok Saat Ini (IDR)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-400 font-mono">
                    Rp
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={remainingAmount}
                    onChange={onRemainingChange}
                    onBlur={onRemainingBlur}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            )}

            {/* Source Wallet (Optional) */}
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Dompet Rekomendasi Pembayaran
              </label>
              <select
                value={walletId}
                onChange={(e) => setWalletId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-emerald-500"
              >
                <option value="">Pilih Dompet Rekomendasi (Opsional)</option>
                {wallets.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({formatCurrency(w.balance)})
                  </option>
                ))}
              </select>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Catatan Tambahan (Opsional)
              </label>
              <textarea
                rows={2}
                maxLength={300}
                placeholder="Nomor kontrak, bunga, tenor, atau info penting lainnya..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-emerald-500 leading-relaxed"
              />
            </div>
          </div>

          {/* Sticky Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 px-5 sm:px-6 py-3.5 border-t border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/90 dark:bg-zinc-950/90 backdrop-blur-xs shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isLoading || rawTotalAmount <= 0}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold active:scale-95 transition-all shadow-xs cursor-pointer disabled:opacity-50"
            >
              {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{initialData ? "Simpan Perubahan" : "Catat Tagihan"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
