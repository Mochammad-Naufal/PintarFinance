"use client";

import { useState } from "react";
import { Loader2, X } from "lucide-react";
import { type ActionResult, type Wallet, type WalletInput, type WalletType } from "@/types/finance";
import { DynamicIcon } from "@/lib/icons";

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: WalletInput) => Promise<ActionResult<Wallet>>;
  initialData?: Wallet | null;
}

const COLOR_PRESETS = [
  "#0060af", // BCA Blue
  "#00aed6", // GoPay Cyan
  "#10b981", // Emerald
  "#f59e0b", // Amber
  "#8b5cf6", // Purple
  "#ec4899", // Pink
  "#ef4444", // Red
  "#64748b", // Slate
];

const ICON_PRESETS = [
  "landmark",
  "smartphone",
  "banknote",
  "credit-card",
  "wallet",
  "building",
  "coins",
];

interface WalletFormProps {
  initialData?: Wallet | null;
  onClose: () => void;
  onSave: (data: WalletInput) => Promise<ActionResult<Wallet>>;
}

function WalletForm({ initialData, onClose, onSave }: WalletFormProps) {
  const [name, setName] = useState(initialData?.name ?? "");
  const [type, setType] = useState<WalletType>(initialData?.type ?? "bank");
  const [balance, setBalance] = useState(initialData ? String(initialData.balance) : "0");
  const [color, setColor] = useState(initialData?.color ?? "#0060af");
  const [icon, setIcon] = useState(initialData?.icon ?? "landmark");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await onSave({
        name,
        type,
        balance: Number(balance) || 0,
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
            Nama Dompet / Rekening
          </label>
          <input
            type="text"
            required
            placeholder="e.g. BCA Utama, GoPay, Dompet Tunai"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
            Tipe Dompet
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(["bank", "ewallet", "cash"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`py-2 px-3 rounded-lg text-xs font-medium border transition-all ${
                  type === t
                    ? "bg-zinc-100 dark:bg-zinc-800 border-emerald-500 text-zinc-900 dark:text-zinc-100 font-semibold"
                    : "bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
                }`}
              >
                {t === "bank" ? "Bank" : t === "ewallet" ? "E-Wallet" : "Kas Tunai"}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
            Saldo Saat Ini (IDR)
          </label>
          <input
            type="number"
            min="0"
            required
            value={balance}
            onChange={(e) => setBalance(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 font-mono tabular-nums placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Color Presets */}
        <div>
          <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
            Warna Identitas
          </label>
          <div className="flex items-center gap-2 flex-wrap">
            {COLOR_PRESETS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`w-7 h-7 rounded-full transition-all ${
                  color === c
                    ? "ring-2 ring-emerald-500 ring-offset-2 ring-offset-white dark:ring-offset-zinc-900 scale-110"
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
            Ikon Dompet
          </label>
          <div className="flex items-center gap-2 flex-wrap">
            {ICON_PRESETS.map((ic) => (
              <button
                key={ic}
                type="button"
                onClick={() => setIcon(ic)}
                className={`w-9 h-9 rounded-lg flex items-center justify-center border transition-all ${
                  icon === ic
                    ? "bg-zinc-100 dark:bg-zinc-800 border-emerald-500 text-emerald-600 dark:text-emerald-400 font-semibold"
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
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-emerald-600 dark:bg-emerald-500 text-white hover:bg-emerald-500 dark:hover:bg-emerald-400 active:scale-[0.98] transition-all disabled:opacity-50 shadow-xs"
        >
          {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          {initialData ? "Simpan Perubahan" : "Buat Dompet"}
        </button>
      </div>
    </form>
  );
}

export function WalletModal({
  isOpen,
  onClose,
  onSave,
  initialData,
}: WalletModalProps) {
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
            {initialData ? "Edit Dompet" : "Tambah Dompet Baru"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form keyed by initialData ID for clean state reset */}
        <WalletForm
          key={initialData?.id ?? "new-wallet"}
          initialData={initialData}
          onClose={onClose}
          onSave={onSave}
        />
      </div>
    </div>
  );
}
