/**
 * Integration tests for coupon scope support
 * (migration 20260810200000_coupon_scope_tables.sql).
 *
 * submit_shop_order now evaluates applies_to against coupon_product_scope /
 * coupon_category_scope: a scoped coupon discounts ONLY the cart lines it
 * is scoped to (the eligible subtotal), rejects the order when no line
 * matches, still increments usage, and scope rows cascade on coupon delete.
 *
 * Requires a running local Supabase stack (see AGENTS.md).
 */

import { describe, expect, it } from "vitest";
import {
  createAdminClient,
  createAnonClient,
  createTestBranch,
  createTestCategory,
  createTestOrg,
  createTestProduct,
  trackCleanup,
} from "./helpers";

interface OrderRow {
  order_id: string;
  total_amount: number;
  status: string;
  delivery_fee: number | null;
  discount_amount: number | null;
  gift_card_amount: number | null;
  payment_instructions: Record<string, unknown> | null;
}

type Admin = ReturnType<typeof createAdminClient>;

interface ScopeStore {
  org: { id: string; slug: string };
  orgId: string;
  /** sale_price 5000 */
  productAId: string;
  /** sale_price 2000 */
  productBId: string;
  categoryId: string;
}

/** Org + catalog-enabled profile + branch + two published products (A 5000, B 2000) + a category on A. */
async function setupScopeStore(admin: Admin): Promise<ScopeStore> {
  const { org, orgId } = await createTestOrg(admin);

  const { error: profileError } = await admin
    .from("organization_public_profiles")
    .upsert({
      organization_id: orgId,
      catalog_enabled: true,
      display_name: org.name,
      delivery_enabled: false,
      pickup_enabled: true,
      delivery_fee_amount: 0,
      free_delivery_threshold: 0,
    });
  if (profileError) {
    throw new Error(`Failed to enable catalog: ${profileError.message}`);
  }

  const { branchId } = await createTestBranch(admin, orgId);
  const { error: defaultError } = await admin
    .from("branches")
    .update({ is_default: true })
    .eq("id", branchId);
  if (defaultError) {
    throw new Error(`Failed to set default branch: ${defaultError.message}`);
  }

  const { productId: productAId } = await createTestProduct(admin, orgId, {
    currentStock: 20,
  });
  const { productId: productBId } = await createTestProduct(admin, orgId, {
    currentStock: 20,
    name: `ProductB-${Date.now()}`,
  });
  // Distinguish prices so the eligible-subtotal math is provable.
  const { error: priceError } = await admin
    .from("products")
    .update({ sale_price: 2000, is_public: true })
    .eq("id", productBId);
  if (priceError) {
    throw new Error(`Failed to price product B: ${priceError.message}`);
  }
  await admin.from("products").update({ is_public: true }).eq("id", productAId);

  const { categoryId } = await createTestCategory(admin, orgId);
  const { error: categoryError } = await admin
    .from("products")
    .update({ category_id: categoryId })
    .eq("id", productAId);
  if (categoryError) {
    throw new Error(`Failed to categorize product A: ${categoryError.message}`);
  }

  return { org, orgId, productAId, productBId, categoryId };
}

function cartItems(lines: Array<{ product_id: string; quantity: number }>) {
  return lines.map((l) => ({
    product_id: l.product_id,
    quantity: l.quantity,
    variant_id: "",
  }));
}

