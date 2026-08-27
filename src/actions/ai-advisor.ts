"use server";

import { sql } from "@/db";
import { getCurrentUser } from "@/lib/supabase/user";
import { type ActionResult } from "@/types/finance";
import { getCurrentPeriod } from "./budgets";
import { formatCurrency } from "@/lib/utils";

export interface AIAnalysisResponse {
  status: "healthy" | "warning" | "critical";
  headline: string;
  summary: string;
  keyInsights: string[];
  actionableRecommendations: string[];
  usedModel?: string;
}

export type AIModuleType =
  | "dashboard"
  | "wallets"
  | "budgets"
  | "savings"
  | "transactions";

// ─── Deterministic Rule-Based Fallback Engine ─────────────────────────────────

function generateFallbackAnalysis(
  moduleType: AIModuleType,
  contextData: Record<string, unknown>
): AIAnalysisResponse {
  switch (moduleType) {
    case "dashboard": {
      const netWorth = (contextData.netWorth as number) || 0;
      const income = (contextData.monthlyIncome as number) || 0;
      const expense = (contextData.monthlyExpense as number) || 0;
      const netSavings = income - expense;
      const savingsRate = income > 0 ? Math.round((netSavings / income) * 100) : 0;

      let status: AIAnalysisResponse["status"] = "healthy";
      let headline = "Kesehatan Finansial Berada pada Tren Positif";

      if (netSavings < 0) {
        status = "critical";
        headline = "Arus Kas Defisit: Pengeluaran Melebihi Pemasukan";
      } else if (savingsRate < 20) {
        status = "warning";
        headline = "Rasio Tabungan Rendah: Perlu Optimasi Anggaran";
      }

      return {
        status,
        headline,
        summary: `Total aset bersih saat ini bernilai ${formatCurrency(
          netWorth
        )}. Bulan ini mencatatkan pemasukan ${formatCurrency(
          income
        )} dan pengeluaran ${formatCurrency(
          expense
        )} dengan rasio tabungan ${savingsRate}%.`,
        keyInsights: [
          `Arus kas bersih bulan ini: ${netSavings >= 0 ? "+" : ""}${formatCurrency(
            netSavings
          )}`,
          `Rasio tabungan ${savingsRate}% (Standar ideal: minimal 20% dari total pemasukan)`,
          `Total cadangan aset di seluruh kantong dan dompet: ${formatCurrency(netWorth)}`,
        ],
        actionableRecommendations: [
          savingsRate < 20
            ? "Tinjau ulang pos pengeluaran sekunder (gaya hidup & jajan) untuk menaikkan rasio tabungan ke target 20%."
            : "Pertahankan surplus arus kas ini dan alokasikan 50% surplus ke pos dana darurat atau investasi.",
          "Manfaatkan fitur 'Transaksi Berulang' untuk mengantisipasi tagihan rutin sebelum jatuh tempo.",
        ],
      };
    }

    case "wallets": {
      const totalBalance = (contextData.totalBalance as number) || 0;
      const walletsCount = (contextData.walletsCount as number) || 0;
      const wallets = (contextData.wallets as Array<{ name: string; balance: number; type: string }>) || [];

      const topWallet = wallets.length > 0
        ? [...wallets].sort((a, b) => b.balance - a.balance)[0]
        : null;

      const topRatio = totalBalance > 0 && topWallet
        ? Math.round((topWallet.balance / totalBalance) * 100)
        : 0;

      let status: AIAnalysisResponse["status"] = "healthy";
      let headline = "Likuiditas Dompet Terdistribusi Baik";

      if (topRatio > 80 && wallets.length > 1) {
        status = "warning";
        headline = "Konsentrasi Dana Terlalu Tinggi pada Satu Dompet";
      } else if (totalBalance <= 0) {
        status = "critical";
        headline = "Saldo Likuiditas Sangat Minim";
      }

      return {
        status,
        headline,
        summary: `Tercatat ${walletsCount} dompet aktif dengan total likuiditas ${formatCurrency(
          totalBalance
        )}. Dompet terbesar adalah "${topWallet?.name || "Utama"}" yang memegang ${topRatio}% dari total likuiditas.`,
        keyInsights: [
          `Total dana likuid: ${formatCurrency(totalBalance)}`,
          `Dompet "${topWallet?.name || "Utama"}" menampung saldo terbesar (${formatCurrency(topWallet?.balance || 0)})`,
          `Diversifikasi dompet membantu memisahkan dana operasional harian dengan pos tabungan darurat`,
        ],
        actionableRecommendations: [
          topRatio > 70
            ? "Pertimbangkan menyebar dana likuid ke rekening terpisah agar tidak mudah terpakai untuk belanja impulsif."
            : "Pastikan saldo di dompet harian (E-Wallet) cukup untuk kebutuhan 1-2 minggu ke depan tanpa berlebihan.",
          "Gunakan transfer berkala dari rekening payroll ke dompet belanja untuk menjaga disiplin pengeluaran.",
        ],
      };
    }

    case "budgets": {
      const budgets = (contextData.budgets as Array<{ category_name: string; limit_amount: number; spent_amount: number; percentage: number }>) || [];
      const overBudgets = budgets.filter((b) => b.percentage >= 100);
      const warningBudgets = budgets.filter((b) => b.percentage >= 80 && b.percentage < 100);

      let status: AIAnalysisResponse["status"] = "healthy";
      let headline = "Seluruh Batas Anggaran Terkendali Rapi";

      if (overBudgets.length > 0) {
        status = "critical";
        headline = `Perhatian: ${overBudgets.length} Kategori Melebihi Batas Anggaran!`;
      } else if (warningBudgets.length > 0) {
        status = "warning";
        headline = `${warningBudgets.length} Kategori Mendekati Limit (>80%)`;
      }

      return {
        status,
        headline,
        summary: `Dari total ${budgets.length} pos anggaran yang dipantau bulan ini, ${overBudgets.length} pos mengalami overbudget dan ${warningBudgets.length} pos dalam status waspada.`,
        keyInsights: [
          overBudgets.length > 0
            ? `Pos overbudget: ${overBudgets.map((b) => `${b.category_name} (${b.percentage}%)`).join(", ")}`
            : "Tidak ada pos anggaran yang terlampaui bulan ini",
          warningBudgets.length > 0
            ? `Pos waspada (>80%): ${warningBudgets.map((b) => `${b.category_name} (${b.percentage}%)`).join(", ")}`
            : "Rata-rata serapan anggaran berada dalam batas aman",
        ],
        actionableRecommendations: [
          overBudgets.length > 0
            ? "Tahan pengeluaran diskresioner pada kategori yang overbudget hingga awal periode bulan depan."
            : "Lanjutkan pola disiplin belanja saat ini untuk mempertahankan ruang tabungan.",
          "Jika ada kategori yang konsisten overbudget setiap bulan, lakukan evaluasi dan sesuaikan limit realistisnya.",
        ],
      };
    }

    case "savings": {
      const goals = (contextData.goals as Array<{ name: string; current_amount: number; target_amount: number; is_completed: boolean }>) || [];
      const totalCurrent = (contextData.totalCurrent as number) || 0;
      const totalTarget = (contextData.totalTarget as number) || 0;
      const completedCount = goals.filter((g) => g.is_completed).length;
      const overallPercent = totalTarget > 0 ? Math.round((totalCurrent / totalTarget) * 100) : 0;

      let status: AIAnalysisResponse["status"] = "healthy";
      let headline = "Progres Target Impian Berjalan Konsisten";

      if (overallPercent < 25 && goals.length > 0) {
        status = "warning";
        headline = "Progres Tabungan Masih di Tahap Awal";
      }

      return {
        status,
        headline,
        summary: `Akumulasi tabungan mencapai ${formatCurrency(
          totalCurrent
        )} (${overallPercent}%) dari target impian keseluruhan ${formatCurrency(
          totalTarget
        )}. Sebanyak ${completedCount} dari ${goals.length} target telah terpenuhi.`,
        keyInsights: [
          `Capaian tabungan global: ${overallPercent}% dari total komitmen`,
          `${completedCount} pos impian sudah tercapai 100%`,
          `Kekurangan dana menuju target: ${formatCurrency(Math.max(0, totalTarget - totalCurrent))}`,
        ],
        actionableRecommendations: [
          "Gunakan fitur 'Tabungan Bersama' untuk pos impian patungan bersama pasangan atau keluarga.",
          "Jadwalkan auto-debit atau mutasi otomatis ke pos impian setiap kali menerima gaji atau bonus bulanan.",
          "Simulasikan pertumbuhan dana jangka panjang menggunakan modul Kalkulator Compounding Interest.",
        ],
      };
    }

    case "transactions": {
      const totalVolume = (contextData.totalVolume as number) || 0;
      const txCount = (contextData.txCount as number) || 0;
      const topCategory = (contextData.topCategory as string) || "Kebutuhan";

      return {
        status: "healthy",
        headline: "Aktivitas Pencatatan Mutasi Sangat Aktif",
        summary: `Tercatat ${txCount} mutasi dalam 30 hari terakhir dengan total perputaran dana ${formatCurrency(
          totalVolume
        )}. Kategori transaksi yang paling dominan adalah "${topCategory}".`,
        keyInsights: [
          `Frekuensi transaksi: rata-rata ${(txCount / 30).toFixed(1)} mutasi per hari`,
          `Pengeluaran terbesar terkonsentrasi pada sektor ${topCategory}`,
          `Pencatatan yang konsisten memberikan presisi prediksi arus kas masa depan`,
        ],
        actionableRecommendations: [
          "Gunakan fitur 'AI Quick Scan' untuk mencatat struk belanja fisik secara instan tanpa input manual.",
          "Periksa daftar transaksi berulang secara berkala untuk membatalkan langganan aplikasi yang sudah tidak terpakai.",
        ],
      };
    }
  }
}

