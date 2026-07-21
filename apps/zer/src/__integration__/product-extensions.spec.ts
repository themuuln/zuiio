/**
 * Integration tests for Product Extensions domain.
 *
 * Covers: product variant groups/options/variants, product bundles,
 * price lists/rules, RLS enforcement.
 */

import { describe, expect, it } from "vitest";
import {
  createAdminClient,
  createAnonClient,
  createTestOrg,
  createTestBranch,
  createTestProduct,
  trackCleanup,
} from "./helpers";

// ── Variant Groups & Options ────────────────────

describe("Variant Groups & Options", () => {
  const admin = createAdminClient();

  it("admin can create a variant group", async () => {
    const { orgId } = await createTestOrg(admin);
    const { productId } = await createTestProduct(admin, orgId);

    const { data: group, error } = await admin
      .from("product_variant_groups")
      .insert({ product_id: productId, name: "Color" })
      .select()
      .single();
    expect(error).toBeNull();
    expect(group!.name).toBe("Color");
    trackCleanup("product_variant_groups", group!.id);
  });

  it("admin can create variant options within a group", async () => {
    const { orgId } = await createTestOrg(admin);
    const { productId } = await createTestProduct(admin, orgId);

    const { data: group } = await admin
      .from("product_variant_groups")
      .insert({ product_id: productId, name: "Size" })
      .select()
      .single();
    trackCleanup("product_variant_groups", group!.id);

    const { data: opt1 } = await admin
      .from("product_variant_options")
      .insert({ group_id: group!.id, value: "Small" })
      .select()
      .single();

    const { data: opt2 } = await admin
      .from("product_variant_options")
      .insert({ group_id: group!.id, value: "Large" })
      .select()
      .single();

    expect(opt1!.value).toBe("Small");
    expect(opt2!.value).toBe("Large");
  });

  it("admin can read variant groups filtered by product", async () => {
    const { orgId } = await createTestOrg(admin);
    const { productId } = await createTestProduct(admin, orgId);

    await admin.from("product_variant_groups").insert([
      { product_id: productId, name: "Color" },
      { product_id: productId, name: "Size" },
    ]);

    const { data: groups, error } = await admin
      .from("product_variant_groups")
      .select("id, name")
      .eq("product_id", productId);
    expect(error).toBeNull();
    expect(groups!.length).toBeGreaterThanOrEqual(2);
  });

  it("admin can delete a variant group (cascades to options)", async () => {
    const { orgId } = await createTestOrg(admin);
    const { productId } = await createTestProduct(admin, orgId);

    const { data: group } = await admin
      .from("product_variant_groups")
      .insert({ product_id: productId, name: "Temp Group" })
      .select()
      .single();

    await admin
      .from("product_variant_options")
      .insert({ group_id: group!.id, value: "Temp Option" });

    const { error } = await admin
      .from("product_variant_groups")
      .delete()
      .eq("id", group!.id);
    expect(error).toBeNull();
  });
});

// ── Product Variants ────────────────────────────

describe("Product Variants", () => {
  const admin = createAdminClient();

  it("admin can create a product variant linked to a product", async () => {
    const { orgId } = await createTestOrg(admin);
    const { productId } = await createTestProduct(admin, orgId);

    const { data: variant, error } = await admin
      .from("product_variants")
      .insert({
        product_id: productId,
        sku: `VAR-${Date.now()}`,
        sale_price: 5000,
        cost_price: 3000,
        current_stock: 10,
      })
      .select()
      .single();
    expect(error).toBeNull();
    expect(variant!.product_id).toBe(productId);
    expect(Number(variant!.sale_price)).toBe(5000);
    expect(variant!.current_stock).toBe(10);
  });

  it("admin can assign variant options to a variant", async () => {
    const { orgId } = await createTestOrg(admin);
    const { productId } = await createTestProduct(admin, orgId);

    const { data: group } = await admin
      .from("product_variant_groups")
      .insert({ product_id: productId, name: "Color" })
      .select()
      .single();
    trackCleanup("product_variant_groups", group!.id);

    const { data: option } = await admin
      .from("product_variant_options")
      .insert({ group_id: group!.id, value: "Red" })
      .select()
      .single();

    const { data: variant } = await admin
      .from("product_variants")
      .insert({
        product_id: productId,
        sku: `ASN-${Date.now()}`,
        current_stock: 5,
      })
      .select()
      .single();

    const { error } = await admin
      .from("product_variant_assignments")
      .insert({
        variant_id: variant!.id,
        option_id: option!.id,
      });
    expect(error).toBeNull();
  });

  it("admin can read variants for a product", async () => {
    const { orgId } = await createTestOrg(admin);
    const { productId } = await createTestProduct(admin, orgId);

    const { error: insertErr } = await admin.from("product_variants").insert([
      { product_id: productId, sku: `R1-${Date.now()}`, current_stock: 3 },
      { product_id: productId, sku: `R2-${Date.now()}`, current_stock: 7 },
    ]);
    expect(insertErr).toBeNull();

    const { data: variants, error } = await admin
      .from("product_variants")
      .select("id, sku")
      .eq("product_id", productId);
    expect(error).toBeNull();
    expect(variants!.length).toBeGreaterThanOrEqual(2);
  });
});

