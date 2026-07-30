/**
 * Integration tests for Coupon system.
 *
 * Covers: coupons, coupon_usage, RLS policies.
 */

import { describe, expect, it } from "vitest";
import {
  createAdminClient,
  createAnonClient,
  createTestOrg,
  createTestUserWithPermissions,
  trackCleanup,
} from "./helpers";

// ── Direct CRUD (via service role) ───────────────────────────

describe("Coupons CRUD", () => {
  const admin = createAdminClient();

  it("admin can create a coupon", async () => {
    const { orgId } = await createTestOrg(admin);

    const code = `TEST-${Date.now()}`;
    const { data: coupon, error } = await admin
      .from("coupons")
      .insert({
        organization_id: orgId,
        code,
        discount_type: "percentage",
        discount_value: 10,
        min_purchase_amount: 5000,
        max_discount_amount: 5000,
        usage_limit: 100,
        per_customer_limit: 1,
        applies_to: "all",
        is_active: true,
      })
      .select()
      .single();

    expect(error).toBeNull();
    expect(coupon).not.toBeNull();
    expect(coupon!.code).toBe(code);
    expect(coupon!.discount_type).toBe("percentage");
    expect(coupon!.discount_value).toBe(10);
    expect(coupon!.min_purchase_amount).toBe(5000);
    expect(coupon!.organization_id).toBe(orgId);
    trackCleanup("coupons", coupon!.id);
  });

  it("admin can create a fixed-amount coupon", async () => {
    const { orgId } = await createTestOrg(admin);

    const code = `FIXED-${Date.now()}`;
    const { data: coupon, error } = await admin
      .from("coupons")
      .insert({
        organization_id: orgId,
        code,
        discount_type: "fixed_amount",
        discount_value: 5000,
        description: "5000₮ off",
        valid_from: new Date().toISOString(),
        valid_until: new Date(Date.now() + 86400000).toISOString(),
      })
      .select()
      .single();

    expect(error).toBeNull();
    expect(coupon!.code).toBe(code);
    expect(coupon!.discount_type).toBe("fixed_amount");
    expect(coupon!.discount_value).toBe(5000);
    expect(coupon!.description).toBe("5000₮ off");
    expect(coupon!.is_active).toBe(true);
    expect(coupon!.used_count).toBe(0);
    trackCleanup("coupons", coupon!.id);
  });

  it("admin can query coupons by organization", async () => {
    const { orgId } = await createTestOrg(admin);
    const { orgId: orgId2 } = await createTestOrg(admin);

    // Create coupons in both orgs
    const code1 = `QRY1-${Date.now()}`;
    const code2 = `QRY2-${Date.now()}`;
    await admin.from("coupons").insert({
      organization_id: orgId,
      code: code1,
      discount_type: "percentage",
      discount_value: 5,
    }).select().single();
    await admin.from("coupons").insert({
      organization_id: orgId2,
      code: code2,
      discount_type: "percentage",
      discount_value: 10,
    }).select().single();

    // Query by first org
    const { data: org1Coupons, error } = await admin
      .from("coupons")
      .select("*")
      .eq("organization_id", orgId);

    expect(error).toBeNull();
    expect(org1Coupons!.length).toBeGreaterThanOrEqual(1);
    expect(org1Coupons!.every((c) => c.organization_id === orgId)).toBe(true);

    // Track cleanup for created coupons
    for (const c of org1Coupons!) {
      trackCleanup("coupons", c.id);
    }

    // Also track org2's coupon
    const { data: org2Coupons } = await admin
      .from("coupons")
      .select("id")
      .eq("organization_id", orgId2);
    for (const c of org2Coupons ?? []) {
      trackCleanup("coupons", c.id);
    }
  });
});

// ── RLS ──────────────────────────────────────────────────────

