"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, X } from "lucide-react";
import {
  type ActionResult,
  type Budget,
  type BudgetInput,
  type Category,
} from "@/types/finance";
import { formatCurrency } from "@/lib/utils";
import { DynamicIcon } from "@/lib/icons";
import { useCurrencyInput } from "@/lib/useCurrencyInput";

interface BudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: BudgetInput) => Promise<ActionResult<Budget>>;
  categories: Category[];
  period: string;
  initialData?: Budget | null;
}

interface BudgetFormProps {
  initialData?: Budget | null;
  onClose: () => void;
  onSave: (data: BudgetInput) => Promise<ActionResult<Budget>>;
  categories: Category[];
  period: string;
}

function BudgetForm({
  initialData,
  onClose,
  onSave,
  categories,
  period,
}: BudgetFormProps) {
  const [categoryId, setCategoryId] = useState(
    initialData?.category_id ?? categories[0]?.id ?? ""
  );
  const {
    displayValue: limitAmount,
    rawValue: rawLimitAmount,
    onChange: onLimitChange,
    onBlur: onLimitBlur,
    setValue: setLimitValue,
  } = useCurrencyInput(initialData?.limit_amount ?? 0);

  // Keep hook in sync when initialData changes (e.g. editing)
  useEffect(() => {
    if (initialData?.limit_amount) setLimitValue(initialData.limit_amount);
  }, [initialData?.limit_amount, setLimitValue]);

  const [selectedPeriod, setSelectedPeriod] = useState(
    initialData?.period ?? period
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const expenseCategories = useMemo<Category[]>(() => {
    const filtered = categories.filter((c: Category) => c.type === "expense");
    const seen = new Set<string>();
    const result: Category[] = [];
    for (const c of filtered) {
      const key = `${c.type}-${c.name.trim().toLowerCase()}`;
      if (!seen.has(key) && !seen.has(c.id)) {
        seen.add(key);
        seen.add(c.id);
        result.push(c);
      }
    }
    return result;
  }, [categories]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!rawLimitAmount || rawLimitAmount < 10000) {
      setError("Batas limit anggaran minimal Rp 10.000");
      return;
    }

    if (!categoryId) {
      setError("Pilih kategori pengeluaran");
      return;
    }

    setIsLoading(true);

    try {
      const res = await onSave({
        category_id: categoryId,
        period: selectedPeriod,
        limit_amount: rawLimitAmount,
      });

      if (res.success) {
        onClose();
      } else {
        setError(res.error ?? "Gagal menyimpan anggaran");
      }
    } catch (err) {
      console.error(err);
      setError("Terjadi kesalahan teknis");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col flex-1 min-h-0 overflow-hidden"
    >
      {/* Scrollable Body */}
      <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 overscroll-contain">
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
          <div className="grid grid-cols-2 gap-2">
            {expenseCategories.map((c) => {
              const isSelected = categoryId === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCategoryId(c.id)}
                  className={`flex items-center gap-2 p-2.5 rounded-xl border text-left text-xs transition-all ${
                    isSelected
                      ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-100 font-semibold"
                      : "border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-700"
                  }`}
                >
                  <div
                    className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                    style={{
                      backgroundColor: `${c.color}15`,
                      color: c.color,
                    }}
                  >
                    <DynamicIcon name={c.icon} className="w-3.5 h-3.5" />
                  </div>
                  <span className="truncate">{c.name}</span>
                </button>
              );
            })}
          </div>
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
              type="text"
              inputMode="numeric"
              required
              placeholder="0"
              value={limitAmount}
              onChange={onLimitChange}
              onBlur={onLimitBlur}
              className="w-full pl-10 pr-3.5 py-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-base font-bold text-zinc-900 dark:text-zinc-100 font-mono tabular-nums placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500"
            />
          </div>
          {rawLimitAmount > 0 && (
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 font-mono">
              = {formatCurrency(rawLimitAmount)}
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
            className="w-full px-3 py-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Pinned Sticky Footer Buttons */}
      <div className="flex items-center justify-end gap-2 px-5 sm:px-6 py-3.5 sm:py-4 border-t border-zinc-200 dark:border-zinc-800/80 bg-zinc-50/90 dark:bg-zinc-900/90 backdrop-blur-xs shrink-0">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2.5 rounded-xl text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 active:scale-[0.98] transition-all"
        >
          Batal
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-emerald-600 dark:bg-emerald-500 text-white hover:bg-emerald-500 dark:hover:bg-emerald-400 active:scale-[0.98] transition-all disabled:opacity-50 shadow-xs"
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
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md rounded-t-3xl sm:rounded-2xl bg-white dark:bg-zinc-900 border-t sm:border border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col max-h-[85dvh] sm:max-h-[90dvh] overflow-hidden">
        {/* Mobile grab handle */}
        <div className="w-10 h-1 bg-zinc-300 dark:bg-zinc-700 rounded-full mx-auto sm:hidden mt-3 mb-1 shrink-0" />

        {/* Header (Pinned) */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-3 border-b border-zinc-100 dark:border-zinc-800/80 shrink-0">
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
