import { getWallets } from "@/actions/wallets";
import { WalletList } from "@/components/modules/wallets/WalletList";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Dompet & Rekening",
  description: "Kelola seluruh akun bank, e-wallet, dan kas fisik kamu dalam satu tempat.",
};

export default async function WalletsPage() {
  const wallets = await getWallets();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
          Dompet & Rekening
        </h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
          Pantau saldo kas, rekening perbankan, dan saldo e-wallet secara real-time.
        </p>
      </div>

      <WalletList initialWallets={wallets} />
    </div>
  );
}
