import { getDebts } from "@/actions/debts";
import { getWallets } from "@/actions/wallets";
import { DebtList } from "@/components/modules/debts/DebtList";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Hutang & Piutang (Liabilitas) | Pintar Finance",
  description:
    "Catat dan monitor kewajiban hutang, jatuh tempo cicilan, serta tagihan piutang Anda.",
};

export default async function DebtsPage() {
  const [debts, wallets] = await Promise.all([getDebts(), getWallets()]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-24 lg:pb-12">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
          Pencatatan Hutang &amp; Piutang (Liabilitas)
        </h1>
        <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Pantau kewajiban cicilan, tenggat waktu pelunasan, serta kelola piutang aktif Anda.
        </p>
      </div>

      <DebtList initialDebts={debts} wallets={wallets} />
    </div>
  );
}
