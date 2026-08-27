import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
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

  if (!user) {
    redirect("/login");
  }

  const [savingsGoals, wallets] = await Promise.all([
    getSavingsGoals(),
    getWallets(),
  ]);

  const profileData = {
    name:
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.email?.split("@")[0] ||
      "Pengguna",
    email: user.email ?? "",
  };

  return (
    <ProfileContent
      user={profileData}
      savingsGoals={savingsGoals}
      wallets={wallets}
    />
  );
}