async function insertScopedCoupon(
  admin: Admin,
  orgId: string,
  opts: {
    appliesTo: "selected_products" | "selected_categories";
    productIds?: string[];
    categoryIds?: string[];
    discountValue?: number;
    minPurchaseAmount?: number;
  },
) {
  const code = `SCOPE-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const { data, error } = await admin
    .from("coupons")
    .insert({
      organization_id: orgId,
      code,
      discount_type: "percentage",
      discount_value: opts.discountValue ?? 10,
      min_purchase_amount: opts.minPurchaseAmount ?? 0,
      valid_from: new Date(Date.now() - 86_400_000).toISOString(),
      is_active: true,
      usage_limit: null,
      per_customer_limit: 1,
      applies_to: opts.appliesTo,
    })
    .select("id, code")
    .single();
  if (error) throw new Error(`Failed to create coupon: ${error.message}`);
  trackCleanup("coupons", data.id);

  const table =
    opts.appliesTo === "selected_products"
      ? "coupon_product_scope"
      : "coupon_category_scope";
  const key =
    opts.appliesTo === "selected_products" ? "product_id" : "category_id";
  const ids =
    opts.appliesTo === "selected_products"
      ? (opts.productIds ?? [])
      : (opts.categoryIds ?? []);
  for (const id of ids) {
    const { error: scopeError } = await admin
      .from(table as "coupon_product_scope")
      .insert({
        organization_id: orgId,
        coupon_id: data.id,
        [key]: id,
      } as never);
    if (scopeError) {
      throw new Error(`Failed to create scope row: ${scopeError.message}`);
    }
  }

  return data as { id: string; code: string };
}

async function trackOrderContact(admin: Admin, orgId: string, phone: string) {
  const { data: contactRows } = (await admin
    .from("contacts")
    .select("id")
    .eq("organization_id", orgId)
    .eq("phone", phone)) as unknown as { data: Array<{ id: string }> };
  for (const c of contactRows ?? []) trackCleanup("contacts", c.id);
}

describe("coupon scope (selected_products / selected_categories)", () => {
  const admin = createAdminClient();

  it("selected_products coupon discounts only the matching line", async () => {
    const { org, orgId, productAId, productBId } = await setupScopeStore(admin);
    const coupon = await insertScopedCoupon(admin, orgId, {
      appliesTo: "selected_products",
      productIds: [productAId],
    });
    const anon = createAnonClient();

    // Cart: A × 1 (5000, in scope) + B × 1 (2000, out of scope).
    // Eligible subtotal = 5000 → 10% = 500 discount; B untouched.
    const { data, error } = await anon.rpc("submit_shop_order", {
      p_org_slug: org.slug,
      p_items: cartItems([
        { product_id: productAId, quantity: 1 },
        { product_id: productBId, quantity: 1 },
      ]),
      p_contact_name: "Бат",
      p_contact_phone: "99112233",
      p_coupon_code: coupon.code,
    } as never);
    expect(error).toBeNull();
    const row = Array.isArray(data) ? (data[0] as OrderRow) : null;
    expect(row?.order_id).toBeTruthy();
    expect(row?.discount_amount).toBe(500);
    expect(row?.total_amount).toBe(6500);
    trackCleanup("sales", row?.order_id);
    await trackOrderContact(admin, orgId, "99112233");
  });

  it("selected_categories coupon applies when the cart contains a product in the category", async () => {
    const { org, orgId, productAId, productBId, categoryId } =
      await setupScopeStore(admin);
    const coupon = await insertScopedCoupon(admin, orgId, {
      appliesTo: "selected_categories",
      categoryIds: [categoryId],
    });
    const anon = createAnonClient();

    // A (5000) is in the category, B (2000) is not → 10% of 5000 = 500.
    const { data, error } = await anon.rpc("submit_shop_order", {
      p_org_slug: org.slug,
      p_items: cartItems([
        { product_id: productAId, quantity: 1 },
        { product_id: productBId, quantity: 1 },
      ]),
      p_contact_name: "Бат",
      p_contact_phone: "99112233",
      p_coupon_code: coupon.code,
    } as never);
    expect(error).toBeNull();
    const row = Array.isArray(data) ? (data[0] as OrderRow) : null;
    expect(row?.order_id).toBeTruthy();
    expect(row?.discount_amount).toBe(500);
    expect(row?.total_amount).toBe(6500);
    trackCleanup("sales", row?.order_id);
    await trackOrderContact(admin, orgId, "99112233");
  });

  it("rejects the order when no cart line matches the scope", async () => {
    const { org, orgId, productAId, productBId } = await setupScopeStore(admin);
    const coupon = await insertScopedCoupon(admin, orgId, {
      appliesTo: "selected_products",
      productIds: [productAId],
    });
    const anon = createAnonClient();

    // Cart contains only B — nothing in scope → rejected.
    const { data, error } = await anon.rpc("submit_shop_order", {
      p_org_slug: org.slug,
      p_items: cartItems([{ product_id: productBId, quantity: 1 }]),
      p_contact_name: "Бат",
      p_contact_phone: "99112233",
      p_coupon_code: coupon.code,
    } as never);
    expect(data).toBeNull();
    expect(error?.message ?? "").toMatch(/тохирохгүй/i);
  });

  it("min_purchase compares against the eligible subtotal", async () => {
    const { org, orgId, productAId, productBId } = await setupScopeStore(admin);
    const coupon = await insertScopedCoupon(admin, orgId, {
      appliesTo: "selected_products",
      productIds: [productAId],
      minPurchaseAmount: 4000,
    });
    const anon = createAnonClient();

    // Eligible subtotal (A only) = 5000 ≥ 4000 → allowed despite total 7000.
    const { data, error } = await anon.rpc("submit_shop_order", {
      p_org_slug: org.slug,
      p_items: cartItems([
        { product_id: productAId, quantity: 1 },
        { product_id: productBId, quantity: 1 },
      ]),
      p_contact_name: "Бат",
      p_contact_phone: "99112233",
      p_coupon_code: coupon.code,
    } as never);
    expect(error).toBeNull();
    const row = Array.isArray(data) ? (data[0] as OrderRow) : null;
    expect(row?.order_id).toBeTruthy();
    expect(row?.discount_amount).toBe(500);
    trackCleanup("sales", row?.order_id);
    await trackOrderContact(admin, orgId, "99112233");

    // A scoped coupon whose eligible subtotal is BELOW the minimum rejects:
    // min 6000 > eligible 5000 even though the full cart is 7000.
    const strictCoupon = await insertScopedCoupon(admin, orgId, {
      appliesTo: "selected_products",
      productIds: [productAId],
      minPurchaseAmount: 6000,
    });
    const { data: rejected, error: rejectError } = await anon.rpc(
      "submit_shop_order",
      {
        p_org_slug: org.slug,
        p_items: cartItems([
          { product_id: productAId, quantity: 1 },
          { product_id: productBId, quantity: 1 },
        ]),
        p_contact_name: "Бат",
        p_contact_phone: "99112233",
        p_coupon_code: strictCoupon.code,
      } as never,
    );
    expect(rejected).toBeNull();
    expect(rejectError?.message ?? "").toMatch(/нөхцөл/i);
  });

  it("usage increment still works for scoped coupons", async () => {
    const { org, orgId, productAId } = await setupScopeStore(admin);
    const coupon = await insertScopedCoupon(admin, orgId, {
      appliesTo: "selected_products",
      productIds: [productAId],
    });
    const anon = createAnonClient();

    const { data, error } = await anon.rpc("submit_shop_order", {
      p_org_slug: org.slug,
      p_items: cartItems([{ product_id: productAId, quantity: 1 }]),
      p_contact_name: "Бат",
      p_contact_phone: "99112233",
      p_coupon_code: coupon.code,
    } as never);
    expect(error).toBeNull();
    const row = Array.isArray(data) ? (data[0] as OrderRow) : null;
    expect(row?.order_id).toBeTruthy();
    trackCleanup("sales", row?.order_id);
    await trackOrderContact(admin, orgId, "99112233");

    const { data: couponRow } = (await admin
      .from("coupons")
      .select("used_count")
      .eq("id", coupon.id)
      .single()) as unknown as { data: { used_count: number } | null };
    expect(couponRow?.used_count).toBe(1);
  });

  it("scope rows cascade when the coupon is deleted", async () => {
    const { orgId, productAId } = await setupScopeStore(admin);
    const coupon = await insertScopedCoupon(admin, orgId, {
      appliesTo: "selected_products",
      productIds: [productAId],
    });

    const { data: before } = (await admin
      .from("coupon_product_scope")
      .select("id")
      .eq("coupon_id", coupon.id)) as unknown as {
      data: Array<{ id: string }> | null;
    };
    expect(before?.length).toBe(1);

    const { error: deleteError } = await admin
      .from("coupons")
      .delete()
      .eq("id", coupon.id);
    expect(deleteError).toBeNull();

    const { data: after } = (await admin
      .from("coupon_product_scope")
      .select("id")
      .eq("coupon_id", coupon.id)) as unknown as {
      data: Array<{ id: string }> | null;
    };
    expect(after ?? []).toHaveLength(0);
  });
});
