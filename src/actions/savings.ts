"use server";

import { revalidatePath } from "next/cache";
import { sql } from "@/db";
import { getCurrentUser } from "@/lib/supabase/user";
import {
  type ActionResult,
  type SavingsGoal,
  type SavingsGoalInput,
  savingsGoalSchema,
} from "@/types/finance";

// ─── Query Savings Goals ──────────────────────────────────────────────────────

export async function getSavingsGoals(): Promise<SavingsGoal[]> {
  try {
    const user = await getCurrentUser();
    const rows = await sql`
      SELECT 
        id,
        user_id,
        name,
        target_amount,
        current_amount,
        target_date::text,
        icon,
        color,
        is_completed,
        created_at::text,
        updated_at::text,
        deleted_at::text
      FROM savings_goals
      WHERE user_id = ${user.id}
        AND deleted_at IS NULL
      ORDER BY created_at ASC
    `;

    return rows.map((row) => ({
      id: row.id as string,
      user_id: row.user_id as string,
      name: row.name as string,
      target_amount: Number(row.target_amount),
      current_amount: Number(row.current_amount),
      target_date: row.target_date as string | null,
      icon: row.icon as string,
      color: row.color as string,
      is_completed: Boolean(row.is_completed),
      created_at: row.created_at as string,
      updated_at: row.updated_at as string,
      deleted_at: row.deleted_at as string | null,
    }));
  } catch (error) {
    console.error("Error fetching savings goals:", error);
    return [];
  }
}

// ─── Create Savings Goal ──────────────────────────────────────────────────────

export async function createSavingsGoal(
  data: SavingsGoalInput
): Promise<ActionResult<SavingsGoal>> {
  const parsed = savingsGoalSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Validasi data gagal",
    };
  }

  const { name, target_amount, current_amount, target_date, color, icon } =
    parsed.data;
  const is_completed = current_amount >= target_amount;

  try {
    const user = await getCurrentUser();
    const [inserted] = await sql`
      INSERT INTO savings_goals (
        user_id,
        name,
        target_amount,
        current_amount,
        target_date,
        color,
        icon,
        is_completed
      ) VALUES (
        ${user.id},
        ${name},
        ${target_amount},
        ${current_amount},
        ${target_date},
        ${color},
        ${icon},
        ${is_completed}
      )
      RETURNING 
        id,
        user_id,
        name,
        target_amount,
        current_amount,
        target_date::text,
        icon,
        color,
        is_completed,
        created_at::text,
        updated_at::text,
        deleted_at::text
    `;

    revalidatePath("/savings");
    revalidatePath("/dashboard");

    return {
      success: true,
      data: {
        id: inserted.id as string,
        user_id: inserted.user_id as string,
        name: inserted.name as string,
        target_amount: Number(inserted.target_amount),
        current_amount: Number(inserted.current_amount),
        target_date: inserted.target_date as string | null,
        icon: inserted.icon as string,
        color: inserted.color as string,
        is_completed: Boolean(inserted.is_completed),
        created_at: inserted.created_at as string,
        updated_at: inserted.updated_at as string,
        deleted_at: inserted.deleted_at as string | null,
      },
    };
  } catch (error) {
    console.error("Error creating savings goal:", error);
    return {
      success: false,
      error: "Gagal menambahkan target impian baru. Silakan coba lagi.",
    };
  }
}

// ─── Update Savings Goal ──────────────────────────────────────────────────────

export async function updateSavingsGoal(
  id: string,
  data: SavingsGoalInput
): Promise<ActionResult<SavingsGoal>> {
  const parsed = savingsGoalSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Validasi data gagal",
    };
  }

  const { name, target_amount, current_amount, target_date, color, icon } =
    parsed.data;
  const is_completed = current_amount >= target_amount;

  try {
    const user = await getCurrentUser();
    const [updated] = await sql`
      UPDATE savings_goals
      SET
        name = ${name},
        target_amount = ${target_amount},
        current_amount = ${current_amount},
        target_date = ${target_date},
        color = ${color},
        icon = ${icon},
        is_completed = ${is_completed},
        updated_at = now()
      WHERE id = ${id}
        AND user_id = ${user.id}
        AND deleted_at IS NULL
      RETURNING 
        id,
        user_id,
        name,
        target_amount,
        current_amount,
        target_date::text,
        icon,
        color,
        is_completed,
        created_at::text,
        updated_at::text,
        deleted_at::text
    `;

    if (!updated) {
      return {
        success: false,
        error: "Target impian tidak ditemukan atau sudah dihapus.",
      };
    }

    revalidatePath("/savings");
    revalidatePath("/dashboard");

    return {
      success: true,
      data: {
        id: updated.id as string,
        user_id: updated.user_id as string,
        name: updated.name as string,
        target_amount: Number(updated.target_amount),
        current_amount: Number(updated.current_amount),
        target_date: updated.target_date as string | null,
        icon: updated.icon as string,
        color: updated.color as string,
        is_completed: Boolean(updated.is_completed),
        created_at: updated.created_at as string,
        updated_at: updated.updated_at as string,
        deleted_at: updated.deleted_at as string | null,
      },
    };
  } catch (error) {
    console.error("Error updating savings goal:", error);
    return {
      success: false,
      error: "Gagal memperbarui target impian. Silakan coba lagi.",
    };
  }
}

// ─── Delete Savings Goal (Soft-delete) ────────────────────────────────────────

export async function deleteSavingsGoal(id: string): Promise<ActionResult> {
  try {
    const user = await getCurrentUser();
    const [deleted] = await sql`
      UPDATE savings_goals
      SET 
        deleted_at = now(),
        updated_at = now()
      WHERE id = ${id}
        AND user_id = ${user.id}
        AND deleted_at IS NULL
      RETURNING id
    `;

    if (!deleted) {
      return {
        success: false,
        error: "Target impian tidak ditemukan atau sudah dihapus.",
      };
    }

    revalidatePath("/savings");
    revalidatePath("/dashboard");

    return { success: true };
  } catch (error) {
    console.error("Error deleting savings goal:", error);
    return {
      success: false,
      error: "Gagal menghapus target impian. Silakan coba lagi.",
    };
  }
}
