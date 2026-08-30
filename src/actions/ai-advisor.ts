"use server";

import { sql } from "@/db";
import { getCurrentUser } from "@/lib/supabase/user";
import { type ActionResult } from "@/types/finance";
import { getCurrentPeriod } from "./budgets";
import { getUserProfile } from "./profile";
import { formatCurrency } from "@/lib/utils";

export interface AIAnalysisResponse {
  status: "healthy" | "warning" | "critical";
  headline: string;
  diagnosis: string;
  summary: string;
  keyMetrics: string[];
  keyInsights: string[];
  actionSteps: string[];
  actionableRecommendations: string[];
  usedModel?: string;
}

export type AIModuleType =
  | "dashboard"
  | "wallets"
  | "budgets"
  | "savings"
  | "transactions";

interface FinancialProfileSnapshot {
  name: string;
  age: number | null;
  occupation: string | null;
  netWorth: number;
  totalBalance: number;
  totalSavings: number;
  totalDebts: number;
  totalReceivables: number;
  monthlyIncome: number;
  monthlyExpense: number;
  monthlyNet: number;
  savingRate: number;
  emergencyRunwayMonths: number;
  debtToIncomeRatio: number;
  debtHealthStatus: "healthy" | "moderate" | "critical" | "debt_free";
  topExpenses: Array<{ name: string; amount: number; percentage: number }>;
}

// ─── Dynamic Certified Financial Planner Rule-Based Fallback Engine ──────────

