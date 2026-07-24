/**
 * Integration test helpers for Onoo.
 *
 * Provides database pool management, test user creation, and
 * user-identity helpers for SECURITY DEFINER functions that
 * check auth.uid().
 *
 * Connect via psql-compatible DB_URL (from `supabase status`):
 *   postgresql://postgres:postgres@127.0.0.1:54323/postgres
 *
 * Run tests with `pnpm test:integration`.
 */

import crypto from "node:crypto";
import type { Pool, PoolClient } from "pg";
import { Pool as PgPool } from "pg";

const DB_URL =
  process.env.DB_URL ??
  "postgresql://postgres:postgres@127.0.0.1:54323/postgres";

let poolSingleton: Pool | null = null;

export function newPool(): Pool {
  return new PgPool({ connectionString: DB_URL });
}

export async function getPool(): Promise<Pool> {
  if (!poolSingleton) {
    poolSingleton = new PgPool({ connectionString: DB_URL });
  }
  return poolSingleton;
}

export async function closePool(): Promise<void> {
  if (poolSingleton) {
    await poolSingleton.end();
    poolSingleton = null;
  }
}

export interface CreateTestUserOptions {
  email?: string;
}

export async function createTestUser(
  pool: Pool,
  options?: CreateTestUserOptions,
): Promise<{ id: string }> {
  const id = crypto.randomUUID();
  const email =
    options?.email ?? `test-${id.slice(0, 8)}@onoo-test.mn`;
  const now = new Date().toISOString();

  // Insert into auth.users with the minimum required fields
  await pool.query(
    `INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, aud, role)
     VALUES ($1, '00000000-0000-0000-0000-000000000000', $2,
             crypt('password123', gen_salt('bf')),
             $3, '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb,
             $3, $3, 'authenticated', 'authenticated')`,
    [id, email, now],
  );

  // Ensure a matching profile row exists (used as FK target by awards etc.)
  await pool.query(
    `INSERT INTO public.profiles (id, display_name)
     VALUES ($1, $2)
     ON CONFLICT (id) DO NOTHING`,
    [id, `Test User ${id.slice(0, 6)}`],
  );

  return { id };
}

/**
 * Execute `fn` on `client` with the session configured as `userId`.
 *
 * Sets ROLE to 'authenticated' and overrides request.jwt.claim.sub so that
 * auth.uid() returns `userId` inside SECURITY DEFINER functions.
 *
 * Resets both after the callback completes or throws.
 */
export async function asUser(
  client: PoolClient,
  userId: string,
  fn: () => Promise<void>,
): Promise<void> {
  try {
    await client.query("SET ROLE 'authenticated'");
    // is_local = false so the setting persists across auto-committed queries
    await client.query(
      "SELECT set_config('request.jwt.claim.sub', $1, false)",
      [userId],
    );
    await fn();
  } finally {
    await client.query("RESET ROLE");
    await client.query(
      "SELECT set_config('request.jwt.claim.sub', '', false)",
    );
  }
}
