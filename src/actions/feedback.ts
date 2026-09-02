"use server";

import { sql } from "@/db";
import { getCurrentUser } from "@/lib/supabase/user";
import {
  type ActionResult,
  type FeedbackInput,
  type UserFeedback,
  feedbackSchema,
} from "@/types/finance";
import { getUserProfile } from "./profile";

// ─── Ensure User Feedbacks Table Exists ──────────────────────────────────────
async function ensureFeedbackTable() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS user_feedbacks (
        id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id       UUID REFERENCES users(id) ON DELETE SET NULL,
        user_name     VARCHAR(100),
        user_email    VARCHAR(150),
        category      VARCHAR(30) NOT NULL CHECK (category IN ('bug', 'feature_request', 'question', 'other')),
        message       TEXT NOT NULL,
        is_anonymous  BOOLEAN NOT NULL DEFAULT false,
        status        VARCHAR(20) NOT NULL DEFAULT 'unread' CHECK (status IN ('unread', 'read', 'resolved')),
        created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_feedbacks_created ON user_feedbacks (created_at DESC)`;
  } catch (err) {
    console.warn("Could not ensure user_feedbacks table:", err);
  }
}

// ─── Submit Feedback ─────────────────────────────────────────────────────────
export async function submitFeedback(
  rawInput: FeedbackInput
): Promise<ActionResult<boolean>> {
  try {
    const user = await getCurrentUser();
    const profile = await getUserProfile();
    await ensureFeedbackTable();

    const validated = feedbackSchema.parse(rawInput);

    const isAnonymous = Boolean(validated.is_anonymous);
    const userId = isAnonymous ? null : user.id;
    const userName = isAnonymous ? "Pengguna Anonim" : profile.name || user.name || "Pengguna";
    const userEmail = isAnonymous ? null : profile.email || user.email || null;

    await sql`
      INSERT INTO user_feedbacks (
        user_id,
        user_name,
        user_email,
        category,
        message,
        is_anonymous
      ) VALUES (
        ${userId},
        ${userName},
        ${userEmail},
        ${validated.category},
        ${validated.message.trim()},
        ${isAnonymous}
      )
    `;

    return {
      success: true,
      data: true,
    };
  } catch (error) {
    console.error("Error submitting user feedback:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal mengirimkan masukan. Silakan coba lagi.",
    };
  }
}

// ─── Get User Feedbacks (Selective Projection) ───────────────────────────────
export async function getUserFeedbacks(): Promise<UserFeedback[]> {
  try {
    const user = await getCurrentUser();
    await ensureFeedbackTable();

    const rows = await sql`
      SELECT 
        id,
        user_id,
        user_name,
        user_email,
        category,
        message,
        is_anonymous,
        status,
        created_at::text
      FROM user_feedbacks
      WHERE user_id = ${user.id}
      ORDER BY created_at DESC
      LIMIT 50
    `;

    return rows.map((r) => ({
      id: r.id as string,
      user_id: r.user_id as string | null,
      user_name: r.user_name as string | null,
      user_email: r.user_email as string | null,
      category: r.category as UserFeedback["category"],
      message: r.message as string,
      is_anonymous: Boolean(r.is_anonymous),
      status: r.status as UserFeedback["status"],
      created_at: r.created_at as string,
    }));
  } catch (error) {
    console.error("Error fetching user feedbacks:", error);
    return [];
  }
}
