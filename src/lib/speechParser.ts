import {
  type Category,
  type SavingsGoal,
  type TransactionType,
  type Wallet,
} from "@/types/finance";

export interface ParsedVoiceTransaction {
  type: TransactionType;
  amount: number;
  description: string;
  categoryId: string | null;
  walletId: string | null;
  destinationWalletId: string | null;
  savingsGoalId: string | null;
  confidence: number;
  rawTranscript: string;
}

// ─── Indonesian Number Word Dictionary ────────────────────────────────────────

const INDONESIAN_NUMBERS: Record<string, number> = {
  nol: 0,
  kosong: 0,
  satu: 1,
  se: 1,
  dua: 2,
  tiga: 3,
  empat: 4,
  lima: 5,
  enam: 6,
  tujuh: 7,
  delapan: 8,
  sembilan: 9,
  sepuluh: 10,
  sebelas: 11,
  "dua belas": 12,
  "tiga belas": 13,
  "empat belas": 14,
  "lima belas": 15,
  "enam belas": 16,
  "tujuh belas": 17,
  "delapan belas": 18,
  "sembilan belas": 19,
};

/**
 * Converts Indonesian spoken number words into integer value.
 * e.g., "dua ratus lima puluh ribu" -> 250000
 * "satu setengah juta" -> 1500000
 */
export function parseIndonesianSpokenWords(text: string): number {
  const clean = text
    .toLowerCase()
    .replace(/rp\.?\s*/g, "")
    .replace(/,/g, ".")
    .trim();

  // Pattern: "1.5 juta", "2,5 jt", "1 setengah juta"
  if (clean.includes("setengah juta")) {
    const prefixMatch = clean.match(/(\d+|satu|dua|tiga|empat|lima|enam|tujuh|delapan|sembilan)\s*setengah\s*juta/);
    if (prefixMatch) {
      const base = INDONESIAN_NUMBERS[prefixMatch[1]] ?? parseFloat(prefixMatch[1]) ?? 1;
      return Math.round((base + 0.5) * 1_000_000);
    }
    return 1_500_000;
  }

  // Pattern: "setengah ratus ribu" or "setengah juta"
  if (clean.includes("setengah ribu")) {
    return 500;
  }

  // Multiplier matching with digits: "50rb", "50 ribu", "2.5 juta", "100k"
  const jtMatch = clean.match(/(\d+([.]\d+)?)\s*(jt|juta)\b/i);
  if (jtMatch) {
    return Math.round(parseFloat(jtMatch[1]) * 1_000_000);
  }

  const rbMatch = clean.match(/(\d+([.]\d+)?)\s*(rb|k|ribu)\b/i);
  if (rbMatch) {
    return Math.round(parseFloat(jtMatch ? jtMatch[1] : rbMatch[1]) * 1_000);
  }

  // Standard numbers with dot thousand separator e.g. "50.000", "150.000", "1.000.000"
  const formattedNumMatch = clean.match(/\b\d{1,3}(\.\d{3})+(\b|\s)/);
  if (formattedNumMatch) {
    const val = parseInt(formattedNumMatch[0].replace(/\./g, "").trim(), 10);
    if (!isNaN(val) && val > 0) return val;
  }

  // Plain digits e.g. "50000"
  const plainMatch = clean.match(/\b\d{3,9}\b/);
  if (plainMatch) {
    const val = parseInt(plainMatch[0], 10);
    if (!isNaN(val) && val > 0) return val;
  }

  // Spoken text parser (e.g. "dua ratus lima puluh ribu")
  const words = clean.split(/\s+/);
  let total = 0;
  let current = 0;

  for (let i = 0; i < words.length; i++) {
    const w = words[i];

    if (w === "juta") {
      current = current === 0 ? 1 : current;
      total += current * 1_000_000;
      current = 0;
    } else if (w === "ribu") {
      current = current === 0 ? 1 : current;
      total += current * 1_000;
      current = 0;
    } else if (w === "ratus") {
      current = current === 0 ? 100 : current * 100;
    } else if (w === "seratus") {
      current += 100;
    } else if (w === "puluh") {
      current = current === 0 ? 10 : current * 10;
    } else if (w === "sepuluh") {
      current += 10;
    } else if (w === "sebelas") {
      current += 11;
    } else if (w === "belas") {
      current += 10;
    } else if (w === "seribu") {
      total += 1_000;
    } else if (w === "sejuta") {
      total += 1_000_000;
    } else if (INDONESIAN_NUMBERS[w] !== undefined) {
      current += INDONESIAN_NUMBERS[w];
    } else if (!isNaN(Number(w))) {
      current += Number(w);
    }
  }

  total += current;
  return total > 0 ? total : 0;
}

