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

// ─── Broad & Deep Certified Financial Planner Reasoning Fallback Engine ────────

function generateDeepFinancialConsultation(
  userPrompt: string,
  ctx: ComprehensiveFinancialContext,
  activeContext?: string
): string {
  const query = userPrompt.toLowerCase().trim();
  const name = ctx.userName;

  // ── 1. Tanya Konsep Compounding vs Menabung Biasa ────────────────────────────
  if (
    (query.includes("hanya") && query.includes("menabung")) ||
    (query.includes("aset") && query.includes("berbunga")) ||
    query.includes("beda menabung") ||
    query.includes("reinvestasi")
  ) {
    return `Halo **${name}**! Ini pertanyaan yang sangat fundamental dan krusial dalam perencanaan keuangan.

Jawabannya tegas: **Compound interest (bunga majemuk) TIDAK BEKERJA jika uang hanya ditabung di rekening bank biasa atau disimpan tunai.**

Agar efek bunga majemuk (*compound return*) bekerja, uang Anda **wajib ditempatkan pada aset produktif yang menghasilkan imbal hasil (bunga, kupon, dividen, atau *capital growth*) yang diinvestasikan kembali (*reinvested*)**.

📊 **Perbandingan Menabung Biasa vs Aset Berbunga:**

1. **Menabung di Rekening Biasa (Bunga ~0%–1%):**
   - Nilai uang Anda bertumbuh secara linear atau bahkan tergerus oleh inflasi (~3%–4%/thn) dan biaya administrasi bulanan (~Rp 15.000/bln).
   - Uang Rp 10 juta yang Anda diamkan selama 5 tahun di tabungan biasa tetap bernilai nominal Rp 10 juta, namun daya belinya berkurang drastis.

2. **Meletakkan Uang di Aset Produktif (Bunga Majemuk):**
   - Modal Anda menghasilkan keuntungan di Tahun 1.
   - Di Tahun 2, keuntungan Tahun 1 **bergabung dengan modal pokok** untuk menghasilkan keuntungan baru yang lebih besar.
   - Hasilnya adalah kurva pertumbuhan **eksponensial** (*bunga di atas bunga*).

💡 **Aset yang Mengaktifkan Bunga Majemuk di Indonesia:**
- **Reksadana Pendapatan Tetap / Pasar Uang:** Keuntungan otomatis terakumulasi dalam Nilai Aktiva Bersih (NAB).
- **Surat Berharga Negara (SBN ORI/SR):** Kupon bulanan langsung dibelikan unit baru secara otomatis.
- **Saham Berdividen (Dividen Reinvestment Plan):** Dividen kas digunakan kembali untuk membeli lembar saham tambahan.
- **Deposito Digital:** Mengaktifkan opsi *Automatic Roll Over (ARO) + Bunga*.

Ada instrumen tertentu yang ingin kita bedah potensinya untuk portofolio Anda?`;
  }

  // ── 2. Tanya Cara Lain / Alternatif ──────────────────────────────────────────
  if (
    query.includes("cara lain") ||
    query.includes("alternatif") ||
    query.includes("opsi lain") ||
    query.includes("selain itu") ||
    query.includes("pilihan lain")
  ) {
    return `Halo **${name}**! Tentu saja, selain instrumen pasar modal konvensional, ada beberapa alternatif strategis lainnya untuk mempercepat pertumbuhan kekayaan Anda:

📈 **4 Alternatif Strategi Pertumbuhan Aset & Arus Kas:**

1. **Investasi pada Diri Sendiri (*Upskilling & High-Income Skills*):**
   - Tingkatkan kemampuan di bidang bernilai tinggi (misal: *data, tech, sales, konsultasi*) untuk mendongkrak penghasilan pokok bulanan Anda. Penghasilan yang lebih besar memperbesar porsi modal yang bisa diinvestasikan (*fuel for compounding*).

2. **Bisnis Sampingan atau *Micro-Business* (*Side Hustle*):**
   - Membangun bisnis produk digital, *e-commerce*, atau agensi jasa dengan *margin* laba tinggi. Keuntungan bersih dapat langsung diputar kembali (*reinvested*) ke dalam bisnis untuk *compounding* omzet.

3. **Emas Batangan / Emas Digital Terjadwal:**
   - Menyisihkan gramatur emas secara rutin sebagai aset lindung nilai (*hedging*) terhadap depresiasi mata uang dalam jangka panjang (5–10+ tahun).

4. **Investasi Properti / REITs (Dana Investasi Real Estat):**
   - Mengalokasikan dana ke efek beragun properti yang membagikan dividen sewa secara reguler tanpa repot mengelola fisik bangunan.

💡 *Kunci Utama:* Kombinasikan 1 instrumen pelindung nilai (Dana Darurat di RDPU) dengan 1 instrumen bertumbuh (Saham/Bisnis) agar risiko tetap terukur.`;
  }

  // ── 3. Tata Cara / Langkah Memulai Compounding ──────────────────────────────
  if (
    query.includes("tata cara") ||
    query.includes("cara melakukan") ||
    query.includes("langkah") ||
    query.includes("panduan") ||
    query.includes("mulai compound")
  ) {
    return `Halo **${name}**! Berikut adalah panduan langkah demi langkah (*step-by-step*) untuk menjalankan keajaiban bunga majemuk (*compound interest*) secara nyata:

🚀 **5 Langkah Praktis Menjalankan Compounding Interest:**

1. **Tentukan Modal Pokok & Komitmen Bulanan (*DCA*):**
   - Mulai dengan modal awal (misal Rp 1.000.000) dan tetapkan setoran rutin bulanan (misal Rp 500.000 – Rp 1.500.000) yang langsung disisihkan di awal gajian (*Pay Yourself First*).

2. **Pilih Platform & Instrumen Resmi Berizin OJK:**
   - Gunakan aplikasi APERD / Sekuritas terpercaya (contoh: Bibit, Bareksa, Stockbit, Ajaib, Pluang, atau Bank Kustodian).
   - Pilih instrumen sesuai target: **Reksadana Indeks / Saham Bluechip** untuk >5 tahun, atau **SBN / RDPT** untuk 1–3 tahun.

3. **Aktifkan Fitur Auto-Debet & Reinvestasi Otomatis:**
   - Kunci sukses bunga majemuk adalah **tidak menarik keuntungan (*capital gain* / dividen)**. Biarkan seluruh imbal hasil kembali membesar bersama modal pokok.

4. **Disiplin Waktu (*Time in the Market > Timing the Market*):**
   - Efek penggandaan bunga majemuk biasanya mulai terasa sangat masif setelah **tahun ke-5 hingga ke-10**. Jangan panik saat pasar berfluktuasi jangka pendek.

5. **Gunakan Kalkulator Simulasi Pintar Finance:**
   - Buka menu **Kalkulator Bunga** di navigasi samping untuk melihat visualisasi grafik pertumbuhan modal vs bunga per tahun!`;
  }

  // ── 4. Analisis Hemat & Pengurangan Pengeluaran ─────────────────────────────
  if (
    query.includes("hemat") ||
    query.includes("kurangi") ||
    query.includes("boros") ||
    query.includes("pangkas") ||
    query.includes("20%")
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
1. **Aturan 3 Hari Audit Jajan:** Batasi frekuensi pesan-antar makanan 2x/minggu untuk menghemat Rp 400.000 – Rp 800.000/bulan.
2. **Audit Komitmen Rutin:** Nonaktifkan langganan aplikasi yang jarang digunakan pada menu Transaksi Berulang.
3. **Penerapan Cooling-off Period (24 Jam):** Tunda pembelian non-primer selama 24 jam sebelum transaksi.
4. **Optimasi Biaya Admin:** Gunakan transfer BI-Fast tanpa biaya admin.`;
  }

  // ── 5. Dana Darurat & Mitigasi Risiko ────────────────────────────────────────
  if (query.includes("darurat") || query.includes("emergency")) {
    const monthlyLiving = ctx.monthlyExpense > 0 ? ctx.monthlyExpense : 3000000;
    const minEmergency = monthlyLiving * 3;
    const idealEmergency = monthlyLiving * 6;

    return `Halo **${name}**, dana darurat (*Emergency Fund*) adalah pilar pertahanan utama dalam piramida finansial!

📊 **Simulasi Kebutuhan Dana Darurat Anda:**
- Pengeluaran Bulanan: **${formatCurrency(monthlyLiving)}**
- Target Minimal (3 Bulan Biaya Hidup): **${formatCurrency(minEmergency)}**
- Target Ideal (6 Bulan Biaya Hidup): **${formatCurrency(idealEmergency)}**
- Likuiditas Dompet Anda Saat Ini: **${formatCurrency(ctx.netWorth)}**

🛡️ **Rekomendasi Penempatan:**
1. 60% di Tabungan Bank Digital / Rekening Terpisah untuk likuiditas instan.
2. 40% di Reksadana Pasar Uang (RDPU) dengan imbal hasil 4.5%–6%/thn bebas pajak.`;
  }

  // ── 6. Default Dynamic Overview ─────────────────────────────────────────────
  const surplusStatus =
    ctx.netSavings >= 0
      ? `surplus sebesar **+${formatCurrency(ctx.netSavings)}** (Rasio Tabungan: **${ctx.savingsRatio}%**)`
      : `defisit sebesar **${formatCurrency(ctx.netSavings)}**`;

  return `Halo **${name}**! Saya adalah asisten kecerdasan finansial **Pintar AI** Anda.

Berikut adalah tinjauan ringkas portofolio Anda saat ini:
- **Total Likuiditas Seluruh Dompet:** **${formatCurrency(ctx.netWorth)}** (${ctx.wallets.length} Akun)
- **Arus Kas Bulan Berjalan:** Pemasukan ${formatCurrency(ctx.monthlyIncome)} vs Pengeluaran ${formatCurrency(ctx.monthlyExpense)} (${surplusStatus})
- **Pos Tabungan Impian:** **${ctx.savingsGoals.length} target** aktif
- **Pos Anggaran:** **${ctx.budgets.length} kategori**

${activeContext ? `📌 *Konteks Halaman Aktif:* Sedang menganalisis modul **${activeContext}**.\n` : ""}
Silakan ajukan pertanyaan seputar strategi investasi, cara menghitung kebutuhan dana darurat, optimasi anggaran, atau perencanaan target finansial Anda!`;
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
        "gemma-4-31b-it",
      ];

      const systemPrompt = `Kamu adalah Pintar AI — Financial Advisor & Certified Financial Planner (CFP) berdedikasi tinggi di aplikasi Pintar Finance.
Persona kamu: Objektif, berwawasan luas, analitis, komunikatif, solutif, dan ramah dalam bahasa Indonesia.
Jawablah pertanyaan pengguna secara langsung, spesifik, mendalam, dan kontekstual terhadap percakapan (termasuk pertanyaan lanjutan). Jangan pernah memberikan template kaku.

DATA FINANSIAL PENGGUNA:
- Nama: ${fullContext.userName}
- Total Saldo: ${formatCurrency(fullContext.netWorth)}
- Pemasukan Bulan Ini: ${formatCurrency(fullContext.monthlyIncome)}
- Pengeluaran Bulan Ini: ${formatCurrency(fullContext.monthlyExpense)}
- Surplus Bersih: ${formatCurrency(fullContext.netSavings)} (Rasio Tabungan: ${fullContext.savingsRatio}%)
- Pos Tabungan Impian (${fullContext.savingsGoals.length}): ${JSON.stringify(fullContext.savingsGoals)}
- Batas Anggaran (${fullContext.budgets.length}): ${JSON.stringify(fullContext.budgets)}
${activeContext ? `- Konteks Modul: ${activeContext}` : ""}`;

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
                  temperature: 0.6,
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
                data: { reply: replyText.trim() },
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
