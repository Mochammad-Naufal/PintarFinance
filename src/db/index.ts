import postgres from "postgres";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error("DATABASE_URL is not set in environment variables.");
}

// Global connection pool to prevent connection exhaustion in Next.js dev server
const globalForDb = globalThis as unknown as {
  sql: ReturnType<typeof postgres> | undefined;
};

export const sql =
  globalForDb.sql ??
  postgres(DATABASE_URL, {
    ssl: "require",
    max: 20,
    idle_timeout: 20,
    connect_timeout: 10,
    prepare: false, // Required for Supabase Transaction Pooler on port 6543
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.sql = sql;
}

export const DEMO_USER_ID = "00000000-0000-0000-0000-000000000001";
