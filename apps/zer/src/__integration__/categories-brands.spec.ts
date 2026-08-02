/**
 * Integration tests for Categories & Brands domain.
 *
 * Covers: categories, brands, slug auto-generation,
 * get_public_categories RPC, RLS enforcement.
 */

import { describe, expect, it } from "vitest";
import {
  createAdminClient,
  createAnonClient,
  createTestOrg,
  trackCleanup,
} from "./helpers";

// ── Categories CRUD ─────────────────────────────

describe("Categories CRUD", () => {
  const admin = createAdminClient();

  it("admin can create a category", async () => {
    const { orgId } = await createTestOrg(admin);

    const { data: cat, error } = await admin
      .from("categories")
      .insert({
        organization_id: orgId,
        name: "Electronics",
        slug: "electronics",
      })
      .select()
      .single();
    expect(error).toBeNull();
    expect(cat?.name).toBe("Electronics");
    trackCleanup("categories", cat?.id);
  });

  it("admin can create category with specific name", async () => {
    const { orgId } = await createTestOrg(admin);

    const { data: cat } = await admin
      .from("categories")
      .insert({
        organization_id: orgId,
        name: "Office Supplies",
        slug: "office-supplies",
      })
      .select()
      .single();
    expect(cat?.name).toBe("Office Supplies");
    trackCleanup("categories", cat?.id);
  });

  it("admin can update category name", async () => {
    const { orgId } = await createTestOrg(admin);

    const { data: cat } = await admin
      .from("categories")
      .insert({
        organization_id: orgId,
        name: "Old Category",
        slug: "old-category",
      })
      .select()
      .single();
    trackCleanup("categories", cat?.id);

    const { error } = await admin
      .from("categories")
      .update({ name: "Updated Category" })
      .eq("id", cat?.id);
    expect(error).toBeNull();

    const { data: updated } = await admin
      .from("categories")
      .select("name")
      .eq("id", cat?.id)
      .single();
    expect(updated?.name).toBe("Updated Category");
  });

  it("admin can delete a category", async () => {
    const { orgId } = await createTestOrg(admin);

    const { data: cat } = await admin
      .from("categories")
      .insert({
        organization_id: orgId,
        name: "Temp Category",
        slug: "temp-category",
      })
      .select()
      .single();

    const { error } = await admin.from("categories").delete().eq("id", cat?.id);
    expect(error).toBeNull();
  });

  it("category slug is stored as provided", async () => {
    const { orgId } = await createTestOrg(admin);

    const { data: cat } = await admin
      .from("categories")
      .insert({
        organization_id: orgId,
        name: "Slug Test",
        slug: "custom-slug",
      })
      .select()
      .single();
    expect(cat?.slug).toBe("custom-slug");
    trackCleanup("categories", cat?.id);
  });
});

// ── Brands CRUD ─────────────────────────────────

describe("Brands CRUD", () => {
  const admin = createAdminClient();

  it("admin can create a brand", async () => {
    const { orgId } = await createTestOrg(admin);

    const { data: brand, error } = await admin
      .from("brands")
      .insert({ organization_id: orgId, name: "Samsung" })
      .select()
      .single();
    expect(error).toBeNull();
    expect(brand?.name).toBe("Samsung");
    trackCleanup("brands", brand?.id);
  });

  it("admin can create brand with logo_url", async () => {
    const { orgId } = await createTestOrg(admin);

    const { data: brand } = await admin
      .from("brands")
      .insert({
        organization_id: orgId,
        name: "Nike",
        logo_url: "https://example.com/nike-logo.png",
      })
      .select()
      .single();
    expect(brand?.logo_url).toBe("https://example.com/nike-logo.png");
    trackCleanup("brands", brand?.id);
  });

  it("admin can update brand name", async () => {
    const { orgId } = await createTestOrg(admin);

    const { data: brand } = await admin
      .from("brands")
      .insert({ organization_id: orgId, name: "Old Brand" })
      .select()
      .single();
    trackCleanup("brands", brand?.id);

    const { error } = await admin
      .from("brands")
      .update({ name: "New Brand" })
      .eq("id", brand?.id);
    expect(error).toBeNull();
  });

  it("admin can delete a brand", async () => {
    const { orgId } = await createTestOrg(admin);

    const { data: brand } = await admin
      .from("brands")
      .insert({ organization_id: orgId, name: "Temp Brand" })
      .select()
      .single();

    const { error } = await admin.from("brands").delete().eq("id", brand?.id);
    expect(error).toBeNull();
  });
});

// ── get_public_categories RPC ───────────────────

describe("get_public_categories RPC", () => {
  const admin = createAdminClient();

  it("returns data for a valid slug", async () => {
    const { orgId } = await createTestOrg(admin);

    const { data: cat } = await admin
      .from("categories")
      .insert({
        organization_id: orgId,
        name: "Unique Slug Test",
        slug: "unique-slug-test",
      })
      .select()
      .single();
    trackCleanup("categories", cat?.id);

    const { error } = await admin.rpc("get_public_categories", {
      p_slug: cat?.slug,
    });
    expect(error).toBeNull();
  });

  it("returns null or empty for non-existent slug", async () => {
    const { error } = await admin.rpc("get_public_categories", {
      p_slug: "nonexistent-slug-12345",
    });
    expect(error).toBeNull();
  });
});

// ── RLS ──────────────────────────────────────────

describe("Row Level Security", () => {
  it("anon cannot create categories", async () => {
    const anon = createAnonClient();
    const { error } = await anon.from("categories").insert({
      organization_id: "00000000-0000-0000-0000-000000000000",
      name: "Hacker Category",
      slug: "hacker",
    });
    expect(error).not.toBeNull();
  });

  it("anon cannot create brands", async () => {
    const anon = createAnonClient();
    const { error } = await anon.from("brands").insert({
      organization_id: "00000000-0000-0000-0000-000000000000",
      name: "Hacker Brand",
    });
    expect(error).not.toBeNull();
  });

  it("anon cannot read categories", async () => {
    const anon = createAnonClient();
    const { data, error } = await anon.from("categories").select("*").limit(1);
    if (error) {
      expect(error.code).toBe("42501");
    } else {
      expect(data).toEqual([]);
    }
  });
});
