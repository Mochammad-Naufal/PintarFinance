"use client";

import { useEffect, useState } from "react";
import { Loader2, X } from "lucide-react";
import {
  type ActionResult,
  type SavingsGoal,
  type SavingsGoalInput,
} from "@/types/finance";
import { formatCurrency } from "@/lib/utils";
import { DynamicIcon } from "@/lib/icons";
import { useCurrencyInput } from "@/lib/useCurrencyInput";

interface SavingsGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: SavingsGoalInput) => Promise<ActionResult<SavingsGoal>>;
  initialData?: SavingsGoal | null;
}

const COLOR_PRESETS = [
  "#3b82f6", // Blue
  "#10b981", // Emerald
  "#f59e0b", // Amber
  "#8b5cf6", // Purple
  "#ec4899", // Pink
  "#06b6d4", // Cyan
  "#f97316", // Orange
  "#64748b", // Slate
];

const ICON_PRESETS = [
  "target",
  "car",
  "plane",
  "home",
  "graduation-cap",
  "ring",
  "gem",
  "laptop",
  "gift",
  "shield-check",
];

interface SavingsGoalFormProps {
  initialData?: SavingsGoal | null;
  onClose: () => void;
  onSave: (data: SavingsGoalInput) => Promise<ActionResult<SavingsGoal>>;
}

function SavingsGoalForm({
  initialData,
  onClose,
  onSave,
}: SavingsGoalFormProps) {
  const [name, setName] = useState(initialData?.name ?? "");
  const {
    displayValue: targetAmount,
    rawValue: rawTargetAmount,
    onChange: onTargetChange,
    onBlur: onTargetBlur,
    setValue: setTargetValue,
  } = useCurrencyInput(initialData?.target_amount ?? 0);
  const {
    displayValue: currentAmount,
    rawValue: rawCurrentAmount,
    onChange: onCurrentChange,
    onBlur: onCurrentBlur,
    setValue: setCurrentValue,
  } = useCurrencyInput(initialData?.current_amount ?? 0);

  useEffect(() => {
    if (initialData?.target_amount) setTargetValue(initialData.target_amount);
    if (initialData?.current_amount !== undefined) setCurrentValue(initialData.current_amount);
  }, [initialData?.target_amount, initialData?.current_amount, setTargetValue, setCurrentValue]);

  const [targetDate, setTargetDate] = useState(
    initialData?.target_date ? initialData.target_date.slice(0, 10) : ""
  );
  const [color, setColor] = useState(initialData?.color ?? "#3b82f6");
  const [icon, setIcon] = useState(initialData?.icon ?? "target");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await onSave({
        name,
        target_amount: rawTargetAmount || 0,
        current_amount: rawCurrentAmount || 0,
        target_date: targetDate || null,
        color,
        icon,
      });

      if (res.success) {
        onClose();
      } else {
        setError(res.error ?? "Terjadi kesalahan saat menyimpan data");
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

        <div>
          <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
            Nama Target Impian
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Dana Darurat, Beli Rumah, Liburan Jepang"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
            Target Nominal yang Ingin Dicapai (IDR)
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
              value={targetAmount}
              onChange={onTargetChange}
              onBlur={onTargetBlur}
              className="w-full pl-10 pr-3.5 py-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-base font-bold text-zinc-900 dark:text-zinc-100 font-mono tabular-nums placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:border-blue-500"
            />
          </div>
          {rawTargetAmount > 0 && (
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 font-mono">
              = {formatCurrency(rawTargetAmount)}
            </p>
          )}
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
            Dana Terkumpul Saat Ini (IDR)
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-zinc-400 font-mono">
              Rp
            </span>
            <input
              type="text"
              inputMode="numeric"
              value={currentAmount}
              onChange={onCurrentChange}
              onBlur={onCurrentBlur}
              className="w-full pl-10 pr-3.5 py-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-sm font-bold text-zinc-900 dark:text-zinc-100 font-mono tabular-nums focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
            Target Tenggat Waktu (Opsional)
          </label>
          <input
            type="date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Color Presets */}
        <div>
          <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
            Warna Tema
          </label>
          <div className="flex items-center gap-2 flex-wrap">
            {COLOR_PRESETS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`w-7 h-7 rounded-full transition-all ${
                  color === c
                    ? "ring-2 ring-blue-500 ring-offset-2 ring-offset-white dark:ring-offset-zinc-900 scale-110"
                    : "opacity-80 hover:opacity-100"
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        {/* Icon Presets */}
        <div>
          <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
            Ikon Impian
          </label>
          <div className="flex items-center gap-2 flex-wrap">
            {ICON_PRESETS.map((ic) => (
              <button
                key={ic}
                type="button"
                onClick={() => setIcon(ic)}
                className={`w-9 h-9 rounded-lg flex items-center justify-center border transition-all ${
                  icon === ic
                    ? "bg-zinc-100 dark:bg-zinc-800 border-blue-500 text-blue-600 dark:text-blue-400 font-semibold"
                    : "bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
                }`}
              >
                <DynamicIcon name={ic} className="w-4 h-4" strokeWidth={1.75} />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Pinned Sticky Footer buttons */}
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
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-blue-600 text-white hover:bg-blue-500 active:scale-[0.98] transition-all disabled:opacity-50 shadow-xs"
        >
          {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          {initialData ? "Simpan Perubahan" : "Buat Pos Impian"}
        </button>
      </div>
    </form>
  );
}

export function SavingsGoalModal({
  isOpen,
  onClose,
  onSave,
  initialData,
}: SavingsGoalModalProps) {
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
            {initialData ? "Edit Pos Impian" : "Tambah Pos Impian Baru"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <SavingsGoalForm
          key={initialData?.id ?? "new-goal"}
          initialData={initialData}
          onClose={onClose}
          onSave={onSave}
        />
      </div>
    </div>
  );
}
