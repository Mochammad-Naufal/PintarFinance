import { getTransactions, getCategories } from "@/actions/transactions";
import { getWallets } from "@/actions/wallets";
import { getSavingsGoals } from "@/actions/savings";
import { TransactionList } from "@/components/modules/transactions/TransactionList";
import { formatCurrency } from "@/lib/utils";
import { ArrowDownLeft, ArrowUpRight, Scale } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Riwayat Transaksi",
  description: "Catatan lengkap arus kas masuk, pengeluaran, transfer dompet, dan tabungan.",
};

export default async function TransactionsPage() {
  const [transactions, wallets, categories, savingsGoals] = await Promise.all([
    getTransactions(),
    getWallets(),
    getCategories(),
    getSavingsGoals(),
  ]);

  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((acc, t) => acc + t.amount, 0);

  const totalExpense = transactions
    .filter((t) => t.type === "expense")
    .reduce((acc, t) => acc + t.amount + t.admin_fee, 0);

  const netCashflow = totalIncome - totalExpense;

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
          Riwayat Transaksi
        </h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
          Pantau seluruh pergerakan uang masuk, pengeluaran harian, dan transfer antar-rekening.
        </p>
      </div>

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

      {/* Transaction List with filters & modal */}
      <TransactionList
        initialTransactions={transactions}
        wallets={wallets}
        categories={categories}
        savingsGoals={savingsGoals}
      />
    </div>
  );
}
