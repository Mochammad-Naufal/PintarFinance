# PRD — Pintar Finance

> **Status:** Draft | **Last Updated:** 2026-08-26 | **Author:** —

---

## 1. Executive Summary

**Pintar Finance** adalah aplikasi manajemen keuangan pribadi berbasis web yang membantu pengguna mencatat pemasukan & pengeluaran, menetapkan anggaran bulanan, dan memvisualisasikan kesehatan finansial mereka secara real-time.

---

## 2. Problem Statement

Banyak orang Indonesia tidak memiliki sistem pencatatan keuangan yang konsisten, sehingga sulit untuk memahami pola pengeluaran dan merencanakan tabungan. Aplikasi yang ada terlalu kompleks atau tidak mendukung format lokal (mata uang IDR, tanggal Indonesia).

---

## 3. Goals & Success Metrics

| Goal | Metric | Target |
|---|---|---|
| Kemudahan pencatatan transaksi | Waktu tambah transaksi | < 30 detik |
| Visibilitas anggaran | % pengguna yang set budget | > 60% |
| Retensi | DAU/MAU | > 30% |

---

## 4. User Personas

### 4.1 Andi — Karyawan Muda (25 thn)
- Ingin tahu ke mana gajinya pergi setiap bulan
- Sering belanja impulsif, butuh reminder anggaran
- Menggunakan HP untuk segalanya

### 4.2 Sari — Ibu Rumah Tangga (35 thn)
- Mengelola keuangan rumah tangga
- Perlu kategori belanja yang fleksibel
- Lebih suka tampilan sederhana

---

## 5. Features (MVP)

### P0 — Must Have
- [ ] Autentikasi (email/password)
- [ ] CRUD Transaksi (pemasukan & pengeluaran)
- [ ] Kategori transaksi
- [ ] Dashboard ringkasan bulanan
- [ ] Anggaran per kategori

### P1 — Should Have
- [ ] Laporan grafik bulanan/tahunan
- [ ] Export CSV/PDF
- [ ] Notifikasi batas anggaran

### P2 — Nice to Have
- [ ] Rekening/dompet virtual
- [ ] Import transaksi dari bank
- [ ] AI insight

---

## 6. Non-Goals (MVP)

- Integrasi pembayaran langsung
- Multi-currency
- Fitur investasi

---

## 7. Technical Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15 (App Router), TypeScript |
| Styling | Tailwind CSS v4, shadcn/ui |
| Validasi | Zod |
| Database | TBD (Prisma + PostgreSQL / Supabase) |
| Auth | TBD (NextAuth / Clerk) |
| Deployment | Vercel |

---

## 8. Open Questions

- [ ] Apakah perlu offline mode / PWA?
- [ ] Database: self-hosted PostgreSQL vs Supabase?
- [ ] Auth provider: NextAuth v5 vs Clerk?
