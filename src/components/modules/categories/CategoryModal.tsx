"use client";

import { useEffect, useState } from "react";
import { Loader2, X } from "lucide-react";
import {
  type ActionResult,
  type Category,
  type CategoryInput,
  type CategoryType,
} from "@/types/finance";
import { DynamicIcon } from "@/lib/icons";

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CategoryInput) => Promise<ActionResult<Category>>;
  initialData?: Category | null;
  defaultType?: CategoryType;
}

const COLOR_PRESETS = [
  "#10b981", // Emerald
  "#059669", // Deep Emerald
  "#0ea5e9", // Sky
  "#3b82f6", // Blue
  "#6366f1", // Indigo
  "#8b5cf6", // Purple
  "#a855f7", // Purple Accent
  "#ec4899", // Pink
  "#e11d48", // Rose
  "#ef4444", // Red
  "#f97316", // Orange
  "#f59e0b", // Amber
  "#14b8a6", // Teal
  "#64748b", // Slate
];

const ICON_PRESETS = [
  "utensils",
  "receipt",
  "shopping-bag",
  "shopping-basket",
  "car",
  "bus",
  "bike",
  "plane",
  "heart-pulse",
  "graduation-cap",
  "film",
  "credit-card",
  "briefcase",
  "building",
  "trending-up",
  "gift",
  "coins",
  "wallet",
  "piggy-bank",
  "tag",
  "coffee",
  "tv",
  "shirt",
  "music",
  "book-open",
  "award",
  "zap",
  "circle-dollar-sign",
  "more-horizontal",
];

export function CategoryModal({
  isOpen,
  onClose,
  onSave,
  initialData,
  defaultType = "expense",
}: CategoryModalProps) {
  const [name, setName] = useState(initialData?.name ?? "");
  const [type, setType] = useState<CategoryType>(
    initialData?.type ?? defaultType
  );
  const [color, setColor] = useState(
    initialData?.color ?? (type === "expense" ? "#f97316" : "#10b981")
  );
  const [icon, setIcon] = useState(
    initialData?.icon ?? (type === "expense" ? "shopping-bag" : "briefcase")
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setType(initialData.type);
      setColor(initialData.color);
      setIcon(initialData.icon);
    } else {
      setName("");
      setType(defaultType);
      setColor(defaultType === "expense" ? "#f97316" : "#10b981");
      setIcon(defaultType === "expense" ? "shopping-bag" : "briefcase");
    }
    setError(null);
  }, [initialData, defaultType, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Nama kategori wajib diisi");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await onSave({
        name: name.trim(),
        type,
        color,
        icon,
      });

      if (res.success) {
        onClose();
      } else {
        setError(res.error ?? "Gagal menyimpan kategori");
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
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-xs"
              style={{ backgroundColor: color }}
            >
              <DynamicIcon name={icon} className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100 leading-tight">
                {initialData ? "Edit Kategori" : "Tambah Kategori Baru"}
              </h2>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                {type === "expense" ? "Pos Pengeluaran" : "Pos Pemasukan"}
              </p>
            </div>
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
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4.5 overscroll-contain">
            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-600 dark:text-rose-400">
                {error}
              </div>
            )}

            {/* Type Selector (only if creating new) */}
            {!initialData && (
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Tipe Transaksi
                </label>
                <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
                  <button
                    type="button"
                    onClick={() => {
                      setType("expense");
                      setColor("#f97316");
                      setIcon("shopping-bag");
                    }}
                    className={`py-2 rounded-lg text-xs font-semibold transition-all ${
                      type === "expense"
                        ? "bg-white dark:bg-zinc-800 text-rose-600 dark:text-rose-400 shadow-xs"
                        : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800"
                    }`}
                  >
                    💸 Pengeluaran (Expense)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setType("income");
                      setColor("#10b981");
                      setIcon("briefcase");
                    }}
                    className={`py-2 rounded-lg text-xs font-semibold transition-all ${
                      type === "income"
                        ? "bg-white dark:bg-zinc-800 text-emerald-600 dark:text-emerald-400 shadow-xs"
                        : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800"
                    }`}
                  >
                    💰 Pemasukan (Income)
                  </button>
                </div>
              </div>
            )}

            {/* Category Name */}
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                Nama Kategori
              </label>
              <input
                type="text"
                required
                maxLength={100}
                placeholder="Contoh: Skincare, Kopi Harian, Freelance..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Color Presets */}
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                Warna Aksen Kategori
              </label>
              <div className="flex items-center gap-2 flex-wrap pt-0.5">
                {COLOR_PRESETS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`w-7 h-7 rounded-full transition-all ${
                      color === c
                        ? "ring-2 ring-emerald-500 ring-offset-2 ring-offset-white dark:ring-offset-zinc-900 scale-110 shadow-xs"
                        : "opacity-80 hover:opacity-100 hover:scale-105"
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            {/* Icon Presets */}
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                Pilih Ikon Representatif
              </label>
              <div className="grid grid-cols-7 gap-2 p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800 max-h-40 overflow-y-auto">
                {ICON_PRESETS.map((ic) => (
                  <button
                    key={ic}
                    type="button"
                    onClick={() => setIcon(ic)}
                    className={`p-2 rounded-lg flex items-center justify-center transition-all ${
                      icon === ic
                        ? "bg-emerald-500 text-white shadow-xs scale-105"
                        : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100"
                    }`}
                    title={ic}
                  >
                    <DynamicIcon name={ic} className="w-4 h-4" />
                  </button>
                ))}
              </div>
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
              disabled={isLoading || !name.trim()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold disabled:opacity-50 active:scale-95 transition-all shadow-xs cursor-pointer"
            >
              {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{initialData ? "Simpan Perubahan" : "Buat Kategori"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
