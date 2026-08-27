import postgres from "postgres";

const DATABASE_URL = "postgresql://postgres.qcduutezsoziwszezsst:xDCHUVZNlTgPjnKa@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?sslmode=require";

async function checkFKs() {
  const sql = postgres(DATABASE_URL, {
    ssl: "require",
    max: 5,
    prepare: false,
  });

  try {
    const fks = await sql`
      SELECT
        tc.table_name, 
        kcu.column_name, 
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name,
        rc.update_rule,
        rc.delete_rule
      FROM information_schema.table_constraints AS tc 
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      JOIN information_schema.referential_constraints AS rc
        ON rc.constraint_name = tc.constraint_name
      WHERE ccu.table_name = 'users';
    `;
    console.log("Foreign keys referencing users:", fks);
  } catch (e) {
    console.error("Error:", e);
  } finally {
    await sql.end();
  }
}

checkFKs();
