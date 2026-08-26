import { getSavingsGoals } from "@/actions/savings";
import { SavingsGoalList } from "@/components/modules/savings/SavingsGoalList";
import { AIContextCard } from "@/components/modules/ai/AIContextCard";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Pos Tabungan & Impian",
  description: "Rencanakan dan pantau progres pencapaian target tabungan impianmu.",
};

export default async function SavingsPage() {
  const goals = await getSavingsGoals();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
          Pos Tabungan & Impian
        </h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
          Kumpulkan dana untuk impian, kebutuhan masa depan, atau dana darurat secara terstruktur.
        </p>
      </div>

      {/* AI Contextual Advisor */}
      <AIContextCard moduleType="savings" moduleName="Target Impian & Tabungan" />

      <SavingsGoalList initialGoals={goals} />
    </div>
  );
}