// ─── Main Server Action: getModuleAIAnalysis ──────────────────────────────────

export async function getModuleAIAnalysis(
  moduleType: AIModuleType
): Promise<ActionResult<AIAnalysisResponse>> {
  try {
    const user = await getCurrentUser();
    const period = await getCurrentPeriod();

    let contextData: Record<string, unknown> = {};
    let contextPromptSummary = "";

    // 1. Gather context data per module type
    if (moduleType === "dashboard") {
      const [walletRows, txMonthlyRows, trendRows] = await Promise.all([
        sql`
          SELECT COALESCE(SUM(balance), 0) AS net_worth
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
          SELECT 
            to_char(transaction_date, 'YYYY-MM') AS period,
            COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) AS income,
            COALESCE(SUM(CASE WHEN type = 'expense' THEN amount + admin_fee ELSE 0 END), 0) AS expense
          FROM transactions
          WHERE user_id = ${user.id}
            AND deleted_at IS NULL
            AND transaction_date >= now() - interval '6 months'
          GROUP BY to_char(transaction_date, 'YYYY-MM')
          ORDER BY period ASC
        `,
      ]);

      const netWorth = Number(walletRows[0]?.net_worth || 0);
      const monthlyIncome = Number(txMonthlyRows[0]?.monthly_income || 0);
      const monthlyExpense = Number(txMonthlyRows[0]?.monthly_expense || 0);

      contextData = {
        netWorth,
        monthlyIncome,
        monthlyExpense,
        trend: trendRows,
      };

      contextPromptSummary = `
- Total Net Worth (Saldo Dompet): ${formatCurrency(netWorth)}
- Pemasukan Bulan Ini: ${formatCurrency(monthlyIncome)}
- Pengeluaran Bulan Ini: ${formatCurrency(monthlyExpense)}
- Arus Kas Bersih Bulan Ini: ${formatCurrency(monthlyIncome - monthlyExpense)}
- Riwayat Tren 6 Bulan: ${JSON.stringify(trendRows)}
`;
    } else if (moduleType === "wallets") {
      const wallets = await sql`
        SELECT id, name, type, balance, color
        FROM wallets
        WHERE user_id = ${user.id} AND deleted_at IS NULL
        ORDER BY balance DESC
      `;

      const totalBalance = wallets.reduce((acc, w) => acc + Number(w.balance), 0);
      contextData = {
        totalBalance,
        walletsCount: wallets.length,
        wallets: wallets.map((w) => ({
          name: w.name,
          type: w.type,
          balance: Number(w.balance),
        })),
      };

      contextPromptSummary = `
- Total Saldo di Seluruh Dompet: ${formatCurrency(totalBalance)}
- Rincian Dompet (${wallets.length} dompet): ${JSON.stringify(contextData.wallets)}
`;
    } else if (moduleType === "budgets") {
      const budgetRows = await sql`
        SELECT 
          b.id,
          b.category_id,
          b.limit_amount,
          c.name AS category_name,
          COALESCE(SUM(t.amount), 0) AS spent_amount
        FROM budgets b
        JOIN categories c ON c.id = b.category_id
        LEFT JOIN transactions t ON t.category_id = b.category_id 
          AND t.user_id = ${user.id}
          AND t.deleted_at IS NULL
          AND t.type = 'expense'
          AND to_char(t.transaction_date, 'YYYY-MM') = ${period}
        WHERE b.user_id = ${user.id}
          AND b.period = ${period}
        GROUP BY b.id, b.category_id, b.limit_amount, c.name
      `;

      const budgets = budgetRows.map((b) => {
        const limit = Number(b.limit_amount);
        const spent = Number(b.spent_amount);
        const percentage = limit > 0 ? Math.round((spent / limit) * 100) : 0;
        return {
          category_name: b.category_name as string,
          limit_amount: limit,
          spent_amount: spent,
          percentage,
        };
      });

      contextData = { budgets, period };
      contextPromptSummary = `
- Periode Anggaran: ${period}
- Rincian Anggaran Kategori: ${JSON.stringify(budgets)}
`;
    } else if (moduleType === "savings") {
      const goals = await sql`
        SELECT id, name, target_amount, current_amount, target_date::text, is_completed
        FROM savings_goals
        WHERE user_id = ${user.id} AND deleted_at IS NULL
      `;

      const totalCurrent = goals.reduce((acc, g) => acc + Number(g.current_amount), 0);
      const totalTarget = goals.reduce((acc, g) => acc + Number(g.target_amount), 0);

      contextData = {
        goals: goals.map((g) => ({
          name: g.name,
          current_amount: Number(g.current_amount),
          target_amount: Number(g.target_amount),
          is_completed: Boolean(g.is_completed),
        })),
        totalCurrent,
        totalTarget,
      };

      contextPromptSummary = `
- Total Tabungan Terkumpul: ${formatCurrency(totalCurrent)}
- Total Target Finansial: ${formatCurrency(totalTarget)}
- Daftar Pos Impian: ${JSON.stringify(contextData.goals)}
`;
    } else if (moduleType === "transactions") {
      const [txStats, topCategories] = await Promise.all([
        sql`
          SELECT 
            COUNT(*) AS total_count,
            COALESCE(SUM(amount), 0) AS total_volume,
            COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS total_expense
          FROM transactions
          WHERE user_id = ${user.id}
            AND deleted_at IS NULL
            AND transaction_date >= now() - interval '30 days'
        `,
        sql`
          SELECT c.name, COALESCE(SUM(t.amount), 0) AS amount
          FROM transactions t
          JOIN categories c ON c.id = t.category_id
          WHERE t.user_id = ${user.id}
            AND t.deleted_at IS NULL
            AND t.type = 'expense'
            AND t.transaction_date >= now() - interval '30 days'
          GROUP BY c.name
          ORDER BY amount DESC
          LIMIT 3
        `,
      ]);

      const txCount = Number(txStats[0]?.total_count || 0);
      const totalVolume = Number(txStats[0]?.total_volume || 0);
      const topCatName = (topCategories[0]?.name as string) || "Kebutuhan";

      contextData = {
        txCount,
        totalVolume,
        topCategory: topCatName,
        topCategories,
      };

      contextPromptSummary = `
- Jumlah Mutasi 30 Hari Terakhir: ${txCount} transaksi
- Total Perputaran Dana 30 Hari: ${formatCurrency(totalVolume)}
- Top Kategori Pengeluaran 30 Hari: ${JSON.stringify(topCategories)}
`;
    }

    // 2. Call Google Gemini API if configured
    const apiKey =
      process.env.GEMINI_API_KEY ||
      process.env.AI_GATEWAY_API_KEY ||
      process.env.OPENAI_API_KEY;

    if (apiKey) {
      try {
        const systemPrompt = `Kamu adalah Senior Financial Advisor & Certified Financial Planner (CFP) di Pintar Finance.
Tugasmu adalah menganalisis data keuangan pengguna pada modul "${moduleType}" dan memberikan evaluasi tajam, actionable, dan bernada positif-konstruktif dalam bahasa Indonesia.

Konteks Finansial Nyata Pengguna:
${contextPromptSummary}

KEMBALIKAN HANYA OBJEK JSON MURNI SESUAI SCHEMA BERIKUT (TANPA MARKDOWN DAN TANPA BACKTICKS):
{
  "status": "healthy" | "warning" | "critical",
  "headline": string (Judul singkat yang menarik dan profesional, maksimal 12 kata),
  "summary": string (Ringkasan analisis 2-3 kalimat yang mengutip data angka rupiah spesifik),
  "keyInsights": string[] (Array berisi 3 poin temuan analitis mendalam),
  "actionableRecommendations": string[] (Array berisi 2-3 langkah nyata yang bisa segera dilakukan pengguna)
}`;

      const candidateModels = [
        "gemini-flash-lite-latest",
        "gemini-3.1-flash-lite",
        "gemini-3.5-flash-lite",
        "gemini-flash-latest",
      ];

      for (const modelName of candidateModels) {
        try {
          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contents: [
                  {
                    parts: [{ text: systemPrompt }],
                  },
                ],
                generationConfig: {
                  responseMimeType: "application/json",
                  temperature: 0.2,
                },
              }),
            }
          );

          if (response.ok) {
            const resData = await response.json();
            const rawText = resData.candidates?.[0]?.content?.parts?.[0]?.text;
            if (rawText) {
              const parsed = JSON.parse(rawText) as AIAnalysisResponse;
              if (parsed.status && parsed.headline && parsed.summary) {
                return {
                  success: true,
                  data: {
                    status: parsed.status,
                    headline: parsed.headline,
                    summary: parsed.summary,
                    keyInsights: Array.isArray(parsed.keyInsights) ? parsed.keyInsights : [],
                    actionableRecommendations: Array.isArray(parsed.actionableRecommendations) ? parsed.actionableRecommendations : [],
                    usedModel: modelName,
                  },
                };
              }
            }
          }
        } catch {
          // Try next model
        }
      }
      } catch (geminiError) {
        console.warn("Gemini API call failed, using intelligent rule-based evaluator:", geminiError);
      }
    }

    // 3. Resilient Fallback Engine
    const fallbackData = generateFallbackAnalysis(moduleType, contextData);
    return {
      success: true,
      data: fallbackData,
    };
  } catch (error) {
    console.error("Error executing getModuleAIAnalysis:", error);
    return {
      success: false,
      error: "Gagal memproses analisis AI untuk modul ini.",
    };
  }
}
