import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { sql, DEMO_USER_ID } from "@/db";

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  isDemo: boolean;
}

export async function getCurrentUser(): Promise<AuthenticatedUser> {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (user && !error) {
      const name =
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        user.email?.split("@")[0] ||
        "Pengguna";

      // Ensure user record exists in public.users
      await ensureUserOnboarding(user.id, user.email ?? "user@pintarfinance.com", name);

      return {
        id: user.id,
        email: user.email ?? "user@pintarfinance.com",
        name,
        isDemo: false,
      };
    }
  } catch (err) {
    // Fallback if session/cookie lookup fails
    console.warn("Session lookup fallback to demo:", err);
  }

  // Fallback: Demo User
  return {
    id: DEMO_USER_ID,
    email: "demo@pintarfinance.com",
    name: "Demo User",
    isDemo: true,
  };
}

/**
 * Onboarding helper: ensures public.users record exists and seeds default
 * wallets and categories for new users so the dashboard is immediately usable.
 */
export async function ensureUserOnboarding(
  userId: string,
  email: string,
  name: string
) {
  try {
    // 1. Insert or update user record
    await sql`
      INSERT INTO users (id, email, name)
      VALUES (${userId}, ${email}, ${name})
      ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        name = COALESCE(EXCLUDED.name, users.name),
        updated_at = now()
    `;

    // 2. Check if user already has wallets
    const [walletCount] = await sql`
      SELECT COUNT(*)::int AS count FROM wallets WHERE user_id = ${userId} AND deleted_at IS NULL
    `;

    if (!walletCount || walletCount.count === 0) {
      // Create default primary wallet
      await sql`
        INSERT INTO wallets (user_id, name, type, balance, color, icon)
        VALUES (${userId}, 'Dompet Utama', 'bank', 0, '#0060af', 'landmark')
      `;
    }

    // 3. Check if user has categories
    const [catCount] = await sql`
      SELECT COUNT(*)::int AS count FROM categories WHERE user_id = ${userId}
    `;

    if (!catCount || catCount.count === 0) {
      // Seed default 12 categories (8 expense + 4 income)
      const defaultCategories = [
        // Expense
        { name: "Makanan & Minuman", type: "expense", icon: "utensils", color: "#f59e0b" },
        { name: "Transportasi", type: "expense", icon: "car", color: "#3b82f6" },
        { name: "Belanja & Kebutuhan", type: "expense", icon: "shopping-bag", color: "#ec4899" },
        { name: "Tagihan & Utilitas", type: "expense", icon: "zap", color: "#ef4444" },
        { name: "Hiburan & Rekreasi", type: "expense", icon: "film", color: "#8b5cf6" },
        { name: "Kesehatan", type: "expense", icon: "heart-pulse", color: "#10b981" },
        { name: "Edukasi", type: "expense", icon: "graduation-cap", color: "#06b6d4" },
        { name: "Lain-lain", type: "expense", icon: "more-horizontal", color: "#64748b" },
        // Income
        { name: "Gaji Pokok", type: "income", icon: "briefcase", color: "#10b981" },
        { name: "Bonus & THR", type: "income", icon: "gift", color: "#f59e0b" },
        { name: "Investasi & Dividen", type: "income", icon: "trending-up", color: "#3b82f6" },
        { name: "Freelance / Side Job", type: "income", icon: "laptop", color: "#8b5cf6" },
      ];

      for (const cat of defaultCategories) {
        await sql`
          INSERT INTO categories (user_id, name, type, icon, color)
          VALUES (${userId}, ${cat.name}, ${cat.type}, ${cat.icon}, ${cat.color})
        `;
      }
    }
  } catch (error) {
    console.error("Error in ensureUserOnboarding:", error);
  }
}
