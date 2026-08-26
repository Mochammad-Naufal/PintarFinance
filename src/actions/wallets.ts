"use server";

import { revalidatePath } from "next/cache";
import { sql, DEMO_USER_ID } from "@/db";
import {
  type ActionResult,
  type Wallet,
  type WalletInput,
  walletSchema,
} from "@/types/finance";

// ─── Query Wallets ────────────────────────────────────────────────────────────

export async function getWallets(): Promise<Wallet[]> {
  try {
    const rows = await sql`
      SELECT 
        id,
        user_id,
        name,
        type,
        balance,
        color,
        icon,
        is_active,
        created_at::text,
        updated_at::text,
        deleted_at::text
      FROM wallets
      WHERE user_id = ${DEMO_USER_ID}
        AND deleted_at IS NULL
      ORDER BY created_at ASC
    `;

    return rows.map((row) => ({
      id: row.id as string,
      user_id: row.user_id as string,
      name: row.name as string,
      type: row.type as Wallet["type"],
      balance: Number(row.balance),
      color: row.color as string,
      icon: row.icon as string,
      is_active: Boolean(row.is_active),
      created_at: row.created_at as string,
      updated_at: row.updated_at as string,
      deleted_at: row.deleted_at as string | null,
    }));
  } catch (error) {
    console.error("Error fetching wallets:", error);
    return [];
  }
}

// ─── Create Wallet ────────────────────────────────────────────────────────────

export async function createWallet(data: WalletInput): Promise<ActionResult<Wallet>> {
  const parsed = walletSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Validasi data gagal",
    };
  }

  const { name, type, balance, color, icon } = parsed.data;

  try {
    const [inserted] = await sql`
      INSERT INTO wallets (
        user_id,
        name,
        type,
        balance,
        color,
        icon
      ) VALUES (
        ${DEMO_USER_ID},
        ${name},
        ${type},
        ${balance},
        ${color},
        ${icon}
      )
      RETURNING 
        id,
        user_id,
        name,
        type,
        balance,
        color,
        icon,
        is_active,
        created_at::text,
        updated_at::text,
        deleted_at::text
    `;

    revalidatePath("/wallets");
    revalidatePath("/dashboard");

    return {
      success: true,
      data: {
        id: inserted.id as string,
        user_id: inserted.user_id as string,
        name: inserted.name as string,
        type: inserted.type as Wallet["type"],
        balance: Number(inserted.balance),
        color: inserted.color as string,
        icon: inserted.icon as string,
        is_active: Boolean(inserted.is_active),
        created_at: inserted.created_at as string,
        updated_at: inserted.updated_at as string,
        deleted_at: inserted.deleted_at as string | null,
      },
    };
  } catch (error) {
    console.error("Error creating wallet:", error);
    return {
      success: false,
      error: "Gagal menambahkan dompet baru. Silakan coba lagi.",
    };
  }
}

// ─── Update Wallet ────────────────────────────────────────────────────────────

export async function updateWallet(
  id: string,
  data: WalletInput
): Promise<ActionResult<Wallet>> {
  const parsed = walletSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Validasi data gagal",
    };
  }

  const { name, type, balance, color, icon } = parsed.data;

  try {
    const [updated] = await sql`
      UPDATE wallets
      SET
        name = ${name},
        type = ${type},
        balance = ${balance},
        color = ${color},
        icon = ${icon},
        updated_at = now()
      WHERE id = ${id}
        AND user_id = ${DEMO_USER_ID}
        AND deleted_at IS NULL
      RETURNING 
        id,
        user_id,
        name,
        type,
        balance,
        color,
        icon,
        is_active,
        created_at::text,
        updated_at::text,
        deleted_at::text
    `;

    if (!updated) {
      return {
        success: false,
        error: "Dompet tidak ditemukan atau sudah dihapus.",
      };
    }

    revalidatePath("/wallets");
    revalidatePath("/dashboard");

    return {
      success: true,
      data: {
        id: updated.id as string,
        user_id: updated.user_id as string,
        name: updated.name as string,
        type: updated.type as Wallet["type"],
        balance: Number(updated.balance),
        color: updated.color as string,
        icon: updated.icon as string,
        is_active: Boolean(updated.is_active),
        created_at: updated.created_at as string,
        updated_at: updated.updated_at as string,
        deleted_at: updated.deleted_at as string | null,
      },
    };
  } catch (error) {
    console.error("Error updating wallet:", error);
    return {
      success: false,
      error: "Gagal memperbarui data dompet. Silakan coba lagi.",
    };
  }
}

// ─── Delete Wallet (Soft-delete) ──────────────────────────────────────────────

export async function deleteWallet(id: string): Promise<ActionResult> {
  try {
    const [deleted] = await sql`
      UPDATE wallets
      SET 
        deleted_at = now(),
        updated_at = now()
      WHERE id = ${id}
        AND user_id = ${DEMO_USER_ID}
        AND deleted_at IS NULL
      RETURNING id
    `;

    if (!deleted) {
      return {
        success: false,
        error: "Dompet tidak ditemukan atau sudah dihapus.",
      };
    }

    revalidatePath("/wallets");
    revalidatePath("/dashboard");

    return { success: true };
  } catch (error) {
    console.error("Error deleting wallet:", error);
    return {
      success: false,
      error: "Gagal menghapus dompet. Silakan coba lagi.",
    };
  }
}
