# PROGRESS.md — Task Tracker

> **Project:** Pintar Finance
> **Started:** 2026-08-26
> **Legend:** ✅ Done | 🔄 In Progress | ⏳ Planned | ❌ Blocked

---

## Phase 0 — Project Setup

- [x] Inisialisasi Next.js 15 App Router (TypeScript, Tailwind v4, ESLint)
- [x] Install core dependencies (lucide-react, clsx, tailwind-merge, date-fns, zod)
- [x] Setup shadcn/ui (New York style, Neutral color)
- [x] Utility helpers: `cn()`, `formatCurrency()`, `formatDate()`, `formatRelativeDate()`
- [x] Agent context files: PRD.md, skill.md, SCHEMA.md, PROGRESS.md
- [ ] Setup Git remote (GitHub)

---

## Phase 1 — Foundation

### Database & Auth
- [ ] Pilih dan setup database (Supabase / PostgreSQL)
- [ ] Setup Prisma ORM + schema awal
- [ ] Seed default categories
- [ ] Setup authentication (NextAuth v5 / Clerk)
- [ ] Protected route middleware

### Layout & Navigation
- [ ] Root layout dengan font & theme provider
- [ ] Sidebar navigasi (desktop)
- [ ] Bottom navigation (mobile)
- [ ] Dark/light mode toggle

---

## Phase 2 — Core Features

### Transactions
- [ ] List transaksi dengan filter (bulan, kategori, tipe)
- [ ] Form tambah transaksi
- [ ] Form edit transaksi
- [ ] Hapus transaksi (soft delete)
- [ ] Validasi form dengan Zod

### Categories
- [ ] List kategori default + custom user
- [ ] Tambah kategori custom
- [ ] Edit & hapus kategori

### Dashboard
- [ ] Ringkasan saldo total
- [ ] Total pemasukan & pengeluaran bulan ini
- [ ] 5 transaksi terakhir
- [ ] Progress anggaran per kategori

---

## Phase 3 — Budget & Reports

### Budget
- [ ] Set anggaran bulanan per kategori
- [ ] Indikator progress anggaran (visual bar)
- [ ] Alert ketika mendekati/melebihi anggaran

### Reports
- [ ] Grafik pengeluaran per kategori (pie/donut chart)
- [ ] Grafik tren bulanan (bar/line chart)
- [ ] Filter rentang tanggal

---

## Phase 4 — Polish & Launch

- [ ] Loading skeletons untuk semua halaman async
- [ ] Error boundaries & halaman error
- [ ] SEO metadata
- [ ] Responsive design audit (mobile, tablet, desktop)
- [ ] Lighthouse performance audit
- [ ] Deploy ke Vercel
- [ ] Custom domain

---

## Backlog (P2 / Future)

- [ ] Export laporan ke CSV/PDF
- [ ] Notifikasi email batas anggaran
- [ ] Rekening/dompet virtual
- [ ] Import transaksi dari bank (CSV)
- [ ] AI spending insight
- [ ] PWA / offline mode
