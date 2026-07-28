/**
 * Integration tests for RLS policies on stock_transfers and stock_transfer_items.
 *
 * Verifies org-scoped isolation for:
 *   - stock_transfers
 *   - stock_transfer_items (through transfer org)
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
  createTestStockTransfer,
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
    email: `user-a-${Date.now()}@strls.mn`,
  });
  userB = await createTestUser(admin, {
    email: `user-b-${Date.now()}@strls.mn`,
  });

  await addUserToOrg(admin, orgAId, userA.id);
  await addUserToOrg(admin, orgBId, userB.id);
});

afterAll(async () => {
  if (!hasSupabase || !admin) return;
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

// ── Stock Transfers RLS ─────────────────────────────────────

describeWhenSupabase("Stock Transfers RLS — org-scoped", () => {
  let branchAId: string;
  let branchBId: string;
  let transferAId: string;
  let transferBId: string;
  let transferItemAId: string;
  let transferItemBId: string;
  let partAId: string;
  let partBId: string;

  beforeAll(async () => {
    // Create branches for transfers
    const ba = await createTestBranch(admin!, orgAId);
    branchAId = ba.branchId;
    const bb = await createTestBranch(admin!, orgBId);
    branchBId = bb.branchId;

    // Create parts for transfer items
    const pa = await createTestPart(admin!, orgAId);
    partAId = pa.partId;
    const pb = await createTestPart(admin!, orgBId);
    partBId = pb.partId;

    // Create transfers
    const ta = await createTestStockTransfer(
      admin!,
      orgAId,
      branchAId,
      userA.id,
    );
    transferAId = ta.transferId;
    const tb = await createTestStockTransfer(
      admin!,
      orgBId,
      branchBId,
      userB.id,
    );
    transferBId = tb.transferId;

    // Create transfer items (org-scoped via transfer FK)
    const { data: itemA, error: errA } = await admin
      ?.from("stock_transfer_items")
      .insert({
        transfer_id: transferAId,
        part_id: partAId,
        quantity: 5,
      })
      .select()
      .single();
    if (errA)
      throw new Error(`Failed to create transfer item A: ${errA.message}`);
    transferItemAId = itemA.id;

    const { data: itemB, error: errB } = await admin
      ?.from("stock_transfer_items")
      .insert({
        transfer_id: transferBId,
        part_id: partBId,
        quantity: 3,
      })
      .select()
      .single();
    if (errB)
      throw new Error(`Failed to create transfer item B: ${errB.message}`);
    transferItemBId = itemB.id;
  });

  afterAll(async () => {
    await deleteRecord(admin!, "stock_transfer_items", transferItemAId);
    await deleteRecord(admin!, "stock_transfer_items", transferItemBId);
    await deleteRecord(admin!, "stock_transfers", transferAId);
    await deleteRecord(admin!, "stock_transfers", transferBId);
    await deleteRecord(admin!, "parts_catalog", partAId);
    await deleteRecord(admin!, "parts_catalog", partBId);
    await deleteRecord(admin!, "branches", branchAId);
    await deleteRecord(admin!, "branches", branchBId);
  });

  it("User A sees only Org A transfers", async () => {
    const ua = await signInAsUser(userA.email, userA.password);
    const { data } = await ua.from("stock_transfers").select("id");
    expect(data).toHaveLength(1);
    expect(data?.[0].id).toBe(transferAId);
  });

  it("User B sees only Org B transfers", async () => {
    const ub = await signInAsUser(userB.email, userB.password);
    const { data } = await ub.from("stock_transfers").select("id");
    expect(data).toHaveLength(1);
    expect(data?.[0].id).toBe(transferBId);
  });

  it("User A cannot see User B's transfer", async () => {
    const ua = await signInAsUser(userA.email, userA.password);
    const { data } = await ua
      .from("stock_transfers")
      .select("id")
      .eq("id", transferBId);
    expect(data).toHaveLength(0);
  });

  it("User A sees only Org A transfer items", async () => {
    const ua = await signInAsUser(userA.email, userA.password);
    const { data } = await ua.from("stock_transfer_items").select("id");
    expect(data).toHaveLength(1);
    expect(data?.[0].id).toBe(transferItemAId);
  });

  it("User B sees only Org B transfer items", async () => {
    const ub = await signInAsUser(userB.email, userB.password);
    const { data } = await ub.from("stock_transfer_items").select("id");
    expect(data).toHaveLength(1);
    expect(data?.[0].id).toBe(transferItemBId);
  });

  it("User A cannot see User B's transfer item", async () => {
    const ua = await signInAsUser(userA.email, userA.password);
    const { data } = await ua
      .from("stock_transfer_items")
      .select("id")
      .eq("id", transferItemBId);
    expect(data).toHaveLength(0);
  });

  it("Anon user cannot read stock transfers", async () => {
    const anon = createAnonClient();
    const { error } = await anon.from("stock_transfers").select("*");
    if (error) {
      expect(error.code).toBe("42501");
    }
  });

  it("Anon user cannot read stock transfer items", async () => {
    const anon = createAnonClient();
    const { error } = await anon.from("stock_transfer_items").select("*");
    if (error) {
      expect(error.code).toBe("42501");
    }
  });
});
