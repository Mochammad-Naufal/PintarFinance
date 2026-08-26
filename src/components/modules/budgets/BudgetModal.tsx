"use client";

import { useState } from "react";
import { Loader2, X } from "lucide-react";
import {
  type ActionResult,
  type Budget,
  type BudgetInput,
  type Category,
} from "@/types/finance";
import { formatCurrency } from "@/lib/utils";

interface BudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: BudgetInput) => Promise<ActionResult<Budget>>;
  categories: Category[];
  period: string;
  initialData?: Budget | null;
}

interface BudgetFormProps {
  onClose: () => void;
  onSave: (data: BudgetInput) => Promise<ActionResult<Budget>>;
  categories: Category[];
  period: string;
  initialData?: Budget | null;
}

function BudgetForm({
  onClose,
  onSave,
  categories,
  period,
  initialData,
}: BudgetFormProps) {
  const [categoryId, setCategoryId] = useState(
    initialData?.category_id ?? categories[0]?.id ?? ""
  );
  const [limitAmount, setLimitAmount] = useState(
    initialData ? String(initialData.limit_amount) : ""
  );
  const [selectedPeriod, setSelectedPeriod] = useState(
    initialData?.period ?? period
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const numLimit = Number(limitAmount);
    if (!numLimit || numLimit < 10000) {
      setError("Batas limit anggaran minimal Rp 10.000");
      return;
    }

    if (!categoryId) {
      setError("Silakan pilih kategori pengeluaran");
      return;
    }

    setIsLoading(true);

    try {
      const res = await onSave({
        category_id: categoryId,
        period: selectedPeriod,
        limit_amount: numLimit,
      });

      if (res.success) {
        onClose();
      } else {
        setError(res.error ?? "Gagal menyimpan batas anggaran");
      }
    } catch (err) {
      console.error(err);
      setError("Terjadi kesalahan teknis");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-600 dark:text-rose-400">
          {error}
        </div>
      )}

      {/* Category Selection */}
      <div>
        <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
          Kategori Pengeluaran
        </label>
        <select
          value={categoryId}
          disabled={!!initialData}
          onChange={(e) => setCategoryId(e.target.value)}
          className="w-full px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-emerald-500 disabled:opacity-60"
        >
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Limit Amount */}
      <div>
        <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
          Batas Limit Anggaran (IDR)
        </label>
        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-zinc-400 font-mono">
            Rp
          </span>
          <input
            type="number"
            min="10000"
            step="1000"
            required
            placeholder="0"
            value={limitAmount}
            onChange={(e) => setLimitAmount(e.target.value)}
            className="w-full pl-10 pr-3.5 py-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-base font-bold text-zinc-900 dark:text-zinc-100 font-mono tabular-nums placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500"
          />
        </div>
        {Number(limitAmount) > 0 && (
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 font-mono">
            = {formatCurrency(Number(limitAmount))}
          </p>
        )}
      </div>

      {/* Period Selection */}
      <div>
        <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
          Periode Bulan
        </label>
        <input
          type="month"
          required
          value={selectedPeriod}
          onChange={(e) => setSelectedPeriod(e.target.value)}
          className="w-full px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-emerald-500"
        />
      </div>

      {/* Footer Buttons */}
      <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-200 dark:border-zinc-800/60">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 rounded-lg text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 active:scale-[0.98] transition-all"
        >
          Batal
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-600 dark:bg-emerald-500 text-white hover:bg-emerald-500 dark:hover:bg-emerald-400 active:scale-[0.98] transition-all disabled:opacity-50"
        >
          {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          {initialData ? "Simpan Perubahan" : "Pasang Anggaran"}
        </button>
      </div>
    </form>
  );
}

export function BudgetModal({
  isOpen,
  onClose,
  onSave,
  categories,
  period,
  initialData,
}: BudgetModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 dark:bg-black/70 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md rounded-t-3xl sm:rounded-2xl bg-white dark:bg-zinc-900 border-t sm:border border-zinc-200 dark:border-zinc-800 p-5 sm:p-6 shadow-2xl space-y-4 sm:space-y-5 max-h-[85dvh] sm:max-h-[90vh] overflow-y-auto overscroll-contain pb-8 sm:pb-6">
        {/* Mobile grab handle */}
        <div className="w-10 h-1 bg-zinc-300 dark:bg-zinc-700 rounded-full mx-auto sm:hidden -mt-1 mb-2 shrink-0" />

        {/* Header */}
        <div className="flex items-center justify-between sticky top-0 bg-white dark:bg-zinc-900 z-10 pt-1 pb-1">
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            {initialData ? "Edit Batas Anggaran" : "Atur Anggaran Baru"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <BudgetForm
          key={initialData?.id ?? "new-budget"}
          initialData={initialData}
          onClose={onClose}
          onSave={onSave}
          categories={categories}
          period={period}
        />
      </div>
    </div>
  );
}