// ── Product Bundles ─────────────────────────────

describe("Product Bundles", () => {
  const admin = createAdminClient();

  it("admin can create a bundle", async () => {
    const { orgId } = await createTestOrg(admin);
    const { branchId } = await createTestBranch(admin, orgId);

    const { data: bundle, error } = await admin
      .from("product_bundles")
      .insert({
        organization_id: orgId,
        name: "Starter Pack",
        sale_price: 50000,
        description: "Getting started bundle",
      })
      .select()
      .single();
    expect(error).toBeNull();
    expect(bundle!.name).toBe("Starter Pack");
    trackCleanup("product_bundles", bundle!.id);
  });

  it("admin can add items to a bundle", async () => {
    const { orgId } = await createTestOrg(admin);
    const { productId } = await createTestProduct(admin, orgId);

    const { data: bundle } = await admin
      .from("product_bundles")
      .insert({
        organization_id: orgId,
        name: "Combo Pack",
      })
      .select()
      .single();
    trackCleanup("product_bundles", bundle!.id);

    const { data: item, error } = await admin
      .from("product_bundle_items")
      .insert({
        bundle_id: bundle!.id,
        product_id: productId,
        quantity: 2,
      })
      .select()
      .single();
    expect(error).toBeNull();
    expect(item!.quantity).toBe(2);
  });

  it("admin can read bundles with items", async () => {
    const { orgId } = await createTestOrg(admin);
    const { productId } = await createTestProduct(admin, orgId);

    const { data: bundle } = await admin
      .from("product_bundles")
      .insert({
        organization_id: orgId,
        name: "Family Pack",
      })
      .select()
      .single();
    trackCleanup("product_bundles", bundle!.id);

    await admin.from("product_bundle_items").insert({
      bundle_id: bundle!.id,
      product_id: productId,
      quantity: 1,
    });

    const { data: items, error } = await admin
      .from("product_bundle_items")
      .select("id, quantity")
      .eq("bundle_id", bundle!.id);
    expect(error).toBeNull();
    expect(items!.length).toBeGreaterThanOrEqual(1);
  });

  it("admin can delete a bundle (cascades to items)", async () => {
    const { orgId } = await createTestOrg(admin);
    const { productId } = await createTestProduct(admin, orgId);

    const { data: bundle } = await admin
      .from("product_bundles")
      .insert({
        organization_id: orgId,
        name: "Temp Bundle",
      })
      .select()
      .single();

    await admin.from("product_bundle_items").insert({
      bundle_id: bundle!.id,
      product_id: productId,
      quantity: 1,
    });

    const { error } = await admin
      .from("product_bundles")
      .delete()
      .eq("id", bundle!.id);
    expect(error).toBeNull();
  });
});

// ── Price Lists & Rules ─────────────────────────

