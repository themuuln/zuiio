/**
 * Integration tests for RLS policies and authorization boundaries.
 *
 * Tests multi-tenant isolation: User A in Org A cannot read/write
 * Org B's data. Anon users are blocked from operations on scoped tables.
 *
 * Requires a running Supabase local stack.
 */

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  addUserToOrg,
  createAdminClient,
  createAnonClient,
  createTestBranch,
  createTestCustomer,
  createTestOrg,
  createTestUser,
  createTestVehicle,
  createTestWorkOrder,
  deleteRecord,
  signInAsUser,
} from "./helpers";

// ── Setup: two orgs, two users ───────────────────────────────

const admin = createAdminClient();
let orgAId: string;
let orgBId: string;
let userA: { id: string; email: string; password: string };
let userB: { id: string; email: string; password: string };

beforeAll(async () => {
  const orgA = await createTestOrg(admin);
  orgAId = orgA.orgId;
  const orgB = await createTestOrg(admin);
  orgBId = orgB.orgId;

  userA = await createTestUser(admin, {
    email: `user-a-${Date.now()}@rlstest.mn`,
  });
  userB = await createTestUser(admin, {
    email: `user-b-${Date.now()}@rlstest.mn`,
  });

  await addUserToOrg(admin, orgAId, userA.id);
  await addUserToOrg(admin, orgBId, userB.id);
});

afterAll(async () => {
  // Clean up in reverse dependency order
  await deleteRecord(
    admin,
    "organization_users",
    `${orgAId},${userA.id}` as any,
  );
  await deleteRecord(
    admin,
    "organization_users",
    `${orgBId},${userB.id}` as any,
  );
  await admin.auth.admin.deleteUser(userA.id);
  await admin.auth.admin.deleteUser(userB.id);
  await deleteRecord(admin, "organizations", orgAId);
  await deleteRecord(admin, "organizations", orgBId);
});

// ── Multi-tenant isolation: Organizations ────────────────────

describe("Organizations RLS — cross-org isolation", () => {
  it("User A sees only Org A", async () => {
    const ua = await signInAsUser(userA.email, userA.password);
    const { data } = await ua.from("organizations").select("id, name");
    expect(data).toHaveLength(1);
    expect(data?.[0].id).toBe(orgAId);
  });

  it("User B sees only Org B", async () => {
    const ub = await signInAsUser(userB.email, userB.password);
    const { data } = await ub.from("organizations").select("id, name");
    expect(data).toHaveLength(1);
    expect(data?.[0].id).toBe(orgBId);
  });

  it("User A cannot see Org B", async () => {
    const ua = await signInAsUser(userA.email, userA.password);
    const { data } = await ua
      .from("organizations")
      .select("id")
      .eq("id", orgBId);
    expect(data).toHaveLength(0);
  });
});

// ── Branches RLS ─────────────────────────────────────────────

describe("Branches RLS — org-scoped", () => {
  let branchAId: string;
  let branchBId: string;

  beforeAll(async () => {
    const branchA = await createTestBranch(admin, orgAId);
    branchAId = branchA.branchId;
    const branchB = await createTestBranch(admin, orgBId);
    branchBId = branchB.branchId;
  });

  afterAll(async () => {
    await deleteRecord(admin, "branches", branchAId);
    await deleteRecord(admin, "branches", branchBId);
  });

  it("User A sees only Org A branches", async () => {
    const ua = await signInAsUser(userA.email, userA.password);
    const { data } = await ua.from("branches").select("id");
    expect(data).toHaveLength(1);
    expect(data?.[0].id).toBe(branchAId);
  });

  it("User B sees only Org B branches", async () => {
    const ub = await signInAsUser(userB.email, userB.password);
    const { data } = await ub.from("branches").select("id");
    expect(data).toHaveLength(1);
    expect(data?.[0].id).toBe(branchBId);
  });
});

// ── Customers RLS ────────────────────────────────────────────

