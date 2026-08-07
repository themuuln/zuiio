/**
 * Integration test helpers for real Postgres database testing.
 *
 * Connects directly to a local Postgres instance (no Docker/Supabase services).
 * RLS policies that call auth.uid() are made testable via SET ROLE + SET LOCAL.
 *
 * Usage:
 *   import { getPool, asUser, cleanTables, createTestUsers } from "@/test/setup-integration";
 *
 * @vitest-environment node
 */

import { Pool, type PoolClient } from "pg";

let pool: Pool | null = null;

/** Database URL — defaults to local Supabase Postgres. */
function dbUrl(): string {
  return (
    process.env.INTEGRATION_DATABASE_URL ||
    "postgresql://postgres:postgres@127.0.0.1:54323/postgres"
  );
}

/** Get or create the singleton connection pool. */
export async function getPool(): Promise<Pool> {
  if (!pool) {
    pool = newPool();
  }
  return pool;
}

/** Create a fresh pool (bypasses singleton — for parallel test files). */
export function newPool(): Pool {
  return new Pool({ connectionString: dbUrl(), max: 5 });
}

/** Close the singleton pool. Call in afterAll or teardown. */
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

// ── RLS context ─────────────────────────────────────────────────────────

/**
 * Execute a callback as the authenticated role for RLS enforcement.
 *
 * Switches to `authenticated` role (not table owner) so RLS policies
 * that target `TO authenticated` are enforced. Also sets
 * `request.jwt.claim.sub` for `auth.uid()` resolution.
 */
export async function asUser<T>(
  client: PoolClient,
  userId: string,
  fn: () => Promise<T>,
): Promise<T> {
  const original = (await client.query("SELECT current_role AS r")).rows[0].r;
  try {
    await client.query("SET ROLE authenticated");
    await client.query(
      "SELECT set_config('request.jwt.claim.sub', $1, false)",
      [userId],
    );
    return await fn();
  } finally {
    await client.query(`SET ROLE ${original}`);
  }
}

/** Clear the RLS user context (reverts to no authenticated user). */
export async function clearUserContext(client: PoolClient): Promise<void> {
  await client.query("SELECT set_config('request.jwt.claim.sub', '', false)");
}

// ── Database helpers ────────────────────────────────────────────────────

/**
 * Truncate all user tables in the public schema.
 * Call in beforeEach to isolate tests.
 */
export async function cleanTables(pool: Pool): Promise<void> {
  const result = await pool.query(`
    SELECT tablename
    FROM pg_catalog.pg_tables
    WHERE schemaname = 'public'
      AND tablename NOT IN ('_prisma_migrations')
      AND tableowner = current_user
  `);

  const tables = result.rows.map((r) => `"${r.tablename}"`).join(", ");
  if (tables.length > 0) {
    await pool.query(`TRUNCATE TABLE ${tables} CASCADE`);
  }
}

/**
 * Insert a test user into auth.users.
 * Works with both the stub table (Docker-less) and real Supabase auth.users (Docker).
 */
export async function createTestUser(
  pool: Pool,
  overrides: Partial<{ email: string; id: string }> = {},
): Promise<{ id: string; email: string }> {
  const id = overrides.id ?? crypto.randomUUID();
  const email = overrides.email ?? `${id}@onoo-test.mn`;
  const { rows } = await pool.query(
    `INSERT INTO auth.users (id, email, is_sso_user, is_anonymous)
     VALUES ($1, $2, false, false)
     RETURNING id, email`,
    [id, email],
  );
  return rows[0];
}

/**
 * Create multiple test users in one batch.
 */
export async function createTestUsers(
  pool: Pool,
  count: number,
): Promise<Array<{ id: string; email: string }>> {
  const users: Array<{ id: string; email: string }> = [];
  for (let i = 0; i < count; i++) {
    users.push(await createTestUser(pool));
  }
  return users;
}
