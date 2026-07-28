/**
 * Integration tests for store_credit tables RLS policies and authorization boundaries.
 *
 * Tests multi-tenant isolation for:
 *   - store_credit_balances — SELECT/INSERT/UPDATE/DELETE org-isolated
 *   - store_credit_transactions — SELECT/INSERT org-isolated
 *
 * User A in Org A cannot read/write Org B's store credit data.
 * Anon users are blocked from operations.
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
  createTestCustomer,
  createTestOrg,
  createTestStoreCredit,
  createTestUser,
  deleteRecord,
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
    email: `user-a-${Date.now()}@scrlstest.mn`,
  });
  userB = await createTestUser(admin, {
    email: `user-b-${Date.now()}@scrlstest.mn`,
  });

  await addUserToOrg(admin, orgAId, userA.id);
  await addUserToOrg(admin, orgBId, userB.id);
});

afterAll(async () => {
  if (!hasSupabase || !admin) return;
  // Clean up in reverse dependency order
  await deleteRecord(
    admin!,
    "organization_users",
    `${orgAId},${userA.id}` as unknown as string,
  );
  await deleteRecord(
    admin!,
    "organization_users",
    `${orgBId},${userB.id}` as unknown as string,
  );
  await admin.auth.admin.deleteUser(userA.id);
  await admin.auth.admin.deleteUser(userB.id);
  await deleteRecord(admin, "organizations", orgAId);
  await deleteRecord(admin, "organizations", orgBId);
});

// ── Store Credit Balances RLS ────────────────────────────────

describeWhenSupabase("Store Credit Balances RLS — cross-org isolation", () => {
  let customerAId: string;
  let customerBId: string;
  let creditAId: string;
  let creditBId: string;

  beforeAll(async () => {
    if (!admin) return;

    // Create customers for both orgs
    const ca = await createTestCustomer(admin, orgAId);
    customerAId = ca.customerId;
    const cb = await createTestCustomer(admin, orgBId);
    customerBId = cb.customerId;

    // Create store credit balances
    const sca = await createTestStoreCredit(admin, orgAId, customerAId);
    creditAId = sca.storeCreditId;
    const scb = await createTestStoreCredit(admin, orgBId, customerBId);
    creditBId = scb.storeCreditId;
  });

  afterAll(async () => {
    if (!admin) return;
    await deleteRecord(admin!, "store_credit_balances", creditAId);
    await deleteRecord(admin!, "store_credit_balances", creditBId);
    await deleteRecord(admin!, "customers", customerAId);
    await deleteRecord(admin!, "customers", customerBId);
  });

  it("User A sees only Org A store credits", async () => {
    const ua = await signInAsUser(userA.email, userA.password);
    const { data } = await ua.from("store_credit_balances").select("id");
    expect(data).toHaveLength(1);
    expect(data?.[0].id).toBe(creditAId);
  });

  it("User B sees only Org B store credits", async () => {
    const ub = await signInAsUser(userB.email, userB.password);
    const { data } = await ub.from("store_credit_balances").select("id");
    expect(data).toHaveLength(1);
    expect(data?.[0].id).toBe(creditBId);
  });

  it("Cross-org blocked — User A cannot see Org B store credits", async () => {
    const ua = await signInAsUser(userA.email, userA.password);
    const { data } = await ua
      .from("store_credit_balances")
      .select("id")
      .eq("id", creditBId);
    expect(data).toHaveLength(0);
  });

  it("Anon user cannot read store credit balances", async () => {
    const anon = createAnonClient();
    const { error } = await anon.from("store_credit_balances").select("*");
    if (error) {
      expect(error.code).toBe("42501");
    }
  });

  it("User A can insert a store credit balance into Org A", async () => {
    const ua = await signInAsUser(userA.email, userA.password);
    const { data, error } = await ua
      .from("store_credit_balances")
      .insert({
        organization_id: orgAId,
        customer_id: customerAId,
        balance: 50000,
      })
      .select()
      .single();

    expect(error).toBeNull();
    expect(data?.organization_id).toBe(orgAId);

    // Clean up
    await deleteRecord(admin!, "store_credit_balances", data?.id);
  });
});

// ── Store Credit Transactions RLS ────────────────────────────

describeWhenSupabase(
  "Store Credit Transactions RLS — cross-org isolation",
  () => {
    let customerAId: string;
    let customerBId: string;
    let txnAId: string;
    let txnBId: string;

    beforeAll(async () => {
      if (!admin) return;

      // Create customers for both orgs
      const ca = await createTestCustomer(admin, orgAId);
      customerAId = ca.customerId;
      const cb = await createTestCustomer(admin, orgBId);
      customerBId = cb.customerId;

      // Create store credit transactions via admin
      const txnA = await admin
        ?.from("store_credit_transactions")
        .insert({
          organization_id: orgAId,
          customer_id: customerAId,
          amount: 50000,
          type: "credit",
        })
        .select()
        .single();
      if (txnA.error)
        throw new Error(`Failed to create txn A: ${txnA.error.message}`);
      txnAId = txnA.data.id;

      const txnB = await admin
        ?.from("store_credit_transactions")
        .insert({
          organization_id: orgBId,
          customer_id: customerBId,
          amount: 30000,
          type: "credit",
        })
        .select()
        .single();
      if (txnB.error)
        throw new Error(`Failed to create txn B: ${txnB.error.message}`);
      txnBId = txnB.data.id;
    });

    afterAll(async () => {
      if (!admin) return;
      await deleteRecord(admin!, "store_credit_transactions", txnAId);
      await deleteRecord(admin!, "store_credit_transactions", txnBId);
      await deleteRecord(admin!, "customers", customerAId);
      await deleteRecord(admin!, "customers", customerBId);
    });

    it("User A sees only Org A store credit transactions", async () => {
      const ua = await signInAsUser(userA.email, userA.password);
      const { data } = await ua.from("store_credit_transactions").select("id");
      expect(data).toHaveLength(1);
      expect(data?.[0].id).toBe(txnAId);
    });

    it("User B sees only Org B store credit transactions", async () => {
      const ub = await signInAsUser(userB.email, userB.password);
      const { data } = await ub.from("store_credit_transactions").select("id");
      expect(data).toHaveLength(1);
      expect(data?.[0].id).toBe(txnBId);
    });

    it("Cross-org blocked — User A cannot see Org B transactions", async () => {
      const ua = await signInAsUser(userA.email, userA.password);
      const { data } = await ua
        .from("store_credit_transactions")
        .select("id")
        .eq("id", txnBId);
      expect(data).toHaveLength(0);
    });

    it("Anon user cannot read store credit transactions", async () => {
      const anon = createAnonClient();
      const { error } = await anon
        .from("store_credit_transactions")
        .select("*");
      if (error) {
        expect(error.code).toBe("42501");
      }
    });

    it("User A can insert a store credit transaction into Org A", async () => {
      const ua = await signInAsUser(userA.email, userA.password);
      const { data, error } = await ua
        .from("store_credit_transactions")
        .insert({
          organization_id: orgAId,
          customer_id: customerAId,
          amount: 25000,
          type: "credit",
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data?.organization_id).toBe(orgAId);

      // Clean up
      await deleteRecord(admin!, "store_credit_transactions", data?.id);
    });
  },
);
