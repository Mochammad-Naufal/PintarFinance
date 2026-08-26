import postgres from "postgres";

const DATABASE_URL = "postgresql://postgres.qcduutezsoziwszezsst:xDCHUVZNlTgPjnKa@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?sslmode=require";

async function main() {
  console.log("Connecting to database...");
  const sql = postgres(DATABASE_URL, {
    ssl: "require",
    max: 5,
    prepare: false,
    connect_timeout: 10,
  });

  const start = Date.now();
  const rows = await sql`SELECT 1 AS test, now() AS current_time`;
  console.log(`Query succeeded in ${Date.now() - start}ms:`, rows);

  const wallets = await sql`SELECT COUNT(*) FROM wallets`;
  console.log("Wallets count:", wallets);

  await sql.end();
  console.log("Connection closed.");
}

main().catch((err) => {
  console.error("DB Error:", err);
  process.exit(1);
});
