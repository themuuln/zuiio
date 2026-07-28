import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockSupabaseClient } from "@/test/mocks/supabase";

vi.mock("@/lib/api-handler", () => ({
  createRouteHandler: vi.fn((handler) => handler),
}));

vi.mock("@/lib/api-response", () => ({
  apiError: vi.fn((code: string, message: string, status: number) => ({
    status,
    json: async () => ({ error: { code, message } }),
  })),
  ok: vi.fn((data: unknown) => ({
    status: 200,
    json: async () => ({ data }),
  })),
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports -- vitest requires dynamic import after vi.mock
const { GET, POST } = await import("./route");

describe("GET /api/organizations/[id]/roles", () => {
  const orgId = "org-1";
  const supabase = createMockSupabaseClient();

  beforeEach(() => {
    vi.clearAllMocks();
    supabase.__qb.reset();
  });

  it("returns roles with member counts and permissions", async () => {
    const roles = [
      { id: "r1", name: "Owner", description: "Org owner", is_system: true },
      { id: "r2", name: "Coach", description: "Team coach", is_system: false },
    ];
    const memberCounts = [
      { role_id: "r1" },
      { role_id: "r2" },
      { role_id: "r2" },
    ];
    const rolePerms = [
      {
        role_id: "r1",
        permissions: {
          id: "p1",
          name: "manage",
          resource: "users",
          action: "*",
          description: "Full access",
        },
      },
      {
        role_id: "r2",
        permissions: {
          id: "p2",
          name: "view",
          resource: "teams",
          action: "read",
          description: "Read teams",
        },
      },
    ];

    supabase.__qb.resolveOnce({ data: roles, error: null });
    supabase.__qb.resolveOnce({ data: memberCounts, error: null });
    supabase.__qb.resolveOnce({ data: rolePerms, error: null });

    const response = await GET({ orgId, supabase });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data).toHaveLength(2);
    expect(body.data[0]).toEqual({
      id: "r1",
      name: "Owner",
      description: "Org owner",
      is_system: true,
      member_count: 1,
      permissions: [
        {
          id: "p1",
          name: "manage",
          resource: "users",
          action: "*",
          description: "Full access",
        },
      ],
    });
    expect(body.data[1]).toEqual({
      id: "r2",
      name: "Coach",
      description: "Team coach",
      is_system: false,
      member_count: 2,
      permissions: [
        {
          id: "p2",
          name: "view",
          resource: "teams",
          action: "read",
          description: "Read teams",
        },
      ],
    });
  });

  it("returns empty array when org has no roles", async () => {
    supabase.__qb.resolveOnce({ data: [], error: null });
    supabase.__qb.resolveOnce({ data: [], error: null });
    supabase.__qb.resolveOnce({ data: [], error: null });

    const response = await GET({ orgId, supabase });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data).toEqual([]);
  });

  it("handles roles fetch error", async () => {
    supabase.__qb.resolveOnce({
      data: null,
      error: { message: "DB connection failed" },
    });

    const response = await GET({ orgId, supabase });
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toEqual({
      code: "FETCH_ERROR",
      message: "DB connection failed",
    });
  });

  it("handles missing member counts gracefully", async () => {
    const roles = [
      { id: "r1", name: "Admin", description: "Admin role", is_system: false },
    ];

    supabase.__qb.resolveOnce({ data: roles, error: null });
    supabase.__qb.resolveOnce({
      data: null,
      error: { message: "query failed" },
    });
    supabase.__qb.resolveOnce({ data: [], error: null });

    const response = await GET({ orgId, supabase });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data).toHaveLength(1);
    expect(body.data[0].member_count).toBe(0);
    expect(body.data[0].permissions).toEqual([]);
  });
});

