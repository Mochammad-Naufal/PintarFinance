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

// ─── Ensure Avatars Storage Bucket Exists ─────────────────────────────────────
export async function ensureAvatarBucket(): Promise<void> {
  try {
    // 1. Ensure storage bucket 'avatars' exists and is public
    await sql`
      INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
      VALUES (
        'avatars',
        'avatars',
        true,
        2097152, -- 2 MB limit
        ARRAY['image/webp', 'image/png', 'image/jpeg', 'image/jpg']
      )
      ON CONFLICT (id) DO UPDATE SET
        public = true,
        file_size_limit = 2097152,
        allowed_mime_types = ARRAY['image/webp', 'image/png', 'image/jpeg', 'image/jpg']
    `;

    // 2. Ensure Storage RLS Policies exist
    await sql`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'Avatars Public Read'
        ) THEN
          CREATE POLICY "Avatars Public Read" ON storage.objects
          FOR SELECT USING (bucket_id = 'avatars');
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'Avatars Authenticated Upload'
        ) THEN
          CREATE POLICY "Avatars Authenticated Upload" ON storage.objects
          FOR INSERT TO authenticated
          WITH CHECK (bucket_id = 'avatars');
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'Avatars Authenticated Update'
        ) THEN
          CREATE POLICY "Avatars Authenticated Update" ON storage.objects
          FOR UPDATE TO authenticated
          USING (bucket_id = 'avatars');
        END IF;
      END $$;
    `;
  } catch (err) {
    console.warn("Notice: ensureAvatarBucket policy check (may be managed by Supabase dashboard):", err);
  }
}

// ─── Upload Avatar to Supabase Storage (Binary WebP) ──────────────────────────
export async function uploadAvatar(
  formData: FormData
): Promise<ActionResult<{ publicUrl: string }>> {
  try {
    const user = await getCurrentUser();
    const file = formData.get("file") as File | null;

    if (!file) {
      return { success: false, error: "File gambar tidak ditemukan." };
    }

    if (!file.type.startsWith("image/")) {
      return { success: false, error: "Format file harus berupa gambar." };
    }

    await ensureAvatarBucket();

    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const filePath = `${user.id}/avatar.webp`;
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload with upsert to overwrite old avatar without accumulating storage
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, buffer, {
        contentType: "image/webp",
        upsert: true,
      });

    if (uploadError) {
      console.error("Supabase storage upload error:", uploadError);
      return {
        success: false,
        error: `Gagal mengunggah avatar ke storage: ${uploadError.message}`,
      };
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("avatars").getPublicUrl(filePath);

    // Append cache-buster for immediate reactive display
    const finalUrl = `${publicUrl}?v=${Date.now()}`;

    // Update database table users directly
    await sql`
      UPDATE users
      SET avatar_url = ${finalUrl}, updated_at = now()
      WHERE id = ${user.id}
    `;

    // Ensure auth metadata avatar_url is cleansed to keep cookies < 2KB
    await supabase.auth.updateUser({
      data: {
        avatar_url: null,
      },
    });

    revalidatePath("/profile");
    revalidatePath("/dashboard");

    return {
      success: true,
      data: { publicUrl: finalUrl },
    };
  } catch (error) {
    console.error("Error in uploadAvatar:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Terjadi kesalahan saat mengunggah avatar.",
    };
  }
}

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

    // 2. Do not allow raw Base64 strings to be stored in DB if public URL is expected
    const cleanAvatarUrl =
      validated.avatar_url && validated.avatar_url.startsWith("data:")
        ? null // Prevent bloated base64 insertion
        : validated.avatar_url || null;

    // 3. Store avatar (Public URL only) EXCLUSIVELY in the database table
    try {
      await sql`
        INSERT INTO users (id, email, name, avatar_url, birth_date, occupation, updated_at)
        VALUES (
          ${user.id},
          ${user.email || ""},
          ${validated.name.trim()},
          ${cleanAvatarUrl},
          ${validated.birth_date ? sql`${validated.birth_date}::date` : null},
          ${validated.occupation || null},
          now()
        )
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          avatar_url = COALESCE(${cleanAvatarUrl}, users.avatar_url),
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
      avatar_url: cleanAvatarUrl,
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
