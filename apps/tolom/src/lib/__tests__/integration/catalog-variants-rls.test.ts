/**
 * Integration tests for RLS policies on catalog variant tables.
 *
 * Verifies org-scoped isolation for:
 *   - catalog_variant_groups
 *   - catalog_variant_options
 *   - catalog_item_variants
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Database } from "@/lib/types";
import {
  addUserToOrg,
  createAdminClient,
  createAnonClient,
  createTestCatalogItemVariant,
  createTestCatalogVariantGroup,
  createTestCatalogVariantOption,
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

beforeAll(async () => {
  if (!hasSupabase) return;
  admin = createAdminClient();
  const orgA = await createTestOrg(admin);
  orgAId = orgA.orgId;
  const orgB = await createTestOrg(admin);
  orgBId = orgB.orgId;

  userA = await createTestUser(admin, {
    email: `user-a-${Date.now()}@cvrls.mn`,
  });
  userB = await createTestUser(admin, {
    email: `user-b-${Date.now()}@cvrls.mn`,
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

// ── Catalog Variant Groups RLS ──────────────────────────────

describeWhenSupabase("Catalog Variant Groups RLS — org-scoped", () => {
  let groupAId: string;
  let groupBId: string;

  beforeAll(async () => {
    const ga = await createTestCatalogVariantGroup(admin!, orgAId);
    groupAId = ga.variantGroupId;
    const gb = await createTestCatalogVariantGroup(admin!, orgBId);
    groupBId = gb.variantGroupId;
  });

  afterAll(async () => {
    await deleteRecord(admin!, "catalog_variant_groups", groupAId);
    await deleteRecord(admin!, "catalog_variant_groups", groupBId);
  });

  it("User A sees only Org A variant groups", async () => {
    const ua = await signInAsUser(userA.email, userA.password);
    const { data } = await ua.from("catalog_variant_groups").select("id");
    expect(data).toHaveLength(1);
    expect(data?.[0].id).toBe(groupAId);
  });

  it("User B sees only Org B variant groups", async () => {
    const ub = await signInAsUser(userB.email, userB.password);
    const { data } = await ub.from("catalog_variant_groups").select("id");
    expect(data).toHaveLength(1);
    expect(data?.[0].id).toBe(groupBId);
  });

  it("User A cannot see User B's variant group", async () => {
    const ua = await signInAsUser(userA.email, userA.password);
    const { data } = await ua
      .from("catalog_variant_groups")
      .select("id")
      .eq("id", groupBId);
    expect(data).toHaveLength(0);
  });

  it("Anon user cannot read variant groups", async () => {
    const anon = createAnonClient();
    const { error } = await anon.from("catalog_variant_groups").select("*");
    if (error) {
      expect(error.code).toBe("42501");
    }
  });
});

// ── Catalog Variant Options RLS ─────────────────────────────

describeWhenSupabase("Catalog Variant Options RLS — org-scoped", () => {
  let groupAId: string;
  let groupBId: string;
  let optionAId: string;
  let optionBId: string;

  beforeAll(async () => {
    // Create groups first (options FK to groups)
    const ga = await createTestCatalogVariantGroup(admin!, orgAId);
    groupAId = ga.variantGroupId;
    const gb = await createTestCatalogVariantGroup(admin!, orgBId);
    groupBId = gb.variantGroupId;

    const oa = await createTestCatalogVariantOption(admin!, orgAId, groupAId);
    optionAId = oa.variantOptionId;
    const ob = await createTestCatalogVariantOption(admin!, orgBId, groupBId);
    optionBId = ob.variantOptionId;
  });

  afterAll(async () => {
    await deleteRecord(admin!, "catalog_variant_options", optionAId);
    await deleteRecord(admin!, "catalog_variant_options", optionBId);
    await deleteRecord(admin!, "catalog_variant_groups", groupAId);
    await deleteRecord(admin!, "catalog_variant_groups", groupBId);
  });

  it("User A sees only Org A variant options", async () => {
    const ua = await signInAsUser(userA.email, userA.password);
    const { data } = await ua.from("catalog_variant_options").select("id");
    expect(data).toHaveLength(1);
    expect(data?.[0].id).toBe(optionAId);
  });

  it("User B sees only Org B variant options", async () => {
    const ub = await signInAsUser(userB.email, userB.password);
    const { data } = await ub.from("catalog_variant_options").select("id");
    expect(data).toHaveLength(1);
    expect(data?.[0].id).toBe(optionBId);
  });

  it("User A cannot see User B's variant option", async () => {
    const ua = await signInAsUser(userA.email, userA.password);
    const { data } = await ua
      .from("catalog_variant_options")
      .select("id")
      .eq("id", optionBId);
    expect(data).toHaveLength(0);
  });

  it("Anon user cannot read variant options", async () => {
    const anon = createAnonClient();
    const { error } = await anon.from("catalog_variant_options").select("*");
    if (error) {
      expect(error.code).toBe("42501");
    }
  });
});

// ── Catalog Item Variants RLS ───────────────────────────────

describeWhenSupabase("Catalog Item Variants RLS — org-scoped", () => {
  let itemVariantAId: string;
  let itemVariantBId: string;

  beforeAll(async () => {
    const va = await createTestCatalogItemVariant(admin!, orgAId);
    itemVariantAId = va.itemVariantId;
    const vb = await createTestCatalogItemVariant(admin!, orgBId);
    itemVariantBId = vb.itemVariantId;
  });

  afterAll(async () => {
    await deleteRecord(admin!, "catalog_item_variants", itemVariantAId);
    await deleteRecord(admin!, "catalog_item_variants", itemVariantBId);
  });

  it("User A sees only Org A item variants", async () => {
    const ua = await signInAsUser(userA.email, userA.password);
    const { data } = await ua.from("catalog_item_variants").select("id");
    expect(data).toHaveLength(1);
    expect(data?.[0].id).toBe(itemVariantAId);
  });

  it("User B sees only Org B item variants", async () => {
    const ub = await signInAsUser(userB.email, userB.password);
    const { data } = await ub.from("catalog_item_variants").select("id");
    expect(data).toHaveLength(1);
    expect(data?.[0].id).toBe(itemVariantBId);
  });

  it("User A cannot see User B's item variant", async () => {
    const ua = await signInAsUser(userA.email, userA.password);
    const { data } = await ua
      .from("catalog_item_variants")
      .select("id")
      .eq("id", itemVariantBId);
    expect(data).toHaveLength(0);
  });

  it("Anon user cannot read item variants", async () => {
    const anon = createAnonClient();
    const { error } = await anon.from("catalog_item_variants").select("*");
    if (error) {
      expect(error.code).toBe("42501");
    }
  });
});
