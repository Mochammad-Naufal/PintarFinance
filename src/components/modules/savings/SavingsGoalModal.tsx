"use client";

import { useState } from "react";
import { Loader2, X } from "lucide-react";
import {
  type ActionResult,
  type SavingsGoal,
  type SavingsGoalInput,
} from "@/types/finance";
import { DynamicIcon } from "@/lib/icons";

interface SavingsGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: SavingsGoalInput) => Promise<ActionResult<SavingsGoal>>;
  initialData?: SavingsGoal | null;
}

const COLOR_PRESETS = [
  "#10b981", // Emerald
  "#3b82f6", // Blue
  "#ec4899", // Pink
  "#f59e0b", // Amber
  "#8b5cf6", // Purple
  "#06b6d4", // Cyan
  "#ef4444", // Red
  "#64748b", // Slate
];

const ICON_PRESETS = [
  "shield-check",
  "bike",
  "heart",
  "car",
  "plane",
  "home",
  "laptop",
  "target",
  "piggy-bank",
  "graduation-cap",
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
  const [targetAmount, setTargetAmount] = useState(
    initialData ? String(initialData.target_amount) : "0"
  );
  const [currentAmount, setCurrentAmount] = useState(
    initialData ? String(initialData.current_amount) : "0"
  );
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
        target_amount: Number(targetAmount) || 0,
        current_amount: Number(currentAmount) || 0,
        target_date: targetDate ? targetDate : null,
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
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-600 dark:text-rose-400">
          {error}
        </div>
      )}

      <div>
        <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
          Nama Impian / Target Tabungan
        </label>
        <input
          type="text"
          required
          placeholder="e.g. Dana Darurat, Beli Motor, Liburan Jepang"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-3.5 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:border-blue-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
            Target Dana (IDR)
          </label>
          <input
            type="number"
            min="1000"
            required
            value={targetAmount}
            onChange={(e) => setTargetAmount(e.target.value)}
            className="w-full px-3.5 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 font-mono tabular-nums placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
            Dana Terkumpul (IDR)
          </label>
          <input
            type="number"
            min="0"
            required
            value={currentAmount}
            onChange={(e) => setCurrentAmount(e.target.value)}
            className="w-full px-3.5 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 font-mono tabular-nums placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
          Tenggat Waktu Pencapaian (Opsional)
        </label>
        <input
          type="date"
          value={targetDate}
          onChange={(e) => setTargetDate(e.target.value)}
          className="w-full px-3.5 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:border-blue-500"
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

      {/* Footer buttons */}
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
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-500 active:scale-[0.98] transition-all disabled:opacity-50"
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 dark:bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            {initialData ? "Edit Pos Impian" : "Tambah Pos Impian Baru"}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
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
