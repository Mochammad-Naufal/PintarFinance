"use server";

import { revalidatePath } from "next/cache";
import { sql } from "@/db";
import { getCurrentUser } from "@/lib/supabase/user";
import {
  type ActionResult,
  type Category,
  type CategoryInput,
  categorySchema,
} from "@/types/finance";
import { ALL_DEFAULT_CATEGORIES } from "@/lib/constants/categories";

// ─── Ensure Default Categories Exist in Database ─────────────────────────────
async function ensureDefaultCategories() {
  try {
    const existing = await sql`SELECT name, type FROM categories WHERE user_id IS NULL`;
    const existingSet = new Set(existing.map((r) => `${r.type}-${(r.name as string).toLowerCase()}`));

    for (const cat of ALL_DEFAULT_CATEGORIES) {
      const key = `${cat.type}-${cat.name.toLowerCase()}`;
      if (!existingSet.has(key)) {
        await sql`
          INSERT INTO categories (name, type, icon, color, user_id)
          VALUES (${cat.name}, ${cat.type}, ${cat.icon}, ${cat.color}, NULL)
          ON CONFLICT DO NOTHING
        `;
      }
    }
  } catch (err) {
    console.warn("Could not ensure default categories:", err);
  }
}

// ─── Get Categories (System Default + User Custom) ───────────────────────────
export async function getCategories(
  type?: "expense" | "income"
): Promise<Category[]> {
  try {
    const user = await getCurrentUser();

    // Query categories with active transaction counts
    const rows = await sql`
      SELECT 
        c.id,
        c.user_id,
        c.name,
        c.type,
        c.icon,
        c.color,
        c.created_at::text,
        COALESCE(t_count.total, 0)::int AS transaction_count
      FROM categories c
      LEFT JOIN (
        SELECT category_id, COUNT(*) AS total
        FROM transactions
        WHERE user_id = ${user.id} AND deleted_at IS NULL
        GROUP BY category_id
      ) t_count ON t_count.category_id = c.id
      WHERE (c.user_id = ${user.id} OR c.user_id IS NULL)
        ${type ? sql`AND c.type = ${type}` : sql``}
      ORDER BY 
        CASE WHEN c.user_id = ${user.id} THEN 0 ELSE 1 END,
        c.name ASC
    `;

    // Deduplicate categories by (type + lower(name)) prioritizing user-specific categories
    const categoryMap = new Map<string, Category>();
    for (const row of rows) {
      const isDefault = row.user_id === null;
      const cat: Category = {
        id: row.id as string,
        user_id: row.user_id as string | null,
        name: row.name as string,
        type: row.type as Category["type"],
        icon: row.icon as string,
        color: row.color as string,
        is_default: isDefault,
        transaction_count: Number(row.transaction_count || 0),
        created_at: row.created_at as string,
      };
      const key = `${cat.type}-${cat.name.trim().toLowerCase()}`;
      if (!categoryMap.has(key)) {
        categoryMap.set(key, cat);
      }
    }

    const result = Array.from(categoryMap.values());

    // If result is empty, return static default list fallback
    if (result.length === 0) {
      void ensureDefaultCategories();
      return ALL_DEFAULT_CATEGORIES.filter((c) => !type || c.type === type).map(
        (c, idx) => ({
          id: `default-${c.type}-${idx}`,
          user_id: null,
          name: c.name,
          type: c.type,
          icon: c.icon,
          color: c.color,
          is_default: true,
          transaction_count: 0,
          created_at: new Date().toISOString(),
        })
      );
    }

    return result.sort((a, b) => {
      // User custom first, then alphabetical
      if (a.is_default !== b.is_default) {
        return a.is_default ? 1 : -1;
      }
      return a.name.localeCompare(b.name, "id");
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    return ALL_DEFAULT_CATEGORIES.filter((c) => !type || c.type === type).map(
      (c, idx) => ({
        id: `default-${c.type}-${idx}`,
        user_id: null,
        name: c.name,
        type: c.type,
        icon: c.icon,
        color: c.color,
        is_default: true,
        transaction_count: 0,
        created_at: new Date().toISOString(),
      })
    );
  }
}

// ─── Create Custom Category ──────────────────────────────────────────────────
export async function createCategory(
  rawInput: CategoryInput
): Promise<ActionResult<Category>> {
  try {
    const user = await getCurrentUser();
    const validated = categorySchema.parse(rawInput);

    // Check duplicate name for this user & type
    const existing = await sql`
      SELECT id FROM categories
      WHERE (user_id = ${user.id} OR user_id IS NULL)
        AND type = ${validated.type}
        AND LOWER(TRIM(name)) = LOWER(TRIM(${validated.name}))
      LIMIT 1
    `;

    if (existing.length > 0) {
      return {
        success: false,
        error: `Kategori "${validated.name}" untuk tipe ${
          validated.type === "expense" ? "Pengeluaran" : "Pemasukan"
        } sudah ada.`,
      };
    }

    const [row] = await sql`
      INSERT INTO categories (
        user_id,
        name,
        type,
        icon,
        color
      ) VALUES (
        ${user.id},
        ${validated.name.trim()},
        ${validated.type},
        ${validated.icon},
        ${validated.color}
      )
      RETURNING id, user_id, name, type, icon, color, created_at::text
    `;

    revalidatePath("/categories");
    revalidatePath("/transactions");
    revalidatePath("/dashboard");

    return {
      success: true,
      data: {
        id: row.id as string,
        user_id: row.user_id as string | null,
        name: row.name as string,
        type: row.type as Category["type"],
        icon: row.icon as string,
        color: row.color as string,
        is_default: false,
        transaction_count: 0,
        created_at: row.created_at as string,
      },
    };
  } catch (error) {
    console.error("Error creating category:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal membuat kategori baru.",
    };
  }
}

// ─── Update Custom Category ──────────────────────────────────────────────────
export async function updateCategory(
  id: string,
  rawInput: CategoryInput
): Promise<ActionResult<Category>> {
  try {
    const user = await getCurrentUser();
    const validated = categorySchema.parse(rawInput);

    // Verify ownership
    const [cat] = await sql`
      SELECT id, user_id FROM categories WHERE id = ${id}
    `;

    if (!cat) {
      return { success: false, error: "Kategori tidak ditemukan." };
    }

    if (cat.user_id === null) {
      return {
        success: false,
        error: "Kategori bawaan sistem tidak dapat diubah.",
      };
    }

    if (cat.user_id !== user.id) {
      return { success: false, error: "Anda tidak memiliki akses ke kategori ini." };
    }

    const [row] = await sql`
      UPDATE categories
      SET 
        name = ${validated.name.trim()},
        type = ${validated.type},
        icon = ${validated.icon},
        color = ${validated.color}
      WHERE id = ${id} AND user_id = ${user.id}
      RETURNING id, user_id, name, type, icon, color, created_at::text
    `;

    revalidatePath("/categories");
    revalidatePath("/transactions");
    revalidatePath("/dashboard");

    return {
      success: true,
      data: {
        id: row.id as string,
        user_id: row.user_id as string | null,
        name: row.name as string,
        type: row.type as Category["type"],
        icon: row.icon as string,
        color: row.color as string,
        is_default: false,
        created_at: row.created_at as string,
      },
    };
  } catch (error) {
    console.error("Error updating category:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal memperbarui kategori.",
    };
  }
}

// ─── Check Category Usage ────────────────────────────────────────────────────
export async function getCategoryUsage(
  id: string
): Promise<{ inUse: boolean; transactionCount: number; budgetCount: number }> {
  try {
    const user = await getCurrentUser();
    const [txRow, budgetRow] = await Promise.all([
      sql`
        SELECT COUNT(*)::int AS count 
        FROM transactions 
        WHERE category_id = ${id} AND user_id = ${user.id} AND deleted_at IS NULL
      `,
      sql`
        SELECT COUNT(*)::int AS count 
        FROM budgets 
        WHERE category_id = ${id} AND user_id = ${user.id}
      `,
    ]);

    const transactionCount = Number(txRow[0]?.count || 0);
    const budgetCount = Number(budgetRow[0]?.count || 0);

    return {
      inUse: transactionCount > 0 || budgetCount > 0,
      transactionCount,
      budgetCount,
    };
  } catch (error) {
    console.error("Error checking category usage:", error);
    return { inUse: false, transactionCount: 0, budgetCount: 0 };
  }
}

// ─── Delete Custom Category ──────────────────────────────────────────────────
export async function deleteCategory(id: string): Promise<ActionResult<boolean>> {
  try {
    const user = await getCurrentUser();

    // Verify ownership
    const [cat] = await sql`
      SELECT id, user_id, name FROM categories WHERE id = ${id}
    `;

    if (!cat) {
      return { success: false, error: "Kategori tidak ditemukan." };
    }

    if (cat.user_id === null) {
      return {
        success: false,
        error: "Kategori bawaan sistem tidak dapat dihapus.",
      };
    }

    if (cat.user_id !== user.id) {
      return { success: false, error: "Anda tidak memiliki izin menghapus kategori ini." };
    }

    // Check usage
    const usage = await getCategoryUsage(id);
    if (usage.inUse) {
      return {
        success: false,
        error: `Kategori "${cat.name}" sedang digunakan oleh ${usage.transactionCount} transaksi aktif dan ${usage.budgetCount} anggaran. Hapus atau pindahkan transaksi terkait terlebih dahulu.`,
      };
    }

    await sql`
      DELETE FROM categories
      WHERE id = ${id} AND user_id = ${user.id}
    `;

    revalidatePath("/categories");
    revalidatePath("/transactions");
    revalidatePath("/dashboard");

    return { success: true, data: true };
  } catch (error) {
    console.error("Error deleting category:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal menghapus kategori.",
    };
  }
}
