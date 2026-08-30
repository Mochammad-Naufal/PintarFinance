"use server";

import { sql } from "@/db";
import { getCurrentUser } from "@/lib/supabase/user";
import { type ActionResult } from "@/types/finance";
import { getCurrentPeriod } from "./budgets";
import { getUserProfile } from "./profile";
import { formatCurrency } from "@/lib/utils";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ComprehensiveFinancialContext {
  userName: string;
  age: number | null;
  occupation: string | null;
  netWorth: number;
  totalBalance: number;
  totalSavings: number;
  totalDebts: number;
  monthlyIncome: number;
  monthlyExpense: number;
  netSavings: number;
  savingsRatio: number;
  emergencyRunwayMonths: number;
  debtToIncomeRatio: number;
  debtHealthStatus: "healthy" | "moderate" | "critical" | "debt_free";
  wallets: Array<{ name: string; type: string; balance: number }>;
  topCategories: Array<{ name: string; amount: number; percentage: number }>;
  savingsGoals: Array<{
    name: string;
    targetAmount: number;
    currentAmount: number;
    percentage: number;
    remaining: number;
    isCompleted: boolean;
  }>;
  budgets: Array<{
    categoryName: string;
    limitAmount: number;
    spentAmount: number;
    percentage: number;
    isOver: boolean;
  }>;
  recurringItems: Array<{ description: string; amount: number; frequency: string }>;
}

// ─── Broad & Deep Certified Financial Planner Reasoning Fallback Engine ────────

function generateDeepFinancialConsultation(
  userPrompt: string,
  ctx: ComprehensiveFinancialContext,
  activeContext?: string
): string {
  const query = userPrompt.toLowerCase().trim();
  const name = ctx.userName;
  const occupation = ctx.occupation || "Pekerja Profesional";
  const ageStr = ctx.age ? `${ctx.age} tahun` : "dewasa muda";

  // ── 1. Tanya Konsep Compounding vs Menabung Biasa ────────────────────────────
  if (
    (query.includes("hanya") && query.includes("menabung")) ||
    (query.includes("aset") && query.includes("berbunga")) ||
    query.includes("beda menabung") ||
    query.includes("reinvestasi")
  ) {
    return `Halo **${name}**! Sebagai ${occupation} di usia ${ageStr}, memahami *compound interest* (bunga majemuk) adalah langkah strategis untuk mempercepat kebebasan finansial Anda.

Jawabannya tegas: **Compound interest TIDAK BEKERJA jika uang hanya ditabung di rekening bank biasa atau disimpan tunai.**

Agar efek bunga majemuk (*compound return*) bekerja, uang Anda **wajib ditempatkan pada aset produktif yang menghasilkan imbal hasil (bunga, kupon, dividen, atau capital growth) yang diinvestasikan kembali (reinvested)**.

📊 **Perbandingan Menabung Biasa vs Aset Berbunga:**

1. **Menabung di Rekening Biasa (Bunga ~0%–1%):**
   - Tergerus oleh inflasi (~3%–4%/thn) dan biaya administrasi bulanan (~Rp 15.000/bln).
   - Uang Rp 10 juta selama 5 tahun di tabungan biasa tetap Rp 10 juta, namun daya belinya berkurang.

2. **Meletakkan Uang di Aset Produktif (Bunga Majemuk):**
   - Modal menghasilkan keuntungan di Tahun 1.
   - Di Tahun 2, keuntungan Tahun 1 **bergabung dengan modal pokok** untuk menghasilkan keuntungan baru yang lebih besar (kurva eksponensial).

💡 **Aset yang Mengaktifkan Bunga Majemuk di Indonesia:**
- **Reksadana Pendapatan Tetap / Pasar Uang (RDPU):** Keuntungan otomatis terakumulasi dalam NAB.
- **Surat Berharga Negara (SBN ORI/SR):** Kupon bulanan langsung dibelikan unit baru secara otomatis.
- **Saham Berdividen (DRIP):** Dividen kas digunakan kembali untuk membeli lembar saham tambahan.
- **Deposito Digital:** Opsi *Automatic Roll Over (ARO) + Bunga*.

Ada instrumen tertentu yang ingin kita bedah potensinya untuk portofolio Anda?`;
  }

  // ── 2. Tanya Profil / Status Keuangan Pengguna ────────────────────────────────
  if (
    query.includes("kondisi") ||
    query.includes("keuangan saya") ||
    query.includes("evaluasi") ||
    query.includes("sehat") ||
    query.includes("posisi keuangan")
  ) {
    return `Halo **${name}**! Berikut adalah ringkasan diagnosis finansial Anda sebagai **${occupation}** (${ageStr}):

🩺 **Diagnosis Arus Kas & Beban Hutang:**
- **Kondisi Arus Kas:** ${ctx.netSavings >= 0 ? `Surplus sebesar ${formatCurrency(ctx.netSavings)} per bulan` : `Defisit sebesar ${formatCurrency(Math.abs(ctx.netSavings))} per bulan`}.
- **Rasio Tabungan (Saving Rate):** **${ctx.savingsRatio}%** ${ctx.savingsRatio >= 20 ? "(✓ Sangat baik, di atas target 20%)" : "(⚠️ Di bawah target ideal 20%)"}.
- **Rasio Beban Hutang (DTI):** **${ctx.debtToIncomeRatio}%** (Status: **${ctx.debtHealthStatus === "debt_free" ? "Bebas Hutang" : ctx.debtHealthStatus === "healthy" ? "Sehat" : "Waspada"}**).
- **Runway Dana Darurat:** **${ctx.emergencyRunwayMonths} Bulan** (${formatCurrency(ctx.totalBalance)} likuid vs ${formatCurrency(ctx.monthlyExpense)} pengeluaran bulanan).

🎯 **Rekomendasi Langkah Aksi Minggu Ini:**
1. Pertahankan rasio tabungan minimal 20% dan otomatiskan mutasi ke pos tabungan impian di awal bulan.
2. Jaga agar rasio beban hutang DTI tetap di bawah 20% dari total penghasilan kotor bulanan.
3. Alokasikan kelebihan likuiditas kas ke pos dana darurat hingga mencapai buffer minimal 6 bulan.`;
  }

  // ── 3. Pertanyaan Umum / Default CFP ──────────────────────────────────────────
  return `Halo **${name}**! Saya telah menganalisis profil finansial Anda (${occupation}, ${ageStr}). 

Saat ini Anda memiliki total aset bersih **${formatCurrency(ctx.netWorth)}** dengan rasio tabungan **${ctx.savingsRatio}%** dan kapasitas runway kas darurat **${ctx.emergencyRunwayMonths} bulan**.

Ada modul atau pertanyaan finansial spesifik yang ingin kita bahas bersama hari ini?`;
}

