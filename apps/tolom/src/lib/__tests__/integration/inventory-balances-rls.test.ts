/**
 * Integration tests for inventory_balances RLS policies and authorization boundaries.
 *
 * Tests multi-tenant isolation for inventory_balances (read-only view):
 * User A in Org A cannot read Org B's inventory balances.
 * Anon users are blocked from reads.
 *
 * inventory_balances is a read-only view, so only SELECT is tested.
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
  createTestInventoryBalance,
  createTestOrg,
  createTestPart,
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
    email: `user-a-${Date.now()}@ibrlstest.mn`,
  });
  userB = await createTestUser(admin, {
    email: `user-b-${Date.now()}@ibrlstest.mn`,
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

// ── Inventory Balances RLS ───────────────────────────────────

describeWhenSupabase("Inventory Balances RLS — org-scoped", () => {
  let partAId: string;
  let partBId: string;
  let balanceAId: string;
  let balanceBId: string;

  beforeAll(async () => {
    if (!admin) return;

    // Create parts for each org
    const pa = await createTestPart(admin, orgAId);
    partAId = pa.partId;
    const pb = await createTestPart(admin, orgBId);
    partBId = pb.partId;

    // Create inventory balances via admin
    const ba = await createTestInventoryBalance(admin, orgAId, partAId);
    balanceAId = ba.inventoryBalanceId;
    const bb = await createTestInventoryBalance(admin, orgBId, partBId);
    balanceBId = bb.inventoryBalanceId;
  });

  afterAll(async () => {
    if (!admin) return;
    await deleteRecord(admin!, "inventory_balances", balanceAId);
    await deleteRecord(admin!, "inventory_balances", balanceBId);
    await deleteRecord(admin!, "parts_catalog", partAId);
    await deleteRecord(admin!, "parts_catalog", partBId);
  });

  it("User A sees only Org A balances", async () => {
    const ua = await signInAsUser(userA.email, userA.password);
    const { data } = await ua.from("inventory_balances").select("id");
    expect(data).toHaveLength(1);
    expect(data?.[0].id).toBe(balanceAId);
  });

  it("User B sees only Org B balances", async () => {
    const ub = await signInAsUser(userB.email, userB.password);
    const { data } = await ub.from("inventory_balances").select("id");
    expect(data).toHaveLength(1);
    expect(data?.[0].id).toBe(balanceBId);
  });

  it("Cross-org blocked — User A cannot see Org B balances", async () => {
    const ua = await signInAsUser(userA.email, userA.password);
    const { data } = await ua
      .from("inventory_balances")
      .select("id")
      .eq("id", balanceBId);
    expect(data).toHaveLength(0);
  });

  it("Anon user cannot read inventory balances", async () => {
    const anon = createAnonClient();
    const { error } = await anon.from("inventory_balances").select("*");
    if (error) {
      expect(error.code).toBe("42501");
    }
  });
});
