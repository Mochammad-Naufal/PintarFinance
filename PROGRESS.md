# Development Progress & Task Tracker — Pintar Finance

Status Legend:
- `[ ]` : Belum dikerjakan (Pending)
- `[/]` : Sedang dikerjakan (In Progress)
- `[x]` : Selesai dan terverifikasi (Completed)

---

## Phase 0: Project Inisialisasi & Guardrails
- [x] Inisialisasi Next.js 15 App Router (TypeScript, Tailwind v4, ESLint)
- [x] Setup dependensi inti (`zod`, `lucide-react`, `date-fns`, `clsx`, `tailwind-merge`)
- [x] Inisialisasi shadcn/ui & helper `src/lib/utils.ts`
- [x] Konfigurasi 4 File Konteks (`PRD.md`, `skill.md`, `SCHEMA.md`, `PROGRESS.md`)

---

## Phase 1: Database Layer & Authentication
- [ ] Install & konfigurasi Drizzle ORM + PostgreSQL/Supabase Client
- [ ] Implementasi skema tabel Drizzle di `src/db/schema/` sesuai `SCHEMA.md` (`users`, `wallets`, `categories`, `savings_goals`, `transactions`, `budgets`)
- [ ] Buat file export relasi Drizzle & Zod validation schema di `src/types/`
- [ ] Generate & run database migration pertama
- [ ] Buat skrip seeder (`src/db/seed.ts`) untuk kategori default sistem & dummy data
- [ ] Setup Autentikasi Pengguna & Session Context (Supabase Auth / Custom Session)

---

## Phase 2: App Shell & Layout Navigation (Mobile-First)
- [ ] Buat Root Layout dengan Theme Provider (Dark/Light Mode)
- [ ] Buat Komponen Shell: Sidebar (Desktop) dan Bottom Navigation Bar (Mobile)
- [ ] Setup Header global dengan user profile preview & ringkasan cepat

---

## Phase 3: Wallet & Savings Goal Management (Core Assets)
- [ ] Server Action: CRUD Wallets (Create, Read, Update, Soft-delete)
- [ ] UI Komponen: Wallet Cards Grid & Modal Tambah/Edit Dompet
- [ ] Server Action: CRUD Savings Goals (Create, Read, Update, Delete)
- [ ] UI Komponen: Savings Goal Card dengan Progress Bar capaian

---

## Phase 4: Transaction Engine & Atomic Ledger
- [ ] Server Action: `createTransaction` dengan ACID transaction (update atomic saldo wallet & tabungan)
- [ ] Server Action: `deleteTransaction` & `updateTransaction` dengan rollback/revert balance otomatis
- [ ] UI Komponen: Modal Form Transaksi Manual (Expense, Income, Transfer, Save to Goal)
- [ ] UI Komponen: Feed/Daftar Riwayat Transaksi dengan filter (dompet, kategori, rentang tanggal)

---

## Phase 5: Budgeting & Monthly Limits
- [ ] Server Action: CRUD Monthly Budgets per kategori
- [ ] Query komputasi total realisasi pengeluaran vs limit budget per periode (`YYYY-MM`)
- [ ] UI Komponen: Budget Tracker Widget dengan threshold progress bar (<75%, 75-99%, >=100%)

---

## Phase 6: Pintar AI Engine Integration
- [ ] Setup API Client LLM / Structured Output di `src/lib/ai/`
- [ ] Server Action/Endpoint: Natural Language Parsing (teks bahasa Indonesia -> JSON transaksi)
- [ ] UI Komponen: Quick Entry Modal (Input teks/voice prompt + modal preview konfirmasi sebelum simpan)
- [ ] Server Action/Endpoint: Vision Receipt OCR (upload gambar struk -> ekstrak merchant, item, total)
- [ ] UI Komponen: Receipt Scanner Modal dengan preview parsing itemized data

---

## Phase 7: Dashboard Analytics & Data Visualization
- [ ] Query agregasi data: Total Net Worth, Monthly Cashflow (In vs Out), Top Expense Categories
- [ ] UI Komponen: Ringkasan Kartu Net Worth & Arus Kas
- [ ] UI Komponen: Donut Chart Komposisi Pengeluaran & Bar Chart Cashflow Tren
- [ ] UI Komponen: Ringkasan Cepat Progres Tabungan Impian di Dashboard

---

## Phase 8: Mobile Polish, PWA, & Production Hardening
- [ ] Konfigurasi `manifest.json` & PWA icons untuk installability di mobile
- [ ] Optimasi UX sentuhan (touch gestures, bottom-sheet dialogs untuk mobile)
- [ ] Audit Typecheck (`tsc --noEmit`) & Linting (`npm run lint`)
- [ ] Verifikasi performa build (`npm run build`)