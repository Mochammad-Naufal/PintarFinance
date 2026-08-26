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
- [x] Pilih dan setup database (Supabase PostgreSQL ✅)
- [x] Setup schema tabel langsung via seed script (`src/db/seed.ts`)
- [x] Seed default categories (12 kategori: 8 expense + 4 income)
- [x] Seed demo user, wallets, savings goals, budgets, 15 transaksi
- [ ] Setup Prisma / Drizzle ORM (opsional — schema sudah live di DB)
- [ ] Setup authentication (NextAuth v5 / Clerk)
- [ ] Protected route middleware Auth / Custom Session)

---

## Phase 2: App Shell & Layout Navigation (Mobile-First)
- [x] Buat Root Layout dengan Theme Provider (Dark/Light Mode)
- [x] Buat Komponen Shell: Sidebar (Desktop) dan Bottom Navigation Bar (Mobile)
- [x] Setup Header global dengan user profile preview & ringkasan cepat

---

## Phase 3: Wallet & Savings Goal Management (Core Assets)
- [x] Server Action: CRUD Wallets (Create, Read, Update, Soft-delete)
- [x] UI Komponen: Wallet Cards Grid & Modal Tambah/Edit Dompet
- [x] Server Action: CRUD Savings Goals (Create, Read, Update, Delete)
- [x] UI Komponen: Savings Goal Card dengan Progress Bar capaian

---

## Phase 4: Transaction Engine & Atomic Ledger
- [x] Server Action: `createTransaction` dengan ACID transaction (update atomic saldo wallet & tabungan)
- [x] Server Action: `deleteTransaction` dengan rollback/revert balance otomatis
- [x] UI Komponen: Modal Form Transaksi Manual (Expense, Income, Transfer, Save to Goal)
- [x] UI Komponen: Feed/Daftar Riwayat Transaksi dengan filter (dompet, kategori, search)
- [x] UI Komponen: Integrasi Widget Transaksi Terakhir di Dashboard

---

## Phase 5: Budgeting & Monthly Limits
- [x] Server Action: CRUD Monthly Budgets per kategori (`getBudgets`, `upsertBudget`, `deleteBudget`)
- [x] Query komputasi realisasi pengeluaran vs limit budget per periode (`YYYY-MM`)
- [x] UI Komponen: Budget Health Summary, BudgetCard dengan threshold progress bar (<75%, 75-99%, >=100%), dan BudgetModal
- [x] UI Komponen: Integrasi Widget Status Anggaran Bulan Ini di Dashboard

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