import { getBudgets, getCurrentPeriod } from "@/actions/budgets";
import { getCategories } from "@/actions/transactions";
import { BudgetList } from "@/components/modules/budgets/BudgetList";
import { AIContextCard } from "@/components/modules/ai/AIContextCard";

export const metadata = {
  title: "Batas Anggaran Bulanan",
  description: "Atur batas limit pengeluaran per kategori agar keuangan tetap terkendali.",
};

interface BudgetsPageProps {
  searchParams: Promise<{ period?: string }>;
}

export default async function BudgetsPage({ searchParams }: BudgetsPageProps) {
  const { period } = await searchParams;
  const currentPeriod = period || (await getCurrentPeriod());

  const [budgets, expenseCategories] = await Promise.all([
    getBudgets(currentPeriod),
    getCategories("expense"),
  ]);

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div>
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
          Batas Anggaran Bulanan
        </h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
          Pantau limit kuota pengeluaran per kategori secara disiplin setiap bulannya.
        </p>
      </div>

      {/* AI Contextual Advisor */}
      <AIContextCard moduleType="budgets" moduleName="Batas Anggaran" />

      <BudgetList
        initialBudgets={budgets}
        currentPeriod={currentPeriod}
        categories={expenseCategories}
      />
    </div>
  );
}
