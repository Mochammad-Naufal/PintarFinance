"use client";

import { useMemo, useState } from "react";
import { ArrowRight, FileText, Plus, Receipt } from "lucide-react";
import {
  type Category,
  type SavingsGoal,
  type Transaction,
  type TransactionInput,
  type TransactionType,
  type Wallet,
} from "@/types/finance";
import { TransactionItem } from "./TransactionItem";
import { TransactionFilter } from "./TransactionFilter";
import { TransactionModal } from "./TransactionModal";
import { ExportModal } from "./ExportModal";
import { AllTransactionsModal } from "./AllTransactionsModal";
import { createTransaction, deleteTransaction } from "@/actions/transactions";
import { formatCurrency, formatDate } from "@/lib/utils";

const DISPLAY_LIMIT = 15;

interface TransactionListProps {
  initialTransactions: Transaction[];
  wallets: Wallet[];
  categories: Category[];
  savingsGoals: SavingsGoal[];
}

function getGroupTitle(dateStr: string): string {
  return formatDate(dateStr, "EEEE, d MMMM yyyy");
}

export function TransactionList({
  initialTransactions,
  wallets,
  categories,
  savingsGoals,
}: TransactionListProps) {
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [selectedType, setSelectedType] = useState<TransactionType | "all">("all");
  const [selectedWallet, setSelectedWallet] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isAllModalOpen, setIsAllModalOpen] = useState(false);

  // Client-side filtering for fast response
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      // Type Filter
      if (selectedType !== "all" && tx.type !== selectedType) {
        return false;
      }
      // Wallet Filter
      if (
        selectedWallet !== "all" &&
        tx.wallet_id !== selectedWallet &&
        tx.destination_wallet_id !== selectedWallet
      ) {
        return false;
      }
      // Search query
      if (searchQuery.trim() !== "") {
        const query = searchQuery.toLowerCase();
        const descMatch = tx.description?.toLowerCase().includes(query);
        const catMatch = tx.category_name?.toLowerCase().includes(query);
        const walletMatch = tx.wallet_name?.toLowerCase().includes(query);
        if (!descMatch && !catMatch && !walletMatch) return false;
      }
      return true;
    });
  }, [transactions, selectedType, selectedWallet, searchQuery]);

  // Display limited subset on main view for fast rendering & clean UI
  const limitedTransactions = useMemo(() => {
    return filteredTransactions.slice(0, DISPLAY_LIMIT);
  }, [filteredTransactions]);

  // Group limited transactions by date string (YYYY-MM-DD)
  const groupedTransactions = useMemo(() => {
    const groups: Record<string, { date: string; items: Transaction[]; net: number }> = {};

    for (const tx of limitedTransactions) {
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
  }, [limitedTransactions]);

  const handleSave = async (data: TransactionInput) => {
    const res = await createTransaction(data);
    if (res.success && res.data) {
      // Find joined metadata
      const w = wallets.find((w) => w.id === res.data!.wallet_id);
      const dw = wallets.find((w) => w.id === res.data!.destination_wallet_id);
      const cat = categories.find((c) => c.id === res.data!.category_id);
      const sg = savingsGoals.find((s) => s.id === res.data!.savings_goal_id);

      const enriched: Transaction = {
        ...res.data,
        wallet_name: w?.name,
        wallet_color: w?.color,
        wallet_icon: w?.icon,
        destination_wallet_name: dw?.name,
        destination_wallet_color: dw?.color,
        destination_wallet_icon: dw?.icon,
        category_name: cat?.name,
        category_icon: cat?.icon,
        category_color: cat?.color,
        savings_goal_name: sg?.name,
        savings_goal_icon: sg?.icon,
        savings_goal_color: sg?.color,
      };

      setTransactions((prev) => [enriched, ...prev]);
    }
    return res;
  };

  const handleDelete = async (id: string) => {
    const res = await deleteTransaction(id);
    if (res.success) {
      setTransactions((prev) => prev.filter((tx) => tx.id !== id));
    } else {
      alert(res.error ?? "Gagal menghapus transaksi");
    }
  };

  return (
    <div className="space-y-5 max-w-full min-w-0">
      {/* Top Filter Bar + Action Buttons */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 min-w-0">
        <div className="flex-1 min-w-0">
          <TransactionFilter
            selectedType={selectedType}
            onTypeChange={setSelectedType}
            selectedWallet={selectedWallet}
            onWalletChange={setSelectedWallet}
            wallets={wallets}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end lg:self-auto">
          {/* Export PDF Trigger */}
          <button
            onClick={() => setIsExportModalOpen(true)}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium text-xs hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 active:scale-[0.98] transition-all shadow-xs shrink-0"
            aria-label="Ekspor Laporan PDF"
          >
            <FileText className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
            <span>Ekspor PDF</span>
          </button>

          {/* Add Transaction Button */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 dark:bg-emerald-500 text-white font-semibold text-xs hover:bg-emerald-500 dark:hover:bg-emerald-400 active:scale-[0.98] transition-all shadow-xs shrink-0"
          >
            <Plus className="w-4 h-4" strokeWidth={2} />
            <span>Catat Transaksi</span>
          </button>
        </div>
      </div>

      {/* Transactions Grouped by Date (Limited 15) */}
      {groupedTransactions.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 rounded-2xl bg-white dark:bg-zinc-900/40 border border-dashed border-zinc-300 dark:border-zinc-800 text-center space-y-3 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800/50 flex items-center justify-center text-zinc-500">
            <Receipt className="w-6 h-6" strokeWidth={1.5} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-200">
              Tidak Ada Transaksi Ditemukan
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-xs">
              Belum ada mutasi keuangan yang cocok dengan filter yang dipilih.
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="mt-2 px-4 py-2 rounded-lg bg-emerald-600 dark:bg-emerald-500 text-white text-xs font-semibold hover:bg-emerald-500 dark:hover:bg-emerald-400 active:scale-[0.98] transition-all shadow-xs"
          >
            Catat Transaksi Baru
          </button>
        </div>
      ) : (
        <div className="space-y-6 min-w-0">
          {groupedTransactions.map(([dateKey, group]) => (
            <div key={dateKey} className="space-y-2.5 min-w-0">
              {/* Date Section Header */}
              <div className="flex items-center justify-between px-1">
                <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  {getGroupTitle(group.date)}
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

              {/* Transaction Items */}
              <div className="space-y-2 min-w-0">
                {group.items.map((tx) => (
                  <TransactionItem
                    key={tx.id}
                    transaction={tx}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </div>
          ))}

          {/* View All History Trigger Button */}
          <div className="pt-2 text-center">
            <button
              onClick={() => setIsAllModalOpen(true)}
              className="w-full py-3 px-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 text-zinc-800 dark:text-zinc-200 text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition-all active:scale-[0.99]"
            >
              <span>
                Lihat Semua Riwayat Transaksi ({transactions.length} Mutasi Tercatat)
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
            </button>
          </div>
        </div>
      )}

      {/* Transaction Entry Modal */}
      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        wallets={wallets}
        categories={categories}
        savingsGoals={savingsGoals}
      />

      {/* Export PDF Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        wallets={wallets}
      />

      {/* Full Transaction History Modal with Comprehensive Time Filters */}
      <AllTransactionsModal
        isOpen={isAllModalOpen}
        onClose={() => setIsAllModalOpen(false)}
        transactions={transactions}
        wallets={wallets}
        categories={categories}
        savingsGoals={savingsGoals}
        onDelete={handleDelete}
      />
    </div>
  );
}
