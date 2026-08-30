/**
 * Standard Master Categories for Pintar Finance
 *
 * Income (6 Categories):
 *  - Gaji & Upah (Pemasukan Aktif)
 *  - Usaha & Bisnis
 *  - Investasi & Dividen (Pemasukan Pasif)
 *  - Bonus & Hadiah
 *  - Penjualan Aset
 *  - Lain-lain
 *
 * Expense (9 Categories):
 *  - Makanan & Minuman
 *  - Tagihan & Utilitas
 *  - Belanja Kebutuhan Pokok
 *  - Transportasi
 *  - Kesehatan
 *  - Edukasi
 *  - Hiburan & Rekreasi
 *  - Cicilan & Hutang
 *  - Lain-lain
 */

export interface DefaultCategoryDefinition {
  name: string;
  type: "income" | "expense";
  icon: string;
  color: string;
  description?: string;
}

export const DEFAULT_INCOME_CATEGORIES: DefaultCategoryDefinition[] = [
  {
    name: "Gaji & Upah (Pemasukan Aktif)",
    type: "income",
    icon: "briefcase",
    color: "#10b981", // Emerald
    description: "Penghasilan bulanan, honor, atau upah kerja utama",
  },
  {
    name: "Usaha & Bisnis",
    type: "income",
    icon: "building",
    color: "#059669", // Deep Emerald
    description: "Profit bisnis, toko, dagang, atau jasa profesional",
  },
  {
    name: "Investasi & Dividen (Pemasukan Pasif)",
    type: "income",
    icon: "trending-up",
    color: "#0ea5e9", // Sky Blue
    description: "Dividen saham, return reksadana, crypto, atau bunga deposito",
  },
  {
    name: "Bonus & Hadiah",
    type: "income",
    icon: "gift",
    color: "#f59e0b", // Amber
    description: "THR, bonus performa, hadiah, atau cashback",
  },
  {
    name: "Penjualan Aset",
    type: "income",
    icon: "coins",
    color: "#8b5cf6", // Purple
    description: "Hasil penjualan barang bekas, aset fisik, atau portofolio",
  },
  {
    name: "Lain-lain",
    type: "income",
    icon: "more-horizontal",
    color: "#64748b", // Slate
    description: "Pemasukan lainnya di luar kategori utama",
  },
];

export const DEFAULT_EXPENSE_CATEGORIES: DefaultCategoryDefinition[] = [
  {
    name: "Makanan & Minuman",
    type: "expense",
    icon: "utensils",
    color: "#f97316", // Orange
    description: "Makan harian, belanja dapur, cafe, atau pesan antar makanan",
  },
  {
    name: "Tagihan & Utilitas",
    type: "expense",
    icon: "receipt",
    color: "#ef4444", // Red
    description: "Listrik PLN, air PAM, internet, pulsa, BPJS, atau sewa",
  },
  {
    name: "Belanja Kebutuhan Pokok",
    type: "expense",
    icon: "shopping-bag",
    color: "#a855f7", // Purple
    description: "Supermarket, perlengkapan rumah, sandang, atau kebutuhan harian",
  },
  {
    name: "Transportasi",
    type: "expense",
    icon: "car",
    color: "#3b82f6", // Blue
    description: "BBM, ojek online, tarif tol, parkir, atau servis kendaraan",
  },
  {
    name: "Kesehatan",
    type: "expense",
    icon: "heart-pulse",
    color: "#14b8a6", // Teal
    description: "Obat-obatan, konsultasi dokter, suplemen, atau klinik",
  },
  {
    name: "Edukasi",
    type: "expense",
    icon: "graduation-cap",
    color: "#6366f1", // Indigo
    description: "SPP/kuliah, kursus, buku, bootcamp, atau sertifikasi",
  },
  {
    name: "Hiburan & Rekreasi",
    type: "expense",
    icon: "film",
    color: "#ec4899", // Pink
    description: "Bioskop, liburan, streaming, hobi, games, atau hangout",
  },
  {
    name: "Cicilan & Hutang",
    type: "expense",
    icon: "credit-card",
    color: "#e11d48", // Rose
    description: "KPR, cicilan kendaraan, kartu kredit, pinjaman, atau paylater",
  },
  {
    name: "Lain-lain",
    type: "expense",
    icon: "more-horizontal",
    color: "#64748b", // Slate
    description: "Pengeluaran tak terduga atau pos pengeluaran lainnya",
  },
];

export const ALL_DEFAULT_CATEGORIES: DefaultCategoryDefinition[] = [
  ...DEFAULT_INCOME_CATEGORIES,
  ...DEFAULT_EXPENSE_CATEGORIES,
];
