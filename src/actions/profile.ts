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

    // 1. Session Metadata Cleanup:
    // If a legacy large Base64 avatar exists in auth.user.user_metadata,
    // clear it to keep JWT tokens and session cookies strictly below 2 KB.
    if (authUser?.user_metadata?.avatar_url) {
      try {
        await supabase.auth.updateUser({
          data: {
            avatar_url: null,
          },
        });
      } catch {
        // Non-blocking cleanup
      }
    }

    // 2. Ensure columns exist in users table
    try {
      await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS birth_date DATE`;
      await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS occupation VARCHAR(100)`;
      await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT`;
    } catch {
      // Ignore if already exists or restricted
    }

    // 3. Fetch profile and avatar ONLY from database table
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
        avatar_url: (r.avatar_url as string | null) || null,
        birth_date: birthDate,
        age: calculateAge(birthDate),
        occupation: (r.occupation as string | null) || authUser?.user_metadata?.occupation || null,
        created_at: r.created_at as string,
        updated_at: r.updated_at as string,
      };
    }

    // Fallback if record not yet inserted
    const metaBirthDate = authUser?.user_metadata?.birth_date as string | null;
    return {
      id: user.id,
      name:
        authUser?.user_metadata?.full_name ||
        authUser?.user_metadata?.name ||
        user.name ||
        "Pengguna",
      email: user.email || "",
      avatar_url: null,
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

    // 1. Update Supabase Auth metadata WITHOUT avatar_url.
    // Setting avatar_url to null ensures JWT cookie remains tiny (<2 KB),
    // eliminating HTTP 431 / 494 Request Header Too Large completely.
    await supabase.auth.updateUser({
      data: {
        full_name: validated.name.trim(),
        name: validated.name.trim(),
        avatar_url: null,
        occupation: validated.occupation || null,
        birth_date: validated.birth_date || null,
      },
    });

    // 2. Store avatar (Base64 string or public URL) EXCLUSIVELY in the database table
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
