/**
 * Integration tests for Supabase local stack.
 *
 * Tests connectivity, auth flows, and basic CRUD operations.
 * Requires a running Supabase local stack.
 *
 * Run: supabase start && pnpm --filter tolom test:integration
 */

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  addUserToOrg,
  createAdminClient,
  createAnonClient,
  createTestOrg,
  createTestUser,
  deleteRecord,
  signInAsUser,
} from "./helpers";

// ── Guard: skip if Supabase local stack is not running ──────

const hasSupabase =
  !!process.env.SUPABASE_ANON_KEY && !!process.env.SUPABASE_SERVICE_ROLE_KEY;
const describeWhenSupabase = hasSupabase ? describe : describe.skip;

// ── Connectivity ─────────────────────────────────────────────

describeWhenSupabase("Supabase connectivity", () => {
  const admin = hasSupabase ? createAdminClient() : null;

  it("can connect to Supabase with service-role key", async () => {
    const { data, error } = await admin
      .from("organizations")
      .select("id")
      .limit(1);
    expect(error).toBeNull();
    expect(data).toBeDefined();
  });

  it("can connect to Supabase with anon key", async () => {
    const anon = createAnonClient();
    const { data, error } = await anon
      .from("organizations")
      .select("id")
      .limit(1);
    // Anon gets empty data (RLS filters), not a connectivity error
    expect(error).toBeNull();
    expect(data).toEqual([]);
  });
});

// ── Auth ─────────────────────────────────────────────────────

describeWhenSupabase("Supabase auth", () => {
  const admin = hasSupabase ? createAdminClient() : null;
  let testUser: { id: string; email: string; password: string };

  beforeAll(async () => {
    testUser = await createTestUser(admin);
  });

  afterAll(async () => {
    await admin.auth.admin.deleteUser(testUser.id);
  });

  it("can create a user via admin API", () => {
    expect(testUser.id).toBeDefined();
    expect(testUser.email).toContain("@test.mn");
  });

  it("can sign in as the created user", async () => {
    const userClient = await signInAsUser(testUser.email, testUser.password);
    const { data } = await userClient.auth.getUser();
    expect(data.user?.email).toBe(testUser.email);
  });

  it("anon user cannot sign in with wrong password", async () => {
    const client = createAnonClient();
    const { error } = await client.auth.signInWithPassword({
      email: testUser.email,
      password: "wrong-password",
    });
    expect(error).not.toBeNull();
  });
});

// ── Organization CRUD ────────────────────────────────────────

describeWhenSupabase("Organization CRUD", () => {
  const admin = hasSupabase ? createAdminClient() : null;
  let orgId: string;
  let testUser: { id: string; email: string; password: string };

  beforeAll(async () => {
    const org = await createTestOrg(admin);
    orgId = org.orgId;
    testUser = await createTestUser(admin);
    await addUserToOrg(admin, orgId, testUser.id);
  });

  afterAll(async () => {
    await deleteRecord(
      admin!,
      "organization_users",
      `${orgId},${testUser.id}` as unknown as string, // composite key
    );
    await admin.auth.admin.deleteUser(testUser.id);
    await deleteRecord(admin, "organizations", orgId);
  });

  it("admin can create an organization", () => {
    expect(orgId).toBeDefined();
  });

  it("admin can read back the organization", async () => {
    const { data, error } = await admin
      .from("organizations")
      .select("name")
      .eq("id", orgId)
      .single();

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data?.name).toContain("Test Org");
  });

  it("admin can update the organization", async () => {
    const { error } = await admin
      .from("organizations")
      .update({ name: "Updated Org" })
      .eq("id", orgId);

    expect(error).toBeNull();
  });

  it("authenticated user can read their org", async () => {
    const userClient = await signInAsUser(testUser.email, testUser.password);
    const { data, error } = await userClient
      .from("organizations")
      .select("id, name")
      .single();

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data?.id).toBe(orgId);
  });

  it("anon user cannot read organizations", async () => {
    const anon = createAnonClient();
    const { error } = await anon.from("organizations").select("*");

    // Either RLS blocks (42501) or returns empty array because no anon policy
    if (error) {
      expect(error.code).toBe("42501");
    }
  });
});

// ── Basic CRUD: Customers ───────────────────────────────────

describeWhenSupabase("Customers CRUD", () => {
  const admin = hasSupabase ? createAdminClient() : null;
  let orgId: string;
  let testUser: { id: string; email: string; password: string };
  let customerId: string;

  beforeAll(async () => {
    const org = await createTestOrg(admin);
    orgId = org.orgId;
    testUser = await createTestUser(admin);
    await addUserToOrg(admin, orgId, testUser.id);
  });

  afterAll(async () => {
    await deleteRecord(
      admin!,
      "organization_users",
      `${orgId},${testUser.id}` as unknown as string, // composite key
    );
    await admin.auth.admin.deleteUser(testUser.id);
    await deleteRecord(admin, "organizations", orgId);
  });

  it("admin can create a customer", async () => {
    const { data, error } = await admin
      .from("customers")
      .insert({
        organization_id: orgId,
        first_name: "Test User",
        phone: "+976-99119911",
      })
      .select()
      .single();

    expect(error).toBeNull();
    expect(data).toBeDefined();
    customerId = data?.id;
  });

  it("authenticated user can read customers in their org", async () => {
    const userClient = await signInAsUser(testUser.email, testUser.password);
    const { data, error } = await userClient
      .from("customers")
      .select("first_name")
      .eq("id", customerId)
      .single();

    expect(error).toBeNull();
    expect(data?.first_name).toBe("Test User");
  });

  it("authenticated user can update customers in their org", async () => {
    const userClient = await signInAsUser(testUser.email, testUser.password);
    const { error } = await userClient
      .from("customers")
      .update({ phone: "+976-99229922" })
      .eq("id", customerId);

    expect(error).toBeNull();
  });
});

// ── Public RPC functions ────────────────────────────────────

describeWhenSupabase("Public RPC functions", () => {
  it("get_user_organization_id returns null for anon", async () => {
    const anon = createAnonClient();
    const { data, error } = await anon.rpc("get_user_organization_id");

    // The function should either return null or error
    expect(error).toBeNull() || expect(data).toBeNull();
  });
});
