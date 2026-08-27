import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { ProfileContent } from "./ProfileContent";

export const metadata = {
  title: "Profil & Pengaturan | Pintar Finance",
  description: "Kelola profil dan pengaturan akun Pintar Finance Anda.",
};

export default async function ProfilePage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If no user is found, the middleware handles demo vs actual,
  // but let's provide a fallback structure.
  const profileData = {
    name: user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split("@")[0] || "Demo User",
    email: user?.email || "demo@pintarfinance.com",
    isDemo: !user,
  };

  return <ProfileContent user={profileData} />;
}
