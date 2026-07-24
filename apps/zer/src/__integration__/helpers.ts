/**
 * Supabase integration test helpers.
 *
 * Provides test clients, fixture factories with auto-cleanup,
 * and utilities for creating test data across all domains.
 *
 * Requires a running Supabase local stack.
 * Run: supabase start && pnpm --filter zer test:integration
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createHmac } from "node:crypto";
import { execSync } from "node:child_process";
import { afterAll } from "vitest";
import type { Database } from "@/lib/database.types";

// ── Service Role JWT (for bypassing RLS) ─────────────────────

const jwtSecret = "super-secret-jwt-token-with-at-least-32-characters-long";

/** Generate a service-role JWT for local Supabase. */
function generateServiceRoleJWT(): string {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(
    JSON.stringify({
      iss: "supabase-demo",
      role: "service_role",
      exp: Math.floor(Date.now() / 1000) + 86400 * 365,
    }),
  ).toString("base64url");
  const sig = createHmac("sha256", jwtSecret).update(`${header}.${payload}`).digest().toString("base64url");
  return `${header}.${payload}.${sig}`;
}

// ── Environment ──────────────────────────────────────────────

const supabaseUrl = process.env.SUPABASE_URL ?? "http://127.0.0.1:54321";
const anonKey = process.env.SUPABASE_ANON_KEY!;

/** Create an anon (unauthenticated) Supabase client. */
export function createAnonClient() {
  return createClient<Database>(supabaseUrl, anonKey);
}

/**
 * Create a service-role (admin) Supabase client that bypasses RLS.
 * Uses a JWT with `role: service_role` so PostgREST runs as the
 * service_role PG user (which has BYPASSRLS).
 */
export function createAdminClient() {
  const jwt = generateServiceRoleJWT();
  return createClient<Database>(supabaseUrl, anonKey, {
    global: {
      headers: { Authorization: `Bearer ${jwt}` },
    },
  });
}

/** Create both clients in one call. */
export function createTestClients() {
  return { anon: createAnonClient(), admin: createAdminClient() };
}

// ── Direct SQL helper (via psql) ─────────────────────────────

/**
 * Execute arbitrary SQL against the local Supabase database.
 * Uses psql with peer auth (trusted local socket).
 */
export async function runSql(sql: string): Promise<void> {
  execSync(
    `PGPASSWORD=postgres psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -c ${JSON.stringify(sql)}`,
    { encoding: "utf-8", timeout: 10_000 },
  );
}

// ── Fixture cleanup tracker ──────────────────────────────────

interface CleanupEntry {
  table: string;
  id: string;
}

const cleanupQueue: CleanupEntry[] = [];

/**
 * Register a created record for automatic cleanup.
 * Call this after every fixture insert.
 */
export function trackCleanup(table: string, id: string) {
  cleanupQueue.push({ table, id });
}

/**
 * Remove all tracked records (newest first to respect FK constraints).
 */
export async function runCleanup(admin: SupabaseClient) {
  for (const entry of cleanupQueue.reverse()) {
    const { error } = await admin
      .from(entry.table as any)
      .delete()
      .eq("id", entry.id as any);
    if (error) {
      console.warn(`Cleanup failed for ${entry.table}#${entry.id}: ${error.message}`);
    }
  }
  cleanupQueue.length = 0;
}

// Auto-register cleanup in vitest.
afterAll(async () => {
  if (cleanupQueue.length > 0) {
    const admin = createAdminClient();
    await runCleanup(admin);
  }
});

// ── Organization fixture ─────────────────────────────────────

/** Create a test organization and return its row + id. */
export async function createTestOrg(admin: SupabaseClient) {
  const slug = `test-org-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const { data, error } = await admin
    .from("organizations")
    .insert({
      name: "Test Organization",
      slug,
      company_type: "retail",
      has_suppliers: true,
      has_track_stock: true,
      has_inventory: true,
      has_variants: true,
      has_categories: true,
      has_brands: true,
      has_multi_branch: true,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create test org: ${error.message}`);
  trackCleanup("organizations", data.id);
  return { org: data, orgId: data.id };
}

// ── Auth user fixture ────────────────────────────────────────

/** User + authenticated client bundle. */
export interface TestUserBundle {
  userId: string;
  email: string;
  password: string;
  client: SupabaseClient;
  session: any;
}

/**
 * Create a fully set-up test user with:
 * 1. Auth user (signed up, email auto-confirmed)
 * 2. Profile linked to the auth user
 * 3. Role with granted permissions
 * 4. Authenticated Supabase client
 */
