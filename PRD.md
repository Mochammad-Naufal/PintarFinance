# Product Requirements Document (PRD) — Pintar Finance

## 1. Executive Summary & Problem Statement
Pintar Finance adalah aplikasi pencatatan dan manajemen keuangan pribadi modern berbasis web (mobile-first/PWA) yang mengintegrasikan AI untuk mengotomatisasi input transaksi, analisis anggaran, pelacakan target tabungan impian, dan pembacaan struk belanja.

---

## 2. User Persona & Scope MVP

### Scope Matrix
| Status | Fitur |
| :--- | :--- |
| **In Scope (MVP)** | Autentikasi Pengguna, Manajemen Multi-Dompet, CRUD Transaksi (Expense, Income, Transfer, Save to Goal), Pintar AI Quick Entry & Receipt OCR, Pos Tabungan & Target Impian (Savings Goals), Alokasi & Pelacak Budget Bulanan, Visualisasi Dashboard. |
| **Out of Scope (Post-MVP)** | Integrasi Open Banking API langsung, Multi-currency selain IDR, Fitur Hutang/Piutang bertempo, Ekspor SPT Pajak otomatis. |

---

## 3. Core Feature Specifications

### A. Wallet & Account Management (Multi-Dompet)
- **Tipe Dompet:** `Cash`, `Bank Account`, `E-Wallet`.
- **Atribut:** Nama, Tipe, Saldo Saat Ini, Ikon, Warna Aksen.
- **Aggregator:** Kalkulasi otomatis total *Net Worth* (Dompet Aktif + Total Alokasi Tabungan).

### B. Pos Tabungan & Target Impian (Savings Goals)
- **Atribut:** Nama Impian (e.g., "Tabungan Nikah", "Beli Motor"), Target Nominal, Saldo Terkumpul, Target Tanggal, Ikon/Gambar.
- **Mekanisme Alokasi:** Mutasi dana dari dompet aktif ke pos tabungan (dan sebaliknya saat ditarik).
- **Progres Visual & AI Insight:** Indikator persentase capaian dan rekomendasi setoran bulanan otomatis berbasis sisa waktu.

### C. Transaction Engine
- **Tipe Transaksi:**
  - `expense` : Mengurangi saldo dompet sumber, wajib memilih kategori.
  - `income`  : Menambah saldo dompet tujuan, wajib memilih kategori.
  - `transfer`: Memindahkan saldo antar-dompet.
  - `saving`  : Menyetor/menarik dana antara dompet aktif dan target `savings_goal`.
- **Rincian Transaksi:** Nominal (IDR), Tanggal, Kategori, Dompet, Target Tabungan (jika tipe saving), Catatan, Attachment/Struk.

### D. Category & Monthly Expense Budgeting
- **Kategori Bawaan Sistem:** Makanan & Minuman, Transportasi, Belanja, Tagihan, Hiburan, Gaji, Investasi, Tabungan, Lain-lain.
- **Budget Alerts:** Batas pengeluaran per kategori per bulan (Aman: <75%, Waspada: 75-99%, Overbudget: >=100%).

### E. Pintar AI Engine
1. **Natural Language Quick Entry:**
   - Input: Teks bebas / speech-to-text (contoh: *"Tabung 500rb dari BCA ke Tabungan Nikah"*).
   - Ekstraksi AI: Menghasilkan JSON terstruktur (tipe, nominal, target goal / kategori, dompet).
   - UX Flow: Tampilkan modal konfirmasi sebelum menyimpan ke database.
2. **Receipt OCR Scanner:**
   - Input: Foto/gambar struk belanja.
   - Ekstraksi AI: Nama merchant, tanggal, total nominal, serta itemized list barang.

### F. Dashboard & Analytics
- Ringkasan Eksekutif: Total Net Worth, Arus Kas Bulanan (In vs Out), dan Ringkasan Progres Tabungan Impian.
- Grafik Arus Kas & Diagram Lingkaran Pengeluaran.
- Daftar Transaksi Terakhir dengan filter terpadu.

---

## 4. Business Rules & Technical Integrity
- **Atomic Balance Updates:** Saldo dompet dan progres tabungan wajib dimutasi menggunakan Database Transaction atomic.
- **Mata Uang:** Standar nominal menggunakan Rupiah (IDR) dalam format integer.
- **Soft Deletes:** Record transaksi, target tabungan, dan dompet menggunakan `deleted_at`.