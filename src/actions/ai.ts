"use server";

import { sql } from "@/db";
import { getCurrentUser } from "@/lib/supabase/user";
import { parseNLPTransaction, parseVisionReceipt } from "@/lib/ai/client";
import {
  type AIContext,
  type ParsedReceiptResult,
  type ParsedTransactionResult,
} from "@/lib/ai/types";
import { type ActionResult } from "@/types/finance";

// ─── Helper to Fetch Active User Financial Context ───────────────────────────

async function getUserAIContext(): Promise<AIContext> {
  const user = await getCurrentUser();
  const [walletRows, categoryRows, goalRows] = await Promise.all([
    sql`
      SELECT id, name, type 
      FROM wallets 
      WHERE user_id = ${user.id} 
        AND deleted_at IS NULL
      ORDER BY name ASC
    `,
    sql`
      SELECT id, name, type 
      FROM categories 
      WHERE (user_id = ${user.id} OR user_id IS NULL)
      ORDER BY name ASC
    `,
    sql`
      SELECT id, name, target_amount 
      FROM savings_goals 
      WHERE user_id = ${user.id} 
        AND deleted_at IS NULL
      ORDER BY name ASC
    `,
  ]);

  return {
    wallets: walletRows.map((r) => ({
      id: r.id as string,
      name: r.name as string,
      type: r.type as string,
    })),
    categories: categoryRows.map((r) => ({
      id: r.id as string,
      name: r.name as string,
      type: r.type as string,
    })),
    savingsGoals: goalRows.map((r) => ({
      id: r.id as string,
      name: r.name as string,
      target_amount: Number(r.target_amount),
    })),
  };
}

// ─── Parse Quick Entry Natural Language Text ─────────────────────────────────

export async function parseQuickEntryText(
  promptText: string
): Promise<ActionResult<ParsedTransactionResult>> {
  if (!promptText || promptText.trim().length === 0) {
    return {
      success: false,
      error: "Teks perintah tidak boleh kosong",
    };
  }

  try {
    const context = await getUserAIContext();
    const result = await parseNLPTransaction(promptText.trim(), context);

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error("Error in parseQuickEntryText action:", error);
    return {
      success: false,
      error: "Gagal memproses teks dengan Pintar AI.",
    };
  }
}

// ─── Parse Receipt Image with Vision OCR ──────────────────────────────────────

export async function parseReceiptImage(
  formData: FormData
): Promise<ActionResult<ParsedReceiptResult>> {
  try {
    const file = formData.get("image") as File | null;
    if (!file) {
      return {
        success: false,
        error: "File gambar struk tidak ditemukan",
      };
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString("base64");
    const mimeType = file.type || "image/jpeg";

    const context = await getUserAIContext();
    const result = await parseVisionReceipt(base64, mimeType, context);

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error("Error in parseReceiptImage action:", error);
    return {
      success: false,
      error: "Gagal menganalisis gambar struk belanja.",
    };
  }
}
