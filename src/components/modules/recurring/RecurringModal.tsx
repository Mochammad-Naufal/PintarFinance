"use client";

import { useMemo, useState } from "react";
import {
  Calendar,
  CheckCircle2,
  Clock,
  Loader2,
  Repeat,
  Tag,
  Wallet as WalletIcon,
  X,
} from "lucide-react";
import {
  type ActionResult,
  type Category,
  type RecurringFrequency,
  type RecurringInput,
  type RecurringTransaction,
  type Wallet,
} from "@/types/finance";

interface RecurringModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    data: RecurringInput,
    id?: string
  ) => Promise<ActionResult<RecurringTransaction>>;
  wallets: Wallet[];
  categories: Category[];
  editingItem?: RecurringTransaction | null;
}

const FREQUENCY_OPTIONS: { value: RecurringFrequency; label: string }[] = [
  { value: "monthly", label: "Bulanan" },
  { value: "weekly", label: "Mingguan" },
  { value: "yearly", label: "Tahunan" },
  { value: "daily", label: "Harian" },
];

function RecurringModalForm({
  onClose,
  onSave,
  wallets,
  categories,
  editingItem,
}: {
  onClose: () => void;
  onSave: (
    data: RecurringInput,
    id?: string
  ) => Promise<ActionResult<RecurringTransaction>>;
  wallets: Wallet[];
  categories: Category[];
  editingItem?: RecurringTransaction | null;
}) {
  const todayStr = new Date().toISOString().slice(0, 10);

  const [description, setDescription] = useState(editingItem?.description || "");
  const [type, setType] = useState<"expense" | "income">(editingItem?.type || "expense");
  const [amount, setAmount] = useState(editingItem ? String(editingItem.amount) : "");
  const [frequency, setFrequency] = useState<RecurringFrequency>(editingItem?.frequency || "monthly");
  const [startDate, setStartDate] = useState(editingItem?.start_date || todayStr);
  const [walletId, setWalletId] = useState(editingItem?.wallet_id || wallets[0]?.id || "");
  const [categoryId, setCategoryId] = useState(editingItem?.category_id || "");
  const [autoCreate, setAutoCreate] = useState(editingItem?.auto_create || false);
  const [isActive, setIsActive] = useState(editingItem?.is_active ?? true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filteredCategories = useMemo<Category[]>(() => {
    const filtered = categories.filter((c: Category) => c.type === type);
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
  }, [categories, type]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsedAmount = parseInt(amount.replace(/\D/g, ""), 10);
    if (isNaN(parsedAmount) || parsedAmount < 100) {
      setError("Nominal tagihan minimal Rp 100");
      return;
    }

    if (!walletId) {
      setError("Pilih dompet pembayaran");
      return;
    }

    setIsLoading(true);

    try {
      const payload: RecurringInput = {
        description: description.trim(),
        type,
        amount: parsedAmount,
        frequency,
        start_date: startDate,
        wallet_id: walletId,
        category_id: categoryId ? categoryId : null,
        auto_create: autoCreate,
        is_active: isActive,
      };

      const res = await onSave(payload, editingItem?.id);
      if (res.success) {
        onClose();
      } else {
        setError(res.error ?? "Gagal menyimpan jadwal transaksi.");
      }
    } catch (err) {
      console.error(err);
      setError("Terjadi kesalahan teknis.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-lg rounded-t-3xl sm:rounded-2xl bg-white dark:bg-zinc-900 border-t sm:border border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col max-h-[90dvh] sm:max-h-[92dvh] overflow-hidden">
      {/* Mobile grab handle */}
      <div className="w-10 h-1 bg-zinc-300 dark:bg-zinc-700 rounded-full mx-auto sm:hidden mt-3 mb-1 shrink-0" />

      {/* Header (Pinned) */}
      <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 border-b border-zinc-100 dark:border-zinc-800/80 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-purple-500/15 flex items-center justify-center text-purple-600 dark:text-purple-400">
            <Repeat className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 leading-none">
              {editingItem ? "Edit Tagihan / Langganan" : "Tambah Transaksi Berulang"}
            </h2>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
              Jadwalkan pengeluaran rutin atau pemasukan berkala otomatis
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Body (Scrollable) */}
      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 overscroll-contain">
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-600 dark:text-rose-400">
            {error}
          </div>
        )}

        {/* Type Selector (Expense vs Income) */}
        <div>
          <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
            Tipe Transaksi
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setType("expense")}
              className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                type === "expense"
                  ? "bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400 shadow-xs"
                  : "bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400"
              }`}
            >
              Pengeluaran Rutin (Tagihan)
            </button>
            <button
              type="button"
              onClick={() => setType("income")}
              className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                type === "income"
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 shadow-xs"
                  : "bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400"
              }`}
            >
              Pemasukan Rutin (Gaji)
            </button>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
            Nama Langganan / Tagihan
          </label>
          <input
            type="text"
            required
            placeholder="Contoh: Netflix Premium, IndiHome, Kos Bulanan, Gaji Kantor"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Amount & Frequency Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              Nominal (IDR)
            </label>
            <input
              type="text"
              required
              placeholder="150000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 font-mono font-bold focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-zinc-400" />
              <span>Frekuensi Tagihan</span>
            </label>
            <select
              value={frequency}
              onChange={(e) => setFrequency(e.target.value as RecurringFrequency)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-emerald-500 font-medium"
            >
              {FREQUENCY_OPTIONS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Start Date */}
        <div>
          <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-zinc-400" />
            <span>Tanggal Jatuh Tempo / Mulai</span>
          </label>
          <input
            type="date"
            required
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-emerald-500 font-mono"
          />
        </div>

        {/* Wallet & Category Selection */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5 flex items-center gap-1">
              <WalletIcon className="w-3.5 h-3.5 text-zinc-400" />
              <span>Dompet Pembayaran</span>
            </label>
            <select
              required
              value={walletId}
              onChange={(e) => setWalletId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-emerald-500"
            >
              <option value="">Pilih Dompet</option>
              {wallets.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5 flex items-center gap-1">
              <Tag className="w-3.5 h-3.5 text-zinc-400" />
              <span>Kategori</span>
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-emerald-500"
            >
              <option value="">Tanpa Kategori</option>
              {filteredCategories.map((c: Category) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Auto Create Switch */}
        <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
              Otomatis Catat ke Buku Kas (*Auto-Debit*)
            </p>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
              Sistem otomatis memotong saldo dompet saat tanggal jatuh tempo tiba
            </p>
          </div>
          <input
            type="checkbox"
            checked={autoCreate}
            onChange={(e) => setAutoCreate(e.target.checked)}
            className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 accent-emerald-600"
          />
        </div>

        {/* Active Switch (for edit mode) */}
        {editingItem && (
          <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                Status Jadwal Aktif
              </p>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                Nonaktifkan untuk menjeda pengingat tagihan sementara
              </p>
            </div>
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 accent-emerald-600"
            />
          </div>
        )}
      </form>

      {/* Sticky Footer */}
      <div className="flex items-center justify-end gap-2 px-5 sm:px-6 py-3.5 border-t border-zinc-200 dark:border-zinc-800/80 bg-zinc-50/90 dark:bg-zinc-900/90 backdrop-blur-xs shrink-0">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 active:scale-[0.98] transition-all"
        >
          Batal
        </button>
        <button
          type="button"
          disabled={isLoading}
          onClick={handleSubmit}
          className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 dark:bg-emerald-500 text-white hover:bg-emerald-500 dark:hover:bg-emerald-400 active:scale-[0.98] transition-all disabled:opacity-50 shadow-xs"
        >
          {isLoading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <CheckCircle2 className="w-3.5 h-3.5" />
          )}
          <span>{editingItem ? "Simpan Perubahan" : "Buat Jadwal"}</span>
        </button>
      </div>
    </div>
  );
}

export function RecurringModal(props: RecurringModalProps) {
  if (!props.isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-100 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) props.onClose();
      }}
    >
      <RecurringModalForm
        key={props.editingItem ? props.editingItem.id : "new"}
        onClose={props.onClose}
        onSave={props.onSave}
        wallets={props.wallets}
        categories={props.categories}
        editingItem={props.editingItem}
      />
    </div>
  );
}
