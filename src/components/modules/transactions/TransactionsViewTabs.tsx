"use client";

import { useState } from "react";
import { ArrowDownLeft, ArrowUpRight, Receipt, Repeat, Scale } from "lucide-react";
import {
  type Category,
  type RecurringTransaction,
  type SavingsGoal,
  type Transaction,
  type Wallet,
} from "@/types/finance";
import { TransactionList } from "./TransactionList";
import { RecurringList } from "../recurring/RecurringList";
import { formatCurrency } from "@/lib/utils";

interface TransactionsViewTabsProps {
  transactions: Transaction[];
  wallets: Wallet[];
  categories: Category[];
  savingsGoals: SavingsGoal[];
  recurringList: RecurringTransaction[];
}

export function TransactionsViewTabs({
  transactions,
  wallets,
  categories,
  savingsGoals,
  recurringList,
}: TransactionsViewTabsProps) {
  const [activeTab, setActiveTab] = useState<"history" | "recurring">("history");

  const todayStr = new Date().toISOString().slice(0, 10);
  const dueRecurringCount = recurringList.filter(
    (r) => r.is_active && r.next_run_date <= todayStr
  ).length;

  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((acc, t) => acc + t.amount, 0);

  const totalExpense = transactions
    .filter((t) => t.type === "expense")
    .reduce((acc, t) => acc + t.amount + t.admin_fee, 0);

  const netCashflow = totalIncome - totalExpense;

  return (
    <div className="space-y-6 max-w-full min-w-0">
      {/* Top Segment Navigation Tabs */}
      <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 w-fit">
        <button
          type="button"
          onClick={() => setActiveTab("history")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === "history"
              ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs"
              : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
          }`}
        >
          <Receipt className="w-3.5 h-3.5" />
          <span>Riwayat Mutasi</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("recurring")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all relative ${
            activeTab === "recurring"
              ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs"
              : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
          }`}
        >
          <Repeat className="w-3.5 h-3.5" />
          <span>Langganan & Jadwal Berulang</span>
          {dueRecurringCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white animate-pulse">
              {dueRecurringCount}
            </span>
          )}
        </button>
      </div>

      {activeTab === "history" ? (
        <div className="space-y-6">
          {/* Summary Metrics */}
          <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/80 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Total Pemasukan
                </p>
                <div className="p-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <ArrowDownLeft className="w-3.5 h-3.5" strokeWidth={1.75} />
                </div>
              </div>
              <p className="text-xl font-bold tracking-tight font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
                {formatCurrency(totalIncome)}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/80 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Total Pengeluaran
                </p>
                <div className="p-1 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400">
                  <ArrowUpRight className="w-3.5 h-3.5" strokeWidth={1.75} />
                </div>
              </div>
              <p className="text-xl font-bold tracking-tight font-mono tabular-nums text-zinc-900 dark:text-zinc-100">
                {formatCurrency(totalExpense)}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/80 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Arus Kas Bersih
                </p>
                <div className="p-1 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
                  <Scale className="w-3.5 h-3.5" strokeWidth={1.75} />
                </div>
              </div>
              <p
                className={`text-xl font-bold tracking-tight font-mono tabular-nums ${
                  netCashflow >= 0
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-rose-600 dark:text-rose-400"
                }`}
              >
                {netCashflow > 0 ? "+" : ""}
                {formatCurrency(netCashflow)}
              </p>
            </div>
          </section>

          {/* Transaction Feed */}
          <TransactionList
            initialTransactions={transactions}
            wallets={wallets}
            categories={categories}
            savingsGoals={savingsGoals}
          />
        </div>
      ) : (
        <RecurringList
          initialRecurring={recurringList}
          wallets={wallets}
          categories={categories}
        />
      )}
    </div>
  );
}
