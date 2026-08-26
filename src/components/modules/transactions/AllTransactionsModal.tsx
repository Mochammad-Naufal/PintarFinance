"use client";

import { useMemo, useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Calendar,
  History,
  Receipt,
  Scale,
  Search,
  X,
} from "lucide-react";
import {
  type Category,
  type SavingsGoal,
  type Transaction,
  type TransactionType,
  type Wallet,
} from "@/types/finance";
import { TransactionItem } from "./TransactionItem";
import { formatCurrency, formatDate } from "@/lib/utils";

interface AllTransactionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  wallets: Wallet[];
  categories: Category[];
  savingsGoals: SavingsGoal[];
  onDelete: (id: string) => Promise<void>;
}

type TimePreset = "all" | "today" | "last7days" | "thisMonth" | "lastMonth" | "custom";

const TIME_PRESETS: { id: TimePreset; label: string }[] = [
  { id: "all", label: "Semua" },
  { id: "today", label: "Hari Ini" },
  { id: "last7days", label: "7 Hari Terakhir" },
  { id: "thisMonth", label: "Bulan Ini" },
  { id: "lastMonth", label: "Bulan Lalu" },
  { id: "custom", label: "Kustom Tanggal" },
];

const TYPE_OPTIONS: { value: TransactionType | "all"; label: string }[] = [
  { value: "all", label: "Semua Tipe" },
  { value: "expense", label: "Pengeluaran" },
  { value: "income", label: "Pemasukan" },
  { value: "transfer", label: "Transfer" },
  { value: "saving", label: "Tabungan" },
];

