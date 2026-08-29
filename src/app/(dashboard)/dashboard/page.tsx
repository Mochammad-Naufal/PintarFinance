import { getDashboardAnalytics } from "@/actions/analytics";
import { getBudgets } from "@/actions/budgets";
import { getWallets } from "@/actions/wallets";
import { DashboardView } from "@/components/modules/analytics/DashboardView";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Dashboard Analitik",
  description: "Ringkasan finansial cerdas, visualisasi arus kas, dan pemantauan impian keuangan.",
};

export default async function DashboardPage() {
  const [analytics, budgets, wallets] = await Promise.all([
    getDashboardAnalytics(),
    getBudgets(),
    getWallets(),
  ]);

  return (
    <DashboardView
      initialAnalytics={analytics}
      initialBudgets={budgets}
      initialWallets={wallets}
    />
  );
}