// ─── Keyword Category Dictionary ──────────────────────────────────────────────

const CATEGORY_SYNONYMS: Record<string, string[]> = {
  // Expense
  "makanan": [
    "makan", "minum", "kopi", "cafe", "kafe", "resto", "restoran", "jajan",
    "snack", "gofood", "grabfood", "shopeefood", "starbucks", "mcd", "kfc",
    "indomie", "bakso", "mie", "nasi", "warteg", "padang", "boba", "sarapan",
    "dinner", "lunch", "ayam", "geprek", "burger", "pizza", "roti",
  ],
  "transportasi": [
    "bensin", "pertamina", "shell", "spbu", "pertalite", "pertamax", "grab",
    "gojek", "goride", "gocar", "toll", "tol", "parkir", "kereta", "krl",
    "mrt", "lrt", "busway", "tj", "ojek", "angkot", "tiket", "pesawat",
    "bengkel", "servis", "tambal ban",
  ],
  "belanja": [
    "belanja", "indomaret", "alfamart", "supermarket", "hypermart", "shopee",
    "tokopedia", "tokped", "lazada", "baju", "sepatu", "sabun", "shampo",
    "minimarket", "pasar", "mall", "superindo", "sayur", "beras", "minyak",
  ],
  "tagihan": [
    "tagihan", "listrik", "pln", "pdam", "air", "wifi", "indihome", "biznet",
    "firstmedia", "pulsa", "kuota", "paket data", "telkomsel", "xl", "indosat",
    "iuran", "bpjs", "asuransi", "sewa", "kos", "kontrakan", "token", "kartu halo",
  ],
  "hiburan": [
    "nonton", "bioskop", "cinema", "xxi", "cgv", "netflix", "spotify", "youtube",
    "game", "steam", "playstation", "liburan", "hotel", "wisata", "karaoke", "jalan-jalan",
  ],
  "kesehatan": [
    "obat", "apotek", "apotik", "dokter", "klinik", "rumah sakit", "rs", "vitamin",
    "halodoc", "alodokter", "kacamata", "gigi", "suplemen", "panadol", "paracetamol",
  ],
  "edukasi": [
    "buku", "kursus", "course", "udemy", "seminar", "workshop", "spp", "kuliah",
    "sekolah", "les", "pelatihan", "bootcamp", "buku tulis",
  ],
  "cicilan": [
    "cicilan", "hutang", "liabilitas", "pinjol", "kartu kredit", "kpr", "leasing",
    "bayar hutang", "angsuran", "paylater",
  ],

  // Income
  "gaji": ["gaji", "salary", "payroll", "upah", "gajian", "sallary"],
  "bonus": ["bonus", "thr", "tunjangan", "insentif", "hadiah", "dikasih", "angpao", "uang kaget"],
  "investasi": ["dividen", "investasi", "reksadana", "saham", "crypto", "profit", "bunga bank", "kupon sbn", "imbal hasil"],
  "freelance": ["freelance", "side job", "proyek", "desain", "ngoding", "jasa", "bisnis", "omzet", "jualan", "laku", "klien", "client"],
};

// ─── Main Speech-to-Transaction Parser ─────────────────────────────────────────

