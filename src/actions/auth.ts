"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ensureUserOnboarding } from "@/lib/supabase/user";
import { type ActionResult } from "@/types/finance";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.NODE_ENV === "production"
    ? "https://pintarfinance.id"
    : "http://localhost:3000");

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
      let errorMessage = error.message;
      if (error.message === "Invalid login credentials") {
        errorMessage = "Email atau kata sandi tidak cocok.";
      } else if (error.message.toLowerCase().includes("email not confirmed")) {
        errorMessage =
          "Email belum dikonfirmasi. Silakan periksa inbox/spam email Anda untuk mengklik tautan verifikasi atau gunakan tombol kirim ulang.";
      }

      return {
        success: false,
        error: errorMessage,
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
        emailRedirectTo: `${SITE_URL}/auth/callback`,
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

export async function resendConfirmationEmail(email: string): Promise<ActionResult> {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { error } = await supabase.auth.resend({
      type: "signup",
      email: email.trim(),
      options: {
        emailRedirectTo: `${SITE_URL}/auth/callback`,
      },
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error("resendConfirmationEmail error:", err);
    return { success: false, error: "Gagal mengirim ulang email konfirmasi" };
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
        emailRedirectTo: `${SITE_URL}/auth/callback`,
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