export async function createTestUserWithPermissions(
  admin: SupabaseClient,
  orgId: string,
  orgName: string,
  permissions: string[],
): Promise<TestUserBundle> {
  const email = `test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
  const password = "test-password-123";

  // 1. Sign up via anon client (works locally, may require email confirm)
  const { data: signUpData, error: signUpError } = await createAnonClient().auth.signUp({
    email,
    password,
  });
  if (signUpError) throw new Error(`SignUp failed: ${signUpError.message}`);
  const userId = signUpData.user?.id;
  if (!userId) throw new Error("SignUp returned no user id");

  // 2. Auto-confirm the email by updating auth.users directly
  await runSql(`UPDATE auth.users SET email_confirmed_at = now() WHERE id = '${userId}'`);

  // 3. Sign in to get a session
  const { data: signInData, error: signInError } = await createAnonClient().auth.signInWithPassword({
    email,
    password,
  });
  if (signInError) throw new Error(`SignIn failed: ${signInError.message}`);

  const session = signInData.session!;
  const client = createClient<Database>(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${session.access_token}` } },
  });

  // 4. Create a role and assign permissions
  const { data: role, error: roleErr } = await admin
    .from("roles")
    .insert({
      organization_id: orgId,
      name: orgName + " Admin",
    })
    .select()
    .single();
  if (roleErr) throw new Error(`Failed to create role: ${roleErr.message}`);
  trackCleanup("roles", role.id);

  // Grant all requested permissions
  for (const perm of permissions) {
    const { error: permErr } = await admin
      .from("role_permissions")
      .insert({ role_id: role.id, permission: perm as any });
    if (permErr) throw new Error(`Failed to grant permission ${perm}: ${permErr.message}`);
  }

  // 5. Create a profile for the user
  const { error: profileErr } = await admin.from("profiles").insert({
    id: userId,
    organization_id: orgId,
    role_id: role.id,
    full_name: email.split("@")[0],
  });
  return { userId, email, password, client, session };
}

// ── Branch fixture ───────────────────────────────────────────

/** Create a test branch for an organization. */
export async function createTestBranch(admin: SupabaseClient, orgId: string) {
  const slug = `branch-${Date.now()}`;
  const { data, error } = await admin
    .from("branches")
    .insert({
      organization_id: orgId,
      name: `Branch-${Date.now()}`,
      slug,
    })
    .select()
    .single();
  if (error) throw new Error(`Failed to create branch: ${error.message}`);
  trackCleanup("branches", data.id);
  return { branch: data, branchId: data.id };
}

// ── Warehouse fixture ────────────────────────────────────────

export async function createTestWarehouse(admin: SupabaseClient, orgId: string, branchId: string) {
  const { data, error } = await admin
    .from("warehouses")
    .insert({
      organization_id: orgId,
      branch_id: branchId,
      name: `Warehouse-${Date.now()}`,
    })
    .select()
    .single();
  if (error) throw new Error(`Failed to create warehouse: ${error.message}`);
  trackCleanup("warehouses", data.id);
  return { warehouse: data, warehouseId: data.id };
}

// ── Product fixture ──────────────────────────────────────────

export async function createTestProduct(
  admin: SupabaseClient,
  orgId: string,
  opts?: { currentStock?: number; name?: string; sku?: string },
) {
  const sku = opts?.sku ?? `SKU-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const { data, error } = await admin
    .from("products")
    .insert({
      organization_id: orgId,
      name: opts?.name ?? `Product-${Date.now()}`,
      sku,
      current_stock: opts?.currentStock ?? 100,
      sale_price: 5000,
      cost_price: 3000,
    })
    .select()
    .single();
  if (error) throw new Error(`Failed to create product: ${error.message}`);
  trackCleanup("products", data.id);
  return { product: data, productId: data.id };
}

// ── Contact fixture (supplier / customer) ────────────────────

export type ContactType = "supplier" | "customer" | "both";

export async function createTestContact(
  admin: SupabaseClient,
  orgId: string,
  type: ContactType = "supplier",
) {
  const { data, error } = await admin
    .from("contacts")
    .insert({
      organization_id: orgId,
      name: `${type}-${Date.now()}`,
      type,
      phone: `9999${Math.floor(1000 + Math.random() * 9000)}`,
    })
    .select()
    .single();
  if (error) throw new Error(`Failed to create contact: ${error.message}`);
  trackCleanup("contacts", data.id);
  return { contact: data, contactId: data.id };
}

// ── Category fixture ─────────────────────────────────────────

export async function createTestCategory(admin: SupabaseClient, orgId: string) {
  const { data, error } = await admin
    .from("categories")
    .insert({
      organization_id: orgId,
      name: `Category-${Date.now()}`,
    })
    .select()
    .single();
  if (error) throw new Error(`Failed to create category: ${error.message}`);
  trackCleanup("categories", data.id);
  return { category: data, categoryId: data.id };
}

// ── Price list fixture ───────────────────────────────────────

export async function createTestPriceList(admin: SupabaseClient, orgId: string, branchId: string) {
  const { data, error } = await admin
    .from("price_lists")
    .insert({
      organization_id: orgId,
      branch_id: branchId,
      name: `PriceList-${Date.now()}`,
    })
    .select()
    .single();
  if (error) throw new Error(`Failed to create price list: ${error.message}`);
  trackCleanup("price_lists", data.id);
  return { priceList: data, priceListId: data.id };
}
