# Database Schema & Relations — Pintar Finance

**Target Database:** PostgreSQL (Supabase)  
**ORM:** Drizzle ORM (`drizzle-orm`)  
**Monetary Standard:** Stored as `bigint` integers in Indonesian Rupiah (IDR) to eliminate floating-point precision errors.

---

## 1. Table Definitions

### A. `users`
Tabel profil pengguna (sinkron dengan Supabase Auth atau custom session).
- `id` : `uuid` (Primary Key, default `gen_random_uuid()`)
- `email` : `varchar(255)` (Unique, Not Null)
- `name` : `varchar(100)` (Not Null)
- `avatar_url` : `text` (Nullable)
- `created_at` : `timestamp with time zone` (Default `now()`, Not Null)
- `updated_at` : `timestamp with time zone` (Default `now()`, Not Null)

### B. `wallets` (Dompet & Rekening)
Tempat penyimpanan dana (Bank, E-Wallet, Kas Tunai).
- `id` : `uuid` (Primary Key, default `gen_random_uuid()`)
- `user_id` : `uuid` (Foreign Key -> `users.id` on delete cascade, Not Null)
- `name` : `varchar(100)` (Not Null) — e.g., "BCA Utama", "GoPay", "Dompet Fisik"
- `type` : `varchar(30)` (Not Null) — Enum: `'bank' | 'ewallet' | 'cash'`
- `balance` : `bigint` (Default `0`, Not Null) — Saldo berjalan dalam IDR
- `color` : `varchar(20)` (Default `'#10b981'`) — Hex warna kartu dompet
- `icon` : `varchar(50)` (Default `'wallet'`) — Nama icon Lucide
- `is_active` : `boolean` (Default `true`, Not Null)
- `created_at` : `timestamp with time zone` (Default `now()`, Not Null)
- `updated_at` : `timestamp with time zone` (Default `now()`, Not Null)
- `deleted_at` : `timestamp with time zone` (Nullable, untuk soft delete)

### C. `categories` (Kategori Transaksi)
Kategori pengeluaran dan pemasukan.
- `id` : `uuid` (Primary Key, default `gen_random_uuid()`)
- `user_id` : `uuid` (Foreign Key -> `users.id` on delete cascade, Nullable) — `null` jika kategori default sistem
- `name` : `varchar(100)` (Not Null) — e.g., "Makanan & Minuman", "Gaji", "Transportasi"
- `type` : `varchar(20)` (Not Null) — Enum: `'expense' | 'income'`
- `icon` : `varchar(50)` (Not Null, default `'tag'`) — Nama icon Lucide
- `color` : `varchar(20)` (Default `'#64748b'`)
- `created_at` : `timestamp with time zone` (Default `now()`, Not Null)

### D. `savings_goals` (Pos Tabungan & Impian)
Target dana menabung untuk impian/tujuan tertentu (misal: nikah, beli kendaraan, dana darurat).
- `id` : `uuid` (Primary Key, default `gen_random_uuid()`)
- `user_id` : `uuid` (Foreign Key -> `users.id` on delete cascade, Not Null)
- `name` : `varchar(150)` (Not Null) — e.g., "Dana Nikah", "Beli Motor NMAX"
- `target_amount` : `bigint` (Not Null) — Target nominal dalam IDR
- `current_amount`: `bigint` (Default `0`, Not Null) — Akumulasi dana terkumpul
- `target_date` : `date` (Nullable) — Tenggat waktu pencapaian
- `icon` : `varchar(50)` (Default `'target'`)
- `color` : `varchar(20)` (Default `'#3b82f6'`)
- `is_completed` : `boolean` (Default `false`, Not Null)
- `created_at` : `timestamp with time zone` (Default `now()`, Not Null)
- `updated_at` : `timestamp with time zone` (Default `now()`, Not Null)
- `deleted_at` : `timestamp with time zone` (Nullable)

