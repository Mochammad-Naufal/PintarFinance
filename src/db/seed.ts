/**
 * src/db/seed.ts
 * Pintar Finance — Database Seeder
 *
 * Menjalankan migrasi tabel (CREATE IF NOT EXISTS) sekaligus mengisi data dummy
 * yang realistis untuk keperluan development & demo.
 *
 * Usage:
 *   npm run db:seed
 */

import dotenv from "dotenv";
import postgres from "postgres";

// ─── Load .env.local ──────────────────────────────────────────────────────────
dotenv.config({ path: ".env.local" });

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("❌  DATABASE_URL tidak ditemukan di .env.local");
  process.exit(1);
}

const sql = postgres(DATABASE_URL, {
  ssl: "require",
  max: 1,
  idle_timeout: 30,
  connect_timeout: 30,
});

// ─── Fixed UUIDs (idempotent seeding) ────────────────────────────────────────
const ID = {
  user: "00000000-0000-0000-0000-000000000001",

  wallet: {
    bca:   "00000000-0000-0000-0000-000000000010",
    gopay: "00000000-0000-0000-0000-000000000011",
    cash:  "00000000-0000-0000-0000-000000000012",
  },

  cat: {
    // Expense
    makanan:     "00000000-0000-0000-0000-000000000020",
    transportasi:"00000000-0000-0000-0000-000000000021",
    belanja:     "00000000-0000-0000-0000-000000000022",
    tagihan:     "00000000-0000-0000-0000-000000000023",
    hiburan:     "00000000-0000-0000-0000-000000000024",
    kesehatan:   "00000000-0000-0000-0000-000000000025",
    edukasi:     "00000000-0000-0000-0000-000000000026",
    lainlain:    "00000000-0000-0000-0000-000000000027",
    // Income
    gaji:        "00000000-0000-0000-0000-000000000030",
    bonus:       "00000000-0000-0000-0000-000000000031",
    investasi:   "00000000-0000-0000-0000-000000000032",
    freelance:   "00000000-0000-0000-0000-000000000033",
  },

  saving: {
    darurat: "00000000-0000-0000-0000-000000000040",
    motor:   "00000000-0000-0000-0000-000000000041",
    nikah:   "00000000-0000-0000-0000-000000000042",
  },

  budget: {
    makanan:     "00000000-0000-0000-0000-000000000050",
    belanja:     "00000000-0000-0000-0000-000000000051",
    transportasi:"00000000-0000-0000-0000-000000000052",
  },
} as const;

// Periode bulan berjalan: format 'YYYY-MM'
const now = new Date();
const currentPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

// Helper: date N days ago
function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

