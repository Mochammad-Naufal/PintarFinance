import postgres from "postgres";

const DATABASE_URL = "postgresql://postgres.qcduutezsoziwszezsst:xDCHUVZNlTgPjnKa@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?sslmode=require";

async function updateForeignKeys() {
  const sql = postgres(DATABASE_URL, {
    ssl: "require",
    max: 5,
    prepare: false,
  });

  try {
    const fks = [
      { table: 'wallets', col: 'user_id', con: 'wallets_user_id_fkey' },
      { table: 'categories', col: 'user_id', con: 'categories_user_id_fkey' },
      { table: 'savings_goals', col: 'user_id', con: 'savings_goals_user_id_fkey' },
      { table: 'transactions', col: 'user_id', con: 'transactions_user_id_fkey' },
      { table: 'budgets', col: 'user_id', con: 'budgets_user_id_fkey' },
      { table: 'notifications', col: 'user_id', con: 'notifications_user_id_fkey' },
      { table: 'recurring_transactions', col: 'user_id', con: 'recurring_transactions_user_id_fkey' },
      { table: 'savings_goal_members', col: 'user_id', con: 'savings_goal_members_user_id_fkey' },
      { table: 'savings_goal_invites', col: 'inviter_id', con: 'savings_goal_invites_inviter_id_fkey' }
    ];

    for (const fk of fks) {
      console.log(`Updating constraint ${fk.con} on table ${fk.table}...`);
      await sql.unsafe(`
        ALTER TABLE ${fk.table} DROP CONSTRAINT IF EXISTS ${fk.con};
        ALTER TABLE ${fk.table} ADD CONSTRAINT ${fk.con}
          FOREIGN KEY (${fk.col}) REFERENCES users(id)
          ON UPDATE CASCADE ON DELETE CASCADE;
      `);
    }

    console.log("Successfully updated all foreign key constraints to ON UPDATE CASCADE ON DELETE CASCADE!");
  } catch (e) {
    console.error("Migration error:", e);
  } finally {
    await sql.end();
  }
}

updateForeignKeys();