describe("POST /api/organizations/[id]/roles", () => {
  const orgId = "org-1";
  const supabase = createMockSupabaseClient();

  beforeEach(() => {
    vi.clearAllMocks();
    supabase.__qb.reset();
  });

  function makeRequest(body: Record<string, unknown>) {
    return new NextRequest(
      new URL("http://localhost/api/organizations/org-1/roles"),
      {
        method: "POST",
        body: JSON.stringify(body),
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  it("creates a role with permissions", async () => {
    const created = {
      id: "r-new",
      name: "Manager",
      description: "Team manager",
      is_system: false,
    };
    const permInsert = { data: null, error: null };

    // No duplicate → maybeSingle returns default { data: null }
    // Insert role → resolveOnce
    // Insert permissions → resolveOnce
    supabase.__qb.resolveOnce({ data: created, error: null });
    supabase.__qb.resolveOnce(permInsert);

    const request = makeRequest({
      name: "Manager",
      description: "Team manager",
      permissionIds: ["p1", "p2"],
    });
    const response = await POST({ orgId, supabase, request });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data).toEqual({
      id: "r-new",
      name: "Manager",
      description: "Team manager",
      is_system: false,
      member_count: 0,
      permissions: [],
    });
  });

  it("creates a role without permissions", async () => {
    const created = {
      id: "r-new",
      name: "Viewer",
      description: null,
      is_system: false,
    };

    supabase.__qb.resolveOnce({ data: created, error: null });

    const request = makeRequest({ name: "Viewer" });
    const response = await POST({ orgId, supabase, request });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data).toEqual({
      id: "r-new",
      name: "Viewer",
      description: null,
      is_system: false,
      member_count: 0,
      permissions: [],
    });
  });

  it("rejects duplicate role name (case-insensitive)", async () => {
    const qb = supabase.from("roles");
    qb.maybeSingle.mockResolvedValueOnce({
      data: { id: "existing-role" },
      error: null,
    });

    const request = makeRequest({ name: "manager" });
    const response = await POST({ orgId, supabase, request });
    const body = await response.json();

    expect(response.status).toBe(409);
    expect(body.error).toEqual({
      code: "DUPLICATE",
      message: "A role with this name already exists",
    });
  });

  it("returns 400 for empty role name", async () => {
    const request = makeRequest({ name: "" });
    const response = await POST({ orgId, supabase, request });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toEqual({
      code: "VALIDATION_ERROR",
      message: "Role name is required",
    });
  });

  it("returns 400 for role name exceeding 60 characters", async () => {
    const request = makeRequest({ name: "A".repeat(61) });
    const response = await POST({ orgId, supabase, request });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toEqual({
      code: "VALIDATION_ERROR",
      message: "Role name must be 60 characters or fewer",
    });
  });

  it("trims whitespace from role name", async () => {
    const created = {
      id: "r-new",
      name: "Manager",
      description: null,
      is_system: false,
    };

    supabase.__qb.resolveOnce({ data: created, error: null });

    const request = makeRequest({ name: "  Manager  " });
    const response = await POST({ orgId, supabase, request });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.name).toBe("Manager");
  });

  it("returns 500 on role creation error", async () => {
    supabase.__qb.resolveOnce({
      data: null,
      error: { message: "constraint violation" },
    });

    const request = makeRequest({ name: "New Role" });
    const response = await POST({ orgId, supabase, request });
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toEqual({
      code: "CREATE_ERROR",
      message: "constraint violation",
    });
  });

  it("rolls back role on permission assignment failure", async () => {
    const created = {
      id: "r-new",
      name: "Perm Role",
      description: null,
      is_system: false,
    };

    supabase.__qb.resolveOnce({ data: created, error: null });
    supabase.__qb.resolveOnce({
      data: null,
      error: { message: "invalid permission" },
    });
    // Rollback delete also uses the chain
    supabase.__qb.resolveOnce({ data: null, error: null });

    const request = makeRequest({
      name: "Perm Role",
      permissionIds: ["bad-perm"],
    });
    const response = await POST({ orgId, supabase, request });
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toEqual({
      code: "PERMISSION_ERROR",
      message: "invalid permission",
    });
  });
});