// ─── Step 1: Create Tables ────────────────────────────────────────────────────
async function createTables() {
  console.log("\n📦  Creating tables (IF NOT EXISTS)...");

  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email       VARCHAR(255) UNIQUE NOT NULL,
      name        VARCHAR(100) NOT NULL,
      avatar_url  TEXT,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS wallets (
      id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name        VARCHAR(100) NOT NULL,
      type        VARCHAR(30) NOT NULL CHECK (type IN ('bank','ewallet','cash')),
      balance     BIGINT NOT NULL DEFAULT 0,
      color       VARCHAR(20) DEFAULT '#10b981',
      icon        VARCHAR(50) DEFAULT 'wallet',
      is_active   BOOLEAN NOT NULL DEFAULT true,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
      deleted_at  TIMESTAMPTZ
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS categories (
      id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
      name        VARCHAR(100) NOT NULL,
      type        VARCHAR(20) NOT NULL CHECK (type IN ('expense','income')),
      icon        VARCHAR(50) NOT NULL DEFAULT 'tag',
      color       VARCHAR(20) DEFAULT '#64748b',
      created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS savings_goals (
      id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name            VARCHAR(150) NOT NULL,
      target_amount   BIGINT NOT NULL,
      current_amount  BIGINT NOT NULL DEFAULT 0,
      target_date     DATE,
      icon            VARCHAR(50) DEFAULT 'target',
      color           VARCHAR(20) DEFAULT '#3b82f6',
      is_completed    BOOLEAN NOT NULL DEFAULT false,
      created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
      deleted_at      TIMESTAMPTZ
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS transactions (
      id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id               UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      wallet_id             UUID NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
      destination_wallet_id UUID REFERENCES wallets(id),
      category_id           UUID REFERENCES categories(id),
      savings_goal_id       UUID REFERENCES savings_goals(id),
      type                  VARCHAR(20) NOT NULL CHECK (type IN ('expense','income','transfer','saving')),
      amount                BIGINT NOT NULL,
      admin_fee             BIGINT NOT NULL DEFAULT 0,
      transaction_date      TIMESTAMPTZ NOT NULL DEFAULT now(),
      description           TEXT,
      receipt_url           TEXT,
      created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
      deleted_at            TIMESTAMPTZ
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS budgets (
      id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      category_id   UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
      period        VARCHAR(7) NOT NULL,
      limit_amount  BIGINT NOT NULL,
      created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
      UNIQUE (user_id, category_id, period)
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS recurring_transactions (
      id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      wallet_id     UUID NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
      category_id   UUID REFERENCES categories(id) ON DELETE SET NULL,
      type          VARCHAR(20) NOT NULL CHECK (type IN ('expense','income')),
      amount        BIGINT NOT NULL,
      frequency     VARCHAR(20) NOT NULL CHECK (frequency IN ('daily','weekly','monthly','yearly')),
      start_date    DATE NOT NULL,
      next_run_date DATE NOT NULL,
      last_run_date DATE,
      description   VARCHAR(255) NOT NULL,
      is_active     BOOLEAN NOT NULL DEFAULT true,
      auto_create   BOOLEAN NOT NULL DEFAULT false,
      created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
      deleted_at    TIMESTAMPTZ
    )
  `;

  // Indexes
  await sql`CREATE INDEX IF NOT EXISTS idx_transactions_user_date  ON transactions (user_id, transaction_date DESC)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_transactions_wallet      ON transactions (wallet_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_transactions_category    ON transactions (category_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_budgets_user_period      ON budgets (user_id, period)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_savings_user             ON savings_goals (user_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_recurring_user           ON recurring_transactions (user_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_recurring_next_run       ON recurring_transactions (next_run_date)`;

  console.log("✅  Tables & indexes ready");
}

// ─── Step 2: Seed User ────────────────────────────────────────────────────────
async function seedUser() {
  console.log("\n👤  Seeding demo user...");
  await sql`
    INSERT INTO users (id, email, name)
    VALUES (${ID.user}, 'demo@pintarfinance.id', 'Demo User')
    ON CONFLICT (id) DO UPDATE SET
      email      = EXCLUDED.email,
      name       = EXCLUDED.name,
      updated_at = now()
  `;
  console.log("   ✓  demo@pintarfinance.id");
}

// ─── Step 3: Seed System Categories ──────────────────────────────────────────
async function seedCategories() {
  console.log("\n🏷️   Seeding system categories (user_id = null)...");

  const expenseCategories = [
    { id: ID.cat.makanan,      name: "Makanan & Minuman",      icon: "utensils",       color: "#f97316" },
    { id: ID.cat.transportasi, name: "Transportasi",           icon: "car",            color: "#3b82f6" },
    { id: ID.cat.belanja,      name: "Belanja & Kebutuhan",    icon: "shopping-bag",   color: "#a855f7" },
    { id: ID.cat.tagihan,      name: "Tagihan & Utilitas",     icon: "receipt",        color: "#ef4444" },
    { id: ID.cat.hiburan,      name: "Hiburan & Rekreasi",     icon: "film",           color: "#ec4899" },
    { id: ID.cat.kesehatan,    name: "Kesehatan",              icon: "heart-pulse",    color: "#14b8a6" },
    { id: ID.cat.edukasi,      name: "Edukasi",                icon: "graduation-cap", color: "#6366f1" },
    { id: ID.cat.lainlain,     name: "Lain-lain",              icon: "more-horizontal",color: "#64748b" },
  ];

  const incomeCategories = [
    { id: ID.cat.gaji,      name: "Gaji & Upah",          icon: "briefcase",   color: "#22c55e" },
    { id: ID.cat.bonus,     name: "Bonus & Tunjangan",    icon: "gift",        color: "#f59e0b" },
    { id: ID.cat.investasi, name: "Hasil Investasi",      icon: "trending-up", color: "#0ea5e9" },
    { id: ID.cat.freelance, name: "Freelance / Side Job", icon: "laptop",      color: "#8b5cf6" },
  ];

  for (const cat of expenseCategories) {
    await sql`
      INSERT INTO categories (id, user_id, name, type, icon, color)
      VALUES (${cat.id}, NULL, ${cat.name}, 'expense', ${cat.icon}, ${cat.color})
      ON CONFLICT (id) DO UPDATE SET
        name  = EXCLUDED.name,
        icon  = EXCLUDED.icon,
        color = EXCLUDED.color
    `;
    console.log(`   ✓  [expense] ${cat.name}`);
  }

  for (const cat of incomeCategories) {
    await sql`
      INSERT INTO categories (id, user_id, name, type, icon, color)
      VALUES (${cat.id}, NULL, ${cat.name}, 'income', ${cat.icon}, ${cat.color})
      ON CONFLICT (id) DO UPDATE SET
        name  = EXCLUDED.name,
        icon  = EXCLUDED.icon,
        color = EXCLUDED.color
    `;
    console.log(`   ✓  [income] ${cat.name}`);
  }
}

// ─── Step 4: Seed Wallets ─────────────────────────────────────────────────────
async function seedWallets() {
  console.log("\n💳  Seeding wallets...");

  const wallets = [
    { id: ID.wallet.bca,   name: "BCA Utama",     type: "bank",    balance: 12_500_000, color: "#0060af", icon: "landmark"   },
    { id: ID.wallet.gopay, name: "GoPay",          type: "ewallet", balance:    350_000, color: "#00aed6", icon: "smartphone" },
    { id: ID.wallet.cash,  name: "Dompet Tunai",   type: "cash",    balance:    400_000, color: "#10b981", icon: "banknote"   },
  ];

  for (const w of wallets) {
    await sql`
      INSERT INTO wallets (id, user_id, name, type, balance, color, icon)
      VALUES (${w.id}, ${ID.user}, ${w.name}, ${w.type}, ${w.balance}, ${w.color}, ${w.icon})
      ON CONFLICT (id) DO UPDATE SET
        name       = EXCLUDED.name,
        balance    = EXCLUDED.balance,
        color      = EXCLUDED.color,
        icon       = EXCLUDED.icon,
        updated_at = now()
    `;
    console.log(`   ✓  ${w.name} — Rp ${w.balance.toLocaleString("id-ID")}`);
  }
}

// ─── Step 5: Seed Savings Goals ───────────────────────────────────────────────
async function seedSavingsGoals() {
  console.log("\n🎯  Seeding savings goals...");

  const goals = [
    { id: ID.saving.darurat, name: "Dana Darurat",      target: 30_000_000, current: 15_000_000, color: "#10b981", icon: "shield-check" },
    { id: ID.saving.motor,   name: "Beli Sepeda Motor", target: 35_000_000, current:  8_500_000, color: "#3b82f6", icon: "bike"         },
    { id: ID.saving.nikah,   name: "Tabungan Nikah",    target: 60_000_000, current: 20_000_000, color: "#ec4899", icon: "heart"        },
  ];

  for (const g of goals) {
    await sql`
      INSERT INTO savings_goals (id, user_id, name, target_amount, current_amount, color, icon)
      VALUES (${g.id}, ${ID.user}, ${g.name}, ${g.target}, ${g.current}, ${g.color}, ${g.icon})
      ON CONFLICT (id) DO UPDATE SET
        name           = EXCLUDED.name,
        target_amount  = EXCLUDED.target_amount,
        current_amount = EXCLUDED.current_amount,
        color          = EXCLUDED.color,
        icon           = EXCLUDED.icon,
        updated_at     = now()
    `;
    console.log(`   ✓  ${g.name} — ${g.current.toLocaleString("id-ID")} / ${g.target.toLocaleString("id-ID")}`);
  }
}

// ─── Step 6: Seed Budgets ─────────────────────────────────────────────────────
async function seedBudgets() {
  console.log(`\n📊  Seeding budgets (period: ${currentPeriod})...`);

  const budgets = [
    { id: ID.budget.makanan,      category_id: ID.cat.makanan,      limit: 2_500_000 },
    { id: ID.budget.belanja,      category_id: ID.cat.belanja,      limit: 1_500_000 },
    { id: ID.budget.transportasi, category_id: ID.cat.transportasi, limit:   800_000 },
  ];

  for (const b of budgets) {
    await sql`
      INSERT INTO budgets (id, user_id, category_id, period, limit_amount)
      VALUES (${b.id}, ${ID.user}, ${b.category_id}, ${currentPeriod}, ${b.limit})
      ON CONFLICT (user_id, category_id, period) DO UPDATE SET
        limit_amount = EXCLUDED.limit_amount,
        updated_at   = now()
    `;
    console.log(`   ✓  Budget Rp ${b.limit.toLocaleString("id-ID")} — ${currentPeriod}`);
  }
}

// ─── Step 7: Seed Transactions ────────────────────────────────────────────────
async function seedTransactions() {
  console.log("\n💸  Seeding transaction history (14 hari terakhir)...");

  // Clear existing transactions for demo user to avoid duplicates on re-seed
  await sql`DELETE FROM transactions WHERE user_id = ${ID.user}`;

  type TxRow = {
    user_id: string;
    wallet_id: string;
    destination_wallet_id?: string | null;
    category_id?: string | null;
    savings_goal_id?: string | null;
    type: string;
    amount: number;
    admin_fee?: number;
    transaction_date: Date;
    description: string;
  };

  const transactions: TxRow[] = [
    // D-14: Gaji masuk ke BCA
    {
      user_id: ID.user,
      wallet_id: ID.wallet.bca,
      category_id: ID.cat.gaji,
      type: "income",
      amount: 8_500_000,
      transaction_date: daysAgo(14),
      description: "Gaji Bulanan — PT Maju Bersama",
    },
    // D-12: Kopi di Janji Jiwa (QRIS via GoPay)
    {
      user_id: ID.user,
      wallet_id: ID.wallet.gopay,
      category_id: ID.cat.makanan,
      type: "expense",
      amount: 38_000,
      transaction_date: daysAgo(12),
      description: "QRIS Janji Jiwa Cafe",
    },
    // D-11: Token Listrik PLN
    {
      user_id: ID.user,
      wallet_id: ID.wallet.bca,
      category_id: ID.cat.tagihan,
      type: "expense",
      amount: 250_000,
      transaction_date: daysAgo(11),
      description: "Token Listrik PLN",
    },
    // D-10: Makan siang Warteg
    {
      user_id: ID.user,
      wallet_id: ID.wallet.cash,
      category_id: ID.cat.makanan,
      type: "expense",
      amount: 22_000,
      transaction_date: daysAgo(10),
      description: "Makan Siang Warteg Bu Yati",
    },
    // D-9: Bensin Shell
    {
      user_id: ID.user,
      wallet_id: ID.wallet.bca,
      category_id: ID.cat.transportasi,
      type: "expense",
      amount: 150_000,
      transaction_date: daysAgo(9),
      description: "Bensin Shell Pertamax Plus",
    },
    // D-9: Transfer BCA → GoPay
    {
      user_id: ID.user,
      wallet_id: ID.wallet.bca,
      destination_wallet_id: ID.wallet.gopay,
      type: "transfer",
      amount: 200_000,
      admin_fee: 0,
      transaction_date: daysAgo(9),
      description: "Top Up GoPay via BCA",
    },
    // D-8: Beli Vitamin di Guardian
    {
      user_id: ID.user,
      wallet_id: ID.wallet.gopay,
      category_id: ID.cat.kesehatan,
      type: "expense",
      amount: 85_000,
      transaction_date: daysAgo(8),
      description: "Vitamin C & Suplemen Guardian",
    },
    // D-7: Netflix
    {
      user_id: ID.user,
      wallet_id: ID.wallet.bca,
      category_id: ID.cat.hiburan,
      type: "expense",
      amount: 54_000,
      transaction_date: daysAgo(7),
      description: "Netflix Subscription Bulanan",
    },
    // D-6: Grocery Superindo
    {
      user_id: ID.user,
      wallet_id: ID.wallet.bca,
      category_id: ID.cat.belanja,
      type: "expense",
      amount: 385_000,
      transaction_date: daysAgo(6),
      description: "Belanja Bulanan Superindo",
    },
    // D-5: Kopi Kenangan (GoPay)
    {
      user_id: ID.user,
      wallet_id: ID.wallet.gopay,
      category_id: ID.cat.makanan,
      type: "expense",
      amount: 45_000,
      transaction_date: daysAgo(5),
      description: "Kopi Kenangan — Americano",
    },
    // D-5: Alokasi Tabungan Nikah
    {
      user_id: ID.user,
      wallet_id: ID.wallet.bca,
      savings_goal_id: ID.saving.nikah,
      type: "saving",
      amount: 1_000_000,
      transaction_date: daysAgo(5),
      description: "Alokasi Tabungan Nikah — Agustus",
    },
    // D-4: Grab Bike
    {
      user_id: ID.user,
      wallet_id: ID.wallet.gopay,
      category_id: ID.cat.transportasi,
      type: "expense",
      amount: 32_000,
      transaction_date: daysAgo(4),
      description: "GrabBike ke Kantor",
    },
    // D-3: Makan Ayam Geprek
    {
      user_id: ID.user,
      wallet_id: ID.wallet.cash,
      category_id: ID.cat.makanan,
      type: "expense",
      amount: 28_000,
      transaction_date: daysAgo(3),
      description: "Makan Siang Ayam Geprek Pak Ndut",
    },
    // D-2: Bayar Kost
    {
      user_id: ID.user,
      wallet_id: ID.wallet.bca,
      category_id: ID.cat.tagihan,
      type: "expense",
      amount: 1_200_000,
      transaction_date: daysAgo(2),
      description: "Sewa Kos Bulanan — September",
    },
    // D-1: Income Freelance Design
    {
      user_id: ID.user,
      wallet_id: ID.wallet.bca,
      category_id: ID.cat.freelance,
      type: "income",
      amount: 1_500_000,
      transaction_date: daysAgo(1),
      description: "Freelance — Desain Logo Client",
    },
  ];

  for (const tx of transactions) {
    await sql`
      INSERT INTO transactions (
        user_id, wallet_id, destination_wallet_id,
        category_id, savings_goal_id,
        type, amount, admin_fee,
        transaction_date, description
      ) VALUES (
        ${tx.user_id},
        ${tx.wallet_id},
        ${tx.destination_wallet_id ?? null},
        ${tx.category_id ?? null},
        ${tx.savings_goal_id ?? null},
        ${tx.type},
        ${tx.amount},
        ${tx.admin_fee ?? 0},
        ${tx.transaction_date},
        ${tx.description}
      )
    `;
    const sign = tx.type === "income" ? "+" : tx.type === "expense" ? "-" : "⇄";
    console.log(`   ✓  [${tx.type.padEnd(8)}] ${sign} Rp ${tx.amount.toLocaleString("id-ID").padStart(12)} — ${tx.description}`);
  }
}

// ─── Step 8: Seed Recurring Transactions ──────────────────────────────────────
async function seedRecurringTransactions() {
  console.log("\n🔁  Seeding recurring transactions & subscriptions...");

  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const in3Days = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const in5Days = new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const in25Days = new Date(today.getTime() + 25 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const recurring = [
    {
      user_id: ID.user,
      wallet_id: ID.wallet.bca,
      category_id: ID.cat.tagihan,
      type: "expense",
      amount: 186_000,
      frequency: "monthly",
      start_date: todayStr,
      next_run_date: in3Days,
      description: "Netflix Premium 4K",
      is_active: true,
      auto_create: true,
    },
    {
      user_id: ID.user,
      wallet_id: ID.wallet.gopay,
      category_id: ID.cat.hiburan,
      type: "expense",
      amount: 86_900,
      frequency: "monthly",
      start_date: todayStr,
      next_run_date: in5Days,
      description: "Spotify Premium Family",
      is_active: true,
      auto_create: false,
    },
    {
      user_id: ID.user,
      wallet_id: ID.wallet.bca,
      category_id: ID.cat.tagihan,
      type: "expense",
      amount: 385_000,
      frequency: "monthly",
      start_date: todayStr,
      next_run_date: todayStr,
      description: "Internet IndiHome 50 Mbps",
      is_active: true,
      auto_create: false,
    },
    {
      user_id: ID.user,
      wallet_id: ID.wallet.bca,
      category_id: ID.cat.gaji,
      type: "income",
      amount: 8_500_000,
      frequency: "monthly",
      start_date: todayStr,
      next_run_date: in25Days,
      description: "Gaji Pokok Kantor",
      is_active: true,
      auto_create: true,
    },
  ];

  for (const r of recurring) {
    await sql`
      INSERT INTO recurring_transactions (
        user_id, wallet_id, category_id,
        type, amount, frequency,
        start_date, next_run_date,
        description, is_active, auto_create
      ) VALUES (
        ${r.user_id},
        ${r.wallet_id},
        ${r.category_id},
        ${r.type},
        ${r.amount},
        ${r.frequency},
        ${r.start_date},
        ${r.next_run_date},
        ${r.description},
        ${r.is_active},
        ${r.auto_create}
      )
    `;
    console.log(`   ✓  [${r.frequency}] Rp ${r.amount.toLocaleString("id-ID").padStart(10)} — ${r.description}`);
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log("🌱  Pintar Finance — Database Seeder");
  console.log("=====================================");
  console.log(`📅  Period: ${currentPeriod}`);
  console.log(`🔗  DB: ${DATABASE_URL!.replace(/:([^:@]+)@/, ":****@")}`);

  try {
    await createTables();
    await seedUser();
    await seedCategories();
    await seedWallets();
    await seedSavingsGoals();
    await seedBudgets();
    await seedTransactions();
    await seedRecurringTransactions();

    console.log("\n🎉  Seeding selesai! Database siap digunakan.");
    console.log("=====================================\n");
  } catch (error) {
    console.error("\n❌  Seeding gagal:", error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

main();