// ─── Main Server Action: sendFinancialChatMessage ─────────────────────────────

export async function sendFinancialChatMessage(
  messages: ChatMessage[],
  activeContext?: string
): Promise<ActionResult<{ reply: string; usedModel?: string }>> {
  try {
    const user = await getCurrentUser();
    const period = await getCurrentPeriod();

    // 1. Gather comprehensive user financial & profile snapshot
    const [profile, wallets, txSummary, goals, budgets, topCategoryRows, recurringRows, debtRows] =
      await Promise.all([
        getUserProfile(),
        sql`
          SELECT name, type, balance
          FROM wallets
          WHERE user_id = ${user.id} AND deleted_at IS NULL
          ORDER BY balance DESC
        `,
        sql`
          SELECT
            COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) AS monthly_income,
            COALESCE(SUM(CASE WHEN type = 'expense' THEN amount + admin_fee ELSE 0 END), 0) AS monthly_expense
          FROM transactions
          WHERE user_id = ${user.id}
            AND deleted_at IS NULL
            AND to_char(transaction_date, 'YYYY-MM') = ${period}
        `,
        sql`
          SELECT name, target_amount, current_amount, is_completed
          FROM savings_goals
          WHERE user_id = ${user.id} AND deleted_at IS NULL
          ORDER BY (current_amount::numeric / GREATEST(target_amount, 1)::numeric) DESC
        `,
        sql`
          SELECT 
            b.limit_amount, 
            c.name AS category_name,
            COALESCE(SUM(t.amount + t.admin_fee), 0) AS spent_amount
          FROM budgets b
          JOIN categories c ON c.id = b.category_id
          LEFT JOIN transactions t ON t.category_id = b.category_id
            AND t.user_id = ${user.id}
            AND t.deleted_at IS NULL
            AND t.type = 'expense'
            AND to_char(t.transaction_date, 'YYYY-MM') = ${period}
          WHERE b.user_id = ${user.id} AND b.period = ${period}
          GROUP BY b.id, b.category_id, b.limit_amount, c.name
        `,
        sql`
          SELECT 
            c.name,
            SUM(t.amount + t.admin_fee) AS amount
          FROM transactions t
          JOIN categories c ON c.id = t.category_id
          WHERE t.user_id = ${user.id}
            AND t.deleted_at IS NULL
            AND t.type = 'expense'
            AND to_char(t.transaction_date, 'YYYY-MM') = ${period}
          GROUP BY c.name
          ORDER BY amount DESC
          LIMIT 5
        `,
        sql`
          SELECT description, amount, frequency
          FROM recurring_transactions
          WHERE user_id = ${user.id} AND is_active = true
          LIMIT 5
        `,
        sql`
          SELECT COALESCE(SUM(remaining_amount), 0) AS total_debts
          FROM debts
          WHERE user_id = ${user.id}
            AND deleted_at IS NULL
            AND type = 'debt'
            AND status != 'paid'
        `,
      ]);

    const totalBalance = wallets.reduce((acc, w) => acc + Number(w.balance), 0);
    const totalSavings = goals.reduce((acc, g) => acc + Number(g.current_amount), 0);
    const totalDebts = Number(debtRows[0]?.total_debts || 0);
    const netWorth = (totalBalance + totalSavings) - totalDebts;

    const monthlyIncome = Number(txSummary[0]?.monthly_income || 0);
    const monthlyExpense = Number(txSummary[0]?.monthly_expense || 0);
    const netSavings = monthlyIncome - monthlyExpense;
    const savingsRatio =
      monthlyIncome > 0 ? Math.round((netSavings / monthlyIncome) * 100) : 0;
    const emergencyRunwayMonths =
      monthlyExpense > 0 ? Number((totalBalance / monthlyExpense).toFixed(1)) : 0;

    const debtToIncomeRatio =
      monthlyIncome > 0
        ? Math.round((totalDebts / monthlyIncome) * 100)
        : totalDebts > 0
        ? 100
        : 0;

    let debtHealthStatus: ComprehensiveFinancialContext["debtHealthStatus"] = "debt_free";
    if (totalDebts === 0) {
      debtHealthStatus = "debt_free";
    } else if (debtToIncomeRatio <= 20) {
      debtHealthStatus = "healthy";
    } else if (debtToIncomeRatio <= 40) {
      debtHealthStatus = "moderate";
    } else {
      debtHealthStatus = "critical";
    }

    const totalExpenseSum = monthlyExpense > 0 ? monthlyExpense : 1;
    const topCategories = topCategoryRows.map((r) => ({
      name: String(r.name),
      amount: Number(r.amount),
      percentage: Math.round((Number(r.amount) / totalExpenseSum) * 100),
    }));

    const parsedGoals = goals.map((g) => {
      const cur = Number(g.current_amount);
      const tar = Number(g.target_amount);
      return {
        name: String(g.name),
        targetAmount: tar,
        currentAmount: cur,
        percentage: tar > 0 ? Math.min(100, Math.round((cur / tar) * 100)) : 0,
        remaining: Math.max(0, tar - cur),
        isCompleted: Boolean(g.is_completed),
      };
    });

    const parsedBudgets = budgets.map((b) => {
      const lim = Number(b.limit_amount);
      const spent = Number(b.spent_amount);
      const pct = lim > 0 ? Math.round((spent / lim) * 100) : 0;
      return {
        categoryName: String(b.category_name),
        limitAmount: lim,
        spentAmount: spent,
        percentage: pct,
        isOver: spent > lim,
      };
    });

    const fullContext: ComprehensiveFinancialContext = {
      userName: profile.name || user.name || "Pengguna",
      age: profile.age ?? null,
      occupation: profile.occupation ?? null,
      netWorth,
      totalBalance,
      totalSavings,
      totalDebts,
      monthlyIncome,
      monthlyExpense,
      netSavings,
      savingsRatio,
      emergencyRunwayMonths,
      debtToIncomeRatio,
      debtHealthStatus,
      wallets: wallets.map((w) => ({
        name: String(w.name),
        type: String(w.type),
        balance: Number(w.balance),
      })),
      topCategories,
      savingsGoals: parsedGoals,
      budgets: parsedBudgets,
      recurringItems: recurringRows.map((r) => ({
        description: String(r.description),
        amount: Number(r.amount),
        frequency: String(r.frequency),
      })),
    };

    const latestUserMessage = messages[messages.length - 1]?.content || "";

    // 2. Query External Gemini LLM with available model candidates
    const apiKey =
      process.env.GEMINI_API_KEY ||
      process.env.AI_GATEWAY_API_KEY ||
      process.env.OPENAI_API_KEY;

    if (apiKey) {
      const candidateModels = [
        "gemini-flash-lite-latest",
        "gemini-3.1-flash-lite",
        "gemini-3.5-flash-lite",
        "gemini-flash-latest",
      ];

      const systemPrompt = `Kamu adalah Pintar AI — Senior Financial Advisor & Certified Financial Planner (CFP) di aplikasi Pintar Finance.
Persona: Objektif, berwawasan luas, analitis, suportif, dan ramah dalam bahasa Indonesia santun.
Penalaran Profesi: Sesuaikan saran dengan profesi pengguna (${fullContext.occupation || "Pekerja Profesional"}) dan rentang usia (${fullContext.age ? `${fullContext.age} tahun` : "Dewasa Muda"}).

DATA FINANSIAL RIIL PENGGUNA:
- Nama: ${fullContext.userName}
- Profesi: ${fullContext.occupation || "Pekerja Profesional"}
- Usia: ${fullContext.age ? `${fullContext.age} tahun` : "Dewasa Muda"}
- Total Net Worth (Aset Bersih): ${formatCurrency(fullContext.netWorth)}
- Likuiditas Kas: ${formatCurrency(fullContext.totalBalance)}
- Tabungan Terkunci: ${formatCurrency(fullContext.totalSavings)}
- Sisa Hutang: ${formatCurrency(fullContext.totalDebts)}
- Pemasukan Bulan Ini: ${formatCurrency(fullContext.monthlyIncome)}
- Pengeluaran Bulan Ini: ${formatCurrency(fullContext.monthlyExpense)}
- Arus Kas Bersih: ${formatCurrency(fullContext.netSavings)} (Saving Rate: ${fullContext.savingsRatio}%)
- Runway Dana Darurat: ${fullContext.emergencyRunwayMonths} Bulan
- Rasio Beban Hutang (DTI): ${fullContext.debtToIncomeRatio}% (Status: ${fullContext.debtHealthStatus})
- Pos Tabungan Impian: ${JSON.stringify(fullContext.savingsGoals)}
- Batas Anggaran: ${JSON.stringify(fullContext.budgets)}
${activeContext ? `- Modul Aktif: ${activeContext}` : ""}`;

      const geminiContents = [
        {
          role: "user",
          parts: [{ text: systemPrompt }],
        },
        {
          role: "model",
          parts: [
            {
              text: `Halo ${fullContext.userName}! Saya siap mendampingi Anda berdiskusi seputar strategi keuangan, evaluasi pos belanja, atau perencanaan investasi. Silakan tanyakan apa saja!`,
            },
          ],
        },
        ...messages.slice(-10).map((m) => ({
          role: m.role === "user" ? "user" : "model",
          parts: [{ text: m.content }],
        })),
      ];

      for (const modelName of candidateModels) {
        try {
          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contents: geminiContents,
                generationConfig: {
                  temperature: 0.5,
                  maxOutputTokens: 1200,
                },
              }),
            }
          );

          if (response.ok) {
            const resData = await response.json();
            const replyText = resData.candidates?.[0]?.content?.parts?.[0]?.text;
            if (replyText && replyText.trim().length > 0) {
              return {
                success: true,
                data: { reply: replyText.trim(), usedModel: modelName },
              };
            }
          }
        } catch {
          // Try next model candidate
        }
      }
    }

    // 3. Resilient Fallback Engine
    const richReply = generateDeepFinancialConsultation(
      latestUserMessage,
      fullContext,
      activeContext
    );

    return {
      success: true,
      data: { reply: richReply },
    };
  } catch (error) {
    console.error("Error in sendFinancialChatMessage:", error);
    return {
      success: false,
      error: "Gagal memproses percakapan finansial.",
    };
  }
}