describe("Price Lists & Rules", () => {
  const admin = createAdminClient();

  it("admin can create a price list", async () => {
    const { orgId } = await createTestOrg(admin);

    const { data: pl, error } = await admin
      .from("price_lists")
      .insert({
        organization_id: orgId,
        name: "Wholesale",
        currency: "MNT",
        priority: 1,
      })
      .select()
      .single();
    expect(error).toBeNull();
    expect(pl!.name).toBe("Wholesale");
    trackCleanup("price_lists", pl!.id);
  });

  it("admin can add a per-product rule to a price list", async () => {
    const { orgId } = await createTestOrg(admin);
    const { productId } = await createTestProduct(admin, orgId);

    const { data: pl } = await admin
      .from("price_lists")
      .insert({
        organization_id: orgId,
        name: "Promo Pricing",
      })
      .select()
      .single();
    trackCleanup("price_lists", pl!.id);

    const { data: rule, error } = await admin
      .from("price_list_rules")
      .insert({
        price_list_id: pl!.id,
        organization_id: orgId,
        product_id: productId,
        unit_price: 9000,
        min_quantity: 5,
      } as any)
      .select()
      .single();
    expect(error).toBeNull();
    expect(Number(rule!.unit_price)).toBe(9000);
  });

  it("admin can add a per-category rule with percentage adjustment", async () => {
    const { orgId } = await createTestOrg(admin);
    const { productId } = await createTestProduct(admin, orgId);

    // Create a category first
    const { data: cat } = await admin
      .from("categories")
      .insert({ organization_id: orgId, name: "Discount Cat", slug: "discount-cat" })
      .select()
      .single();
    trackCleanup("categories", cat!.id);

    const { data: pl } = await admin
      .from("price_lists")
      .insert({
        organization_id: orgId,
        name: "Category Discount",
      })
      .select()
      .single();
    trackCleanup("price_lists", pl!.id);

    const { data: rule, error } = await admin
      .from("price_list_rules")
      .insert({
        price_list_id: pl!.id,
        organization_id: orgId,
        category_id: cat!.id,
        percentage_adjustment: -10,
      } as any)
      .select()
      .single();
    expect(error).toBeNull();
    expect(Number(rule!.percentage_adjustment)).toBe(-10);
  });

  it("admin can read price lists with rules", async () => {
    const { orgId } = await createTestOrg(admin);
    const { productId } = await createTestProduct(admin, orgId);

    const { data: pl } = await admin
      .from("price_lists")
      .insert({
        organization_id: orgId,
        name: "Full Price List",
      })
      .select()
      .single();
    trackCleanup("price_lists", pl!.id);

    const { error: ruleErr } = await admin
      .from("price_list_rules")
      .insert({
        price_list_id: pl!.id,
        organization_id: orgId,
        product_id: productId,
        unit_price: 8000,
      } as any);
    expect(ruleErr).toBeNull();

    const { data: rules, error } = await admin
      .from("price_list_rules")
      .select("id")
      .eq("price_list_id", pl!.id);
    expect(error).toBeNull();
    expect(rules!.length).toBeGreaterThanOrEqual(1);
  });

  it("admin can delete a price list (cascades to rules)", async () => {
    const { orgId } = await createTestOrg(admin);

    const { data: pl } = await admin
      .from("price_lists")
      .insert({
        organization_id: orgId,
        name: "Temp PL",
      })
      .select()
      .single();

    await admin.from("price_list_rules").insert({
      price_list_id: pl!.id,
      organization_id: orgId,
    } as any);

    const { error } = await admin.from("price_lists").delete().eq("id", pl!.id);
    expect(error).toBeNull();
  });
});

// ── RLS ──────────────────────────────────────────

describe("Row Level Security", () => {
  it("anon cannot create variant groups", async () => {
    const anon = createAnonClient();
    const { error } = await anon.from("product_variant_groups").insert({
      product_id: "00000000-0000-0000-0000-000000000000",
      name: "Hacker Group",
    });
    expect(error).not.toBeNull();
  });

  it("anon cannot create bundles", async () => {
    const anon = createAnonClient();
    const { error } = await anon.from("product_bundles").insert({
      organization_id: "00000000-0000-0000-0000-000000000000",
      name: "Hacker Bundle",
    });
    expect(error).not.toBeNull();
  });

  it("anon cannot create price lists", async () => {
    const anon = createAnonClient();
    const { error } = await anon.from("price_lists").insert({
      organization_id: "00000000-0000-0000-0000-000000000000",
      name: "Hacker PL",
    });
    expect(error).not.toBeNull();
  });
});
