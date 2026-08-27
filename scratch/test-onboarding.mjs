import postgres from "postgres";

const DATABASE_URL = "postgresql://postgres.qcduutezsoziwszezsst:xDCHUVZNlTgPjnKa@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?sslmode=require";

async function testOnboarding() {
  const sql = postgres(DATABASE_URL, {
    ssl: "require",
    max: 5,
    prepare: false,
  });

  try {
    const testEmail = "testuser_onboarding@pintarfinance.id";
    const testId1 = "11111111-2222-3333-4444-555555555555";
    const testId2 = "99999999-8888-7777-6666-555555555555";

    // Clean test user if exists
    await sql`DELETE FROM users WHERE email = ${testEmail}`;

    console.log("1. Testing fresh insert...");
    // Simulate ensureUserOnboarding
    const cleanEmail = testEmail.trim().toLowerCase();
    const cleanName = "Test User 1";

    let [existingById] = await sql`SELECT id FROM users WHERE id = ${testId1} LIMIT 1`;
    let [existingByEmail] = await sql`SELECT id FROM users WHERE LOWER(email) = ${cleanEmail} LIMIT 1`;

    if (!existingById && !existingByEmail) {
      await sql`
        INSERT INTO users (id, email, name)
        VALUES (${testId1}, ${cleanEmail}, ${cleanName})
      `;
      console.log("-> Fresh insert succeeded!");
    }

    console.log("2. Testing second login with same ID...");
    [existingById] = await sql`SELECT id FROM users WHERE id = ${testId1} LIMIT 1`;
    if (existingById) {
      await sql`
        UPDATE users
        SET email = ${cleanEmail}, name = ${cleanName}, updated_at = now()
        WHERE id = ${testId1}
      `;
      console.log("-> Same ID update succeeded!");
    }

    console.log("3. Testing re-registration with SAME EMAIL but NEW ID (the bug condition)...");
    [existingById] = await sql`SELECT id FROM users WHERE id = ${testId2} LIMIT 1`;
    [existingByEmail] = await sql`SELECT id FROM users WHERE LOWER(email) = ${cleanEmail} LIMIT 1`;

    if (!existingById && existingByEmail) {
      await sql`
        UPDATE users
        SET id = ${testId2}, name = 'Test User 2', updated_at = now()
        WHERE id = ${existingByEmail.id}
      `;
      console.log("-> Conflict on email with new ID successfully re-mapped and updated!");
    }

    // Verify final state
    const [finalUser] = await sql`SELECT id, email, name FROM users WHERE email = ${testEmail}`;
    console.log("Final user state in DB:", finalUser);

    // Clean up test user
    await sql`DELETE FROM users WHERE email = ${testEmail}`;
    console.log("Test cleanup completed successfully!");
  } catch (e) {
    console.error("Test failed with error:", e);
  } finally {
    await sql.end();
  }
}

testOnboarding();
