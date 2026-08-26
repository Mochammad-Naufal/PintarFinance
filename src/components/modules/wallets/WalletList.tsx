"use client";

import { useState } from "react";
import { Plus, Wallet as WalletIcon } from "lucide-react";
import { type Wallet, type WalletInput } from "@/types/finance";
import { WalletCard } from "./WalletCard";
import { WalletModal } from "./WalletModal";
import { createWallet, deleteWallet, updateWallet } from "@/actions/wallets";
import { formatCurrency } from "@/lib/utils";

interface WalletListProps {
  initialWallets: Wallet[];
}

export function WalletList({ initialWallets }: WalletListProps) {
  const [wallets, setWallets] = useState<Wallet[]>(initialWallets);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWallet, setEditingWallet] = useState<Wallet | null>(null);

  const totalBalance = wallets.reduce((acc, w) => acc + w.balance, 0);

  const handleOpenAdd = () => {
    setEditingWallet(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (wallet: Wallet) => {
    setEditingWallet(wallet);
    setIsModalOpen(true);
  };

  const handleSave = async (data: WalletInput) => {
    if (editingWallet) {
      const res = await updateWallet(editingWallet.id, data);
      if (res.success && res.data) {
        setWallets((prev) =>
          prev.map((w) => (w.id === editingWallet.id ? res.data! : w))
        );
      }
      return res;
    } else {
      const res = await createWallet(data);
      if (res.success && res.data) {
        setWallets((prev) => [...prev, res.data!]);
      }
      return res;
    }
  };

  const handleDelete = async (id: string) => {
    const res = await deleteWallet(id);
    if (res.success) {
      setWallets((prev) => prev.filter((w) => w.id !== id));
    } else {
      alert(res.error ?? "Gagal menghapus dompet");
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Banner & Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/80 shadow-xs">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Total Likuiditas Tergabung
          </p>
          <p className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white font-mono tabular-nums mt-1">
            {formatCurrency(totalBalance)}
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Tersebar di {wallets.length} rekening & dompet aktif
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 dark:bg-emerald-500 text-white font-medium text-sm hover:bg-emerald-500 dark:hover:bg-emerald-400 active:scale-[0.98] transition-all shadow-xs"
        >
          <Plus className="w-4 h-4" strokeWidth={2} />
          Tambah Dompet
        </button>
      </div>

      {/* Wallets Grid */}
      {wallets.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 rounded-2xl bg-white dark:bg-zinc-900/40 border border-dashed border-zinc-300 dark:border-zinc-800 text-center space-y-3 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800/50 flex items-center justify-center text-zinc-500">
            <WalletIcon className="w-6 h-6" strokeWidth={1.5} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-200">
              Belum Ada Dompet
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-xs">
              Tambahkan rekening bank, e-wallet, atau kas fisik untuk mulai mencatat keuanganmu.
            </p>
          </div>
          <button
            onClick={handleOpenAdd}
            className="mt-2 px-4 py-2 rounded-lg bg-emerald-600 dark:bg-emerald-500 text-white text-xs font-semibold hover:bg-emerald-500 dark:hover:bg-emerald-400 active:scale-[0.98] transition-all shadow-xs"
          >
            Tambah Dompet Sekarang
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {wallets.map((wallet) => (
            <WalletCard
              key={wallet.id}
              wallet={wallet}
              onEdit={handleOpenEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      <WalletModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        initialData={editingWallet}
      />
    </div>
  );
}
