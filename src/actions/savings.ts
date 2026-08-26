"use server";

import { revalidatePath } from "next/cache";
import { sql } from "@/db";
import { getCurrentUser } from "@/lib/supabase/user";
import {
  type ActionResult,
  type SavingsGoal,
  type SavingsGoalInput,
  type SavingsGoalInvite,
  type SavingsGoalMember,
  savingsGoalSchema,
} from "@/types/finance";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.NODE_ENV === "production"
    ? "https://pintarfinance.id"
    : "http://localhost:3000");

// ─── Ensure Tables Helper ─────────────────────────────────────────────────────

async function ensureSavingsTables() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS savings_goal_members (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        goal_id     UUID NOT NULL REFERENCES savings_goals(id) ON DELETE CASCADE,
        user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        role        VARCHAR(20) NOT NULL CHECK (role IN ('owner','member')) DEFAULT 'member',
        joined_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
        UNIQUE (goal_id, user_id)
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS savings_goal_invites (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        goal_id     UUID NOT NULL REFERENCES savings_goals(id) ON DELETE CASCADE,
        inviter_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        invite_code VARCHAR(32) UNIQUE NOT NULL,
        expires_at  TIMESTAMPTZ NOT NULL,
        is_used     BOOLEAN NOT NULL DEFAULT false,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `;
  } catch (err) {
    console.error("Error creating savings collaborative tables:", err);
  }
}

// ─── Query Savings Goals (Owned & Joined) ─────────────────────────────────────

export async function getSavingsGoals(): Promise<SavingsGoal[]> {
  try {
    await ensureSavingsTables();
    const user = await getCurrentUser();

    // 1. Fetch goals where user is owner OR listed in savings_goal_members
    const rows = await sql`
      SELECT DISTINCT
        s.id,
        s.user_id,
        s.name,
        s.target_amount,
        s.current_amount,
        s.target_date::text,
        s.icon,
        s.color,
        s.is_completed,
        s.created_at::text,
        s.updated_at::text,
        s.deleted_at::text,
        u.name AS owner_name,
        COALESCE(m.role, CASE WHEN s.user_id = ${user.id} THEN 'owner' ELSE 'member' END) AS user_role
      FROM savings_goals s
      LEFT JOIN users u ON u.id = s.user_id
      LEFT JOIN savings_goal_members m ON m.goal_id = s.id AND m.user_id = ${user.id}
      WHERE (s.user_id = ${user.id} OR m.user_id = ${user.id})
        AND s.deleted_at IS NULL
      ORDER BY s.created_at ASC
    `;

    if (rows.length === 0) return [];

    const goalIds = rows.map((r) => r.id as string);

    // 2. Fetch all members for these goals
    const memberRows = await sql`
      SELECT 
        m.id,
        m.goal_id,
        m.user_id,
        m.role,
        m.joined_at::text,
        u.name AS user_name,
        u.email AS user_email,
        u.avatar_url AS user_avatar
      FROM savings_goal_members m
      JOIN users u ON u.id = m.user_id
      WHERE m.goal_id = ANY(${goalIds})
      ORDER BY m.joined_at ASC
    `;

    // 3. Compute contributions per member per goal from transactions table
    const contributionRows = await sql`
      SELECT 
        savings_goal_id,
        user_id,
        COALESCE(SUM(amount), 0) AS total_contributed
      FROM transactions
      WHERE savings_goal_id = ANY(${goalIds})
        AND type = 'saving'
        AND deleted_at IS NULL
      GROUP BY savings_goal_id, user_id
    `;

    const contributionMap = new Map<string, number>();
    for (const c of contributionRows) {
      contributionMap.set(`${c.savings_goal_id}_${c.user_id}`, Number(c.total_contributed));
    }

    // Group members by goal
    const membersByGoal = new Map<string, SavingsGoalMember[]>();
    for (const m of memberRows) {
      const gId = m.goal_id as string;
      const uId = m.user_id as string;
      const contributed = contributionMap.get(`${gId}_${uId}`) || 0;

      const memberObj: SavingsGoalMember = {
        id: m.id as string,
        goal_id: gId,
        user_id: uId,
        role: m.role as "owner" | "member",
        joined_at: m.joined_at as string,
        user_name: (m.user_name as string) || undefined,
        user_email: (m.user_email as string) || undefined,
        user_avatar: (m.user_avatar as string) || null,
        total_contributed: contributed,
      };

      if (!membersByGoal.has(gId)) {
        membersByGoal.set(gId, []);
      }
      membersByGoal.get(gId)!.push(memberObj);
    }

    return rows.map((row) => {
      const gId = row.id as string;
      let members = membersByGoal.get(gId) || [];

      // Fallback: if no rows in savings_goal_members yet, ensure owner is represented
      if (members.length === 0) {
        members = [
          {
            id: `owner_${gId}`,
            goal_id: gId,
            user_id: row.user_id as string,
            role: "owner",
            joined_at: row.created_at as string,
            user_name: (row.owner_name as string) || "Pemilik",
            total_contributed: Number(row.current_amount),
          },
        ];
      }

      const isShared = members.length > 1;

      return {
        id: gId,
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
        owner_name: (row.owner_name as string) || undefined,
        user_role: (row.user_role as "owner" | "member") || (row.user_id === user.id ? "owner" : "member"),
        is_shared: isShared,
        members,
      };
    });
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
    await ensureSavingsTables();
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

    // Also register creator as owner in savings_goal_members
    await sql`
      INSERT INTO savings_goal_members (goal_id, user_id, role)
      VALUES (${inserted.id}, ${user.id}, 'owner')
      ON CONFLICT (goal_id, user_id) DO NOTHING
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
        user_role: "owner",
        is_shared: false,
        members: [
          {
            id: `owner_${inserted.id}`,
            goal_id: inserted.id as string,
            user_id: user.id,
            role: "owner",
            joined_at: inserted.created_at as string,
            user_name: user.name,
            total_contributed: Number(inserted.current_amount),
          },
        ],
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
        AND (user_id = ${user.id} OR id IN (SELECT goal_id FROM savings_goal_members WHERE user_id = ${user.id}))
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
        error: "Target impian tidak ditemukan atau Anda tidak memiliki akses.",
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

// ─── Delete Savings Goal (Owner Only) ─────────────────────────────────────────

export async function deleteSavingsGoal(id: string): Promise<ActionResult> {
  try {
    const user = await getCurrentUser();

    // Verify user is the OWNER
    const [goal] = await sql`
      SELECT id, user_id FROM savings_goals
      WHERE id = ${id} AND deleted_at IS NULL
    `;

    if (!goal) {
      return { success: false, error: "Target impian tidak ditemukan." };
    }

    if (goal.user_id !== user.id) {
      return {
        success: false,
        error: "Hanya pemilik (owner) yang dapat menghapus pos tabungan bersama.",
      };
    }

    await sql`
      UPDATE savings_goals
      SET 
        deleted_at = now(),
        updated_at = now()
      WHERE id = ${id}
        AND user_id = ${user.id}
    `;

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

// ─── Leave Shared Savings Goal (Member Only) ─────────────────────────────────

export async function leaveSavingsGoal(goalId: string): Promise<ActionResult> {
  try {
    const user = await getCurrentUser();

    const [member] = await sql`
      SELECT id, role FROM savings_goal_members
      WHERE goal_id = ${goalId} AND user_id = ${user.id}
    `;

    if (!member) {
      return { success: false, error: "Anda bukan anggota dari pos tabungan ini." };
    }

    if (member.role === "owner") {
      return {
        success: false,
        error: "Pemilik pos tabungan tidak dapat keluar. Anda dapat menghapus pos tabungan jika diinginkan.",
      };
    }

    await sql`
      DELETE FROM savings_goal_members
      WHERE goal_id = ${goalId} AND user_id = ${user.id}
    `;

    revalidatePath("/savings");
    revalidatePath("/dashboard");

    return { success: true };
  } catch (error) {
    console.error("Error leaving savings goal:", error);
    return { success: false, error: "Gagal keluar dari pos tabungan bersama." };
  }
}

// ─── Create Savings Goal Invite Link ──────────────────────────────────────────

export async function createSavingsInviteLink(
  goalId: string
): Promise<ActionResult<{ inviteCode: string; inviteUrl: string }>> {
  try {
    await ensureSavingsTables();
    const user = await getCurrentUser();

    // Verify user is owner or member
    const [goal] = await sql`
      SELECT s.id, s.name FROM savings_goals s
      LEFT JOIN savings_goal_members m ON m.goal_id = s.id AND m.user_id = ${user.id}
      WHERE s.id = ${goalId}
        AND (s.user_id = ${user.id} OR m.user_id = ${user.id})
        AND s.deleted_at IS NULL
    `;

    if (!goal) {
      return {
        success: false,
        error: "Pos tabungan tidak ditemukan atau Anda tidak memiliki izin.",
      };
    }

    // Generate random unique alphanumeric code
    const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
    const inviteCode = `SAV-${randomSuffix}`;
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days

    await sql`
      INSERT INTO savings_goal_invites (
        goal_id,
        inviter_id,
        invite_code,
        expires_at
      ) VALUES (
        ${goalId},
        ${user.id},
        ${inviteCode},
        ${expiresAt}
      )
    `;

    const inviteUrl = `${SITE_URL}/savings/join?code=${inviteCode}`;

    return {
      success: true,
      data: {
        inviteCode,
        inviteUrl,
      },
    };
  } catch (error) {
    console.error("Error creating savings invite link:", error);
    return { success: false, error: "Gagal membuat tautan undangan." };
  }
}

// ─── Get Savings Invite Details (for Join Preview) ─────────────────────────────

export async function getSavingsInviteDetails(
  inviteCode: string
): Promise<ActionResult<SavingsGoalInvite>> {
  try {
    await ensureSavingsTables();
    const [invite] = await sql`
      SELECT 
        i.id,
        i.goal_id,
        i.inviter_id,
        i.invite_code,
        i.expires_at::text,
        i.is_used,
        i.created_at::text,
        s.name AS goal_name,
        s.target_amount,
        s.current_amount,
        u.name AS inviter_name
      FROM savings_goal_invites i
      JOIN savings_goals s ON s.id = i.goal_id
      JOIN users u ON u.id = i.inviter_id
      WHERE i.invite_code = ${inviteCode.trim()}
        AND s.deleted_at IS NULL
    `;

    if (!invite) {
      return { success: false, error: "Kode undangan tidak valid atau pos tabungan sudah dihapus." };
    }

    const isExpired = new Date(invite.expires_at as string) < new Date();
    if (isExpired) {
      return { success: false, error: "Tautan undangan telah kadaluarsa." };
    }

    return {
      success: true,
      data: {
        id: invite.id as string,
        goal_id: invite.goal_id as string,
        inviter_id: invite.inviter_id as string,
        invite_code: invite.invite_code as string,
        expires_at: invite.expires_at as string,
        is_used: Boolean(invite.is_used),
        created_at: invite.created_at as string,
        goal_name: invite.goal_name as string,
        target_amount: Number(invite.target_amount),
        current_amount: Number(invite.current_amount),
        inviter_name: invite.inviter_name as string,
      },
    };
  } catch (error) {
    console.error("Error fetching invite details:", error);
    return { success: false, error: "Gagal memverifikasi kode undangan." };
  }
}

// ─── Join Savings Goal with Code ──────────────────────────────────────────────

export async function joinSavingsGoalWithCode(
  inviteCode: string
): Promise<ActionResult<{ goalId: string }>> {
  try {
    await ensureSavingsTables();
    const user = await getCurrentUser();

    // 1. Verify invite
    const [invite] = await sql`
      SELECT i.id, i.goal_id, i.expires_at, s.name AS goal_name, s.user_id AS owner_id
      FROM savings_goal_invites i
      JOIN savings_goals s ON s.id = i.goal_id
      WHERE i.invite_code = ${inviteCode.trim()}
        AND s.deleted_at IS NULL
    `;

    if (!invite) {
      return { success: false, error: "Kode undangan tidak valid." };
    }

    if (new Date(invite.expires_at as string) < new Date()) {
      return { success: false, error: "Kode undangan telah kadaluarsa." };
    }

    // 2. Check if already owner or member
    if (invite.owner_id === user.id) {
      return {
        success: false,
        error: "Anda adalah pemilik pos tabungan ini.",
      };
    }

    const [existingMember] = await sql`
      SELECT id FROM savings_goal_members
      WHERE goal_id = ${invite.goal_id} AND user_id = ${user.id}
    `;

    if (existingMember) {
      return {
        success: true,
        data: { goalId: invite.goal_id as string },
      };
    }

    // 3. Insert user as member
    await sql`
      INSERT INTO savings_goal_members (
        goal_id,
        user_id,
        role
      ) VALUES (
        ${invite.goal_id},
        ${user.id},
        'member'
      )
      ON CONFLICT (goal_id, user_id) DO NOTHING
    `;

    revalidatePath("/savings");
    revalidatePath("/dashboard");

    return {
      success: true,
      data: { goalId: invite.goal_id as string },
    };
  } catch (error) {
    console.error("Error joining savings goal:", error);
    return { success: false, error: "Gagal bergabung ke pos tabungan bersama." };
  }
}