describe("Coupons RLS", () => {
  const admin = createAdminClient();

  it("anon cannot create coupons", async () => {
    const { orgId } = await createTestOrg(admin);
    const anon = createAnonClient();
    const { error } = await anon.from("coupons").insert({
      organization_id: orgId,
      code: "HACKED",
      discount_type: "percentage",
      discount_value: 99,
    });
    expect(error).not.toBeNull();
  });

  it("anon cannot read coupons", async () => {
    const anon = createAnonClient();
    const { data, error } = await anon.from("coupons").select("*").limit(1);
    // Anon should get either RLS error or empty result
    if (error) {
      expect(error.code).toBe("42501");
    } else {
      expect(data).toEqual([]);
    }
  });

  it("RLS scopes coupons to organization", async () => {
    // Create two organizations
    const { orgId: orgA, org: orgAEntity } = await createTestOrg(admin);
    const { orgId: orgB } = await createTestOrg(admin);

    // Create a user in org A with coupons.read permission
    const userA = await createTestUserWithPermissions(admin, orgA, orgAEntity.name, ["coupons.read"]);

    // Use admin to create a coupon in org B (different org)
    const code = `SCOPE-${Date.now()}`;
    const { data: couponB } = await admin
      .from("coupons")
      .insert({
        organization_id: orgB,
        code,
        discount_type: "fixed_amount",
        discount_value: 3000,
      })
      .select()
      .single();
    trackCleanup("coupons", couponB!.id);

    // User from org A should NOT see org B's coupon
    const { data: userACoupons, error: userAError } = await userA.client
      .from("coupons")
      .select("*")
      .eq("code", code);

    expect(userAError).toBeNull();
    expect(userACoupons).toEqual([]);
  });

  it("user can read coupons from their own organization", async () => {
    const { orgId, org } = await createTestOrg(admin);

    // Create a user with coupons.read permission
    const user = await createTestUserWithPermissions(admin, orgId, org.name, ["coupons.read"]);

    // Use admin to create a coupon in user's org
    const code = `OWN-${Date.now()}`;
    const { data: coupon } = await admin
      .from("coupons")
      .insert({
        organization_id: orgId,
        code,
        discount_type: "percentage",
        discount_value: 15,
      })
      .select()
      .single();
    trackCleanup("coupons", coupon!.id);

    // User should be able to read their own org's coupon
    const { data: results, error } = await user.client
      .from("coupons")
      .select("*")
      .eq("code", code);

    expect(error).toBeNull();
    expect(results).toHaveLength(1);
    expect(results![0].code).toBe(code);
    expect(results![0].discount_value).toBe(15);
  });

  it("user without coupons.read permission cannot read coupons", async () => {
    const { orgId, org } = await createTestOrg(admin);

    // Create a user WITHOUT coupons.read permission
    const user = await createTestUserWithPermissions(admin, orgId, org.name, ["products.read"]);

    // Use admin to create a coupon
    const code = `NOPERM-${Date.now()}`;
    const { data: coupon } = await admin
      .from("coupons")
      .insert({
        organization_id: orgId,
        code,
        discount_type: "percentage",
        discount_value: 20,
      })
      .select()
      .single();
    trackCleanup("coupons", coupon!.id);

    // User should not see any coupons
    const { data: results, error } = await user.client
      .from("coupons")
      .select("*")
      .eq("code", code);

    expect(error).toBeNull();
    expect(results).toEqual([]);
  });
});

// ── Coupon Usage Tracking ────────────────────────────────────

describe("Coupon usage tracking", () => {
  const admin = createAdminClient();

  it("admin can create coupon_usage record", async () => {
    const { orgId } = await createTestOrg(admin);

    // Create a coupon first
    const code = `USAGE-${Date.now()}`;
    const { data: coupon, error: couponError } = await admin
      .from("coupons")
      .insert({
        organization_id: orgId,
        code,
        discount_type: "percentage",
        discount_value: 10,
      })
      .select()
      .single();

    expect(couponError).toBeNull();
    trackCleanup("coupons", coupon!.id);

    // Create coupon_usage record
    const { data: usage, error: usageError } = await admin
      .from("coupon_usage")
      .insert({
        coupon_id: coupon!.id,
        organization_id: orgId,
        used_at: new Date().toISOString(),
      })
      .select()
      .single();

    expect(usageError).toBeNull();
    expect(usage!.coupon_id).toBe(coupon!.id);
    expect(usage!.organization_id).toBe(orgId);
    trackCleanup("coupon_usage", usage!.id);
  });

  it("coupon_usage is linked to coupon correctly", async () => {
    const { orgId } = await createTestOrg(admin);

    // Create coupon
    const { data: coupon } = await admin
      .from("coupons")
      .insert({
        organization_id: orgId,
        code: `LINK-${Date.now()}`,
        discount_type: "fixed_amount",
        discount_value: 2000,
      })
      .select()
      .single();
    trackCleanup("coupons", coupon!.id);

    // Create multiple usage records
    const { data: usage1 } = await admin
      .from("coupon_usage")
      .insert({
        coupon_id: coupon!.id,
        organization_id: orgId,
      })
      .select()
      .single();
    trackCleanup("coupon_usage", usage1!.id);

    const { data: usage2 } = await admin
      .from("coupon_usage")
      .insert({
        coupon_id: coupon!.id,
        organization_id: orgId,
      })
      .select()
      .single();
    trackCleanup("coupon_usage", usage2!.id);

    // Query usage by coupon_id
    const { data: usageRecords, error } = await admin
      .from("coupon_usage")
      .select("*")
      .eq("coupon_id", coupon!.id);

    expect(error).toBeNull();
    expect(usageRecords!.length).toBeGreaterThanOrEqual(2);
    expect(usageRecords!.every((r) => r.coupon_id === coupon!.id)).toBe(true);
  });
});

// ── Coupon Usage RLS ─────────────────────────────────────────

