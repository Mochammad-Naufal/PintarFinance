import postgres from "postgres";

const DATABASE_URL = "postgresql://postgres.qcduutezsoziwszezsst:xDCHUVZNlTgPjnKa@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?sslmode=require";

async function addCascadeUpdate() {
  const sql = postgres(DATABASE_URL, {
    ssl: "require",
    max: 5,
    prepare: false,
  });

  try {
    // Check constraint names
    const constraints = await sql`
      SELECT tc.table_name, tc.constraint_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.constraint_column_usage ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE ccu.table_name = 'users' AND tc.constraint_type = 'FOREIGN KEY';
    `;
    console.log("Constraints:", constraints);

    for (const c of constraints) {
      console.log(`Updating ${c.table_name}.${c.constraint_name} to ON UPDATE CASCADE...`);
      // We will drop and re-add with ON UPDATE CASCADE ON DELETE CASCADE
    }
  } catch (e) {
    console.error("Error:", e);
  } finally {
    await sql.end();
  }
}

addCascadeUpdate();
