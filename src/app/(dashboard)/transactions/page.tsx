import { getTransactions, getCategories } from "@/actions/transactions";
import { getWallets } from "@/actions/wallets";
import { getSavingsGoals } from "@/actions/savings";
import { getRecurringTransactions } from "@/actions/recurring";
import { getBudgets, getCurrentPeriod } from "@/actions/budgets";
import { getDebts } from "@/actions/debts";
import { TransactionsViewTabs } from "@/components/modules/transactions/TransactionsViewTabs";
import { AIContextCard } from "@/components/modules/ai/AIContextCard";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Transaksi, Anggaran, Langganan & Hutang",
  description: "Buku besar arus kas masuk, alokasi anggaran, tagihan berkala, dan pos hutang piutang.",
};

interface TransactionsPageProps {
  searchParams?: Promise<{ tab?: string; period?: string }>;
}

export default async function TransactionsPage({ searchParams }: TransactionsPageProps) {
  const params = searchParams ? await searchParams : {};
  const currentPeriod = params.period || (await getCurrentPeriod());

  const [transactions, wallets, categories, savingsGoals, recurringList, budgets, debts] =
    await Promise.all([
      getTransactions(),
      getWallets(),
      getCategories(),
      getSavingsGoals(),
      getRecurringTransactions(),
      getBudgets(currentPeriod),
      getDebts(),
    ]);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
          Transaksi, Anggaran &amp; Hutang Piutang
        </h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
          Pantau pergerakan uang harian, batas alokasi anggaran, jadwal tagihan otomatis, serta kelola liabilitas Anda.
        </p>
      </div>

      {/* AI Contextual Advisor */}
      <AIContextCard moduleType="transactions" moduleName="Transaksi & Anggaran" />

      {/* Segmented View Tabs (4 Tabs) */}
      <TransactionsViewTabs
        initialTab={params.tab}
        transactions={transactions}
        wallets={wallets}
        categories={categories}
        savingsGoals={savingsGoals}
        recurringList={recurringList}
        budgets={budgets}
        debts={debts}
        currentPeriod={currentPeriod}
      />
    </div>
  );
}
