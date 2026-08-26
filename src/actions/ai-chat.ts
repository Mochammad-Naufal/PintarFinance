"use server";

import { sql } from "@/db";
import { getCurrentUser } from "@/lib/supabase/user";
import { type ActionResult } from "@/types/finance";
import { getCurrentPeriod } from "./budgets";
import { formatCurrency } from "@/lib/utils";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

// ─── Deterministic Financial Chatbot Fallback Engine ──────────────────────────

function generateFallbackChatReply(
  userPrompt: string,
  userContext: {
    userName: string;
    netWorth: number;
    monthlyIncome: number;
    monthlyExpense: number;
    savingsGoalsCount: number;
    budgetsCount: number;
  }
): string {
  const lower = userPrompt.toLowerCase();
  const netSavings = userContext.monthlyIncome - userContext.monthlyExpense;
  const savingsRatio =
    userContext.monthlyIncome > 0
      ? Math.round((netSavings / userContext.monthlyIncome) * 100)
      : 0;

  if (lower.includes("hemat") || lower.includes("20%") || lower.includes("kurangi")) {
    return `Halo **${userContext.userName}**! Berdasarkan data bulan ini, total pengeluaran Anda tercatat **${formatCurrency(
      userContext.monthlyExpense
    )}**.

Berikut adalah 3 langkah strategis untuk memangkas pengeluaran sebesar 15–20%:
1. **Audit Pos Gaya Hidup & Kuliner:** Kategorikan jajan harian dan pesan antar. Membatasi frekuensi pesan antar makanan hingga 2x seminggu dapat menghemat sekitar Rp 300.000 – Rp 600.000/bulan.
2. **Evaluasi Langganan Aplikasi:** Cek modul **Transaksi Berulang / Subscriptions** di Pintar Finance. Matikan langganan yang jarang digunakan.
3. **Terapkan Prinsip 24 Jam:** Tunda pembelian barang non-primer selama 24 jam sebelum checkout untuk menghindari belanja impulsif.`;
  }

  if (lower.includes("darurat") || lower.includes("emergency")) {
    const ideal3Months = userContext.monthlyExpense * 3;
    const ideal6Months = userContext.monthlyExpense * 6;

    return `Halo **${userContext.userName}**, dana darurat adalah fondasi utama piramida keuangan!

📊 **Simulasi Kebutuhan Dana Darurat Anda:**
- Pengeluaran bulanan rata-rata: **${formatCurrency(userContext.monthlyExpense)}**
- Target Minimal (3 Bulan Biaya Hidup): **${formatCurrency(ideal3Months)}**
- Target Ideal (6 Bulan Biaya Hidup): **${formatCurrency(ideal6Months)}**
- Total Likuiditas Dompet Saat Ini: **${formatCurrency(userContext.netWorth)}**

💡 **Rekomendasi Alokasi:**
Simpan dana darurat di instrumen likuid dan aman seperti Rekening Bank terpisah, Deposito Digital, atau Reksadana Pasar Uang (RDPU) agar tidak tergerus fluktuasi pasar namun tetap mudah dicairkan saat dibutuhkan.`;
  }

  if (lower.includes("investasi") || lower.includes("compound") || lower.includes("bunga majemuk")) {
    return `Halo **${userContext.userName}**! Keajaiban bunga majemuk (*compound interest*) bekerja paling optimal dengan konsistensi waktu (*time in the market*).

📈 **Strategi Investasi Disiplin (DCA):**
1. Sisihkan minimal 10–20% dari penghasilan (saat ini rasio tabungan Anda adalah **${savingsRatio}%**).
2. Anda dapat memanfaatkan fitur **Kalkulator Compounding Interest** di menu samping untuk mensimulasikan hasil investasi 5–10 tahun ke depan.
3. Tempatkan portofolio sesuai profil risiko: Pasar Uang untuk jangka pendek (< 1 tahun), Obligasi/SBN untuk jangka menengah (1–3 tahun), dan Saham/Indeks untuk jangka panjang (> 5 tahun).`;
  }

  if (lower.includes("anggaran") || lower.includes("budget") || lower.includes("50/30/20")) {
    const kebutuhan = userContext.monthlyIncome * 0.5;
    const keinginan = userContext.monthlyIncome * 0.3;
    const tabungan = userContext.monthlyIncome * 0.2;

    return `Halo **${userContext.userName}**! Metode **50/30/20** sangat ideal untuk menjaga keseimbangan arus kas:

💰 **Simulasi Alokasi Penghasilan Bulanan (${formatCurrency(
      userContext.monthlyIncome
    )}):**
- **50% Kebutuhan Pokok (Needs):** Maksimal **${formatCurrency(kebutuhan)}** (makan, sewa/tempat tinggal, tagihan utilitas, transportasi).
- **30% Keinginan (Wants):** Maksimal **${formatCurrency(keinginan)}** (hiburan, hobi, jajan, belanja pakaian).
- **20% Tabungan & Investasi (Savings):** Minimal **${formatCurrency(tabungan)}** (dana darurat, pos tabungan impian, investasi).

Saat ini Anda memiliki **${userContext.budgetsCount} pos anggaran** yang aktif dipantau. Pastikan tidak ada kategori yang melewati 100%!`;
  }

  // Default helpful response
  return `Halo **${userContext.userName}**! Saya adalah asisten kecerdasan finansial Pintar AI Anda.

Saat ini ringkasan finansial Anda:
- **Total Saldo / Net Worth:** ${formatCurrency(userContext.netWorth)}
- **Arus Kas Bulan Ini:** Pemasukan ${formatCurrency(
    userContext.monthlyIncome
  )} vs Pengeluaran ${formatCurrency(userContext.monthlyExpense)}
- **Surplus Bersih:** ${netSavings >= 0 ? "+" : ""}${formatCurrency(netSavings)} (Rasio Tabungan: ${savingsRatio}%)
- **Target Impian Aktif:** ${userContext.savingsGoalsCount} pos tabungan

Ada yang ingin Anda tanyakan atau diskusikan seputar strategi keuangan, evaluasi anggaran, atau perencanaan tabungan?`;
}

