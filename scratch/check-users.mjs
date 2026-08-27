import postgres from "postgres";

const DATABASE_URL = "postgresql://postgres.qcduutezsoziwszezsst:xDCHUVZNlTgPjnKa@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?sslmode=require";

async function checkUsers() {
  const sql = postgres(DATABASE_URL, {
    ssl: "require",
    max: 5,
    prepare: false,
  });

  try {
    const users = await sql`SELECT id, email, name, created_at FROM users`;
    console.log("Users in DB:", users);

    const constraints = await sql`
      SELECT conname, pg_get_constraintdef(oid)
      FROM pg_constraint
      WHERE conrelid = 'users'::regclass;
    `;
    console.log("Constraints on users table:", constraints);
  } catch (e) {
    console.error("Error:", e);
  } finally {
    await sql.end();
  }
}

checkUsers();