### E. `transactions` (Ledger Mutasi Keuangan)
Buku besar seluruh mutasi uang.
- `id` : `uuid` (Primary Key, default `gen_random_uuid()`)
- `user_id` : `uuid` (Foreign Key -> `users.id` on delete cascade, Not Null)
- `wallet_id` : `uuid` (Foreign Key -> `wallets.id` on delete cascade, Not Null) — Dompet sumber
- `destination_wallet_id`: `uuid` (Foreign Key -> `wallets.id`, Nullable) — Khusus mutasi transfer
- `category_id` : `uuid` (Foreign Key -> `categories.id`, Nullable) — Wajib untuk expense/income
- `savings_goal_id` : `uuid` (Foreign Key -> `savings_goals.id`, Nullable) — Khusus mutasi alokasi tabungan
- `type` : `varchar(20)` (Not Null) — Enum: `'expense' | 'income' | 'transfer' | 'saving'`
- `amount` : `bigint` (Not Null) — Nominal transaksi dalam IDR (selalu bernilai positif)
- `admin_fee` : `bigint` (Default `0`, Not Null) — Biaya admin tambahan (misal antar-bank)
- `transaction_date`: `timestamp with time zone` (Default `now()`, Not Null)
- `description` : `text` (Nullable) — Catatan / Nama merchant
- `receipt_url` : `text` (Nullable) — URL lampiran foto struk
- `created_at` : `timestamp with time zone` (Default `now()`, Not Null)
- `updated_at` : `timestamp with time zone` (Default `now()`, Not Null)
- `deleted_at` : `timestamp with time zone` (Nullable)

### F. `budgets` (Batas Anggaran Bulanan)
Batas pengeluaran per kategori per bulan kalender.
- `id` : `uuid` (Primary Key, default `gen_random_uuid()`)
- `user_id` : `uuid` (Foreign Key -> `users.id` on delete cascade, Not Null)
- `category_id` : `uuid` (Foreign Key -> `categories.id` on delete cascade, Not Null)
- `period` : `varchar(7)` (Not Null) — Format: `'YYYY-MM'` (e.g., `'2026-08'`)
- `limit_amount` : `bigint` (Not Null) — Batas limit pengeluaran bulanan dalam IDR
- `created_at` : `timestamp with time zone` (Default `now()`, Not Null)
- `updated_at` : `timestamp with time zone` (Default `now()`, Not Null)

---

## 2. Entity Relations & Foreign Keys

users (1) ────< (N) wallets
users (1) ────< (N) categories
users (1) ────< (N) savings_goals
users (1) ────< (N) transactions
users (1) ────< (N) budgets

wallets (1) ────< (N) transactions (as source wallet)
wallets (1) ────< (N) transactions (as destination wallet)

categories (1) ────< (N) transactions
categories (1) ────< (N) budgets

savings_goals (1) ────< (N) transactions (as saving allocation target)


---

## 3. Database Indexes (Performance Optimization)

Untuk menjaga performa query analitik tetap instan:
- `idx_transactions_user_date` on `transactions (user_id, transaction_date DESC)`
- `idx_transactions_wallet` on `transactions (wallet_id)`
- `idx_transactions_category` on `transactions (category_id)`
- `idx_budgets_user_period` on `budgets (user_id, period)`
- `idx_savings_user` on `savings_goals (user_id)`

---

## 4. Financial Mutation Ledger Rules (ACID Transactions)

Setiap mutasi saldo wajib dijalankan di dalam blok `db.transaction(...)`:

1. **`expense`:**
   - Kurangi `wallets.balance` dompet sumber sebesar `(amount + admin_fee)`.
2. **`income`:**
   - Tambah `wallets.balance` dompet tujuan sebesar `amount`.
3. **`transfer`:**
   - Kurangi `wallets.balance` dompet sumber sebesar `(amount + admin_fee)`.
   - Tambah `wallets.balance` dompet tujuan sebesar `amount`.
4. **`saving`:**
   - Kurangi `wallets.balance` dompet sumber sebesar `amount`.
   - Tambah `savings_goals.current_amount` pada target tabungan sebesar `amount`.