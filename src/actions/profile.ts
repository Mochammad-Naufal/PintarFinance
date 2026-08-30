"use server";

import { revalidatePath } from "next/cache";
import { sql } from "@/db";
import { getCurrentUser } from "@/lib/supabase/user";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import {
  type ActionResult,
  type UserProfile,
  type UserProfileInput,
  userProfileSchema,
} from "@/types/finance";
import { calculateAge } from "@/lib/utils";

// ─── Get User Profile ────────────────────────────────────────────────────────
export async function getUserProfile(): Promise<UserProfile> {
  try {
    const user = await getCurrentUser();
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    // Ensure columns exist in users table
    try {
      await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS birth_date DATE`;
      await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS occupation VARCHAR(100)`;
      await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT`;
    } catch {
      // Ignore if already exists or restricted
    }

    const rows = await sql`
      SELECT 
        id,
        email,
        name,
        avatar_url,
        birth_date::text,
        occupation,
        created_at::text,
        updated_at::text
      FROM users
      WHERE id = ${user.id}
      LIMIT 1
    `;

    if (rows.length > 0) {
      const r = rows[0];
      const birthDate = r.birth_date as string | null;
      return {
        id: r.id as string,
        name: (r.name as string) || authUser?.user_metadata?.full_name || user.name || "Pengguna",
        email: (r.email as string) || user.email || "",
        avatar_url: (r.avatar_url as string | null) || authUser?.user_metadata?.avatar_url || null,
        birth_date: birthDate,
        age: calculateAge(birthDate),
        occupation: (r.occupation as string | null) || authUser?.user_metadata?.occupation || null,
        created_at: r.created_at as string,
        updated_at: r.updated_at as string,
      };
    }

    // Fallback from auth metadata
    const metaBirthDate = authUser?.user_metadata?.birth_date as string | null;
    return {
      id: user.id,
      name:
        authUser?.user_metadata?.full_name ||
        authUser?.user_metadata?.name ||
        user.name ||
        "Pengguna",
      email: user.email || "",
      avatar_url: authUser?.user_metadata?.avatar_url || null,
      birth_date: metaBirthDate || null,
      age: calculateAge(metaBirthDate),
      occupation: authUser?.user_metadata?.occupation || null,
    };
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return {
      id: "anonymous",
      name: "Pengguna",
      email: "",
    };
  }
}

// ─── Update User Profile ─────────────────────────────────────────────────────
export async function updateUserProfile(
  rawInput: UserProfileInput
): Promise<ActionResult<UserProfile>> {
  try {
    const user = await getCurrentUser();
    const validated = userProfileSchema.parse(rawInput);

    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    // 1. Update Supabase Auth metadata
    await supabase.auth.updateUser({
      data: {
        full_name: validated.name.trim(),
        name: validated.name.trim(),
        avatar_url: validated.avatar_url || null,
        occupation: validated.occupation || null,
        birth_date: validated.birth_date || null,
      },
    });

    // 2. Update users DB table
    try {
      await sql`
        INSERT INTO users (id, email, name, avatar_url, birth_date, occupation, updated_at)
        VALUES (
          ${user.id},
          ${user.email || ""},
          ${validated.name.trim()},
          ${validated.avatar_url || null},
          ${validated.birth_date ? sql`${validated.birth_date}::date` : null},
          ${validated.occupation || null},
          now()
        )
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          avatar_url = EXCLUDED.avatar_url,
          birth_date = EXCLUDED.birth_date,
          occupation = EXCLUDED.occupation,
          updated_at = now()
      `;
    } catch (dbErr) {
      console.warn("Could not upsert users table directly:", dbErr);
    }

    revalidatePath("/profile");
    revalidatePath("/dashboard");

    const updatedProfile: UserProfile = {
      id: user.id,
      name: validated.name.trim(),
      email: user.email || "",
      avatar_url: validated.avatar_url || null,
      occupation: validated.occupation || null,
      birth_date: validated.birth_date || null,
      age: calculateAge(validated.birth_date),
    };

    return {
      success: true,
      data: updatedProfile,
    };
  } catch (error) {
    console.error("Error updating user profile:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Gagal memperbarui profil pengguna.",
    };
  }
}
