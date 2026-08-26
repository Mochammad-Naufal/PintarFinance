import { getTransactions, getCategories } from "@/actions/transactions";
import { getWallets } from "@/actions/wallets";
import { getSavingsGoals } from "@/actions/savings";
import { getRecurringTransactions } from "@/actions/recurring";
import { TransactionsViewTabs } from "@/components/modules/transactions/TransactionsViewTabs";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Transaksi & Langganan Berulang",
  description: "Buku besar arus kas masuk, pengeluaran, transfer dompet, dan tagihan berkala.",
};

export default async function TransactionsPage() {
  const [transactions, wallets, categories, savingsGoals, recurringList] =
    await Promise.all([
      getTransactions(),
      getWallets(),
      getCategories(),
      getSavingsGoals(),
      getRecurringTransactions(),
    ]);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
          Transaksi & Langganan Berulang
        </h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
          Pantau seluruh pergerakan uang harian, komitmen langganan rutin, dan jadwal tagihan otomatis.
        </p>
      </div>

      {/* Segmented View Tabs */}
      <TransactionsViewTabs
        transactions={transactions}
        wallets={wallets}
        categories={categories}
        savingsGoals={savingsGoals}
        recurringList={recurringList}
      />
    </div>
  );
}
