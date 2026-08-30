import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/user";
import { ProfileContent } from "./ProfileContent";
import { getSavingsGoals } from "@/actions/savings";
import { getWallets } from "@/actions/wallets";
import { getUserProfile } from "@/actions/profile";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Profil & Pengaturan | Pintar Finance",
  description:
    "Kelola profil pengguna, data personal, tabungan bersama, dan preferensi akun Pintar Finance Anda.",
};

export default async function ProfilePage() {
  try {
    const [userProfile, savingsGoals, wallets] = await Promise.all([
      getUserProfile(),
      getSavingsGoals(),
      getWallets(),
    ]);

    return (
      <ProfileContent
        user={userProfile}
        savingsGoals={savingsGoals}
        wallets={wallets}
      />
    );
  } catch {
    redirect("/login");
  }
}
