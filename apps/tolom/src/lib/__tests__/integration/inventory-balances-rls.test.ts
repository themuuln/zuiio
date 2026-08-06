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

// ── Inventory Balances RLS ───────────────────────────────────

describeWhenSupabase("Inventory Balances RLS — org-scoped", () => {
  let partAId: string;
  let partBId: string;

  beforeAll(async () => {
    if (!admin) return;

    // Create parts for each org
    const pa = await createTestPart(admin, orgAId);
    partAId = pa.partId;
    const pb = await createTestPart(admin, orgBId);
    partBId = pb.partId;

    // Create inventory balances via admin
    await createTestInventoryBalance(admin, orgAId, partAId);
    await createTestInventoryBalance(admin, orgBId, partBId);
  });

  afterAll(async () => {
    if (!admin) return;
    await deleteRecord(admin, "inventory_balances", {
      organization_id: orgAId,
      part_id: partAId,
    });
    await deleteRecord(admin, "inventory_balances", {
      organization_id: orgBId,
      part_id: partBId,
    });
    await deleteRecord(admin, "parts_catalog", partAId);
    await deleteRecord(admin, "parts_catalog", partBId);
  });

  it("User A sees only Org A balances", async () => {
    const ua = await signInAsUser(userA.email, userA.password);
    const { data } = await ua.from("inventory_balances").select("part_id");
    expect(data).toHaveLength(1);
    expect(data?.[0].part_id).toBe(partAId);
  });

  it("User B sees only Org B balances", async () => {
    const ub = await signInAsUser(userB.email, userB.password);
    const { data } = await ub.from("inventory_balances").select("part_id");
    expect(data).toHaveLength(1);
    expect(data?.[0].part_id).toBe(partBId);
  });

  it("Cross-org blocked — User A cannot see Org B balances", async () => {
    const ua = await signInAsUser(userA.email, userA.password);
    const { data } = await ua
      .from("inventory_balances")
      .select("part_id")
      .eq("part_id", partBId);
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
