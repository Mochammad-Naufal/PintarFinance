import { getWallets } from "@/actions/wallets";
import { getCategories } from "@/actions/transactions";
import { getSavingsGoals } from "@/actions/savings";
import { AIHubClient } from "@/components/modules/ai/AIHubClient";

export const metadata = {
  title: "AI Quick Scan & Assistant",
  description: "Catat transaksi instan dengan natural language processing dan vision OCR struk belanja.",
};

export default async function AIPage() {
  const [wallets, categories, savingsGoals] = await Promise.all([
    getWallets(),
    getCategories(),
    getSavingsGoals(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
          Pintar AI Assistant & Quick Scan
        </h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
          Gunakan kecerdasan buatan untuk mencatat transaksi dengan teks bebas atau memindai foto struk belanja secara instan.
        </p>
      </div>

      <AIHubClient
        wallets={wallets}
        categories={categories}
        savingsGoals={savingsGoals}
      />
    </div>
  );
}