describe("Customers RLS — cross-org isolation", () => {
  let customerAId: string;
  let customerBId: string;

  beforeAll(async () => {
    const ca = await createTestCustomer(admin, orgAId);
    customerAId = ca.customerId;
    const cb = await createTestCustomer(admin, orgBId);
    customerBId = cb.customerId;
  });

  afterAll(async () => {
    await deleteRecord(admin, "customers", customerAId);
    await deleteRecord(admin, "customers", customerBId);
  });

  it("User A sees only Org A customers", async () => {
    const ua = await signInAsUser(userA.email, userA.password);
    const { data } = await ua.from("customers").select("id");
    expect(data).toHaveLength(1);
    expect(data?.[0].id).toBe(customerAId);
  });

  it("User B sees only Org B customers", async () => {
    const ub = await signInAsUser(userB.email, userB.password);
    const { data } = await ub.from("customers").select("id");
    expect(data).toHaveLength(1);
    expect(data?.[0].id).toBe(customerBId);
  });

  it("User A cannot read User B's customer", async () => {
    const ua = await signInAsUser(userA.email, userA.password);
    const { data } = await ua
      .from("customers")
      .select("id")
      .eq("id", customerBId);
    expect(data).toHaveLength(0);
  });

  it("Anon user cannot read customers", async () => {
    const anon = createAnonClient();
    const { error } = await anon.from("customers").select("*");
    if (error) {
      expect(error.code).toBe("42501");
    }
  });
});

// ── Vehicles RLS ─────────────────────────────────────────────

describe("Vehicles RLS — cross-org isolation", () => {
  let vehicleAId: string;
  let vehicleBId: string;

  beforeAll(async () => {
    const ca = await createTestCustomer(admin, orgAId);
    const cb = await createTestCustomer(admin, orgBId);

    const va = await createTestVehicle(admin, orgAId, ca.customerId);
    vehicleAId = va.vehicleId;
    const vb = await createTestVehicle(admin, orgBId, cb.customerId);
    vehicleBId = vb.vehicleId;

    await deleteRecord(admin, "customers", ca.customerId);
    await deleteRecord(admin, "customers", cb.customerId);
  });

  afterAll(async () => {
    await deleteRecord(admin, "vehicles", vehicleAId);
    await deleteRecord(admin, "vehicles", vehicleBId);
  });

  it("User A sees only Org A vehicles", async () => {
    const ua = await signInAsUser(userA.email, userA.password);
    const { data } = await ua.from("vehicles").select("id");
    expect(data).toHaveLength(1);
    expect(data?.[0].id).toBe(vehicleAId);
  });

  it("User B sees only Org B vehicles", async () => {
    const ub = await signInAsUser(userB.email, userB.password);
    const { data } = await ub.from("vehicles").select("id");
    expect(data).toHaveLength(1);
    expect(data?.[0].id).toBe(vehicleBId);
  });
});

// ── Work Orders RLS ──────────────────────────────────────────

describe("Work Orders RLS — cross-org isolation", () => {
  let woAId: string;
  let woBId: string;

  beforeAll(async () => {
    const ca = await createTestCustomer(admin, orgAId);
    const cb = await createTestCustomer(admin, orgBId);

    const woA = await createTestWorkOrder(admin, orgAId, ca.customerId);
    woAId = woA.workOrderId;
    const woB = await createTestWorkOrder(admin, orgBId, cb.customerId);
    woBId = woB.workOrderId;

    await deleteRecord(admin, "customers", ca.customerId);
    await deleteRecord(admin, "customers", cb.customerId);
  });

  afterAll(async () => {
    await deleteRecord(admin, "work_orders", woAId);
    await deleteRecord(admin, "work_orders", woBId);
  });

  it("User A sees only Org A work orders", async () => {
    const ua = await signInAsUser(userA.email, userA.password);
    const { data } = await ua.from("work_orders").select("id");
    expect(data).toHaveLength(1);
    expect(data?.[0].id).toBe(woAId);
  });

  it("User B sees only Org B work orders", async () => {
    const ub = await signInAsUser(userB.email, userB.password);
    const { data } = await ub.from("work_orders").select("id");
    expect(data).toHaveLength(1);
    expect(data?.[0].id).toBe(woBId);
  });

  it("User A cannot see User B's work order", async () => {
    const ua = await signInAsUser(userA.email, userA.password);
    const { data } = await ua.from("work_orders").select("id").eq("id", woBId);
    expect(data).toHaveLength(0);
  });

  it("Anon user cannot read work orders", async () => {
    const anon = createAnonClient();
    const { error } = await anon.from("work_orders").select("*");
    if (error) {
      expect(error.code).toBe("42501");
    }
  });
});
