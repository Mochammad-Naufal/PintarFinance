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
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400">
          {error}
        </div>
      )}

      <div>
        <label className="block text-xs font-medium text-zinc-400 mb-1.5">
          Nama Dompet / Rekening
        </label>
        <input
          type="text"
          required
          placeholder="e.g. BCA Utama, GoPay, Dompet Tunai"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-3.5 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-zinc-400 mb-1.5">
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
                  ? "bg-zinc-800 border-emerald-500 text-zinc-100"
                  : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {t === "bank" ? "Bank" : t === "ewallet" ? "E-Wallet" : "Kas Tunai"}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-zinc-400 mb-1.5">
          Saldo Saat Ini (IDR)
        </label>
        <input
          type="number"
          min="0"
          required
          value={balance}
          onChange={(e) => setBalance(e.target.value)}
          className="w-full px-3.5 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-sm text-zinc-100 tabular-nums placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500"
        />
      </div>

      {/* Color Presets */}
      <div>
        <label className="block text-xs font-medium text-zinc-400 mb-1.5">
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
                  ? "ring-2 ring-white ring-offset-2 ring-offset-zinc-900 scale-110"
                  : "opacity-80 hover:opacity-100"
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>

      {/* Icon Presets */}
      <div>
        <label className="block text-xs font-medium text-zinc-400 mb-1.5">
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
                  ? "bg-zinc-800 border-emerald-500 text-emerald-400"
                  : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <DynamicIcon name={ic} className="w-4 h-4" strokeWidth={1.75} />
            </button>
          ))}
        </div>
      </div>

      {/* Footer buttons */}
      <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800/60">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 rounded-lg text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 active:scale-[0.98] transition-all"
        >
          Batal
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-500 text-white hover:bg-emerald-400 active:scale-[0.98] transition-all disabled:opacity-50"
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-md rounded-2xl bg-zinc-900 border border-zinc-800 p-6 shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-zinc-100">
            {initialData ? "Edit Dompet" : "Tambah Dompet Baru"}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
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
