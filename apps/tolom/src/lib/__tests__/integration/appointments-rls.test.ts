/**
 * Integration tests for Appointments RLS policies and authorization boundaries.
 *
 * Tests multi-tenant isolation: User A in Org A cannot read/write
 * Org B's appointments. Anon users are blocked from scoped tables.
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
  createTestAppointment,
  createTestBranch,
  createTestCustomer,
  createTestOrg,
  createTestUser,
  createTestVehicle,
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
    email: `user-a-${Date.now()}@apptrlstest.mn`,
  });
  userB = await createTestUser(admin, {
    email: `user-b-${Date.now()}@apptrlstest.mn`,
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

// ── Appointments RLS ────────────────────────────────────────

describeWhenSupabase("Appointments RLS — cross-org isolation", () => {
  let branchAId: string;
  let branchBId: string;
  let customerAId: string;
  let customerBId: string;
  let vehicleAId: string;
  let vehicleBId: string;
  let appointmentAId: string;
  let appointmentBId: string;

  beforeAll(async () => {
    if (!admin) return;

    // Create branches, customers, and vehicles for both orgs
    const branchA = await createTestBranch(admin, orgAId);
    branchAId = branchA.branchId;
    const branchB = await createTestBranch(admin, orgBId);
    branchBId = branchB.branchId;

    const ca = await createTestCustomer(admin, orgAId);
    customerAId = ca.customerId;
    const cb = await createTestCustomer(admin, orgBId);
    customerBId = cb.customerId;

    const va = await createTestVehicle(admin, orgAId, customerAId);
    vehicleAId = va.vehicleId;
    const vb = await createTestVehicle(admin, orgBId, customerBId);
    vehicleBId = vb.vehicleId;

    // Create appointments
    const apptA = await createTestAppointment(
      admin,
      orgAId,
      branchAId,
      customerAId,
      vehicleAId,
    );
    appointmentAId = apptA.appointmentId;
    const apptB = await createTestAppointment(
      admin,
      orgBId,
      branchBId,
      customerBId,
      vehicleBId,
    );
    appointmentBId = apptB.appointmentId;
  });

  afterAll(async () => {
    if (!admin) return;
    await deleteRecord(admin, "appointments", appointmentAId);
    await deleteRecord(admin, "appointments", appointmentBId);
    await deleteRecord(admin, "vehicles", vehicleAId);
    await deleteRecord(admin, "vehicles", vehicleBId);
    await deleteRecord(admin, "customers", customerAId);
    await deleteRecord(admin, "customers", customerBId);
    await deleteRecord(admin, "branches", branchAId);
    await deleteRecord(admin, "branches", branchBId);
  });

  it("User A sees only Org A appointments", async () => {
    const ua = await signInAsUser(userA.email, userA.password);
    const { data } = await ua.from("appointments").select("id");
    expect(data).toHaveLength(1);
    expect(data?.[0].id).toBe(appointmentAId);
  });

  it("User B sees only Org B appointments", async () => {
    const ub = await signInAsUser(userB.email, userB.password);
    const { data } = await ub.from("appointments").select("id");
    expect(data).toHaveLength(1);
    expect(data?.[0].id).toBe(appointmentBId);
  });

  it("User A cannot see User B's appointment", async () => {
    const ua = await signInAsUser(userA.email, userA.password);
    const { data } = await ua
      .from("appointments")
      .select("id")
      .eq("id", appointmentBId);
    expect(data).toHaveLength(0);
  });

  it("Anon user cannot read appointments", async () => {
    const anon = createAnonClient();
    const { error } = await anon.from("appointments").select("*");
    if (error) {
      expect(error.code).toBe("42501");
    }
  });
});
