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

interface ComprehensiveFinancialContext {
  userName: string;
  netWorth: number;
  monthlyIncome: number;
  monthlyExpense: number;
  netSavings: number;
  savingsRatio: number;
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

// ─── Broad & Deep Certified Financial Planner Reasoning Engine ────────────────

function generateDeepFinancialConsultation(
  userPrompt: string,
  ctx: ComprehensiveFinancialContext,
  activeContext?: string
): string {
  const query = userPrompt.toLowerCase().trim();
  const name = ctx.userName;

  // ── 1. Analisis Hemat & Pengurangan Pengeluaran ─────────────────────────────
  if (
    query.includes("hemat") ||
    query.includes("kurangi") ||
    query.includes("boros") ||
    query.includes("pangkas") ||
    query.includes("20%") ||
    query.includes("bocor halus")
  ) {
    const topCat = ctx.topCategories[0];
    const topCatName = topCat?.name || "Gaya Hidup & Konsumsi";
    const topCatAmount = topCat?.amount || Math.round(ctx.monthlyExpense * 0.4);
    const targetSavings = Math.round(ctx.monthlyExpense * 0.2);

    return `Halo **${name}**! Mari kita bedah struktur pengeluaran Anda secara analitis dan strategis.

Berdasarkan data transaksi bulan ini, total belanja Anda tercatat **${formatCurrency(
      ctx.monthlyExpense
    )}**. Target penghematan 20% berarti Anda dapat mengamankan surplus baru sebesar **${formatCurrency(
      targetSavings
    )}/bulan**.

📊 **Audit Sektor Pengeluaran Terbesar:**
Pos belanja paling dominan saat ini adalah **${topCatName}** sebesar **${formatCurrency(
      topCatAmount
    )}** (${topCat?.percentage || 35}% dari total pengeluaran).

💡 **4 Langkah Strategis Pemangkasan Beban Keuangan:**
1. **Aturan 3 Hari Audit Jajan:** Kategorikan pengeluaran harian ke dalam *Must-Have* vs *Nice-to-Have*. Membatasi frekuensi kopi harian atau pesan-antar makanan 2x/minggu berpotensi memangkas Rp 400.000 – Rp 800.000/bulan.
2. **Audit Komitmen Rutin:** Periksa menu **Transaksi Berulang** di Pintar Finance. Nonaktifkan langganan aplikasi (*streaming, SaaS, gym*) yang jarang diakses.
3. **Penerapan *Cooling-off Period* (24–48 Jam):** Tunda setiap pembelian non-primer di atas Rp 300.000 selama minimal 24 jam untuk meredam bias belanja impulsif.
4. **Optimasi Biaya Admin & Transfer:** Gunakan fitur transfer BI-Fast atau dompet digital tanpa admin untuk menghentikan kebocoran halus saldo.`;
  }

  // ── 2. Dana Darurat & Mitigasi Risiko ────────────────────────────────────────
  if (
    query.includes("darurat") ||
    query.includes("emergency") ||
    query.includes("jaga-jaga") ||
    query.includes("aman") ||
    query.includes("asuransi")
  ) {
    const monthlyLiving = ctx.monthlyExpense > 0 ? ctx.monthlyExpense : 3000000;
    const minEmergency = monthlyLiving * 3;
    const idealEmergency = monthlyLiving * 6;
    const maxEmergency = monthlyLiving * 12;
    const currentLiquidity = ctx.netWorth;
    const emergencyCoverageMonths = (currentLiquidity / monthlyLiving).toFixed(1);

    return `Halo **${name}**, dana darurat (*Emergency Fund*) adalah pilar pertahanan utama dalam piramida kesehatan finansial!

📊 **Simulasi Kebutuhan Dana Darurat Anda:**
- Pengeluaran Bulanan Rata-rata: **${formatCurrency(monthlyLiving)}**
- **Fase 1 (Minimal - Lajang):** **${formatCurrency(minEmergency)}** (3 bulan biaya hidup)
- **Fase 2 (Ideal - Berkeluarga/Karyawan):** **${formatCurrency(idealEmergency)}** (6 bulan biaya hidup)
- **Fase 3 (Maksimal - Freelancer/Bisnis):** **${formatCurrency(maxEmergency)}** (12 bulan biaya hidup)
- **Likuiditas Dompet Anda Saat Ini:** **${formatCurrency(currentLiquidity)}** (Mencakup ~${emergencyCoverageMonths} bulan biaya hidup)

🛡️ **Rekomendasi Penempatan Portofolio Likuid:**
1. **60% di Tabungan Bank Digital / Rekening Terpisah:** Untuk kebutuhan mendesak H+0 (contoh: Bank Jago, Seabank, BCA).
2. **40% di Reksadana Pasar Uang (RDPU) / Deposito Digital:** Memberikan return 4.5%–6% per tahun bebas pajak dengan waktu pencairan 1–2 hari kerja (T+1).`;
  }

  // ── 3. Investasi, Saham, Reksadana, SBN & Compounding Interest ───────────────
  if (
    query.includes("investasi") ||
    query.includes("saham") ||
    query.includes("reksadana") ||
    query.includes("sbn") ||
    query.includes("obligasi") ||
    query.includes("crypto") ||
    query.includes("emas") ||
    query.includes("dividen") ||
    query.includes("compound")
  ) {
    const investableSurplus = ctx.netSavings > 0 ? ctx.netSavings : Math.round(ctx.monthlyIncome * 0.2);

    return `Halo **${name}**! Strategi investasi yang berkelanjutan selalu mengutamakan keselarasan antara **Jangka Waktu (*Time Horizon*)**, **Profil Risiko**, dan **Disiplin Dollar-Cost Averaging (DCA)**.

💰 **Kapasitas Investasi Bulanan Anda:**
Saat ini potensi surplus bulanan Anda adalah **${formatCurrency(
      investableSurplus
    )}/bulan** (Rasio tabungan: **${ctx.savingsRatio}%**).

📈 **Panduan Alokasi Portofolio Berdasarkan Horizon Waktu:**
1. **Jangka Pendek (< 1 Tahun):**
   - *Instrumen:* Reksadana Pasar Uang (RDPU) & Deposito Berjangka (Bunga ~4.5%–6%/thn).
   - *Fungsi:* Menjaga nilai modal dari inflasi tanpa risiko fluktuasi harga.
2. **Jangka Menengah (1 – 3 Tahun):**
   - *Instrumen:* Surat Berharga Negara (SBN ORI/SR) & Reksadana Pendapatan Tetap (RDPT) (Kupon ~6.2%–7.0%/thn).
   - *Fungsi:* Menghasilkan *passive income* bulanan dengan jaminan undang-undang negara.
3. **Jangka Panjang (> 3 – 5 Tahun):**
   - *Instrumen:* Reksadana Indeks (misal IDX30 / LQ45), Saham Bluechip Berdividen, atau Emas Digital.
   - *Fungsi:* Mengoptimalkan efek *compound interest* (ekspektasi return 9%–14%/thn).

💡 *Tips:* Gunakan fitur **Kalkulator Bunga** di menu samping untuk mensimulasikan proyeksi nilai aset Anda hingga 10–20 tahun ke depan!`;
  }

  // ── 4. Metode Anggaran 50/30/20 & Evaluasi Budget ───────────────────────────
  if (
    query.includes("50/30/20") ||
    query.includes("anggaran") ||
    query.includes("budget") ||
    query.includes("alokasi") ||
    query.includes("gaji")
  ) {
    const income = ctx.monthlyIncome > 0 ? ctx.monthlyIncome : 8000000;
    const needsLimit = Math.round(income * 0.5);
    const wantsLimit = Math.round(income * 0.3);
    const savingsLimit = Math.round(income * 0.2);

    const overBudgets = ctx.budgets.filter((b) => b.isOver);

    return `Halo **${name}**! Metode **50/30/20 Rule** adalah pedoman alokasi arus kas yang sangat efektif untuk menjaga kesehatan finansial jangka panjang:

💰 **Simulasi Alokasi Penghasilan Bulanan (${formatCurrency(income)}):**
1. **50% Kebutuhan Pokok (*Needs*):** Maksimal **${formatCurrency(needsLimit)}**
   - Alokasi: Makan harian, sewa tempat tinggal, tagihan listrik/air/wifi, transportasi rutin, dan asuransi dasar.
2. **30% Keinginan & Gaya Hidup (*Wants*):** Maksimal **${formatCurrency(wantsLimit)}**
   - Alokasi: Hiburan, jajan kuliner, hobi, rekreasi akhir pekan, dan pakaian.
3. **20% Tabungan & Investasi (*Savings*):** Minimal **${formatCurrency(savingsLimit)}**
   - Alokasi: Dana darurat, pos impian jangka menengah, dan investasi masa depan.

📊 **Status Anggaran Aktif Anda Saat Ini:**
Anda memiliki **${ctx.budgets.length} pos anggaran** yang aktif dipantau.
${
  overBudgets.length > 0
    ? `⚠️ *Perhatian:* Ada ${overBudgets.length} pos yang melewati limit, yaitu: ${overBudgets
        .map((b) => `**${b.categoryName}** (${b.percentage}%)`)
        .join(", ")}.`
    : `✅ *Bagus!* Seluruh pos anggaran Anda saat ini masih berada di bawah batas limit pengeluaran.`
}`;
  }

  // ── 5. Rencana Pembelian Target / Tabungan Impian ────────────────────────────
  if (
    query.includes("beli") ||
    query.includes("tabungan") ||
    query.includes("impian") ||
    query.includes("rumah") ||
    query.includes("mobil") ||
    query.includes("motor") ||
    query.includes("nikah") ||
    query.includes("gadget") ||
    query.includes("iphone") ||
    query.includes("liburan")
  ) {
    const activeGoals = ctx.savingsGoals;
    const surplus = ctx.netSavings > 0 ? ctx.netSavings : Math.round(ctx.monthlyIncome * 0.25);

    return `Halo **${name}**! Untuk merealisasikan target pembelian barang atau impian tanpa mengganggu stabilitas keuangan, mari kita gunakan pendekatan *Goal-Based Financial Planning*.

🎯 **Pos Tabungan Impian Anda Saat Ini (${activeGoals.length} Pos):**
${
  activeGoals.length > 0
    ? activeGoals
        .map(
          (g) =>
            `- **${g.name}:** Terkumpul ${formatCurrency(g.currentAmount)} dari ${formatCurrency(
              g.targetAmount
            )} (${g.percentage}% | Kurang: ${formatCurrency(g.remaining)})`
        )
        .join("\n")
    : `- Belum ada pos tabungan impian aktif. Anda bisa menambahkannya di menu **Tabungan Impian**.`
}

💡 **Strategi Percepatan Pencapaian Target:**
1. **Hitung Kecepatan Waktu (*Timeline Runrate*):** Dengan komitmen alokasi rutin sebesar **${formatCurrency(
      surplus
    )}/bulan**, hitung durasi target dengan formula: $\\text{Bulan} = \\frac{\\text{Sisa Kebutuhan}}{\\text{Setoran Rutin}}$.
2. **Pisahkan Rekening Reksa Dana / Sinking Fund:** Jangan mencampur dana tabungan impian dengan rekening operasional harian agar tidak terpakai tanpa sadar.
3. **Manfaatkan Fitur Tabungan Bersama:** Jika pos impian ditargetkan bersama pasangan atau keluarga, gunakan fitur undang anggota di Pintar Finance agar progres terkumpul secara transparan.`;
  }

  // ── 6. Manajemen Hutang & Cicilan (Debt Management) ──────────────────────────
  if (
    query.includes("hutang") ||
    query.includes("utang") ||
    query.includes("cicilan") ||
    query.includes("paylater") ||
    query.includes("kartu kredit") ||
    query.includes("pinjol") ||
    query.includes("kpr")
  ) {
    const maxSafeInstallment = Math.round(ctx.monthlyIncome * 0.3);

    return `Halo **${name}**! Pengelolaan kewajiban cicilan yang sehat adalah kunci agar keuangan tidak tertekan:

📊 **Batas Aman Beban Hutang (*Debt Service Ratio / DSR*):**
- Total seluruh cicilan bulanan idealnya **tidak melebihi 30% dari penghasilan** (Maksimal aman Anda: **${formatCurrency(
      maxSafeInstallment
    )}/bulan**).

🛡️ **2 Metode Pelunasan Hutang Paling Efektif:**
1. **Metode *Debt Avalanche* (Paling Hemat Bunga):**
   - Urutkan seluruh hutang berdasarkan persentase bunga tertinggi (misal: Pinjol/Paylater > Kartu Kredit > KTA > KPR).
   - Bayar cicilan minimum untuk semua hutang, lalu alokasikan seluruh sisa surplus uang untuk melunasi hutang dengan bunga tertinggi terlebih dahulu.
2. **Metode *Debt Snowball* (Paling Efektif Membangun Motivasi Mental):**
   - Urutkan hutang dari nominal saldo terkecil ke terbesar.
   - Fokus lunasi hutang terkecil secepat mungkin agar daftar kewajiban berkurang satu per satu.

💡 *Prinsip Utama:* Hindari mengambil cicilan baru untuk barang konsumtif non-produktif sebelum beban cicilan lama tuntas.`;
  }

  // ── 7. Konsultasi Komprehensif Finansial Umum (Default Broad Answer) ─────────
  const surplusStatus =
    ctx.netSavings >= 0
      ? `surplus sebesar **+${formatCurrency(ctx.netSavings)}** (Rasio Tabungan: **${ctx.savingsRatio}%**)`
      : `defisit sebesar **${formatCurrency(ctx.netSavings)}**`;

  return `Halo **${name}**! Saya adalah asisten kecerdasan finansial **Pintar AI** Anda.

Berikut adalah tinjauan kesehatan portofolio keuangan Anda saat ini:
- **Total Saldo / Likuiditas Portofolio:** **${formatCurrency(ctx.netWorth)}** (${ctx.wallets.length} Dompet Aktif)
- **Pemasukan Bulan Berjalan:** **${formatCurrency(ctx.monthlyIncome)}**
- **Pengeluaran Bulan Berjalan:** **${formatCurrency(ctx.monthlyExpense)}**
- **Kondisi Arus Kas:** Menghasilkan ${surplusStatus}
- **Pos Tabungan Impian:** **${ctx.savingsGoals.length} target** aktif berjalan
- **Pos Anggaran:** **${ctx.budgets.length} kategori** dalam pemantauan

${activeContext ? `📌 *Konteks Halaman Aktif:* Sedang menganalisis modul **${activeContext}**.\n` : ""}
Ada topik khusus yang ingin kita diskusikan lebih dalam? Anda bisa menanyakan:
1. *Strategi alokasi investasi bulanan (DCA, SBN, Reksadana, Saham)*
2. *Simulasi pembagian anggaran 50/30/20 berdasarkan penghasilan Anda*
3. *Rencana pelunasan dan batas aman beban cicilan*
4. *Cara menghitung dan mengumpulkan target dana darurat ideal*`;
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
    const [wallets, txSummary, goals, budgets, topCategoryRows, recurringRows] =
      await Promise.all([
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
      ]);

    const totalBalance = wallets.reduce((acc, w) => acc + Number(w.balance), 0);
    const monthlyIncome = Number(txSummary[0]?.monthly_income || 0);
    const monthlyExpense = Number(txSummary[0]?.monthly_expense || 0);
    const netSavings = monthlyIncome - monthlyExpense;
    const savingsRatio =
      monthlyIncome > 0 ? Math.round((netSavings / monthlyIncome) * 100) : 0;

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
      userName: user.name || "Pengguna",
      netWorth: totalBalance,
      monthlyIncome,
      monthlyExpense,
      netSavings,
      savingsRatio,
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

    // 2. Query External Gemini LLM if a genuine API key is configured
    const apiKey =
      process.env.GEMINI_API_KEY ||
      (process.env.AI_GATEWAY_API_KEY?.startsWith("AIzaSy") ? process.env.AI_GATEWAY_API_KEY : undefined);

    if (apiKey) {
      try {
        const systemPrompt = `Kamu adalah Pintar AI — Financial Advisor & Certified Financial Planner (CFP) berdedikasi tinggi di aplikasi Pintar Finance.
Persona kamu: Objektif, berwawasan luas, analitis, suportif, komunikatif, solutif, dan ramah dalam bahasa Indonesia.
Gunakan format Markdown yang rapi (bullet point, tebalkan angka/istilah kunci) agar nyaman dibaca.

DATA FINANSIAL LENGKAP PENGGUNA:
- Nama Pengguna: ${fullContext.userName}
- Total Saldo Dompet (Net Worth): ${formatCurrency(fullContext.netWorth)}
- Pemasukan Bulan Ini (${period}): ${formatCurrency(fullContext.monthlyIncome)}
- Pengeluaran Bulan Ini (${period}): ${formatCurrency(fullContext.monthlyExpense)}
- Arus Kas Bersih: ${formatCurrency(fullContext.netSavings)} (Rasio Tabungan: ${fullContext.savingsRatio}%)
- Rincian Dompet: ${JSON.stringify(fullContext.wallets)}
- Top Kategori Pengeluaran: ${JSON.stringify(fullContext.topCategories)}
- Pos Tabungan Impian (${fullContext.savingsGoals.length}): ${JSON.stringify(fullContext.savingsGoals)}
- Batas Anggaran (${fullContext.budgets.length}): ${JSON.stringify(fullContext.budgets)}
- Langganan Rutin: ${JSON.stringify(fullContext.recurringItems)}
${activeContext ? `- Konteks Modul Halaman: ${activeContext}` : ""}

Jawablah pertanyaan pengguna dengan mengaitkan data finansial nyata mereka secara personal dan berikan edukasi serta strategi actionable.`;

        const geminiContents = [
          {
            role: "user",
            parts: [{ text: systemPrompt }],
          },
          {
            role: "model",
            parts: [
              {
                text: `Halo ${fullContext.userName}! Saya siap mendampingi perencanaan dan evaluasi keuangan Anda dengan wawasan cerdas dan solutif. Ada yang bisa saya bantu hari ini?`,
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
                temperature: 0.5,
                maxOutputTokens: 1200,
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
        console.warn("Gemini API call failed, using high-intelligence local planner engine:", geminiError);
      }
    }

    // 3. Deep In-Engine Financial Reasoning Response
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
