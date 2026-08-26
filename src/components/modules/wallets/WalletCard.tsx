"use client";

import { useState } from "react";
import { Loader2, Pencil, Trash2 } from "lucide-react";
import { type Wallet } from "@/types/finance";
import { formatCurrency } from "@/lib/utils";
import { DynamicIcon } from "@/lib/icons";

interface WalletCardProps {
  wallet: Wallet;
  onEdit: (wallet: Wallet) => void;
  onDelete: (id: string) => Promise<void>;
}

const TYPE_LABELS: Record<Wallet["type"], string> = {
  bank: "Bank",
  ewallet: "E-Wallet",
  cash: "Kas Tunai",
};

export function WalletCard({ wallet, onEdit, onDelete }: WalletCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (confirm(`Yakin ingin menghapus dompet "${wallet.name}"?`)) {
      setIsDeleting(true);
      try {
        await onDelete(wallet.id);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  return (
    <div className="relative group p-5 rounded-2xl bg-zinc-900 border border-zinc-800/60 hover:border-zinc-700/80 transition-all duration-150 flex flex-col justify-between overflow-hidden">
      {/* Accent top color strip */}
      <div
        className="absolute top-0 left-0 right-0 h-1"
        style={{ backgroundColor: wallet.color || "#10b981" }}
      />

      {/* Top row: Icon, Name, Type badge, Actions */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{
              backgroundColor: `${wallet.color || "#10b981"}20`,
              color: wallet.color || "#10b981",
            }}
          >
            <DynamicIcon name={wallet.icon} className="w-5 h-5" strokeWidth={1.75} />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-zinc-100 truncate">
              {wallet.name}
            </h3>
            <span className="inline-block mt-0.5 text-[10px] font-medium px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400">
              {TYPE_LABELS[wallet.type]}
            </span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onEdit(wallet)}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 active:scale-[0.95] transition-all"
            title="Edit Dompet"
          >
            <Pencil className="w-4 h-4" strokeWidth={1.75} />
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 active:scale-[0.95] transition-all disabled:opacity-50"
            title="Hapus Dompet"
          >
            {isDeleting ? (
              <Loader2 className="w-4 h-4 animate-spin text-rose-400" strokeWidth={1.75} />
            ) : (
              <Trash2 className="w-4 h-4" strokeWidth={1.75} />
            )}
          </button>
        </div>
      </div>

      {/* Bottom row: Saldo */}
      <div className="mt-6 pt-4 border-t border-zinc-800/40">
        <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">
          Saldo Saat Ini
        </p>
        <p className="text-2xl font-bold tracking-tight text-zinc-50 tabular-nums mt-1">
          {formatCurrency(wallet.balance)}
        </p>
      </div>
    </div>
  );
}
