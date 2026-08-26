# SCHEMA.md — Database Schema & Relations

> **Status:** Draft | **Last Updated:** 2026-08-26
> Dokumen ini mendefinisikan struktur database untuk Pintar Finance.
> Update file ini sebelum melakukan migrasi database apapun.

---

## 1. ORM & Database

| Item | Decision |
|---|---|
| ORM | Prisma (TBD) |
| Database | PostgreSQL / Supabase (TBD) |
| Migrations | Prisma Migrate |

---

## 2. Conventions

- Primary keys: `id` — UUID (`cuid()` via Prisma)
- Timestamps: `createdAt`, `updatedAt` (auto-managed)
- Soft delete: `deletedAt` nullable timestamp
- **Currency amounts stored as INTEGER (in sen/cents)**: Rp 10.000 → `10000`
- Dates stored as `DateTime` (UTC)
- Enums defined in Prisma schema

---

## 3. Entity Relationship Diagram

```
User ──────────── Account (1:N)
 │
 ├──────────────── Transaction (1:N)
 │                     │
 │                     └── Category (N:1)
 │
 ├──────────────── Category (1:N, custom per user)
 │
 └──────────────── Budget (1:N)
                       │
                       └── Category (N:1)
```

---

## 4. Tables / Models

### User
```prisma
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String?
  passwordHash  String?
  avatar        String?
  currency      String    @default("IDR")
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  transactions  Transaction[]
  categories    Category[]
  budgets       Budget[]
  accounts      Account[]
}
```

### Account (Rekening/Dompet)
```prisma
model Account {
  id          String      @id @default(cuid())
  userId      String
  name        String      // e.g. "BCA Tabungan", "Gopay"
  type        AccountType
  balance     Int         @default(0)  // stored in sen
  color       String?
  icon        String?
  isDefault   Boolean     @default(false)
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
  deletedAt   DateTime?

  user         User          @relation(fields: [userId], references: [id])
  transactions Transaction[]
}

enum AccountType {
  CASH
  BANK
  CREDIT_CARD
  EWALLET
  INVESTMENT
  OTHER
}
```

### Category
```prisma
model Category {
  id        String           @id @default(cuid())
  userId    String?          // null = system default category
  name      String
  type      TransactionType  // INCOME | EXPENSE
  icon      String?
  color     String?
  isSystem  Boolean          @default(false)
  createdAt DateTime         @default(now())
  updatedAt DateTime         @updatedAt

  user         User?         @relation(fields: [userId], references: [id])
  transactions Transaction[]
  budgets      Budget[]
}
```

### Transaction
```prisma
model Transaction {
  id          String          @id @default(cuid())
  userId      String
  accountId   String
  categoryId  String
  type        TransactionType
  amount      Int             // in sen, always positive
  note        String?
  date        DateTime
  createdAt   DateTime        @default(now())
  updatedAt   DateTime        @updatedAt
  deletedAt   DateTime?

  user     User     @relation(fields: [userId], references: [id])
  account  Account  @relation(fields: [accountId], references: [id])
  category Category @relation(fields: [categoryId], references: [id])
}

enum TransactionType {
  INCOME
  EXPENSE
  TRANSFER
}
```

### Budget
```prisma
model Budget {
  id         String   @id @default(cuid())
  userId     String
  categoryId String
  amount     Int      // limit in sen
  month      Int      // 1–12
  year       Int
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  user     User     @relation(fields: [userId], references: [id])
  category Category @relation(fields: [categoryId], references: [id])

  @@unique([userId, categoryId, month, year])
}
```

---

## 5. Indexes (Planned)

| Table | Index | Reason |
|---|---|---|
| `Transaction` | `(userId, date DESC)` | Dashboard queries sorted by date |
| `Transaction` | `(userId, categoryId, date)` | Category reports |
| `Budget` | `(userId, month, year)` | Monthly budget lookup |

---

## 6. Seed Data (Default Categories)

**Expense categories:** Makanan & Minuman, Transportasi, Belanja, Hiburan, Tagihan & Utilitas, Kesehatan, Pendidikan, Lainnya

**Income categories:** Gaji, Freelance, Investasi, Bonus, Hadiah, Lainnya

---

## 7. Open Questions

- [ ] Apakah perlu tabel `Transfer` terpisah atau cukup dua baris Transaction?
- [ ] Recurring transaction — model terpisah atau field pada Transaction?
- [ ] Attachment/foto struk — simpan di storage mana (S3 / Supabase Storage)?
