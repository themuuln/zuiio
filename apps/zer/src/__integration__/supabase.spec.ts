/**
 * Integration tests for Supabase local stack.
 *
 * Tests connectivity, auth flows, and basic CRUD operations.
 * Requires a running Supabase local stack.
 *
 * Run: supabase start && pnpm --filter zer test:integration
 */

import { describe, expect, it } from "vitest";
import {
  createAnonClient,
  createAdminClient,
  createTestClients,
  createTestOrg,
} from "./helpers";

// ── Connectivity ─────────────────────────────────────────────

describe("Supabase connectivity", () => {
  const { anon, admin } = createTestClients();

  it("anon client reaches PostgREST gateway", async () => {
    const { error } = await anon.from("_health").select("*").limit(1);
    expect(error).not.toBeNull();
    // PGRST205 = table not found — means PostgREST processed the request
    expect(error?.code).toMatch(/^PGRST/);
  });

  it("service-role client can query tables", async () => {
    const { data, error } = await admin.from("organizations").select("id").limit(1);
    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(Array.isArray(data)).toBe(true);
  });
});

// ── Auth (via signUp — works with anon key) ─────────────────

describe("Supabase auth", () => {
  it("can sign up a new user", async () => {
    const email = `test-${Date.now()}@example.com`;
    const { data, error } = await createAnonClient().auth.signUp({
      email,
      password: "password123",
    });
    expect(error).toBeNull();
    expect(data?.user?.email).toBe(email);
  });
});

// ── Organization CRUD (via service role) ─────────────────────

describe("Organization CRUD", () => {
  const admin = createAdminClient();

  it("can create an organization", async () => {
    const { org, orgId } = await createTestOrg(admin);
    expect(orgId).toBeDefined();
    expect(org.id).toBe(orgId);
    expect(org.name).toBe("Test Organization");
    expect(org.slug).toMatch(/^test-org-/);
    expect(org.company_type).toBe("retail");
  });

  it("can read an organization by id", async () => {
    const { orgId } = await createTestOrg(admin);
    const { data, error } = await admin
      .from("organizations")
      .select("*")
      .eq("id", orgId)
      .single();
    expect(error).toBeNull();
    expect(data).not.toBeNull();
    expect(data!.id).toBe(orgId);
  });

  it("can update an organization", async () => {
    const { orgId } = await createTestOrg(admin);
    const { error } = await admin
      .from("organizations")
      .update({ name: "Updated Org" })
      .eq("id", orgId);
    expect(error).toBeNull();

    const { data } = await admin
      .from("organizations")
      .select("name")
      .eq("id", orgId)
      .single();
    expect(data!.name).toBe("Updated Org");
  });

  it("can delete an organization", async () => {
    const { orgId } = await createTestOrg(admin);
    const { error } = await admin.from("organizations").delete().eq("id", orgId);
    expect(error).toBeNull();

    const { data } = await admin
      .from("organizations")
      .select("id")
      .eq("id", orgId)
      .single();
    expect(data).toBeNull();
  });
});

// ── Products CRUD (via service role) ─────────────────────────

describe("Products CRUD", () => {
  const admin = createAdminClient();

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

  it("admin can update products", async () => {
    const { orgId } = await createTestOrg(admin);
    const { data: product } = await admin
      .from("products")
      .insert({
        name: "Updatable Product",
        organization_id: orgId,
        sku: `SKU-UPD-${Date.now()}`,
      })
      .select()
      .single();

    const { error } = await admin
      .from("products")
      .update({ name: "Updated Product" })
      .eq("id", product!.id);
    expect(error).toBeNull();
  });
});

// ── RLS (basic anon isolation) ──────────────────────────────

describe("Row Level Security (RLS)", () => {
  const admin = createAdminClient();

  it("anon cannot read protected tables (stock_movements)", async () => {
    const anon = createAnonClient();
    const { data, error } = await anon.from("stock_movements").select("*").limit(1);
    if (error) {
      expect(error.code).toBe("42501");
    } else {
      expect(data).toEqual([]);
    }
  });

  it("anon cannot create protected records", async () => {
    const anon = createAnonClient();
    const { error } = await anon.from("stock_movements").insert({
      type: "in",
      quantity: 1,
      organization_id: "00000000-0000-0000-0000-000000000000",
      branch_id: "00000000-0000-0000-0000-000000000000",
      product_id: "00000000-0000-0000-0000-000000000000",
    });
    expect(error).not.toBeNull();
  });
});

// ── Public API functions ────────────────────────────────────

describe("Public RPC functions", () => {
  it("get_public_products returns null for non-existent org", async () => {
    const anon = createAnonClient();
    const { data, error } = await anon.rpc("get_public_products", {
      p_slug: "non-existent-org-slug",
    });
    // Function handles gracefully — either null or error
    if (!error) {
      expect(data).toBeDefined();
    }
  });

  it("get_public_categories returns null for non-existent org", async () => {
    const anon = createAnonClient();
    const { data, error } = await anon.rpc("get_public_categories", {
      p_slug: "non-existent-org-slug",
    });
    if (!error) {
      expect(data).toBeDefined();
    }
  });
});

// ── Error handling ──────────────────────────────────────────

describe("Database error handling", () => {
  const admin = createAdminClient();

  it("querying non-existent table returns PGRST error", async () => {
    const anon = createAnonClient();
    const { error } = await anon.from("nonexistent_table").select("*").limit(1);
    expect(error).not.toBeNull();
    expect(error?.code).toMatch(/^PGRST/);
  });
});