describe("Coupon usage RLS", () => {
  const admin = createAdminClient();

  it("anon cannot create coupon_usage", async () => {
    const { orgId } = await createTestOrg(admin);
    const { data: coupon } = await admin
      .from("coupons")
      .insert({
        organization_id: orgId,
        code: `ANONUSAGE-${Date.now()}`,
        discount_type: "percentage",
        discount_value: 5,
      })
      .select()
      .single();
    trackCleanup("coupons", coupon!.id);

    const anon = createAnonClient();
    const { error } = await anon.from("coupon_usage").insert({
      coupon_id: coupon!.id,
      organization_id: orgId,
    });
    expect(error).not.toBeNull();
  });

  it("user with sales.create permission can create coupon_usage in own org", async () => {
    const { orgId, org } = await createTestOrg(admin);

    const { data: coupon } = await admin
      .from("coupons")
      .insert({
        organization_id: orgId,
        code: `SALESUSAGE-${Date.now()}`,
        discount_type: "fixed_amount",
        discount_value: 1000,
      })
      .select()
      .single();
    trackCleanup("coupons", coupon!.id);

    // User with sales.create — coupon_usage insert allows it
    const user = await createTestUserWithPermissions(admin, orgId, org.name, ["sales.create"]);

    const { data: usage, error } = await user.client
      .from("coupon_usage")
      .insert({
        coupon_id: coupon!.id,
        organization_id: orgId,
        used_at: new Date().toISOString(),
      })
      .select()
      .single();

    expect(error).toBeNull();
    expect(usage!.coupon_id).toBe(coupon!.id);
    expect(usage!.organization_id).toBe(orgId);
    trackCleanup("coupon_usage", usage!.id);
  });

  it("user with coupons.update permission can create coupon_usage in own org", async () => {
    const { orgId, org } = await createTestOrg(admin);

    const { data: coupon } = await admin
      .from("coupons")
      .insert({
        organization_id: orgId,
        code: `UPDATEUSAGE-${Date.now()}`,
        discount_type: "fixed_amount",
        discount_value: 2500,
      })
      .select()
      .single();
    trackCleanup("coupons", coupon!.id);

    // User with coupons.update — coupon_usage insert also allows it
    const user = await createTestUserWithPermissions(admin, orgId, org.name, ["coupons.update"]);

    const { data: usage, error } = await user.client
      .from("coupon_usage")
      .insert({
        coupon_id: coupon!.id,
        organization_id: orgId,
      })
      .select()
      .single();

    expect(error).toBeNull();
    expect(usage!.coupon_id).toBe(coupon!.id);
    trackCleanup("coupon_usage", usage!.id);
  });

  it("RLS scopes coupon_usage to organization", async () => {
    const { orgId: orgA, org: orgAEntity } = await createTestOrg(admin);
    const { orgId: orgB } = await createTestOrg(admin);

    // Create coupon and usage in org B
    const { data: couponB } = await admin
      .from("coupons")
      .insert({
        organization_id: orgB,
        code: `USAGESCOPE-${Date.now()}`,
        discount_type: "percentage",
        discount_value: 10,
      })
      .select()
      .single();
    trackCleanup("coupons", couponB!.id);

    const { data: usageB } = await admin
      .from("coupon_usage")
      .insert({
        coupon_id: couponB!.id,
        organization_id: orgB,
      })
      .select()
      .single();
    trackCleanup("coupon_usage", usageB!.id);

    // User from org A with sales.read should NOT see org B's coupon_usage
    const userA = await createTestUserWithPermissions(admin, orgA, orgAEntity.name, ["sales.read"]);

    const { data: results, error } = await userA.client
      .from("coupon_usage")
      .select("*")
      .eq("id", usageB!.id);

    expect(error).toBeNull();
    expect(results).toEqual([]);
  });

  it("user without sales.read or sales.create cannot read coupon_usage", async () => {
    const { orgId, org } = await createTestOrg(admin);

    const { data: coupon } = await admin
      .from("coupons")
      .insert({
        organization_id: orgId,
        code: `NOUSAGEPERM-${Date.now()}`,
        discount_type: "percentage",
        discount_value: 5,
      })
      .select()
      .single();
    trackCleanup("coupons", coupon!.id);

    const { data: usage } = await admin
      .from("coupon_usage")
      .insert({
        coupon_id: coupon!.id,
        organization_id: orgId,
      })
      .select()
      .single();
    trackCleanup("coupon_usage", usage!.id);

    // User with products.read only — no sales.read or coupons.update
    const user = await createTestUserWithPermissions(admin, orgId, org.name, ["products.read"]);

    const { data: results, error } = await user.client
      .from("coupon_usage")
      .select("*")
      .eq("id", usage!.id);

    expect(error).toBeNull();
    expect(results).toEqual([]);
  });
});
