"use server";

import { revalidatePath } from "next/cache";
import { sql } from "@/db";
import { getCurrentUser } from "@/lib/supabase/user";
import {
  type ActionResult,
  type AppNotification,
  type NotificationType,
} from "@/types/finance";
import { formatCurrency, formatDate } from "@/lib/utils";

// ─── Ensure Notifications Table Helper ────────────────────────────────────────

async function ensureNotificationsTable() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS notifications (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type        VARCHAR(30) NOT NULL CHECK (type IN ('budget_warning','recurring_due','goal_reached','system')),
        title       VARCHAR(255) NOT NULL,
        message     TEXT NOT NULL,
        link        VARCHAR(255),
        is_read     BOOLEAN NOT NULL DEFAULT false,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `;
  } catch (err) {
    console.error("Error creating notifications table:", err);
  }
}

// ─── Trigger Financial Alert Engine ───────────────────────────────────────────

export async function checkAndGenerateFinancialAlerts(): Promise<void> {
  try {
    await ensureNotificationsTable();
    const user = await getCurrentUser();

    const now = new Date();
    const currentPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const startOfMonth = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1, 0, 0, 0)).toISOString();
    const endOfMonth = new Date(Date.UTC(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)).toISOString();
    const todayStr = now.toISOString().slice(0, 10);

    // ── 1. Evaluate Budget Warnings (>= 80% and >= 100%) ─────────────────────
    const budgetRows = await sql`
      SELECT 
        b.id,
        b.limit_amount,
        c.name AS category_name,
        COALESCE(SUM(t.amount + t.admin_fee), 0) AS spent_amount
      FROM budgets b
      JOIN categories c ON c.id = b.category_id
      LEFT JOIN transactions t ON t.category_id = b.category_id
        AND t.user_id = ${user.id}
        AND t.deleted_at IS NULL
        AND t.type = 'expense'
        AND t.transaction_date >= ${startOfMonth}::timestamptz
        AND t.transaction_date <= ${endOfMonth}::timestamptz
      WHERE b.user_id = ${user.id}
        AND b.period = ${currentPeriod}
      GROUP BY b.id, b.limit_amount, c.name
    `;

    for (const b of budgetRows) {
      const limit = Number(b.limit_amount);
      const spent = Number(b.spent_amount);
      if (limit <= 0) continue;

      const percentage = Math.round((spent / limit) * 100);

      if (percentage >= 80) {
        const isOver = percentage >= 100;
        const title = isOver
          ? `Overbudget: Kategori ${b.category_name}`
          : `Peringatan: Anggaran ${b.category_name} (${percentage}%)`;

        const message = isOver
          ? `Pengeluaran kategori ${b.category_name} telah melampaui batas anggaran (Total: ${formatCurrency(spent)} dari limit ${formatCurrency(limit)}).`
          : `Pengeluaran kategori ${b.category_name} telah mencapai ${percentage}% dari batas anggaran bulanan Rp ${formatCurrency(limit)}.`;

        // Idempotency: avoid duplicating the same budget alert within 24h
        const [recent] = await sql`
          SELECT id FROM notifications
          WHERE user_id = ${user.id}
            AND type = 'budget_warning'
            AND title = ${title}
            AND created_at >= now() - INTERVAL '24 hours'
        `;

        if (!recent) {
          await sql`
            INSERT INTO notifications (user_id, type, title, message, link)
            VALUES (${user.id}, 'budget_warning', ${title}, ${message}, '/budgets')
          `;
        }
      }
    }

    // ── 2. Evaluate Recurring Bills Due (today or tomorrow) ───────────────────
    const dueRecurring = await sql`
      SELECT 
        id,
        description,
        amount,
        next_run_date::text,
        type
      FROM recurring_transactions
      WHERE user_id = ${user.id}
        AND is_active = true
        AND deleted_at IS NULL
        AND next_run_date <= (${todayStr}::date + INTERVAL '1 day')
    `;

    for (const r of dueRecurring) {
      const amount = Number(r.amount);
      const nextRun = r.next_run_date as string;
      const isToday = nextRun <= todayStr;
      const title = `Tagihan ${r.description} ${isToday ? "Jatuh Tempo Hari Ini" : "Jatuh Tempo Besok"}`;
      const message = `Tagihan ${r.description} sebesar ${formatCurrency(amount)} dijadwalkan jatuh tempo pada ${formatDate(nextRun, "d MMMM yyyy")}.`;

      const [recent] = await sql`
        SELECT id FROM notifications
        WHERE user_id = ${user.id}
          AND type = 'recurring_due'
          AND title = ${title}
          AND created_at >= now() - INTERVAL '24 hours'
      `;

      if (!recent) {
        await sql`
          INSERT INTO notifications (user_id, type, title, message, link)
          VALUES (${user.id}, 'recurring_due', ${title}, ${message}, '/transactions')
        `;
      }
    }

    // ── 3. Evaluate Savings Goals 100% Reached ────────────────────────────────
    const reachedGoals = await sql`
      SELECT id, name, target_amount, current_amount
      FROM savings_goals
      WHERE user_id = ${user.id}
        AND current_amount >= target_amount
        AND deleted_at IS NULL
    `;

    for (const g of reachedGoals) {
      const target = Number(g.target_amount);
      const title = `🎉 Target Impian Tercapai: ${g.name}!`;
      const message = `Selamat! Pos tabungan impian "${g.name}" telah berhasil mencapai 100% (Terkumpul ${formatCurrency(target)}).`;

      const [recent] = await sql`
        SELECT id FROM notifications
        WHERE user_id = ${user.id}
          AND type = 'goal_reached'
          AND title = ${title}
          AND created_at >= now() - INTERVAL '7 days'
      `;

      if (!recent) {
        await sql`
          INSERT INTO notifications (user_id, type, title, message, link)
          VALUES (${user.id}, 'goal_reached', ${title}, ${message}, '/savings')
        `;
      }
    }
  } catch (error) {
    console.error("Error generating financial alerts:", error);
  }
}

// ─── Get Notifications & Unread Count ─────────────────────────────────────────

export async function getNotifications(): Promise<{
  notifications: AppNotification[];
  unreadCount: number;
}> {
  try {
    await ensureNotificationsTable();
    const user = await getCurrentUser();

    // Trigger financial alert evaluator
    await checkAndGenerateFinancialAlerts();

    const [rows, [countRow]] = await Promise.all([
      sql`
        SELECT 
          id,
          user_id,
          type,
          title,
          message,
          link,
          is_read,
          created_at::text
        FROM notifications
        WHERE user_id = ${user.id}
        ORDER BY created_at DESC
        LIMIT 25
      `,
      sql`
        SELECT COUNT(*)::int AS count
        FROM notifications
        WHERE user_id = ${user.id}
          AND is_read = false
      `,
    ]);

    const notifications: AppNotification[] = rows.map((r) => ({
      id: r.id as string,
      user_id: r.user_id as string,
      type: r.type as NotificationType,
      title: r.title as string,
      message: r.message as string,
      link: (r.link as string) || null,
      is_read: Boolean(r.is_read),
      created_at: r.created_at as string,
    }));

    return {
      notifications,
      unreadCount: Number(countRow?.count || 0),
    };
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return {
      notifications: [],
      unreadCount: 0,
    };
  }
}

// ─── Mark Single Notification As Read ─────────────────────────────────────────

export async function markAsRead(id: string): Promise<ActionResult> {
  try {
    const user = await getCurrentUser();
    await sql`
      UPDATE notifications
      SET is_read = true
      WHERE id = ${id}
        AND user_id = ${user.id}
    `;

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return { success: false, error: "Gagal memperbarui notifikasi" };
  }
}

// ─── Mark All Notifications As Read ───────────────────────────────────────────

export async function markAllAsRead(): Promise<ActionResult> {
  try {
    const user = await getCurrentUser();
    await sql`
      UPDATE notifications
      SET is_read = true
      WHERE user_id = ${user.id}
        AND is_read = false
    `;

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    return { success: false, error: "Gagal memperbarui semua notifikasi" };
  }
}