function generateFallbackAnalysis(
  moduleType: AIModuleType,
  snapshot: FinancialProfileSnapshot,
  extraData: Record<string, unknown>
): AIAnalysisResponse {
  const name = snapshot.name || "Pengguna";
  const occupation = snapshot.occupation || "Pekerja Profesional";
  const age = snapshot.age ? `${snapshot.age} tahun` : "Dewasa Muda";
  const savingRate = snapshot.savingRate;
  const dti = snapshot.debtToIncomeRatio;
  const runway = snapshot.emergencyRunwayMonths;
  const topExp = snapshot.topExpenses[0];

  // Dynamic Occupation context label
  const isFreelance =
    /freelance|lepas|wirausaha|bisnis|owner|trader|creator|jasa/i.test(
      occupation
    );
  const isStudent = /mahasiswa|pelajar|fresh graduate|magang/i.test(occupation);

  switch (moduleType) {
    case "dashboard": {
      let status: AIAnalysisResponse["status"] = "healthy";
      let headline = `Tren Keuangan ${name} Berada pada Jalur Positif`;

      if (snapshot.monthlyNet < 0 || dti > 40) {
        status = "critical";
        headline = `Defisit Arus Kas & Beban Hutang Perlu Penanganan Segera`;
      } else if (savingRate < 20 || (isFreelance && runway < 6) || runway < 3) {
        status = "warning";
        headline = `Optimasi Buffer Kas & Alokasi Anggaran Diperlukan`;
      }

      const diagnosis =
        snapshot.monthlyNet >= 0
          ? `Kondisi arus kas ${name} (${occupation}, ${age}) saat ini surplus ${formatCurrency(
              snapshot.monthlyNet
            )} per bulan dengan rasio tabungan ${savingRate}% dan rasio beban hutang DTI ${dti}% (${snapshot.debtHealthStatus === "debt_free" ? "Bebas Hutang" : snapshot.debtHealthStatus === "healthy" ? "Rasio Sehat" : "Perlu Waspada"}).`
          : `Arus kas ${name} mengalami defisit ${formatCurrency(
              Math.abs(snapshot.monthlyNet)
            )} bulan ini karena total pengeluaran (${formatCurrency(
              snapshot.monthlyExpense
            )}) melampaui pemasukan, dengan cadangan dana darurat bertahan selama ${runway} bulan.`;

      const keyMetrics = [
        `Rasio Tabungan: ${savingRate}% ${savingRate >= 20 ? "(✓ Target Sehat ≥20% tercapai)" : "(⚠️ Di bawah target ideal 20%)"}`,
        `Debt-to-Income (DTI): ${dti}% ${dti === 0 ? "(✓ Bebas Liabilitas)" : dti <= 20 ? "(✓ Beban Hutang Aman ≤20%)" : "(⚠️ Beban Hutang Tinggi)"}`,
        `Runway Dana Darurat: ${runway} Bulan (${formatCurrency(snapshot.totalBalance)} likuid vs ${formatCurrency(snapshot.monthlyExpense)} beban bulanan)`,
        topExp ? `Pengeluaran Terbesar: ${topExp.name} (${formatCurrency(topExp.amount)} • ${topExp.percentage}%)` : `Total Net Worth: ${formatCurrency(snapshot.netWorth)}`,
      ];

      const actionSteps = [
        isFreelance
          ? `Alokasikan minimal ${formatCurrency(Math.max(250_000, Math.round(snapshot.monthlyIncome * 0.15)))} ke pos dana darurat untuk memperpanjang buffer runway menuju target ideal 6–12 bulan.`
          : `Sisihkan minimal ${formatCurrency(Math.max(200_000, Math.round(snapshot.monthlyIncome * 0.2)))} di awal gajian ke pos impian atau instrumen investasi pasar uang.`,
        topExp
          ? `Lakukan pembatasan belanja diskresioner pada kategori ${topExp.name} maksimal hemat Rp ${Math.round(topExp.amount * 0.15).toLocaleString("id-ID")} minggu ini.`
          : `Aktifkan jadwal pencatatan transaksi berulang untuk tagihan listrik & wifi sebelum jatuh tempo.`,
        snapshot.totalDebts > 0
          ? `Fokuskan surplus kas Rp ${Math.round(Math.max(100_000, snapshot.monthlyNet * 0.4)).toLocaleString("id-ID")} untuk akselerasi pelunasan sisa pokok hutang (${formatCurrency(snapshot.totalDebts)}).`
          : `Simulasikan potensi pertumbuhan aset di kalkulator compounding interest dengan asumsi return 6-8%/tahun.`,
      ];

      return {
        status,
        headline,
        diagnosis,
        summary: diagnosis,
        keyMetrics,
        keyInsights: keyMetrics,
        actionSteps,
        actionableRecommendations: actionSteps,
      };
    }

    case "wallets": {
      const totalBalance = snapshot.totalBalance;
      const wallets = (extraData.wallets as Array<{ name: string; balance: number; type: string }>) || [];
      const topWallet = wallets[0] || null;
      const topRatio = totalBalance > 0 && topWallet ? Math.round((topWallet.balance / totalBalance) * 100) : 0;

      let status: AIAnalysisResponse["status"] = "healthy";
      let headline = `Struktur Likuiditas Dompet Terkelola Baik`;

      if (totalBalance <= 0) {
        status = "critical";
        headline = `Saldo Likuiditas Kritis: Buffer Kas Habis`;
      } else if (topRatio > 85 && wallets.length > 1) {
        status = "warning";
        headline = `Konsentrasi Dana Terlalu Bertumpuk pada Satu Dompet`;
      }

      const diagnosis = `Total likuiditas ${name} di ${wallets.length} dompet bernilai ${formatCurrency(totalBalance)}, dengan ${topRatio}% dana terkonsentrasi di dompet "${topWallet?.name || "Utama"}". Buffer ini sanggup menopang operasional selama ${runway} bulan.`;

      const keyMetrics = [
        `Total Likuiditas Kas: ${formatCurrency(totalBalance)}`,
        `Kapasitas Runway Kas: ${runway} Bulan terhadap rata-rata pengeluaran bulanan`,
        `Dompet Dominan: "${topWallet?.name || "Utama"}" (${formatCurrency(topWallet?.balance || 0)} • ${topRatio}%)`,
      ];

      const actionSteps = [
        topRatio > 80
          ? `Pindahkan sebagian saldo sekitar Rp ${Math.round((topWallet?.balance || 0) * 0.3).toLocaleString("id-ID")} ke dompet tabungan terkunci agar terhindar dari belanja impulsif.`
          : `Jaga saldo dompet operasional harian (E-Wallet) maksimal sebesar ${formatCurrency(Math.max(500_000, Math.round(snapshot.monthlyExpense * 0.25)))}.`,
        `Tinjau rekonsiliasi saldo fisik dan digital setiap akhir pekan agar buku kas selalu akurat 100%.`,
      ];

      return {
        status,
        headline,
        diagnosis,
        summary: diagnosis,
        keyMetrics,
        keyInsights: keyMetrics,
        actionSteps,
        actionableRecommendations: actionSteps,
      };
    }

    case "budgets": {
      const budgets = (extraData.budgets as Array<{ category_name: string; limit_amount: number; spent_amount: number; percentage: number }>) || [];
      const overBudgets = budgets.filter((b) => b.percentage >= 100);
      const warningBudgets = budgets.filter((b) => b.percentage >= 80 && b.percentage < 100);

      let status: AIAnalysisResponse["status"] = "healthy";
      let headline = `Pengendalian Anggaran Berjalan Disiplin`;

      if (overBudgets.length > 0) {
        status = "critical";
        headline = `Peringatan: ${overBudgets.length} Pos Pengeluaran Melampaui Batas!`;
      } else if (warningBudgets.length > 0) {
        status = "warning";
        headline = `${warningBudgets.length} Pos Anggaran Mendekati Batas Kritis (>80%)`;
      }

      const diagnosis =
        overBudgets.length > 0
          ? `Terdapat ${overBudgets.length} pos anggaran yang overbudget bulan ini, dengan serapan terbesar pada kategori ${overBudgets.map((b) => b.category_name).join(", ")}. Diperlukan pengendalian belanja diskresioner segera.`
          : `Seluruh pos anggaran bulan ini berada dalam koridor aman dengan disiplin belanja yang baik.`;

      const keyMetrics = [
        `Total Pos Anggaran: ${budgets.length} kategori aktif`,
        overBudgets.length > 0
          ? `Pos Overbudget: ${overBudgets.map((b) => `${b.category_name} (${b.percentage}%)`).join(", ")}`
          : `Status Overbudget: 0 Pos (100% terkontrol)`,
        warningBudgets.length > 0
          ? `Pos Waspada (80-99%): ${warningBudgets.map((b) => `${b.category_name} (${b.percentage}%)`).join(", ")}`
          : `Status Waspada: Seluruh pos di bawah batas aman`,
      ];

      const actionSteps = [
        overBudgets.length > 0
          ? `Tahan pengeluaran diskresioner pada kategori overbudget hingga awal periode bulan depan.`
          : `Pertahankan ritme belanja saat ini dan alokasikan selisih sisa limit anggaran ke pos impian.`,
        `Evaluasi limit anggaran kategori yang rutin overbudget lebih dari 2 bulan berturut-turut.`,
      ];

      return {
        status,
        headline,
        diagnosis,
        summary: diagnosis,
        keyMetrics,
        keyInsights: keyMetrics,
        actionSteps,
        actionableRecommendations: actionSteps,
      };
    }

    case "savings": {
      const goals = (extraData.goals as Array<{ name: string; current_amount: number; target_amount: number; is_completed: boolean }>) || [];
      const totalCurrent = (extraData.totalCurrent as number) || 0;
      const totalTarget = (extraData.totalTarget as number) || 0;
      const completedCount = goals.filter((g) => g.is_completed).length;
      const overallPercent = totalTarget > 0 ? Math.round((totalCurrent / totalTarget) * 100) : 0;

      let status: AIAnalysisResponse["status"] = "healthy";
      let headline = `Progres Tabungan Impian Berjalan Konsisten`;

      if (overallPercent < 20 && goals.length > 0) {
        status = "warning";
        headline = `Progres Akumulasi Tabungan Masih Tahap Awal`;
      }

      const diagnosis = `Akumulasi tabungan ${name} mencapai ${formatCurrency(totalCurrent)} (${overallPercent}%) dari target impian keseluruhan ${formatCurrency(totalTarget)}. Sebanyak ${completedCount} dari ${goals.length} target telah terpenuhi.`;

      const keyMetrics = [
        `Total Terkumpul: ${formatCurrency(totalCurrent)} dari target ${formatCurrency(totalTarget)} (${overallPercent}%)`,
        `Target Selesai: ${completedCount} dari ${goals.length} pos impian`,
        `Kekurangan Menuju Target: ${formatCurrency(Math.max(0, totalTarget - totalCurrent))}`,
      ];

      const actionSteps = [
        `Otomatisasi setoran minimal ${formatCurrency(Math.max(150_000, Math.round(snapshot.monthlyIncome * 0.1)))} ke pos impian prioritas tertinggi setiap tanggal gajian.`,
        `Gunakan simulasi kalkulator bunga majemuk untuk mengukur horizon waktu pencapaian target tabungan.`,
      ];

      return {
        status,
        headline,
        diagnosis,
        summary: diagnosis,
        keyMetrics,
        keyInsights: keyMetrics,
        actionSteps,
        actionableRecommendations: actionSteps,
      };
    }

    case "transactions": {
      const txCount = (extraData.txCount as number) || 0;
      const totalVolume = (extraData.totalVolume as number) || 0;
      const topCatName = (extraData.topCategory as string) || "Kebutuhan";

      const diagnosis = `Pencatatan mutasi ${name} sangat aktif dengan ${txCount} transaksi tercatat dalam 30 hari terakhir (total perputaran ${formatCurrency(totalVolume)}), didominasi oleh kategori "${topCatName}".`;

      const keyMetrics = [
        `Aktivitas Mutasi: ${txCount} transaksi dalam 30 hari terakhir`,
        `Total Perputaran Arus Kas: ${formatCurrency(totalVolume)}`,
        `Kategori Pengeluaran Dominan: ${topCatName}`,
      ];

      const actionSteps = [
        `Gunakan fitur Voice Input (Input Suara) untuk mencatat pengeluaran harian < 5 detik langsung setelah transaksi.`,
        `Periksa daftar langganan berulang bulanan untuk memutus tagihan yang sudah tidak aktif digunakan.`,
      ];

      return {
        status: "healthy",
        headline: `Disiplin Pencatatan Buku Kas Sangat Baik`,
        diagnosis,
        summary: diagnosis,
        keyMetrics,
        keyInsights: keyMetrics,
        actionSteps,
        actionableRecommendations: actionSteps,
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

    // 1. Fetch User Profile Context
    const profile = await getUserProfile();

    // 2. Query Comprehensive Financial Snapshot
    const [
      walletRows,
      savingsRows,
      debtRows,
      monthlyIncomeRows,
      monthlyExpenseRows,
      categoryExpenseRows,
    ] = await Promise.all([
      sql`
        SELECT id, name, type, balance, color
        FROM wallets
        WHERE user_id = ${user.id} AND deleted_at IS NULL
        ORDER BY balance DESC
      `,
      sql`
        SELECT id, name, target_amount, current_amount, target_date::text, is_completed
        FROM savings_goals
        WHERE user_id = ${user.id} AND deleted_at IS NULL
      `,
      sql`
        SELECT COALESCE(SUM(remaining_amount), 0) AS total_debts
        FROM debts
        WHERE user_id = ${user.id}
          AND deleted_at IS NULL
          AND type = 'debt'
          AND status != 'paid'
      `,
      sql`
        SELECT COALESCE(SUM(amount), 0) AS total_income
        FROM transactions
        WHERE user_id = ${user.id}
          AND deleted_at IS NULL
          AND type = 'income'
          AND to_char(transaction_date, 'YYYY-MM') = ${period}
      `,
      sql`
        SELECT COALESCE(SUM(amount + admin_fee), 0) AS total_expense
        FROM transactions
        WHERE user_id = ${user.id}
          AND deleted_at IS NULL
          AND type = 'expense'
          AND to_char(transaction_date, 'YYYY-MM') = ${period}
      `,
      sql`
        SELECT c.name, COALESCE(SUM(t.amount + t.admin_fee), 0) AS amount
        FROM transactions t
        JOIN categories c ON c.id = t.category_id
        WHERE t.user_id = ${user.id}
          AND t.deleted_at IS NULL
          AND t.type = 'expense'
          AND to_char(t.transaction_date, 'YYYY-MM') = ${period}
        GROUP BY c.name
        ORDER BY amount DESC
        LIMIT 3
      `,
    ]);

    const totalBalance = walletRows.reduce((acc, w) => acc + Number(w.balance), 0);
    const totalSavings = savingsRows.reduce((acc, g) => acc + Number(g.current_amount), 0);
    const totalDebts = Number(debtRows[0]?.total_debts || 0);
    const netWorth = (totalBalance + totalSavings) - totalDebts;

    const monthlyIncome = Number(monthlyIncomeRows[0]?.total_income || 0);
    const monthlyExpense = Number(monthlyExpenseRows[0]?.total_expense || 0);
    const monthlyNet = monthlyIncome - monthlyExpense;

    const savingRate =
      monthlyIncome > 0 ? Math.round((monthlyNet / monthlyIncome) * 100) : 0;
    const emergencyRunwayMonths =
      monthlyExpense > 0 ? Number((totalBalance / monthlyExpense).toFixed(1)) : 0;

    const debtToIncomeRatio =
      monthlyIncome > 0
        ? Math.round((totalDebts / monthlyIncome) * 100)
        : totalDebts > 0
        ? 100
        : 0;

    let debtHealthStatus: FinancialProfileSnapshot["debtHealthStatus"] = "debt_free";
    if (totalDebts === 0) {
      debtHealthStatus = "debt_free";
    } else if (debtToIncomeRatio <= 20) {
      debtHealthStatus = "healthy";
    } else if (debtToIncomeRatio <= 40) {
      debtHealthStatus = "moderate";
    } else {
      debtHealthStatus = "critical";
    }

    const topExpenses = categoryExpenseRows.map((r) => {
      const amt = Number(r.amount);
      return {
        name: r.name as string,
        amount: amt,
        percentage: monthlyExpense > 0 ? Math.round((amt / monthlyExpense) * 100) : 0,
      };
    });

    const snapshot: FinancialProfileSnapshot = {
      name: profile.name || "Pengguna",
      age: profile.age ?? null,
      occupation: profile.occupation ?? null,
      netWorth,
      totalBalance,
      totalSavings,
      totalDebts,
      totalReceivables: 0,
      monthlyIncome,
      monthlyExpense,
      monthlyNet,
      savingRate,
      emergencyRunwayMonths,
      debtToIncomeRatio,
      debtHealthStatus,
      topExpenses,
    };

    // 3. Gather Module-Specific Extra Context
    let extraData: Record<string, unknown> = {};
    let moduleSpecificPrompt = "";

    if (moduleType === "dashboard") {
      extraData = {
        wallets: walletRows.map((w) => ({ name: w.name, balance: Number(w.balance), type: w.type })),
        goals: savingsRows.map((g) => ({ name: g.name, current: Number(g.current_amount), target: Number(g.target_amount) })),
      };
      moduleSpecificPrompt = `Fokus evaluasi: Gambaran besar kesehatan finansial, neraca aset bersih vs hutang, dan laju pertumbuhan kekayaan.`;
    } else if (moduleType === "wallets") {
      extraData = {
        wallets: walletRows.map((w) => ({ name: w.name, balance: Number(w.balance), type: w.type })),
      };
      moduleSpecificPrompt = `Fokus evaluasi: Distribusi likuiditas kas antar dompet, keamanan dana darurat, dan risiko konsentrasi dana.`;
    } else if (moduleType === "budgets") {
      const budgetRows = await sql`
        SELECT 
          b.id,
          b.category_id,
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
        WHERE b.user_id = ${user.id}
          AND b.period = ${period}
        GROUP BY b.id, b.category_id, b.limit_amount, c.name
      `;

      const budgets = budgetRows.map((b) => {
        const limit = Number(b.limit_amount);
        const spent = Number(b.spent_amount);
        return {
          category_name: b.category_name as string,
          limit_amount: limit,
          spent_amount: spent,
          percentage: limit > 0 ? Math.round((spent / limit) * 100) : 0,
        };
      });

      extraData = { budgets, period };
      moduleSpecificPrompt = `Fokus evaluasi: Kepatuhan serapan anggaran kategori, mitigasi overbudget, dan efisiensi pengeluaran diskresioner. Rincian anggaran: ${JSON.stringify(budgets)}`;
    } else if (moduleType === "savings") {
      const totalCurrent = savingsRows.reduce((acc, g) => acc + Number(g.current_amount), 0);
      const totalTarget = savingsRows.reduce((acc, g) => acc + Number(g.target_amount), 0);
      extraData = {
        goals: savingsRows.map((g) => ({
          name: g.name,
          current_amount: Number(g.current_amount),
          target_amount: Number(g.target_amount),
          is_completed: Boolean(g.is_completed),
        })),
        totalCurrent,
        totalTarget,
      };
      moduleSpecificPrompt = `Fokus evaluasi: Progres pos impian, horizon waktu pencapaian target tabungan bersama dan pribadi. Rincian target: ${JSON.stringify(extraData.goals)}`;
    } else if (moduleType === "transactions") {
      const txStats = await sql`
        SELECT 
          COUNT(*) AS total_count,
          COALESCE(SUM(amount), 0) AS total_volume
        FROM transactions
        WHERE user_id = ${user.id}
          AND deleted_at IS NULL
          AND transaction_date >= now() - interval '30 days'
      `;
      const txCount = Number(txStats[0]?.total_count || 0);
      const totalVolume = Number(txStats[0]?.total_volume || 0);

      extraData = {
        txCount,
        totalVolume,
        topCategory: topExpenses[0]?.name || "Kebutuhan",
      };
      moduleSpecificPrompt = `Fokus evaluasi: Kebiasaan pencatatan mutasi harian, volume perputaran dana, dan deteksi kebocoran halus pada pengeluaran mikro.`;
    }

    // 4. Call Google Gemini API with Dynamic Prompting
    const apiKey =
      process.env.GEMINI_API_KEY ||
      process.env.AI_GATEWAY_API_KEY ||
      process.env.OPENAI_API_KEY;

    if (apiKey) {
      try {
        const dynamicSystemPrompt = `Kamu adalah Senior Certified Financial Planner (CFP) di Pintar Finance.
Tugasmu adalah menganalisis data keuangan pengguna secara dinamis dan personal, bebas dari saran klise hardcoded.

PROFIL PENGGUNA:
- Nama: ${snapshot.name}
- Usia: ${snapshot.age ? `${snapshot.age} tahun` : "Dewasa Muda"}
- Profesi/Pekerjaan: ${snapshot.occupation || "Pekerja Profesional"}

SNAPSHOT METRIK FINANSIAL NYATA PENGGUNA:
- Total Net Worth (Aset Bersih): ${formatCurrency(snapshot.netWorth)}
- Likuiditas Kas di Dompet: ${formatCurrency(snapshot.totalBalance)}
- Dana Terkunci di Pos Impian: ${formatCurrency(snapshot.totalSavings)}
- Sisa Pokok Hutang/Liabilitas: ${formatCurrency(snapshot.totalDebts)}
- Pemasukan Bulan Ini (${period}): ${formatCurrency(snapshot.monthlyIncome)}
- Pengeluaran Bulan Ini (${period}): ${formatCurrency(snapshot.monthlyExpense)}
- Arus Kas Bersih: ${formatCurrency(snapshot.monthlyNet)}
- Saving Rate: ${snapshot.savingRate}%
- Runway Dana Darurat: ${snapshot.emergencyRunwayMonths} Bulan
- Rasio Debt-to-Income (DTI): ${snapshot.debtToIncomeRatio}% (Status: ${snapshot.debtHealthStatus})
- Top 3 Pengeluaran: ${snapshot.topExpenses.map((e) => `${e.name} (${formatCurrency(e.amount)} • ${e.percentage}%)`).join(", ") || "Belum ada transaksi"}

${moduleSpecificPrompt}

PANDUAN PENALARAN KONTEKSTUAL (DYNAMIC REASONING):
1. Penalaran Profesi:
   - Jika Pekerja Lepas / Freelancer / Wirausaha / Bisnis: Soroti manajemen volatilitas arus kas, perpanjangan buffer dana darurat (target 6-12 bulan), dan pemisahan dana operasional vs pribadi.
   - Jika Karyawan Tetap / PNS / BUMN: Arahkan pada optimasi anggaran 50/30/20, percepatan pelunasan hutang, dan investasi rutin otomatis saat tanggal gajian.
   - Jika Mahasiswa / Fresh Graduate: Fokus pada pembentukan kebiasaan mencatat, membangun dana darurat pertama, menghindari pinjol/paylater, dan upskilling.
2. Penyesuaian Nada & Usia:
   - Usia < 25 th: Nada bersahabat, energik, memotivasi kebiasaan berinvestasi sejak dini.
   - Usia 25 - 40 th: Nada strategis, berorientasi target masa depan (rumah, keluarga, akselerasi aset).
   - Usia > 40 th: Nada matang, fokus pada pelunasan hutang, dana pensiun, dan proteksi kekayaan.
3. Evaluasi Berbasis Angka Nyata: Selalu sebutkan nominal rupiah riil, persentase saving rate, rasio DTI, dan bulan runway pengguna dalam analisis.

STRUKTUR OUTPUT WAJIB 3 BAGIAN:
KEMBALIKAN HANYA JSON MURNI SESUAI SCHEMA:
{
  "status": "healthy" | "warning" | "critical",
  "headline": string (Judul tajam & profesional, maksimal 12 kata),
  "diagnosis": string (BAGIAN 1: Diagnosis Singkat dalam 1-2 kalimat mengevaluasi arus kas dan beban hutang dengan angka riil),
  "keyMetrics": string[] (BAGIAN 2: 3-4 butir Sorotan Metrik Utama yang memuat angka rupiah, %, dan status kesehatannya),
  "actionSteps": string[] (BAGIAN 3: 2-3 Langkah Aksi Konkret terukur dengan estimasi nominal rupiah spesifik untuk dieksekusi minggu ini)
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
                  contents: [{ parts: [{ text: dynamicSystemPrompt }] }],
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
                const parsed = JSON.parse(rawText);
                const diagnosisText = parsed.diagnosis || parsed.summary || "";
                const keyMetricsArray = Array.isArray(parsed.keyMetrics)
                  ? parsed.keyMetrics
                  : Array.isArray(parsed.keyInsights)
                  ? parsed.keyInsights
                  : [];
                const actionStepsArray = Array.isArray(parsed.actionSteps)
                  ? parsed.actionSteps
                  : Array.isArray(parsed.actionableRecommendations)
                  ? parsed.actionableRecommendations
                  : [];

                if (parsed.status && parsed.headline && diagnosisText) {
                  return {
                    success: true,
                    data: {
                      status: parsed.status,
                      headline: parsed.headline,
                      diagnosis: diagnosisText,
                      summary: diagnosisText,
                      keyMetrics: keyMetricsArray,
                      keyInsights: keyMetricsArray,
                      actionSteps: actionStepsArray,
                      actionableRecommendations: actionStepsArray,
                      usedModel: modelName,
                    },
                  };
                }
              }
            }
          } catch {
            // try next model
          }
        }
      } catch (geminiError) {
        console.warn("Gemini API call failed, using dynamic CFP rule engine:", geminiError);
      }
    }

    // 5. Intelligent Dynamic Fallback Engine
    const fallback = generateFallbackAnalysis(moduleType, snapshot, extraData);
    return {
      success: true,
      data: fallback,
    };
  } catch (error) {
    console.error("Error executing getModuleAIAnalysis:", error);
    return {
      success: false,
      error: "Gagal memproses analisis AI untuk modul ini.",
    };
  }
}