export function AllTransactionsModal({
  isOpen,
  onClose,
  transactions,
  wallets,
  onDelete,
}: AllTransactionsModalProps) {
  const [timePreset, setTimePreset] = useState<TimePreset>("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedType, setSelectedType] = useState<TransactionType | "all">("all");
  const [selectedWallet, setSelectedWallet] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Calculate filtered dataset
  const filteredTransactions = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);

    // Compute Date Boundaries based on preset
    let startLimit: Date | null = null;
    let endLimit: Date | null = null;

    if (timePreset === "today") {
      startLimit = new Date(`${todayStr}T00:00:00Z`);
      endLimit = new Date(`${todayStr}T23:59:59Z`);
    } else if (timePreset === "last7days") {
      const past7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      startLimit = past7;
      endLimit = now;
    } else if (timePreset === "thisMonth") {
      const y = now.getFullYear();
      const m = now.getMonth();
      startLimit = new Date(Date.UTC(y, m, 1));
      endLimit = new Date(Date.UTC(y, m + 1, 0, 23, 59, 59));
    } else if (timePreset === "lastMonth") {
      const y = now.getFullYear();
      const m = now.getMonth() - 1;
      startLimit = new Date(Date.UTC(y, m, 1));
      endLimit = new Date(Date.UTC(y, m + 1, 0, 23, 59, 59));
    } else if (timePreset === "custom") {
      if (startDate) startLimit = new Date(`${startDate}T00:00:00Z`);
      if (endDate) endLimit = new Date(`${endDate}T23:59:59Z`);
    }

    return transactions.filter((tx) => {
      const txTime = new Date(tx.transaction_date).getTime();

      // Time Range Filter
      if (startLimit && txTime < startLimit.getTime()) return false;
      if (endLimit && txTime > endLimit.getTime()) return false;

      // Type Filter
      if (selectedType !== "all" && tx.type !== selectedType) return false;

      // Wallet Filter
      if (
        selectedWallet !== "all" &&
        tx.wallet_id !== selectedWallet &&
        tx.destination_wallet_id !== selectedWallet
      ) {
        return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const descMatch = tx.description?.toLowerCase().includes(query);
        const catMatch = tx.category_name?.toLowerCase().includes(query);
        const walletMatch = tx.wallet_name?.toLowerCase().includes(query);
        if (!descMatch && !catMatch && !walletMatch) return false;
      }

      return true;
    });
  }, [transactions, timePreset, startDate, endDate, selectedType, selectedWallet, searchQuery]);

  // Aggregate Metrics for Filtered Data
  const { totalIncome, totalExpense, netCashflow } = useMemo(() => {
    let income = 0;
    let expense = 0;
    for (const tx of filteredTransactions) {
      if (tx.type === "income") {
        income += tx.amount;
      } else if (tx.type === "expense") {
        expense += tx.amount + tx.admin_fee;
      }
    }
    return {
      totalIncome: income,
      totalExpense: expense,
      netCashflow: income - expense,
    };
  }, [filteredTransactions]);

  // Group by Date
  const groupedTransactions = useMemo(() => {
    const groups: Record<string, { date: string; items: Transaction[]; net: number }> = {};

    for (const tx of filteredTransactions) {
      const dateKey = tx.transaction_date.slice(0, 10);
      if (!groups[dateKey]) {
        groups[dateKey] = {
          date: tx.transaction_date,
          items: [],
          net: 0,
        };
      }
      groups[dateKey].items.push(tx);
      if (tx.type === "income") {
        groups[dateKey].net += tx.amount;
      } else if (tx.type === "expense") {
        groups[dateKey].net -= tx.amount + tx.admin_fee;
      }
    }

    return Object.entries(groups).sort(
      ([a], [b]) => new Date(b).getTime() - new Date(a).getTime()
    );
  }, [filteredTransactions]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-4xl rounded-t-3xl sm:rounded-2xl bg-white dark:bg-zinc-900 border-t sm:border border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col max-h-[90dvh] sm:max-h-[92dvh] overflow-hidden">
        {/* Mobile grab handle */}
        <div className="w-10 h-1 bg-zinc-300 dark:bg-zinc-700 rounded-full mx-auto sm:hidden mt-3 mb-1 shrink-0" />

        {/* Header (Pinned) */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 border-b border-zinc-100 dark:border-zinc-800/80 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 leading-none">
                Semua Riwayat Transaksi
              </h2>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
                Buku besar lengkap seluruh mutasi finansial dengan filter rentang waktu
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

        {/* Filter Controls Bar */}
        <div className="p-4 sm:p-5 border-b border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-950/40 space-y-3 shrink-0">
          {/* Time Preset Pills */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
            <div className="flex items-center gap-1.5 mr-1 text-zinc-500 dark:text-zinc-400 text-xs shrink-0">
              <Calendar className="w-3.5 h-3.5" />
              <span className="font-medium hidden sm:inline">Periode:</span>
            </div>
            {TIME_PRESETS.map((preset) => {
              const isSelected = timePreset === preset.id;
              return (
                <button
                  key={preset.id}
                  onClick={() => setTimePreset(preset.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all duration-100 active:scale-[0.98] shrink-0 ${
                    isSelected
                      ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-semibold shadow-xs"
                      : "bg-white dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
                  }`}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>

          {/* Custom Date Range Inputs (if custom chosen) */}
          {timePreset === "custom" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <div>
                <label className="block text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                  Dari Tanggal
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                  Sampai Tanggal
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          )}

          {/* Second Filter Row: Type, Wallet & Search */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            {/* Type selector */}
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as TransactionType | "all")}
              className="px-3 py-1.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-emerald-500 shrink-0"
            >
              {TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            {/* Wallet dropdown */}
            <select
              value={selectedWallet}
              onChange={(e) => setSelectedWallet(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-emerald-500 shrink-0"
            >
              <option value="all">Semua Dompet</option>
              {wallets.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>

            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
              <input
                type="text"
                placeholder="Cari transaksi / merchant..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Dynamic Metric Ribbon */}
        <div className="grid grid-cols-3 gap-2 px-5 py-3 bg-zinc-100/70 dark:bg-zinc-950/60 border-b border-zinc-200/80 dark:border-zinc-800/80 text-xs shrink-0">
          <div>
            <span className="text-[10px] uppercase font-semibold text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
              <ArrowDownLeft className="w-3 h-3 text-emerald-600" /> Pemasukan
            </span>
            <p className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-xs sm:text-sm tabular-nums mt-0.5">
              {formatCurrency(totalIncome)}
            </p>
          </div>
          <div>
            <span className="text-[10px] uppercase font-semibold text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
              <ArrowUpRight className="w-3 h-3 text-rose-600" /> Pengeluaran
            </span>
            <p className="font-mono font-bold text-zinc-900 dark:text-zinc-100 text-xs sm:text-sm tabular-nums mt-0.5">
              {formatCurrency(totalExpense)}
            </p>
          </div>
          <div>
            <span className="text-[10px] uppercase font-semibold text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
              <Scale className="w-3 h-3 text-purple-600" /> Net ({filteredTransactions.length} item)
            </span>
            <p
              className={`font-mono font-bold text-xs sm:text-sm tabular-nums mt-0.5 ${
                netCashflow >= 0
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-rose-600 dark:text-rose-400"
              }`}
            >
              {netCashflow > 0 ? "+" : ""}
              {formatCurrency(netCashflow)}
            </p>
          </div>
        </div>

        {/* Scrollable Transaction Feed */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 overscroll-contain">
          {groupedTransactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center space-y-2">
              <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400">
                <Receipt className="w-5 h-5" />
              </div>
              <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                Tidak Ada Transaksi Sesuai Filter
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-xs">
                Coba sesuaikan rentang waktu, tipe mutasi, atau kata kunci pencarian Anda.
              </p>
            </div>
          ) : (
            groupedTransactions.map(([dateKey, group]) => (
              <div key={dateKey} className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    {formatDate(group.date, "EEEE, d MMMM yyyy")}
                  </p>
                  {group.net !== 0 && (
                    <p
                      className={`text-[11px] font-mono font-medium tabular-nums ${
                        group.net > 0
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-zinc-500 dark:text-zinc-400"
                      }`}
                    >
                      {group.net > 0 ? "+" : ""}
                      {formatCurrency(group.net)}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  {group.items.map((tx) => (
                    <TransactionItem
                      key={tx.id}
                      transaction={tx}
                      onDelete={onDelete}
                    />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-zinc-200 dark:border-zinc-800/80 bg-zinc-50/90 dark:bg-zinc-900/90 backdrop-blur-xs shrink-0">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Menampilkan <strong>{filteredTransactions.length}</strong> dari {transactions.length} mutasi
          </p>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:opacity-90 active:scale-[0.98] transition-all"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
