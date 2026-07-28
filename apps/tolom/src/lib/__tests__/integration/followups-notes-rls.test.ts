/**
 * Integration tests for RLS policies on customer followups, notes, and communications.
 *
 * Verifies org-scoped isolation for:
 *   - customer_followups
 *   - customer_notes
 *   - customer_communications
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Database } from "@/lib/types";
import {
  addUserToOrg,
  createAdminClient,
  createAnonClient,
  createTestCustomer,
  createTestCustomerNote,
  createTestFollowup,
  createTestOrg,
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
let customerAId: string;
let customerBId: string;

beforeAll(async () => {
  if (!hasSupabase) return;
  admin = createAdminClient();
  const orgA = await createTestOrg(admin);
  orgAId = orgA.orgId;
  const orgB = await createTestOrg(admin);
  orgBId = orgB.orgId;

  userA = await createTestUser(admin, {
    email: `user-a-${Date.now()}@fnrls.mn`,
  });
  userB = await createTestUser(admin, {
    email: `user-b-${Date.now()}@fnrls.mn`,
  });

  await addUserToOrg(admin, orgAId, userA.id);
  await addUserToOrg(admin, orgBId, userB.id);

  // Create customers needed by followups, notes, and communications
  const ca = await createTestCustomer(admin, orgAId);
  customerAId = ca.customerId;
  const cb = await createTestCustomer(admin, orgBId);
  customerBId = cb.customerId;
});

afterAll(async () => {
  if (!hasSupabase || !admin) return;
  await deleteRecord(admin, "customers", customerAId);
  await deleteRecord(admin, "customers", customerBId);
  await deleteRecord(
    admin,
    "organization_users",
    `${orgAId},${userA.id}` as unknown as string,
  );
  await deleteRecord(
    admin,
    "organization_users",
    `${orgBId},${userB.id}` as unknown as string,
  );
  await admin.auth.admin.deleteUser(userA.id);
  await admin.auth.admin.deleteUser(userB.id);
  await deleteRecord(admin, "organizations", orgAId);
  await deleteRecord(admin, "organizations", orgBId);
});

// ── Customer Followups RLS ───────────────────────────────────

describeWhenSupabase("Customer Followups RLS — org-scoped", () => {
  let followupAId: string;
  let followupBId: string;

  beforeAll(async () => {
    const fa = await createTestFollowup(admin!, orgAId, customerAId);
    followupAId = fa.followupId;
    const fb = await createTestFollowup(admin!, orgBId, customerBId);
    followupBId = fb.followupId;
  });

  afterAll(async () => {
    await deleteRecord(admin!, "customer_followups", followupAId);
    await deleteRecord(admin!, "customer_followups", followupBId);
  });

  it("User A sees only Org A followups", async () => {
    const ua = await signInAsUser(userA.email, userA.password);
    const { data } = await ua.from("customer_followups").select("id");
    expect(data).toHaveLength(1);
    expect(data?.[0].id).toBe(followupAId);
  });

  it("User B sees only Org B followups", async () => {
    const ub = await signInAsUser(userB.email, userB.password);
    const { data } = await ub.from("customer_followups").select("id");
    expect(data).toHaveLength(1);
    expect(data?.[0].id).toBe(followupBId);
  });

  it("User A cannot see User B's followup", async () => {
    const ua = await signInAsUser(userA.email, userA.password);
    const { data } = await ua
      .from("customer_followups")
      .select("id")
      .eq("id", followupBId);
    expect(data).toHaveLength(0);
  });

  it("Anon user cannot read followups", async () => {
    const anon = createAnonClient();
    const { error } = await anon.from("customer_followups").select("*");
    if (error) {
      expect(error.code).toBe("42501");
    }
  });
});

// ── Customer Notes RLS ───────────────────────────────────────

describeWhenSupabase("Customer Notes RLS — org-scoped", () => {
  let noteAId: string;
  let noteBId: string;

  beforeAll(async () => {
    const na = await createTestCustomerNote(
      admin!,
      orgAId,
      customerAId,
      userA.id,
    );
    noteAId = na.customerNoteId;
    const nb = await createTestCustomerNote(
      admin!,
      orgBId,
      customerBId,
      userB.id,
    );
    noteBId = nb.customerNoteId;
  });

  afterAll(async () => {
    await deleteRecord(admin!, "customer_notes", noteAId);
    await deleteRecord(admin!, "customer_notes", noteBId);
  });

  it("User A sees only Org A notes", async () => {
    const ua = await signInAsUser(userA.email, userA.password);
    const { data } = await ua.from("customer_notes").select("id");
    expect(data).toHaveLength(1);
    expect(data?.[0].id).toBe(noteAId);
  });

  it("User B sees only Org B notes", async () => {
    const ub = await signInAsUser(userB.email, userB.password);
    const { data } = await ub.from("customer_notes").select("id");
    expect(data).toHaveLength(1);
    expect(data?.[0].id).toBe(noteBId);
  });

  it("User A cannot see User B's note", async () => {
    const ua = await signInAsUser(userA.email, userA.password);
    const { data } = await ua
      .from("customer_notes")
      .select("id")
      .eq("id", noteBId);
    expect(data).toHaveLength(0);
  });

  it("Anon user cannot read customer notes", async () => {
    const anon = createAnonClient();
    const { error } = await anon.from("customer_notes").select("*");
    if (error) {
      expect(error.code).toBe("42501");
    }
  });
});

// ── Customer Communications RLS ──────────────────────────────

describeWhenSupabase("Customer Communications RLS — org-scoped", () => {
  let commAId: string;
  let commBId: string;

  beforeAll(async () => {
    const { data: ca, error: errA } = await admin
      ?.from("customer_communications")
      .insert({
        organization_id: orgAId,
        customer_id: customerAId,
        type: "email",
        direction: "outbound",
        subject: "Test comm A",
        content: "Test content A",
      })
      .select()
      .single();
    if (errA) throw new Error(`Failed to create comm A: ${errA.message}`);
    commAId = ca.id;

    const { data: cb, error: errB } = await admin
      ?.from("customer_communications")
      .insert({
        organization_id: orgBId,
        customer_id: customerBId,
        type: "email",
        direction: "outbound",
        subject: "Test comm B",
        content: "Test content B",
      })
      .select()
      .single();
    if (errB) throw new Error(`Failed to create comm B: ${errB.message}`);
    commBId = cb.id;
  });

  afterAll(async () => {
    await deleteRecord(admin!, "customer_communications", commAId);
    await deleteRecord(admin!, "customer_communications", commBId);
  });

  it("User A sees only Org A communications", async () => {
    const ua = await signInAsUser(userA.email, userA.password);
    const { data } = await ua.from("customer_communications").select("id");
    expect(data).toHaveLength(1);
    expect(data?.[0].id).toBe(commAId);
  });

  it("User B sees only Org B communications", async () => {
    const ub = await signInAsUser(userB.email, userB.password);
    const { data } = await ub.from("customer_communications").select("id");
    expect(data).toHaveLength(1);
    expect(data?.[0].id).toBe(commBId);
  });

  it("User A cannot see User B's communication", async () => {
    const ua = await signInAsUser(userA.email, userA.password);
    const { data } = await ua
      .from("customer_communications")
      .select("id")
      .eq("id", commBId);
    expect(data).toHaveLength(0);
  });

  it("Anon user cannot read communications", async () => {
    const anon = createAnonClient();
    const { error } = await anon.from("customer_communications").select("*");
    if (error) {
      expect(error.code).toBe("42501");
    }
  });
});