export function parseSpeechToTransaction(
  transcript: string,
  context: {
    wallets: Wallet[];
    categories: Category[];
    savingsGoals: SavingsGoal[];
  }
): ParsedVoiceTransaction {
  const text = transcript.trim();
  const lower = text.toLowerCase();
  const amount = parseIndonesianSpokenWords(lower);

  // 1. Detect Transaction Type
  let type: TransactionType = "expense";

  const isSaving =
    lower.includes("tabung") ||
    lower.includes("nabung") ||
    lower.includes("menabung") ||
    lower.includes("pos impian") ||
    lower.includes("target tabungan") ||
    lower.includes("alokasi tabungan");

  const isTransfer =
    (lower.includes("transfer") || lower.includes("tf") || lower.includes("pindah")) &&
    (lower.includes("ke dompet") || lower.includes("ke rekening") || lower.includes("dari") || lower.includes("ke"));

  const isIncome =
    lower.includes("gaji") ||
    lower.includes("terima") ||
    lower.includes("dapat") ||
    lower.includes("pemasukan") ||
    lower.includes("uang masuk") ||
    lower.includes("bonus") ||
    lower.includes("thr") ||
    lower.includes("dividen") ||
    lower.includes("omzet") ||
    lower.includes("jualan laku") ||
    lower.includes("transfer masuk") ||
    lower.includes("cair");

  if (isSaving && context.savingsGoals.length > 0) {
    type = "saving";
  } else if (isTransfer && !isIncome && context.wallets.length > 1) {
    type = "transfer";
  } else if (isIncome) {
    type = "income";
  } else {
    type = "expense";
  }

  // 2. Match Wallet
  let matchedWallet: Wallet | null = null;
  for (const w of context.wallets) {
    const wName = w.name.toLowerCase();
    if (
      lower.includes(wName) ||
      (wName.includes("bca") && lower.includes("bca")) ||
      (wName.includes("gopay") && (lower.includes("gopay") || lower.includes("go pay"))) ||
      (wName.includes("ovo") && lower.includes("ovo")) ||
      (wName.includes("dana") && lower.includes("dana") && !lower.includes("dana darurat")) ||
      (wName.includes("shopee") && lower.includes("shopee")) ||
      (wName.includes("tunai") && (lower.includes("tunai") || lower.includes("cash") || lower.includes("uang tunai"))) ||
      (wName.includes("jago") && lower.includes("jago")) ||
      (wName.includes("mandiri") && lower.includes("mandiri")) ||
      (wName.includes("bri") && lower.includes("bri")) ||
      (wName.includes("bni") && lower.includes("bni"))
    ) {
      matchedWallet = w;
      break;
    }
  }

  // 3. Match Destination Wallet (for transfer)
  let matchedDestWallet: Wallet | null = null;
  if (type === "transfer") {
    const afterKe = lower.split(/\bke\b/)[1];
    if (afterKe) {
      for (const w of context.wallets) {
        const wName = w.name.toLowerCase();
        if (afterKe.includes(wName) && w.id !== matchedWallet?.id) {
          matchedDestWallet = w;
          break;
        }
      }
    }
    if (!matchedDestWallet) {
      matchedDestWallet = context.wallets.find((w) => w.id !== matchedWallet?.id) || null;
    }
  }

  // 4. Match Savings Goal (for saving)
  let matchedGoal: SavingsGoal | null = null;
  if (type === "saving") {
    for (const g of context.savingsGoals) {
      const gName = g.name.toLowerCase();
      if (lower.includes(gName) || gName.split(" ").some((w) => w.length > 3 && lower.includes(w))) {
        matchedGoal = g;
        break;
      }
    }
    if (!matchedGoal && context.savingsGoals.length > 0) {
      matchedGoal = context.savingsGoals[0];
    }
  }

  // 5. Match Category (for expense / income)
  let matchedCategory: Category | null = null;
  const filteredCategories = context.categories.filter((c) => c.type === (type === "income" ? "income" : "expense"));

  for (const cat of filteredCategories) {
    const cName = cat.name.toLowerCase();
    // Direct exact / substring match with category name
    if (lower.includes(cName)) {
      matchedCategory = cat;
      break;
    }

    // Synonym keyword match
    for (const [keyGroup, keywords] of Object.entries(CATEGORY_SYNONYMS)) {
      if (cName.includes(keyGroup)) {
        const hasKeyword = keywords.some((kw) => lower.includes(kw));
        if (hasKeyword) {
          matchedCategory = cat;
          break;
        }
      }
    }

    if (matchedCategory) break;
  }

  // Fallback to first matching type category if none matched
  if (!matchedCategory && filteredCategories.length > 0) {
    matchedCategory = filteredCategories[0];
  }

  // 6. Build Clean Description
  let cleanDesc = text
    // Remove filler phrases
    .replace(/^tolong\s+/i, "")
    .replace(/^catat\s+(transaksi\s+)?/i, "")
    .replace(/^masukkan\s+/i, "")
    .replace(/^input\s+/i, "")
    .trim();

  // Capitalize first letter
  if (cleanDesc.length > 0) {
    cleanDesc = cleanDesc.charAt(0).toUpperCase() + cleanDesc.slice(1);
  } else {
    cleanDesc = matchedCategory ? matchedCategory.name : "Transaksi Suara";
  }

  return {
    type,
    amount,
    description: cleanDesc,
    categoryId: matchedCategory?.id || null,
    walletId: matchedWallet?.id || context.wallets[0]?.id || null,
    destinationWalletId: matchedDestWallet?.id || null,
    savingsGoalId: matchedGoal?.id || null,
    confidence: amount > 0 ? 0.95 : 0.6,
    rawTranscript: text,
  };
}
