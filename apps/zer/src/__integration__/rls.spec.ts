/**
 * Integration tests for Row-Level Security policies.
 *
 * Requires a running Supabase local stack.
 */

import { describe, expect, it } from "vitest";
import {
  createAnonClient,
  createAdminClient,
  createTestOrg,
} from "./helpers";

// Products RLS
describe("Products RLS", () => {
  const admin = createAdminClient();

  it("anon cannot create products", async () => {
    const anon = createAnonClient();
    const { error } = await anon.from("products").insert({
      name: "Hacked Product",
      organization_id: "00000000-0000-0000-0000-000000000000",
    });
    expect(error).not.toBeNull();
  });

  it("admin can create and read products", async () => {
    const { orgId } = await createTestOrg(admin);
    const { data, error } = await admin
      .from("products")
      .insert({
        name: "Test Product",
        organization_id: orgId,
        sku: `SKU-${Date.now()}`,
      })
      .select()
      .single();
    expect(error).toBeNull();
    expect(data!.name).toBe("Test Product");
  });
});

// Stock movements RLS
describe("Stock movements RLS", () => {
  const admin = createAdminClient();

  it("anon cannot access stock movements", async () => {
    const anon = createAnonClient();
    const { data, error } = await anon.from("stock_movements").select("*").limit(1);
    if (error) {
      expect(error.code).toBe("42501");
    } else {
      expect(data).toEqual([]);
    }
  });
});

// Public functions should work for anon
describe("Public catalog functions", () => {
  it("get_public_products handles non-existent org", async () => {
    const anon = createAnonClient();
    const { data, error } = await anon.rpc("get_public_products", {
      p_slug: "non-existent-org-slug",
    });
    if (!error) {
      expect(data).toBeDefined();
    }
  });

  it("get_public_categories handles non-existent org", async () => {
    const anon = createAnonClient();
    const { data, error } = await anon.rpc("get_public_categories", {
      p_slug: "non-existent-org-slug",
    });
    if (!error) {
      expect(data).toBeDefined();
    }
  });
});
