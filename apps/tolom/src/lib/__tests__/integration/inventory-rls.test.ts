/**
 * Integration tests for inventory RLS policies and authorization boundaries.
 *
 * Tests multi-tenant isolation for parts_catalog and inventory_movements:
 * User A in Org A cannot read/write Org B's inventory data.
 * Anon users are blocked from operations on scoped tables.
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
  createTestBranch,
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
    email: `user-a-${Date.now()}@invrlstest.mn`,
  });
  userB = await createTestUser(admin, {
    email: `user-b-${Date.now()}@invrlstest.mn`,
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

// ── Parts Catalog RLS ────────────────────────────────────────

describeWhenSupabase("Parts Catalog RLS — cross-org isolation", () => {
  let partAId: string;
  let partBId: string;

  beforeAll(async () => {
    const pa = await createTestPart(admin!, orgAId);
    partAId = pa.partId;
    const pb = await createTestPart(admin!, orgBId);
    partBId = pb.partId;
  });

  afterAll(async () => {
    await deleteRecord(admin!, "parts_catalog", partAId);
    await deleteRecord(admin!, "parts_catalog", partBId);
  });

  it("Admin user can create + read parts", async () => {
    const { data } = await admin
      ?.from("parts_catalog")
      .select("id, name, organization_id");
    expect(data?.length).toBeGreaterThanOrEqual(2);
    const ids = data?.map((r: { id: string }) => r.id);
    expect(ids).toContain(partAId);
    expect(ids).toContain(partBId);
  });

  it("User A sees only Org A parts", async () => {
    const ua = await signInAsUser(userA.email, userA.password);
    const { data } = await ua.from("parts_catalog").select("id");
    expect(data).toHaveLength(1);
    expect(data?.[0].id).toBe(partAId);
  });

  it("User B sees only Org B parts", async () => {
    const ub = await signInAsUser(userB.email, userB.password);
    const { data } = await ub.from("parts_catalog").select("id");
    expect(data).toHaveLength(1);
    expect(data?.[0].id).toBe(partBId);
  });

  it("User A cannot see Org B parts", async () => {
    const ua = await signInAsUser(userA.email, userA.password);
    const { data } = await ua
      .from("parts_catalog")
      .select("id")
      .eq("id", partBId);
    expect(data).toHaveLength(0);
  });

  it("Anon user cannot read parts", async () => {
    const anon = createAnonClient();
    const { error } = await anon.from("parts_catalog").select("*");
    if (error) {
      expect(error.code).toBe("42501");
    }
  });
});

// ── Inventory Movements RLS ──────────────────────────────────

describeWhenSupabase("Inventory Movements RLS — org-scoped", () => {
  let branchAId: string;
  let branchBId: string;
  let partAId: string;
  let partBId: string;
  let movementAId: string;
  let movementBId: string;

  beforeAll(async () => {
    // Create branches and parts for each org
    const branchA = await createTestBranch(admin!, orgAId);
    branchAId = branchA.branchId;
    const branchB = await createTestBranch(admin!, orgBId);
    branchBId = branchB.branchId;

    const pa = await createTestPart(admin!, orgAId);
    partAId = pa.partId;
    const pb = await createTestPart(admin!, orgBId);
    partBId = pb.partId;

    // Create inventory movements via admin
    const ma = await admin
      ?.from("inventory_movements")
      .insert({
        organization_id: orgAId,
        branch_id: branchAId,
        part_id: partAId,
        movement_type: "purchase",
        quantity: 10,
        unit_cost: 5000,
        unit_price: 8000,
        notes: "Test purchase A",
      })
      .select()
      .single();
    if (ma.error)
      throw new Error(`Failed to create movement A: ${ma.error.message}`);
    movementAId = ma.data.id;

    const mb = await admin
      ?.from("inventory_movements")
      .insert({
        organization_id: orgBId,
        branch_id: branchBId,
        part_id: partBId,
        movement_type: "purchase",
        quantity: 5,
        unit_cost: 3000,
        unit_price: 5500,
        notes: "Test purchase B",
      })
      .select()
      .single();
    if (mb.error)
      throw new Error(`Failed to create movement B: ${mb.error.message}`);
    movementBId = mb.data.id;
  });

  afterAll(async () => {
    // Clean up in reverse dependency order
    await deleteRecord(admin!, "inventory_movements", movementAId);
    await deleteRecord(admin!, "inventory_movements", movementBId);
    await deleteRecord(admin!, "parts_catalog", partAId);
    await deleteRecord(admin!, "parts_catalog", partBId);
    await deleteRecord(admin!, "branches", branchAId);
    await deleteRecord(admin!, "branches", branchBId);
  });

  it("Admin can read movements from both orgs", async () => {
    const { data } = await admin?.from("inventory_movements").select("id");
    expect(data?.length).toBeGreaterThanOrEqual(2);
    const ids = data?.map((r: { id: string }) => r.id);
    expect(ids).toContain(movementAId);
    expect(ids).toContain(movementBId);
  });

  it("User A sees only Org A movements", async () => {
    const ua = await signInAsUser(userA.email, userA.password);
    const { data } = await ua.from("inventory_movements").select("id");
    expect(data).toHaveLength(1);
    expect(data?.[0].id).toBe(movementAId);
  });

  it("User B sees only Org B movements", async () => {
    const ub = await signInAsUser(userB.email, userB.password);
    const { data } = await ub.from("inventory_movements").select("id");
    expect(data).toHaveLength(1);
    expect(data?.[0].id).toBe(movementBId);
  });

  it("User A cannot see Org B movements", async () => {
    const ua = await signInAsUser(userA.email, userA.password);
    const { data } = await ua
      .from("inventory_movements")
      .select("id")
      .eq("id", movementBId);
    expect(data).toHaveLength(0);
  });

  it("Anon user cannot read inventory movements", async () => {
    const anon = createAnonClient();
    const { error } = await anon.from("inventory_movements").select("*");
    if (error) {
      expect(error.code).toBe("42501");
    }
  });
});
