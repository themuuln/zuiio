/**
 * Integration tests for Service Reminders (vehicle_service_schedules, reminder_logs)
 * RLS policies and authorization boundaries.
 *
 * Tests multi-tenant isolation: User A in Org A cannot read/write
 * Org B's service schedules. Anon users are blocked from scoped tables.
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
  createTestServiceSchedule,
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
    email: `user-a-${Date.now()}@svcrlstest.mn`,
  });
  userB = await createTestUser(admin, {
    email: `user-b-${Date.now()}@svcrlstest.mn`,
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

// ── Vehicle Service Schedules RLS ────────────────────────────

describeWhenSupabase(
  "Vehicle Service Schedules RLS — cross-org isolation",
  () => {
    let customerAId: string;
    let customerBId: string;
    let vehicleAId: string;
    let vehicleBId: string;
    let scheduleAId: string;
    let scheduleBId: string;

    beforeAll(async () => {
      if (!admin) return;

      // Create customers and vehicles for both orgs
      const ca = await createTestCustomer(admin, orgAId);
      customerAId = ca.customerId;
      const cb = await createTestCustomer(admin, orgBId);
      customerBId = cb.customerId;

      const va = await createTestVehicle(admin, orgAId, customerAId);
      vehicleAId = va.vehicleId;
      const vb = await createTestVehicle(admin, orgBId, customerBId);
      vehicleBId = vb.vehicleId;

      // Create service schedules
      const sa = await createTestServiceSchedule(
        admin,
        orgAId,
        customerAId,
        vehicleAId,
      );
      scheduleAId = sa.serviceScheduleId;
      const sb = await createTestServiceSchedule(
        admin,
        orgBId,
        customerBId,
        vehicleBId,
      );
      scheduleBId = sb.serviceScheduleId;
    });

    afterAll(async () => {
      if (!admin) return;
      await deleteRecord(admin, "vehicle_service_schedules", scheduleAId);
      await deleteRecord(admin, "vehicle_service_schedules", scheduleBId);
      await deleteRecord(admin, "vehicles", vehicleAId);
      await deleteRecord(admin, "vehicles", vehicleBId);
      await deleteRecord(admin, "customers", customerAId);
      await deleteRecord(admin, "customers", customerBId);
    });

    it("User A sees only Org A service schedules", async () => {
      const ua = await signInAsUser(userA.email, userA.password);
      const { data } = await ua.from("vehicle_service_schedules").select("id");
      expect(data).toHaveLength(1);
      expect(data?.[0].id).toBe(scheduleAId);
    });

    it("User B sees only Org B service schedules", async () => {
      const ub = await signInAsUser(userB.email, userB.password);
      const { data } = await ub.from("vehicle_service_schedules").select("id");
      expect(data).toHaveLength(1);
      expect(data?.[0].id).toBe(scheduleBId);
    });

    it("User A cannot see User B's service schedule", async () => {
      const ua = await signInAsUser(userA.email, userA.password);
      const { data } = await ua
        .from("vehicle_service_schedules")
        .select("id")
        .eq("id", scheduleBId);
      expect(data).toHaveLength(0);
    });

    it("Anon user cannot read service schedules", async () => {
      const anon = createAnonClient();
      const { error } = await anon
        .from("vehicle_service_schedules")
        .select("*");
      if (error) {
        expect(error.code).toBe("42501");
      }
    });
  },
);

// ── Reminder Logs RLS ────────────────────────────────────────

describeWhenSupabase("Reminder Logs RLS — cross-org isolation", () => {
  let customerAId: string;
  let customerBId: string;
  let vehicleAId: string;
  let vehicleBId: string;
  let logAId: string;
  let logBId: string;

  beforeAll(async () => {
    if (!admin) return;

    // Create customers and vehicles for both orgs
    const ca = await createTestCustomer(admin, orgAId);
    customerAId = ca.customerId;
    const cb = await createTestCustomer(admin, orgBId);
    customerBId = cb.customerId;

    const va = await createTestVehicle(admin, orgAId, customerAId);
    vehicleAId = va.vehicleId;
    const vb = await createTestVehicle(admin, orgBId, customerBId);
    vehicleBId = vb.vehicleId;

    // Create reminder logs directly via admin
    const logA = await admin
      ?.from("reminder_logs")
      .insert({
        organization_id: orgAId,
        vehicle_id: vehicleAId,
        customer_id: customerAId,
        service_name: `Test Reminder ${Date.now()}`,
        reminder_type: "service_due",
        channel: "email",
        status: "pending",
      })
      .select()
      .single();

    if (logA.error)
      throw new Error(`Failed to create reminder log A: ${logA.error.message}`);
    logAId = logA.data.id;

    const logB = await admin
      ?.from("reminder_logs")
      .insert({
        organization_id: orgBId,
        vehicle_id: vehicleBId,
        customer_id: customerBId,
        service_name: `Test Reminder ${Date.now()}`,
        reminder_type: "service_due",
        channel: "email",
        status: "pending",
      })
      .select()
      .single();

    if (logB.error)
      throw new Error(`Failed to create reminder log B: ${logB.error.message}`);
    logBId = logB.data.id;
  });

  afterAll(async () => {
    if (!admin) return;
    await deleteRecord(admin, "reminder_logs", logAId);
    await deleteRecord(admin, "reminder_logs", logBId);
    await deleteRecord(admin, "vehicles", vehicleAId);
    await deleteRecord(admin, "vehicles", vehicleBId);
    await deleteRecord(admin, "customers", customerAId);
    await deleteRecord(admin, "customers", customerBId);
  });

  it("User A sees only Org A reminder logs", async () => {
    const ua = await signInAsUser(userA.email, userA.password);
    const { data } = await ua.from("reminder_logs").select("id");
    expect(data).toHaveLength(1);
    expect(data?.[0].id).toBe(logAId);
  });

  it("User B sees only Org B reminder logs", async () => {
    const ub = await signInAsUser(userB.email, userB.password);
    const { data } = await ub.from("reminder_logs").select("id");
    expect(data).toHaveLength(1);
    expect(data?.[0].id).toBe(logBId);
  });

  it("User A cannot see User B's reminder logs", async () => {
    const ua = await signInAsUser(userA.email, userA.password);
    const { data } = await ua
      .from("reminder_logs")
      .select("id")
      .eq("id", logBId);
    expect(data).toHaveLength(0);
  });

  it("Anon user cannot read reminder logs", async () => {
    const anon = createAnonClient();
    const { error } = await anon.from("reminder_logs").select("*");
    if (error) {
      expect(error.code).toBe("42501");
    }
  });
});
