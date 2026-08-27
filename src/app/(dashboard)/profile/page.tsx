import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { ProfileContent } from "./ProfileContent";
import { getSavingsGoals } from "@/actions/savings";
import { getWallets } from "@/actions/wallets";

export const metadata = {
  title: "Profil & Pengaturan | Pintar Finance",
  description: "Kelola profil, tabungan bersama, dan preferensi akun Pintar Finance Anda.",
};

export default async function ProfilePage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [savingsGoals, wallets] = await Promise.all([
    getSavingsGoals(),
    getWallets(),
  ]);

  const profileData = {
    name:
      user?.user_metadata?.full_name ||
      user?.user_metadata?.name ||
      user?.email?.split("@")[0] ||
      "Demo User",
    email: user?.email || "demo@pintarfinance.com",
    isDemo: !user,
  };

  return (
    <ProfileContent
      user={profileData}
      savingsGoals={savingsGoals}
      wallets={wallets}
    />
  );
}
