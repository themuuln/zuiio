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

import crypto from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types";

// ── Environment ──────────────────────────────────────────────

const supabaseUrl = process.env.SUPABASE_URL ?? "http://127.0.0.1:54321";
const anonKey = process.env.SUPABASE_ANON_KEY ?? "";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

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
export async function createTestBranch(admin: SupabaseClient, orgId: string) {
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
export async function createTestCustomer(admin: SupabaseClient, orgId: string) {
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
      plate_number: `${String(Math.floor(1000 + Math.random() * 9000))}${["УБХ", "УБЯ", "УБТ", "УБЦ", "УБС", "ХАА", "ХБУ", "ХАС"][Math.floor(Math.random() * 8)]}`,
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
 * Create a test part (parts_catalog entry) for an organization.
 */
export async function createTestPart(admin: SupabaseClient, orgId: string) {
  const { data, error } = await admin
    .from("parts_catalog")
    .insert({
      organization_id: orgId,
      name: `Test Part ${Date.now()}`,
      part_number: `TP-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      unit: "piece",
      default_price: Math.floor(Math.random() * 100000) + 1000,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create part: ${error.message}`);
  return { partId: data.id };
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

/**
 * Create a test appointment for an organization.
 */
export async function createTestAppointment(
  admin: SupabaseClient,
  orgId: string,
  branchId: string,
  customerId: string,
  vehicleId: string,
) {
  const { data, error } = await admin
    .from("appointments")
    .insert({
      organization_id: orgId,
      branch_id: branchId,
      customer_id: customerId,
      vehicle_id: vehicleId,
      title: `Test Appointment ${Date.now()}`,
      scheduled_at: new Date(Date.now() + 86400000).toISOString(),
      status: "scheduled",
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create appointment: ${error.message}`);
  return { appointmentId: data.id };
}

/**
 * Create a test service schedule (service_reminders / vehicle_service_schedules) for an organization.
 */
export async function createTestServiceSchedule(
  admin: SupabaseClient,
  orgId: string,
  customerId: string,
  vehicleId: string,
) {
  const { data, error } = await admin
    .from("vehicle_service_schedules")
    .insert({
      organization_id: orgId,
      vehicle_id: vehicleId,
      service_name: `Test Service ${Date.now()}`,
      interval_months: 6,
      next_due_date: new Date(Date.now() + 180 * 86400000).toISOString().split("T")[0],
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create service schedule: ${error.message}`);
  return { serviceScheduleId: data.id };
}

/**
 * Create a test expense for an organization.
 */
export async function createTestExpense(admin: SupabaseClient, orgId: string) {
  const { data, error } = await admin
    .from("expenses")
    .insert({
      organization_id: orgId,
      description: `Test Expense ${Date.now()}`,
      amount: Math.floor(Math.random() * 500000) + 10000,
      expense_date: new Date().toISOString().split("T")[0],
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create expense: ${error.message}`);
  return { expenseId: data.id };
}

/**
 * Create a test invoice for an organization.
 */
export async function createTestInvoice(
  admin: SupabaseClient,
  orgId: string,
  customerId: string,
) {
  const { data, error } = await admin
    .from("invoices")
    .insert({
      organization_id: orgId,
      customer_id: customerId,
      invoice_number: `INV-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      total: Math.floor(Math.random() * 500000) + 10000,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create invoice: ${error.message}`);
  return { invoiceId: data.id };
}

/**
 * Create a test price rule for an organization.
 */
export async function createTestPriceRule(admin: SupabaseClient, orgId: string) {
  const { data, error } = await admin
    .from("price_rules")
    .insert({
      organization_id: orgId,
      name: `Test Price Rule ${Date.now()}`,
      apply_to: "parts",
      operator: "fixed",
      value: Math.floor(Math.random() * 50000) + 5000,
      priority: 1,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create price rule: ${error.message}`);
  return { priceRuleId: data.id };
}

/**
 * Create a test inventory balance for an organization.
 */
export async function createTestInventoryBalance(
  admin: SupabaseClient,
  orgId: string,
  partId: string,
) {
  const { data, error } = await admin
    .from("inventory_balances")
    .insert({
      organization_id: orgId,
      part_id: partId,
      quantity_on_hand: Math.floor(Math.random() * 100) + 1,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create inventory balance: ${error.message}`);
  return { inventoryBalanceId: data.id };
}

/**
 * Create a test store credit balance for an organization.
 */
export async function createTestStoreCredit(
  admin: SupabaseClient,
  orgId: string,
  customerId: string,
) {
  const { data, error } = await admin
    .from("store_credit_balances")
    .insert({
      organization_id: orgId,
      customer_id: customerId,
      balance: Math.floor(Math.random() * 200000) + 10000,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create store credit: ${error.message}`);
  return { storeCreditId: data.id };
}

/**
 * Create a test payroll record for an organization.
 */
export async function createTestPayrollRecord(
  admin: SupabaseClient,
  orgId: string,
  userId: string,
) {
  const { data, error } = await admin
    .from("payroll_records")
    .insert({
      organization_id: orgId,
      mechanic_id: userId,
      period_start: new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0],
      period_end: new Date().toISOString().split("T")[0],
      total_hours: 160,
      hourly_rate: 15000,
      gross_pay: 2400000,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create payroll record: ${error.message}`);
  return { payrollRecordId: data.id };
}

/**
 * Create a test customer followup for an organization.
 */
export async function createTestFollowup(
  admin: SupabaseClient,
  orgId: string,
  customerId: string,
) {
  const { data, error } = await admin
    .from("customer_followups")
    .insert({
      organization_id: orgId,
      customer_id: customerId,
      type: "call",
      subject: `Test followup ${Date.now()}`,
      due_at: new Date(Date.now() + 86400000).toISOString(),
      status: "pending",
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create followup: ${error.message}`);
  return { followupId: data.id };
}

/**
 * Create a test customer note for an organization.
 * Note: created_by is NOT NULL in the schema, so a userId is required.
 */
export async function createTestCustomerNote(
  admin: SupabaseClient,
  orgId: string,
  customerId: string,
  userId: string,
) {
  const { data, error } = await admin
    .from("customer_notes")
    .insert({
      organization_id: orgId,
      customer_id: customerId,
      content: `Test note ${Date.now()}`,
      type: "general",
      created_by: userId,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create customer note: ${error.message}`);
  return { customerNoteId: data.id };
}

/**
 * Create a test stock transfer for an organization.
 * Creates a branch for the to_branch_id reference.
 * Requires createdBy because created_by is NOT NULL in the schema.
 */
export async function createTestStockTransfer(
  admin: SupabaseClient,
  orgId: string,
  toBranchId: string,
  createdBy: string,
) {
  const { data, error } = await admin
    .from("stock_transfers")
    .insert({
      organization_id: orgId,
      to_branch_id: toBranchId,
      created_by: createdBy,
      notes: `Test transfer ${Date.now()}`,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create stock transfer: ${error.message}`);
  return { transferId: data.id };
}

/**
 * Create a test catalog variant group for an organization.
 */
export async function createTestCatalogVariantGroup(
  admin: SupabaseClient,
  orgId: string,
) {
  const { data, error } = await admin
    .from("catalog_variant_groups")
    .insert({
      organization_id: orgId,
      name: `Test Group ${Date.now()}`,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create variant group: ${error.message}`);
  return { variantGroupId: data.id };
}

/**
 * Create a test catalog variant option for an organization.
 */
export async function createTestCatalogVariantOption(
  admin: SupabaseClient,
  orgId: string,
  groupId: string,
) {
  const { data, error } = await admin
    .from("catalog_variant_options")
    .insert({
      organization_id: orgId,
      group_id: groupId,
      label: `Test Option ${Date.now()}`,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create variant option: ${error.message}`);
  return { variantOptionId: data.id };
}

/**
 * Create a test catalog item variant for an organization.
 */
export async function createTestCatalogItemVariant(
  admin: SupabaseClient,
  orgId: string,
) {
  const { data, error } = await admin
    .from("catalog_item_variants")
    .insert({
      organization_id: orgId,
      entity_type: "part",
      entity_id: crypto.randomUUID(),
      variant_label: `Test Variant ${Date.now()}`,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create item variant: ${error.message}`);
  return { itemVariantId: data.id };
}