// ─── Main Server Action: sendFinancialChatMessage ─────────────────────────────

export async function sendFinancialChatMessage(
  messages: ChatMessage[],
  activeContext?: string
): Promise<ActionResult<{ reply: string }>> {
  try {
    const user = await getCurrentUser();
    const period = await getCurrentPeriod();

    // 1. Gather comprehensive user financial snapshot
    const [wallets, txSummary, goals, budgets] = await Promise.all([
      sql`
        SELECT COALESCE(SUM(balance), 0) AS total_balance
        FROM wallets
        WHERE user_id = ${user.id} AND deleted_at IS NULL
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
      `,
      sql`
        SELECT b.amount AS limit_amount, c.name AS category_name
        FROM budgets b
        JOIN categories c ON c.id = b.category_id
        WHERE b.user_id = ${user.id} AND b.period = ${period}
      `,
    ]);

    const netWorth = Number(wallets[0]?.total_balance || 0);
    const monthlyIncome = Number(txSummary[0]?.monthly_income || 0);
    const monthlyExpense = Number(txSummary[0]?.monthly_expense || 0);

    const userSnapshot = {
      userName: user.name || "Pengguna",
      netWorth,
      monthlyIncome,
      monthlyExpense,
      savingsGoalsCount: goals.length,
      budgetsCount: budgets.length,
    };

    const apiKey =
      process.env.GEMINI_API_KEY ||
      process.env.AI_GATEWAY_API_KEY ||
      process.env.OPENAI_API_KEY;

    const latestUserMessage = messages[messages.length - 1]?.content || "";

    // 2. Query Gemini if configured
    if (apiKey) {
      try {
        const systemPrompt = `Kamu adalah Pintar AI — Financial Advisor & Certified Financial Planner (CFP) berdedikasi tinggi di aplikasi Pintar Finance.
Persona kamu: Objektif, analitis, suportif, komunikatif, solutif, dan ramah dalam bahasa Indonesia.
Gunakan format Markdown yang rapi (bullet point, tebalkan angka/istilah kunci) agar nyaman dibaca di layar mobile maupun desktop.

DATA FINANSIAL PENGGUNA SAAT INI:
- Nama Pengguna: ${user.name}
- Total Saldo di Seluruh Dompet: ${formatCurrency(netWorth)}
- Pemasukan Bulan Ini (${period}): ${formatCurrency(monthlyIncome)}
- Pengeluaran Bulan Ini (${period}): ${formatCurrency(monthlyExpense)}
- Arus Kas Bersih: ${formatCurrency(monthlyIncome - monthlyExpense)}
- Target Impian Aktif (${goals.length}): ${JSON.stringify(goals)}
- Anggaran Aktif (${budgets.length}): ${JSON.stringify(budgets)}
${activeContext ? `- Konteks Modul Saat Ini: ${activeContext}` : ""}

Jawablah pertanyaan pengguna dengan mengaitkan data finansial nyata mereka secara personal dan berikan saran yang bisa segera diterapkan.`;

        // Format conversation for Gemini API
        const geminiContents = [
          {
            role: "user",
            parts: [{ text: systemPrompt }],
          },
          {
            role: "model",
            parts: [
              {
                text: `Halo ${user.name}! Saya siap mendampingi perencanaan keuangan Anda dengan analisis cerdas dan solutif. Ada yang bisa saya bantu hari ini?`,
              },
            ],
          },
          ...messages.slice(-8).map((m) => ({
            role: m.role === "user" ? "user" : "model",
            parts: [{ text: m.content }],
          })),
        ];

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: geminiContents,
              generationConfig: {
                temperature: 0.4,
                maxOutputTokens: 1000,
              },
            }),
          }
        );

        if (response.ok) {
          const resData = await response.json();
          const replyText = resData.candidates?.[0]?.content?.parts?.[0]?.text;
          if (replyText) {
            return {
              success: true,
              data: { reply: replyText.trim() },
            };
          }
        }
      } catch (geminiError) {
        console.warn("Gemini Chat API call failed, falling back to local advisor engine:", geminiError);
      }
    }

    // 3. Fallback Reply
    const fallbackReply = generateFallbackChatReply(latestUserMessage, userSnapshot);
    return {
      success: true,
      data: { reply: fallbackReply },
    };
  } catch (error) {
    console.error("Error in sendFinancialChatMessage:", error);
    return {
      success: false,
      error: "Gagal memproses pesan percakapan.",
    };
  }
}
