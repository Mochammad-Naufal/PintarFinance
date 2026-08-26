"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ensureUserOnboarding } from "@/lib/supabase/user";
import { type ActionResult } from "@/types/finance";

export async function signInWithPassword(formData: {
  email: string;
  password: string;
}): Promise<ActionResult<{ userId: string }>> {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: formData.email.trim(),
      password: formData.password,
    });

    if (error) {
      return {
        success: false,
        error:
          error.message === "Invalid login credentials"
            ? "Email atau kata sandi tidak cocok"
            : error.message,
      };
    }

    if (data.user) {
      const name =
        data.user.user_metadata?.full_name ||
        data.user.user_metadata?.name ||
        data.user.email?.split("@")[0] ||
        "Pengguna";

      await ensureUserOnboarding(data.user.id, data.user.email!, name);
    }

    return {
      success: true,
      data: { userId: data.user.id },
    };
  } catch (err) {
    console.error("signInWithPassword error:", err);
    return { success: false, error: "Terjadi kesalahan saat proses login" };
  }
}

export async function signInWithOtp(email: string): Promise<ActionResult<{ sent: boolean }>> {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/dashboard`,
      },
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: { sent: true } };
  } catch (err) {
    console.error("signInWithOtp error:", err);
    return { success: false, error: "Gagal mengirim link login email" };
  }
}

export async function signUp(formData: {
  name: string;
  email: string;
  password: string;
}): Promise<ActionResult<{ userId?: string; requiresEmailConfirm: boolean }>> {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { data, error } = await supabase.auth.signUp({
      email: formData.email.trim(),
      password: formData.password,
      options: {
        data: {
          full_name: formData.name.trim(),
          name: formData.name.trim(),
        },
      },
    });

    if (error) {
      return { success: false, error: error.message };
    }

    if (data.user) {
      await ensureUserOnboarding(data.user.id, data.user.email!, formData.name.trim());
    }

    // Check if session exists (auto-confirmed) or email confirmation required
    const requiresEmailConfirm = !data.session;

    return {
      success: true,
      data: {
        userId: data.user?.id,
        requiresEmailConfirm,
      },
    };
  } catch (err) {
    console.error("signUp error:", err);
    return { success: false, error: "Terjadi kesalahan saat registrasi" };
  }
}

export async function signOut() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  await supabase.auth.signOut();
  redirect("/login");
}
