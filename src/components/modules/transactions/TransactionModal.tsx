"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, X } from "lucide-react";
import {
  type ActionResult,
  type Category,
  type SavingsGoal,
  type Transaction,
  type TransactionInput,
  type TransactionType,
  type Wallet,
} from "@/types/finance";
import { formatCurrency } from "@/lib/utils";
import { useCurrencyInput } from "@/lib/useCurrencyInput";


interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: TransactionInput) => Promise<ActionResult<Transaction>>;
  wallets: Wallet[];
  categories: Category[];
  savingsGoals: SavingsGoal[];
}

interface TransactionFormProps {
  onClose: () => void;
  onSave: (data: TransactionInput) => Promise<ActionResult<Transaction>>;
  wallets: Wallet[];
  categories: Category[];
  savingsGoals: SavingsGoal[];
}

function TransactionForm({
  onClose,
  onSave,
  wallets,
  categories,
  savingsGoals,
}: TransactionFormProps) {
  const [type, setType] = useState<TransactionType>("expense");
  const { displayValue: amount, rawValue: rawAmount, onChange: onAmountChange, onBlur: onAmountBlur } = useCurrencyInput(0);
  const [walletId, setWalletId] = useState(wallets[0]?.id ?? "");
  const [destinationWalletId, setDestinationWalletId] = useState(
    wallets[1]?.id ?? wallets[0]?.id ?? ""
  );

  // Filter and deduplicate categories based on selected transaction type
  const availableCategories = useMemo(() => {
    const filtered = categories.filter((c) => c.type === type);
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

  const [categoryId, setCategoryId] = useState(
    () => categories.find((c) => c.type === "expense")?.id ?? ""
  );
  const [savingsGoalId, setSavingsGoalId] = useState(savingsGoals[0]?.id ?? "");
  const [adminFee, setAdminFee] = useState("0");
  const [transactionDate, setTransactionDate] = useState(() => {
    const now = new Date();
    return new Date(now.getTime() - now.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
  });
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Keep categoryId in sync with availableCategories
  useEffect(() => {
    if (type === "expense" || type === "income") {
      const exists = availableCategories.some((c) => c.id === categoryId);
      if (!exists && availableCategories.length > 0) {
        setCategoryId(availableCategories[0].id);
      }
    }
  }, [type, availableCategories, categoryId]);

  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    setError(null);
    if (newType === "expense" || newType === "income") {
      const match = categories.find((c) => c.type === newType);
      if (match) setCategoryId(match.id);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const numAmount = rawAmount;
    if (!numAmount || numAmount <= 0) {
      setError("Nominal transaksi harus lebih dari 0");
      return;
    }

    if (!walletId) {
      setError("Silakan pilih dompet");
      return;
    }

    if (type === "transfer" && walletId === destinationWalletId) {
      setError("Dompet sumber dan tujuan transfer tidak boleh sama");
      return;
    }

    setIsLoading(true);

    try {
      const payload: TransactionInput = {
        type,
        wallet_id: walletId,
        destination_wallet_id: type === "transfer" ? destinationWalletId : null,
        category_id: type === "expense" || type === "income" ? categoryId : null,
        savings_goal_id: type === "saving" ? savingsGoalId : null,
        amount: rawAmount,
        admin_fee: Number(adminFee) || 0,
        transaction_date: new Date(transactionDate).toISOString(),
        description: description.trim() || null,
        receipt_url: null,
      };

      const res = await onSave(payload);
      if (res.success) {
        onClose();
      } else {
        setError(res.error ?? "Gagal menyimpan transaksi");
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
      {/* Scrollable Form Body */}
      <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 overscroll-contain">
        {error && (
          <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-600 dark:text-rose-400">
            {error}
          </div>
        )}

        {/* Type Selector Tabs */}
        <div className="grid grid-cols-4 gap-1 p-1 rounded-xl bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
          {(
            [
              { id: "expense", label: "Pengeluaran" },
              { id: "income", label: "Pemasukan" },
              { id: "transfer", label: "Transfer" },
              { id: "saving", label: "Tabungan" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTypeChange(tab.id)}
              className={`py-1.5 rounded-lg text-xs font-semibold transition-all duration-100 ${
                type === tab.id
                  ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs"
                  : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Amount Input with Live Preview */}
        <div>
          <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
            Nominal Transaksi (IDR)
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
              value={amount}
              onChange={onAmountChange}
              onBlur={onAmountBlur}
              className="w-full pl-10 pr-3.5 py-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-base font-bold text-zinc-900 dark:text-zinc-100 font-mono tabular-nums placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500"
            />
          </div>
          {rawAmount > 0 && (
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 font-mono">
              = {formatCurrency(rawAmount)}
            </p>
          )}
        </div>

        {/* Wallets / Accounts Selection */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Source Wallet */}
          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              {type === "income" ? "Dompet Penerima" : "Dompet Sumber"}
            </label>
            <select
              value={walletId}
              onChange={(e) => setWalletId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-emerald-500"
            >
              {wallets.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} ({formatCurrency(w.balance)})
                </option>
              ))}
            </select>
          </div>

          {/* Conditional Field: Destination Wallet (Transfer), Category (Expense/Income), or Savings Goal (Saving) */}
          {type === "transfer" && (
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                Dompet Tujuan
              </label>
              <select
                value={destinationWalletId}
                onChange={(e) => setDestinationWalletId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-emerald-500"
              >
                {wallets
                  .filter((w) => w.id !== walletId)
                  .map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({formatCurrency(w.balance)})
                    </option>
                  ))}
              </select>
            </div>
          )}

          {(type === "expense" || type === "income") && (
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                Kategori
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-emerald-500"
              >
                {availableCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {type === "saving" && (
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                Pos Tabungan Impian
              </label>
              <select
                value={savingsGoalId}
                onChange={(e) => setSavingsGoalId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-blue-500"
              >
                {savingsGoals.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name} ({formatCurrency(g.current_amount)} / {formatCurrency(g.target_amount)})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Date & Admin Fee */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              Tanggal & Jam
            </label>
            <input
              type="datetime-local"
              required
              value={transactionDate}
              onChange={(e) => setTransactionDate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              Biaya Admin (Opsional)
            </label>
            <input
              type="number"
              min="0"
              value={adminFee}
              onChange={(e) => setAdminFee(e.target.value)}
              placeholder="0"
              className="w-full px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 font-mono tabular-nums focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Description / Merchant */}
        <div>
          <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
            Catatan / Nama Merchant (Opsional)
          </label>
          <input
            type="text"
            placeholder="e.g. Kopi Janji Jiwa, Makan Siang, Gaji Kantor"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3.5 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500"
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
          Simpan Transaksi
        </button>
      </div>
    </form>
  );
}

export function TransactionModal({
  isOpen,
  onClose,
  onSave,
  wallets,
  categories,
  savingsGoals,
}: TransactionModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-lg rounded-t-3xl sm:rounded-2xl bg-white dark:bg-zinc-900 border-t sm:border border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col max-h-[85dvh] sm:max-h-[90dvh] overflow-hidden">
        {/* Mobile grab handle */}
        <div className="w-10 h-1 bg-zinc-300 dark:bg-zinc-700 rounded-full mx-auto sm:hidden mt-3 mb-1 shrink-0" />

        {/* Header (Pinned) */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-3 border-b border-zinc-100 dark:border-zinc-800/80 shrink-0">
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            Catat Transaksi Baru
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form with scrollable body + pinned footer */}
        <TransactionForm
          key={isOpen ? "open" : "closed"}
          onClose={onClose}
          onSave={onSave}
          wallets={wallets}
          categories={categories}
          savingsGoals={savingsGoals}
        />
      </div>
    </div>
  );
}
