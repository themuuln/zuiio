/**
 * Seed dev users for local development
 * Run: npx tsx scripts/seed-users.ts
 * Requires: SUPABASE_SERVICE_ROLE_KEY env var (from supabase status output)
 *
 * Creates:
 * - admin@dev.local (league admin)
 * - scorer@dev.local (scorekeeper for seeded test game)
 *
 * Idempotent: safe to run multiple times
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://localhost:54321";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_KEY) {
  console.error("Missing SUPABASE_SERVICE_ROLE_KEY. Run `supabase status` and set it.");
  process.exit(1);
}

// Fixed UUIDs matching seed.sql
const LEAGUE_ID = "c0000000-0000-0000-0000-000000000001";
const ORG_ID = "b0000000-0000-0000-0000-000000000001";
const GAME_ID = "70000000-0000-0000-0000-000000000001";

interface User {
  email: string;
  password: string;
  display_name: string;
}

const USERS: User[] = [
  { email: "admin@dev.local", password: "admin123", display_name: "Admin Dev" },
  { email: "scorer@dev.local", password: "scorer123", display_name: "Scorer Dev" },
];

async function createUser(user: User): Promise<string | null> {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: "POST",
    headers: {
      apikey: SERVICE_KEY!,
      Authorization: `Bearer ${SERVICE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: user.email,
      password: user.password,
      email_confirm: true,
      user_metadata: { display_name: user.display_name },
    }),
  });

  if (res.status === 422) {
    // User already exists — get their ID
    const listRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
      headers: { apikey: SERVICE_KEY!, Authorization: `Bearer ${SERVICE_KEY}` },
    });
    const { users } = await listRes.json();
    const existing = users.find((u: { email: string }) => u.email === user.email);
    if (existing) {
      console.log(`  ✓ ${user.email} already exists (${existing.id})`);
      return existing.id;
    }
  }

  if (!res.ok) {
    const err = await res.text();
    console.error(`  ✗ Failed to create ${user.email}: ${err}`);
    return null;
  }

  const { id } = await res.json();
  console.log(`  ✓ Created ${user.email} (${id})`);
  return id;
}

async function upsertMembership(userId: string, role: string) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/memberships`, {
    method: "POST",
    headers: {
      apikey: SERVICE_KEY!,
      Authorization: `Bearer ${SERVICE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates",
    },
    body: JSON.stringify({
      user_id: userId,
      scope_type: "league",
      scope_id: LEAGUE_ID,
      role,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error(`  ✗ Failed to upsert membership for ${userId}: ${err}`);
  } else {
    console.log(`  ✓ Membership: ${role} for league ${LEAGUE_ID}`);
  }
}

async function upsertGameAssignment(userId: string) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/game_assignments`, {
    method: "POST",
    headers: {
      apikey: SERVICE_KEY!,
      Authorization: `Bearer ${SERVICE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates",
    },
    body: JSON.stringify({
      game_id: GAME_ID,
      user_id: userId,
      role: "scorekeeper",
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error(`  ✗ Failed to upsert game assignment: ${err}`);
  } else {
    console.log(`  ✓ Game assignment: scorer for game ${GAME_ID}`);
  }
}

async function main() {
  console.log("Seeding dev users...\n");

  for (const user of USERS) {
    const userId = await createUser(user);
    if (!userId) continue;

    // Admin gets league admin role
    if (user.email === "admin@dev.local") {
      await upsertMembership(userId, "admin");
    }

    // Scorer gets scorekeeper assignment on the test game
    if (user.email === "scorer@dev.local") {
      await upsertMembership(userId, "scorekeeper");
      await upsertGameAssignment(userId);
    }
  }

  console.log("\nDone! Users can now log in at /admin/login");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
