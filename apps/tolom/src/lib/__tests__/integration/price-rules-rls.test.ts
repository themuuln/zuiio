/**
 * Integration tests for price_rules RLS policies and authorization boundaries.
 *
 * Tests multi-tenant isolation for the price_rules table:
 * User A in Org A cannot read/write Org B's price rules.
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
  createTestOrg,
  createTestPriceRule,
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
    email: `user-a-${Date.now()}@prrlstest.mn`,
  });
  userB = await createTestUser(admin, {
    email: `user-b-${Date.now()}@prrlstest.mn`,
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

// ── Price Rules RLS ──────────────────────────────────────────

describeWhenSupabase("Price Rules RLS — cross-org isolation", () => {
  let ruleAId: string;
  let ruleBId: string;

  beforeAll(async () => {
    if (!admin) return;
    const ra = await createTestPriceRule(admin, orgAId);
    ruleAId = ra.priceRuleId;
    const rb = await createTestPriceRule(admin, orgBId);
    ruleBId = rb.priceRuleId;
  });

  afterAll(async () => {
    if (!admin) return;
    await deleteRecord(admin, "price_rules", ruleAId);
    await deleteRecord(admin, "price_rules", ruleBId);
  });

  it("User A sees only Org A price rules", async () => {
    const ua = await signInAsUser(userA.email, userA.password);
    const { data } = await ua.from("price_rules").select("id");
    expect(data).toHaveLength(1);
    expect(data?.[0].id).toBe(ruleAId);
  });

  it("User B sees only Org B price rules", async () => {
    const ub = await signInAsUser(userB.email, userB.password);
    const { data } = await ub.from("price_rules").select("id");
    expect(data).toHaveLength(1);
    expect(data?.[0].id).toBe(ruleBId);
  });

  it("User A cannot see Org B price rules", async () => {
    const ua = await signInAsUser(userA.email, userA.password);
    const { data } = await ua
      .from("price_rules")
      .select("id")
      .eq("id", ruleBId);
    expect(data).toHaveLength(0);
  });

  it("User A can insert a price rule into Org A", async () => {
    const ua = await signInAsUser(userA.email, userA.password);
    const { data, error } = await ua
      .from("price_rules")
      .insert({
        organization_id: orgAId,
        name: `Inserted Rule ${Date.now()}`,
        apply_to: "part",
        operator: "add_fixed",
        value: 10000,
        priority: 1,
        created_by: userA.id,
      })
      .select()
      .single();

    expect(error).toBeNull();
    expect(data?.organization_id).toBe(orgAId);

    // Clean up the inserted rule
    await deleteRecord(admin, "price_rules", data?.id);
  });

  it("User A cannot insert a price rule into Org B", async () => {
    const ua = await signInAsUser(userA.email, userA.password);
    const { error } = await ua.from("price_rules").insert({
      organization_id: orgBId,
      name: `Should Fail ${Date.now()}`,
      apply_to: "parts",
      operator: "fixed",
      value: 5000,
      priority: 1,
    });

    expect(error).not.toBeNull();
    // 42501 = insufficient_privilege (RLS policy violation)
    expect(error?.code).toBe("42501");
  });

  it("Anon user cannot read price rules", async () => {
    const anon = createAnonClient();
    const { error } = await anon.from("price_rules").select("*");
    if (error) {
      expect(error.code).toBe("42501");
    }
  });
});
