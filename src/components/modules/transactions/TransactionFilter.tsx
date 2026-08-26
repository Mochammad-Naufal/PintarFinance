"use client";

import { Search } from "lucide-react";
import { type TransactionType, type Wallet } from "@/types/finance";

interface TransactionFilterProps {
  selectedType: TransactionType | "all";
  onTypeChange: (type: TransactionType | "all") => void;
  selectedWallet: string;
  onWalletChange: (walletId: string) => void;
  wallets: Wallet[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

const TYPE_OPTIONS: { value: TransactionType | "all"; label: string }[] = [
  { value: "all", label: "Semua" },
  { value: "expense", label: "Pengeluaran" },
  { value: "income", label: "Pemasukan" },
  { value: "transfer", label: "Transfer" },
  { value: "saving", label: "Tabungan" },
];

export function TransactionFilter({
  selectedType,
  onTypeChange,
  selectedWallet,
  onWalletChange,
  wallets,
  searchQuery,
  onSearchChange,
}: TransactionFilterProps) {
  return (
    <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-2.5 p-2 sm:p-2.5 rounded-2xl bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/80 shadow-xs min-w-0">
      {/* Type Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 xl:pb-0 scrollbar-none min-w-0">
        {TYPE_OPTIONS.map(({ value, label }) => {
          const isSelected = selectedType === value;
          return (
            <button
              key={value}
              onClick={() => onTypeChange(value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all duration-100 active:scale-[0.98] shrink-0 ${
                isSelected
                  ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-semibold shadow-xs"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Right: Wallet Dropdown & Search Input */}
      <div className="flex items-center gap-2 min-w-0 shrink-0">
        {/* Wallet Dropdown */}
        <select
          value={selectedWallet}
          onChange={(e) => onWalletChange(e.target.value)}
          className="px-2.5 py-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-emerald-500 shrink-0 max-w-[140px]"
        >
          <option value="all">Semua Dompet</option>
          {wallets.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name}
            </option>
          ))}
        </select>

        {/* Search */}
        <div className="relative flex-1 sm:w-44 min-w-[130px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
          <input
            type="text"
            placeholder="Cari transaksi..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>
    </div>
  );
}
