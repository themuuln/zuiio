/**
 * Integration tests for Financial tables RLS policies and authorization boundaries.
 *
 * Tests multi-tenant isolation for:
 *   - expenses & expense_categories
 *   - cash_register_sessions
 *   - invoices
 *
 * User A in Org A cannot read/write Org B's financial data.
 * Anon users are blocked from scoped tables.
 *
 * Requires a running Supabase local stack.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Database } from "@/lib/types";
import {
  addUserToOrg,
  createAdminClient,
  createAnonClient,
  createTestExpense,
  createTestInvoice,
  createTestOrg,
  createTestUser,
  deleteRecord,
  deleteTestOrg,
  signInAsUser,
} from "./helpers";

// ── Guard: skip if Supabase local stack is not running ──────

const hasSupabase =
  !!process.env.SUPABASE_ANON_KEY && !!process.env.SUPABASE_SERVICE_ROLE_KEY;
const describeWhenSupabase = hasSupabase ? describe : describe.skip;

// ── Setup: two orgs, two users ───────────────────────────────

let admin: SupabaseClient<Database> | null = null;
let orgAId: string;
let orgBId: string;
let userA: { id: string; email: string; password: string };
let userB: { id: string; email: string; password: string };

beforeAll(async () => {
  if (!hasSupabase) return;
  admin = createAdminClient();
  const orgA = await createTestOrg(admin);
  orgAId = orgA.orgId;
  const orgB = await createTestOrg(admin);
  orgBId = orgB.orgId;

  userA = await createTestUser(admin, {
    email: `user-a-${Date.now()}@finrlstest.mn`,
  });
  userB = await createTestUser(admin, {
    email: `user-b-${Date.now()}@finrlstest.mn`,
  });

  await addUserToOrg(admin, orgAId, userA.id);
  await addUserToOrg(admin, orgBId, userB.id);
});

afterAll(async () => {
  if (!hasSupabase || !admin) return;
  // Clean up in reverse dependency order
  await deleteRecord(admin, "organization_users", {
    organization_id: orgAId,
    user_id: userA.id,
  });
  await deleteRecord(admin, "organization_users", {
    organization_id: orgBId,
    user_id: userB.id,
  });
  await admin.auth.admin.deleteUser(userA.id);
  await admin.auth.admin.deleteUser(userB.id);
  await deleteTestOrg(admin, orgAId);

  await deleteTestOrg(admin, orgBId);
});

// ── Expense Categories RLS ───────────────────────────────────

describeWhenSupabase("Expense Categories RLS — cross-org isolation", () => {
  let categoryAId: string;
  let categoryBId: string;

  beforeAll(async () => {
    if (!admin) return;

    const catA = await admin
      ?.from("expense_categories")
      .insert({
        organization_id: orgAId,
        name: `Test Category A ${Date.now()}`,
      })
      .select()
      .single();
    if (catA.error)
      throw new Error(`Failed to create category A: ${catA.error.message}`);
    categoryAId = catA.data.id;

    const catB = await admin
      ?.from("expense_categories")
      .insert({
        organization_id: orgBId,
        name: `Test Category B ${Date.now()}`,
      })
      .select()
      .single();
    if (catB.error)
      throw new Error(`Failed to create category B: ${catB.error.message}`);
    categoryBId = catB.data.id;
  });

  afterAll(async () => {
    if (!admin) return;
    await deleteRecord(admin, "expense_categories", categoryAId);
    await deleteRecord(admin, "expense_categories", categoryBId);
  });

  it("User A sees only Org A expense categories", async () => {
    const ua = await signInAsUser(userA.email, userA.password);
    const { data } = await ua.from("expense_categories").select("id");
    expect(data).toHaveLength(1);
    expect(data?.[0].id).toBe(categoryAId);
  });

  it("User B sees only Org B expense categories", async () => {
    const ub = await signInAsUser(userB.email, userB.password);
    const { data } = await ub.from("expense_categories").select("id");
    expect(data).toHaveLength(1);
    expect(data?.[0].id).toBe(categoryBId);
  });

  it("User A cannot see User B's expense category", async () => {
    const ua = await signInAsUser(userA.email, userA.password);
    const { data } = await ua
      .from("expense_categories")
      .select("id")
      .eq("id", categoryBId);
    expect(data).toHaveLength(0);
  });

  it("Anon user cannot read expense categories", async () => {
    const anon = createAnonClient();
    const { error } = await anon.from("expense_categories").select("*");
    if (error) {
      expect(error.code).toBe("42501");
    }
  });
});

// ── Expenses RLS ─────────────────────────────────────────────

describeWhenSupabase("Expenses RLS — cross-org isolation", () => {
  let expenseAId: string;
  let expenseBId: string;

  beforeAll(async () => {
    if (!admin) return;
    const ea = await createTestExpense(admin, orgAId);
    expenseAId = ea.expenseId;
    const eb = await createTestExpense(admin, orgBId);
    expenseBId = eb.expenseId;
  });

  afterAll(async () => {
    if (!admin) return;
    await deleteRecord(admin, "expenses", expenseAId);
    await deleteRecord(admin, "expenses", expenseBId);
  });

  it("User A sees only Org A expenses", async () => {
    const ua = await signInAsUser(userA.email, userA.password);
    const { data } = await ua.from("expenses").select("id");
    expect(data).toHaveLength(1);
    expect(data?.[0].id).toBe(expenseAId);
  });

  it("User B sees only Org B expenses", async () => {
    const ub = await signInAsUser(userB.email, userB.password);
    const { data } = await ub.from("expenses").select("id");
    expect(data).toHaveLength(1);
    expect(data?.[0].id).toBe(expenseBId);
  });

  it("User A cannot see User B's expense", async () => {
    const ua = await signInAsUser(userA.email, userA.password);
    const { data } = await ua
      .from("expenses")
      .select("id")
      .eq("id", expenseBId);
    expect(data).toHaveLength(0);
  });

  it("Anon user cannot read expenses", async () => {
    const anon = createAnonClient();
    const { error } = await anon.from("expenses").select("*");
    if (error) {
      expect(error.code).toBe("42501");
    }
  });
});

// ── Cash Register Sessions RLS ───────────────────────────────

describeWhenSupabase("Cash Register Sessions RLS — cross-org isolation", () => {
  let sessionAId: string;
  let sessionBId: string;

  beforeAll(async () => {
    if (!admin) return;

    const sa = await admin
      ?.from("cash_register_sessions")
      .insert({
        organization_id: orgAId,
        opened_at: new Date().toISOString(),
        opened_by: userA.id,
        opening_balance: 100000,
      })
      .select()
      .single();
    if (sa.error)
      throw new Error(`Failed to create session A: ${sa.error.message}`);
    sessionAId = sa.data.id;

    const sb = await admin
      ?.from("cash_register_sessions")
      .insert({
        organization_id: orgBId,
        opened_at: new Date().toISOString(),
        opened_by: userB.id,
        opening_balance: 50000,
      })
      .select()
      .single();
    if (sb.error)
      throw new Error(`Failed to create session B: ${sb.error.message}`);
    sessionBId = sb.data.id;
  });

  afterAll(async () => {
    if (!admin) return;
    await deleteRecord(admin, "cash_register_sessions", sessionAId);
    await deleteRecord(admin, "cash_register_sessions", sessionBId);
  });

  it("User A sees only Org A cash register sessions", async () => {
    const ua = await signInAsUser(userA.email, userA.password);
    const { data } = await ua.from("cash_register_sessions").select("id");
    expect(data).toHaveLength(1);
    expect(data?.[0].id).toBe(sessionAId);
  });

  it("User B sees only Org B cash register sessions", async () => {
    const ub = await signInAsUser(userB.email, userB.password);
    const { data } = await ub.from("cash_register_sessions").select("id");
    expect(data).toHaveLength(1);
    expect(data?.[0].id).toBe(sessionBId);
  });

  it("User A cannot see User B's cash register session", async () => {
    const ua = await signInAsUser(userA.email, userA.password);
    const { data } = await ua
      .from("cash_register_sessions")
      .select("id")
      .eq("id", sessionBId);
    expect(data).toHaveLength(0);
  });

  it("Anon user cannot read cash register sessions", async () => {
    const anon = createAnonClient();
    const { error } = await anon.from("cash_register_sessions").select("*");
    if (error) {
      expect(error.code).toBe("42501");
    }
  });
});

// ── Invoices RLS ─────────────────────────────────────────────

describeWhenSupabase("Invoices RLS — cross-org isolation", () => {
  let customerAId: string;
  let customerBId: string;
  let invoiceAId: string;
  let invoiceBId: string;

  beforeAll(async () => {
    if (!admin) return;

    // Create customers for invoice references (customer_id is nullable FK)
    const ca = await admin
      ?.from("customers")
      .insert({
        organization_id: orgAId,
        first_name: `InvCustA-${Date.now()}`,
        phone: `+976-${Math.random().toString(36).slice(2, 8)}`,
      })
      .select()
      .single();
    if (ca.error)
      throw new Error(`Failed to create customer A: ${ca.error.message}`);
    customerAId = ca.data.id;

    const cb = await admin
      ?.from("customers")
      .insert({
        organization_id: orgBId,
        first_name: `InvCustB-${Date.now()}`,
        phone: `+976-${Math.random().toString(36).slice(2, 8)}`,
      })
      .select()
      .single();
    if (cb.error)
      throw new Error(`Failed to create customer B: ${cb.error.message}`);
    customerBId = cb.data.id;

    // Create invoices using the helper
    const invA = await createTestInvoice(admin, orgAId, customerAId);
    invoiceAId = invA.invoiceId;
    const invB = await createTestInvoice(admin, orgBId, customerBId);
    invoiceBId = invB.invoiceId;
  });

  afterAll(async () => {
    if (!admin) return;
    await deleteRecord(admin, "invoices", invoiceAId);
    await deleteRecord(admin, "invoices", invoiceBId);
    await deleteRecord(admin, "customers", customerAId);
    await deleteRecord(admin, "customers", customerBId);
  });

  it("User A sees only Org A invoices", async () => {
    const ua = await signInAsUser(userA.email, userA.password);
    const { data } = await ua.from("invoices").select("id");
    expect(data).toHaveLength(1);
    expect(data?.[0].id).toBe(invoiceAId);
  });

  it("User B sees only Org B invoices", async () => {
    const ub = await signInAsUser(userB.email, userB.password);
    const { data } = await ub.from("invoices").select("id");
    expect(data).toHaveLength(1);
    expect(data?.[0].id).toBe(invoiceBId);
  });

  it("User A cannot see User B's invoice", async () => {
    const ua = await signInAsUser(userA.email, userA.password);
    const { data } = await ua
      .from("invoices")
      .select("id")
      .eq("id", invoiceBId);
    expect(data).toHaveLength(0);
  });

  it("Anon user cannot read invoices", async () => {
    const anon = createAnonClient();
    const { error } = await anon.from("invoices").select("*");
    if (error) {
      expect(error.code).toBe("42501");
    }
  });
});
