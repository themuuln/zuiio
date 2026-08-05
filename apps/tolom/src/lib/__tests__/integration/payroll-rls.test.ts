/**
 * Integration tests for Payroll tables RLS policies and authorization boundaries.
 *
 * Tests multi-tenant isolation for:
 *   - payroll_records
 *   - mechanic_pay_rates
 *   - mechanic_commission_rules
 *
 * User A in Org A cannot read/write Org B's payroll data.
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
  createTestPayrollRecord,
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
    email: `user-a-${Date.now()}@payrlstest.mn`,
  });
  userB = await createTestUser(admin, {
    email: `user-b-${Date.now()}@payrlstest.mn`,
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

// ── Pay Rates RLS ────────────────────────────────────────────

describeWhenSupabase("Pay Rates RLS — cross-org isolation", () => {
  let payRateAId: string;
  let payRateBId: string;

  beforeAll(async () => {
    if (!admin) return;

    const pra = await admin
      ?.from("mechanic_pay_rates")
      .insert({
        organization_id: orgAId,
        mechanic_id: userA.id,
        hourly_rate: 20000,
        effective_from: new Date().toISOString().split("T")[0],
      })
      .select()
      .single();
    if (pra.error)
      throw new Error(`Failed to create pay rate A: ${pra.error.message}`);
    payRateAId = pra.data.id;

    const prb = await admin
      ?.from("mechanic_pay_rates")
      .insert({
        organization_id: orgBId,
        mechanic_id: userB.id,
        hourly_rate: 15000,
        effective_from: new Date().toISOString().split("T")[0],
      })
      .select()
      .single();
    if (prb.error)
      throw new Error(`Failed to create pay rate B: ${prb.error.message}`);
    payRateBId = prb.data.id;
  });

  afterAll(async () => {
    if (!admin) return;
    await deleteRecord(admin, "mechanic_pay_rates", payRateAId);
    await deleteRecord(admin, "mechanic_pay_rates", payRateBId);
  });

  it("User A sees only Org A pay rates", async () => {
    const ua = await signInAsUser(userA.email, userA.password);
    const { data } = await ua.from("mechanic_pay_rates").select("id");
    expect(data).toHaveLength(1);
    expect(data?.[0].id).toBe(payRateAId);
  });

  it("User B sees only Org B pay rates", async () => {
    const ub = await signInAsUser(userB.email, userB.password);
    const { data } = await ub.from("mechanic_pay_rates").select("id");
    expect(data).toHaveLength(1);
    expect(data?.[0].id).toBe(payRateBId);
  });

  it("User A cannot see User B's pay rate", async () => {
    const ua = await signInAsUser(userA.email, userA.password);
    const { data } = await ua
      .from("mechanic_pay_rates")
      .select("id")
      .eq("id", payRateBId);
    expect(data).toHaveLength(0);
  });

  it("Anon user cannot read pay rates", async () => {
    const anon = createAnonClient();
    const { error } = await anon.from("mechanic_pay_rates").select("*");
    if (error) {
      expect(error.code).toBe("42501");
    }
  });
});

// ── Payroll Records RLS ──────────────────────────────────────

describeWhenSupabase("Payroll Records RLS — cross-org isolation", () => {
  let payrollAId: string;
  let payrollBId: string;

  beforeAll(async () => {
    if (!admin) return;
    const pa = await createTestPayrollRecord(admin, orgAId, userA.id);
    payrollAId = pa.payrollRecordId;
    const pb = await createTestPayrollRecord(admin, orgBId, userB.id);
    payrollBId = pb.payrollRecordId;
  });

  afterAll(async () => {
    if (!admin) return;
    await deleteRecord(admin, "payroll_records", payrollAId);
    await deleteRecord(admin, "payroll_records", payrollBId);
  });

  it("User A sees only Org A payroll records", async () => {
    const ua = await signInAsUser(userA.email, userA.password);
    const { data } = await ua.from("payroll_records").select("id");
    expect(data).toHaveLength(1);
    expect(data?.[0].id).toBe(payrollAId);
  });

  it("User B sees only Org B payroll records", async () => {
    const ub = await signInAsUser(userB.email, userB.password);
    const { data } = await ub.from("payroll_records").select("id");
    expect(data).toHaveLength(1);
    expect(data?.[0].id).toBe(payrollBId);
  });

  it("User A cannot see User B's payroll record", async () => {
    const ua = await signInAsUser(userA.email, userA.password);
    const { data } = await ua
      .from("payroll_records")
      .select("id")
      .eq("id", payrollBId);
    expect(data).toHaveLength(0);
  });

  it("Anon user cannot read payroll records", async () => {
    const anon = createAnonClient();
    const { error } = await anon.from("payroll_records").select("*");
    if (error) {
      expect(error.code).toBe("42501");
    }
  });
});

// ── Mechanic Commission Rules RLS ────────────────────────────

describeWhenSupabase(
  "Mechanic Commission Rules RLS — cross-org isolation",
  () => {
    let ruleAId: string;
    let ruleBId: string;

    beforeAll(async () => {
      if (!admin) return;

      const ra = await admin
        ?.from("mechanic_commission_rules")
        .insert({
          organization_id: orgAId,
          name: `Commission Rule A ${Date.now()}`,
          commission_type: "percentage_of_labor",
          commission_value: 10,
        })
        .select()
        .single();
      if (ra.error)
        throw new Error(
          `Failed to create commission rule A: ${ra.error.message}`,
        );
      ruleAId = ra.data.id;

      const rb = await admin
        ?.from("mechanic_commission_rules")
        .insert({
          organization_id: orgBId,
          name: `Commission Rule B ${Date.now()}`,
          commission_type: "percentage_of_labor",
          commission_value: 15,
        })
        .select()
        .single();
      if (rb.error)
        throw new Error(
          `Failed to create commission rule B: ${rb.error.message}`,
        );
      ruleBId = rb.data.id;
    });

    afterAll(async () => {
      if (!admin) return;
      await deleteRecord(admin, "mechanic_commission_rules", ruleAId);
      await deleteRecord(admin, "mechanic_commission_rules", ruleBId);
    });

    it("User A sees only Org A commission rules", async () => {
      const ua = await signInAsUser(userA.email, userA.password);
      const { data } = await ua.from("mechanic_commission_rules").select("id");
      expect(data).toHaveLength(1);
      expect(data?.[0].id).toBe(ruleAId);
    });

    it("User B sees only Org B commission rules", async () => {
      const ub = await signInAsUser(userB.email, userB.password);
      const { data } = await ub.from("mechanic_commission_rules").select("id");
      expect(data).toHaveLength(1);
      expect(data?.[0].id).toBe(ruleBId);
    });

    it("User A cannot see User B's commission rule", async () => {
      const ua = await signInAsUser(userA.email, userA.password);
      const { data } = await ua
        .from("mechanic_commission_rules")
        .select("id")
        .eq("id", ruleBId);
      expect(data).toHaveLength(0);
    });

    it("Anon user cannot read commission rules", async () => {
      const anon = createAnonClient();
      const { error } = await anon
        .from("mechanic_commission_rules")
        .select("*");
      if (error) {
        expect(error.code).toBe("42501");
      }
    });
  },
);
