/**
 * Supabase integration test helpers for Tolom.
 *
 * Provides Supabase clients (anon, admin/service-role, authenticated)
 * and fixture creation helpers for integration tests.
 *
 * Usage:
 *   import { createAdminClient, createAnonClient, createTestOrg } from "./helpers";
 *
 * Requires a running Supabase local stack.
 * Run: supabase start && pnpm --filter tolom test:integration
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

// ── Environment ──────────────────────────────────────────────

const supabaseUrl = process.env.SUPABASE_URL ?? "http://127.0.0.1:54321";
const anonKey = process.env.SUPABASE_ANON_KEY!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// ── Client Factories ─────────────────────────────────────────

/** Create an anon (unauthenticated) Supabase client. */
export function createAnonClient() {
  return createClient<Database>(supabaseUrl, anonKey, {
    auth: { persistSession: false },
  });
}

/**
 * Create a service-role (admin) Supabase client that bypasses RLS.
 */
export function createAdminClient() {
  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/**
 * Sign in as an existing user and return the authenticated client.
 * The user must exist in auth.users (created via createTestUser).
 */
export async function signInAsUser(
  email: string,
  password: string,
): Promise<SupabaseClient<Database>> {
  const client = createClient<Database>(supabaseUrl, anonKey, {
    auth: { persistSession: true },
  });

  const { error } = await client.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw new Error(`signInAsUser failed for ${email}: ${error.message}`);
  }

  return client;
}

/** Create all three client types in one call. */
export function createTestClients() {
  return {
    anon: createAnonClient(),
    admin: createAdminClient(),
  };
}

// ── Fixture Helpers ──────────────────────────────────────────

/**
 * Create a test organization and return its id.
 */
export async function createTestOrg(admin: SupabaseClient) {
  const { data, error } = await admin
    .from("organizations")
    .insert({
      name: `Test Org ${Date.now()}`,
      slug: `test-org-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create org: ${error.message}`);
  return { orgId: data.id };
}

/**
 * Create a test user (via admin API) and return user id, email, password.
 */
export async function createTestUser(
  admin: SupabaseClient,
  overrides?: { email?: string; password?: string },
): Promise<{ id: string; email: string; password: string }> {
  const password = overrides?.password ?? "test-password-123";
  const email =
    overrides?.email ??
    `test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@test.mn`;

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (error) throw new Error(`Failed to create user: ${error.message}`);
  return { id: data.user.id, email, password };
}

/**
 * Add a user to an organization as a member.
 */
export async function addUserToOrg(
  admin: SupabaseClient,
  orgId: string,
  userId: string,
) {
  const { error } = await admin.from("organization_users").insert({
    organization_id: orgId,
    user_id: userId,
  });

  if (error) throw new Error(`Failed to add user to org: ${error.message}`);
}

/**
 * Create a test branch for an organization.
 */
export async function createTestBranch(
  admin: SupabaseClient,
  orgId: string,
) {
  const { data, error } = await admin
    .from("branches")
    .insert({
      organization_id: orgId,
      name: `Test Branch ${Date.now()}`,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create branch: ${error.message}`);
  return { branchId: data.id };
}

/**
 * Create a test customer for an organization.
 */
export async function createTestCustomer(
  admin: SupabaseClient,
  orgId: string,
) {
  const { data, error } = await admin
    .from("customers")
    .insert({
      organization_id: orgId,
      first_name: `Test-${Date.now()}`,
      phone: `+976-${Math.random().toString(36).slice(2, 8)}`,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create customer: ${error.message}`);
  return { customerId: data.id };
}

/**
 * Create a test vehicle for an organization.
 */
export async function createTestVehicle(
  admin: SupabaseClient,
  orgId: string,
  customerId: string,
) {
  const { data, error } = await admin
    .from("vehicles")
    .insert({
      organization_id: orgId,
      customer_id: customerId,
      plate_number: `${String(Math.floor(1000 + Math.random() * 9000))}${['УБХ', 'УБЯ', 'УБТ', 'УБЦ', 'УБС', 'ХАА', 'ХБУ', 'ХАС'][Math.floor(Math.random() * 8)]}`,
      make: "Toyota",
      model: "Camry",
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create vehicle: ${error.message}`);
  return { vehicleId: data.id };
}

/**
 * Create a test work order for an organization.
 */
export async function createTestWorkOrder(
  admin: SupabaseClient,
  orgId: string,
  customerId: string,
) {
  const { data, error } = await admin
    .from("work_orders")
    .insert({
      organization_id: orgId,
      customer_id: customerId,
      status: "New",
      description: `Test WO ${Date.now()}`,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create work order: ${error.message}`);
  return { workOrderId: data.id };
}

/**
 * Clean up a created record by id (admin/service-role client bypasses RLS).
 */
export async function deleteRecord(
  admin: SupabaseClient,
  table: string,
  id: string,
) {
  // Admin client bypasses RLS via service_role key
  const { error } = await admin.from(table).delete().eq("id", id);
  if (error) {
    console.warn(`deleteRecord ${table}/${id}: ${error.message}`);
  }
}
