import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const invalidateReportCacheMock = vi.fn();

vi.mock("@/lib/api-handler", () => ({
  createRouteHandler: vi.fn((handler: unknown) => handler),
}));

vi.mock("@/lib/api-response", () => ({
  created: vi.fn(
    (data: unknown) => new Response(JSON.stringify({ data }), { status: 201 }),
  ),
}));

vi.mock("@/lib/cache/server", () => ({
  invalidateReportCache: invalidateReportCacheMock,
}));

/**
 * Build a service-role mock for the flow.
 * Handles:
 *   - .auth.admin.listUsers(), .auth.admin.createUser(), .auth.admin.deleteUser()
 *   - .from("profiles").select("id").eq("phone", ...).maybeSingle()
 *   - .from("profiles").select("id").eq("username", ...).maybeSingle()
 *   - .from("profiles").insert()
 */
function buildServiceRole() {
  const phoneMaybeSingle = vi
    .fn()
    .mockResolvedValue({ data: null, error: null });
  const phoneSelectEq = vi.fn(() => ({
    eq: vi.fn(() => ({ maybeSingle: phoneMaybeSingle })),
  }));

  const listUsers = vi
    .fn()
    .mockResolvedValue({ data: { users: [] }, error: null });
  const createUser = vi
    .fn()
    .mockResolvedValue({ data: { user: { id: "auth-user-1" } }, error: null });
  const deleteUser = vi.fn().mockResolvedValue({});

  const profileInsert = vi.fn(() => ({ error: null }));

  return {
    auth: {
      admin: {
        listUsers,
        createUser,
        deleteUser,
      },
    },
    from: vi.fn((table: string) => {
      if (table === "profiles") {
        return {
          select: phoneSelectEq,
          insert: profileInsert,
        };
      }
      return {
        select: vi.fn(() => ({ eq: vi.fn(() => ({ maybeSingle: vi.fn() })) })),
      };
    }),
  };
}

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() =>
    Promise.resolve({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: vi
                .fn()
                .mockResolvedValue({ data: null, error: null }),
            })),
          })),
        })),
        insert: vi.fn(() => ({ error: null })),
      })),
    }),
  ),
}));

vi.mock("@/lib/supabase/service-role", () => ({
  createServiceRoleClient: vi.fn(() => Promise.resolve(buildServiceRole())),
}));

const { POST } = await import("./route");

describe("organizations/[id]/members route", () => {
  const orgId = "org-1";
  const baseUrl = `http://localhost/api/organizations/${orgId}/members`;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("POST", () => {
    it("creates member with email and returns 201", async () => {
      const body = {
        email: "new@test.com",
        password: "password123",
        fullName: "New Member",
        roleId: "role-1",
      };

      const req = new NextRequest(new URL(baseUrl), {
        method: "POST",
        body: JSON.stringify(body),
      });
      const response = await (POST as any)({ request: req, orgId });
      const bodyResponse = await response.json();

      expect(bodyResponse.data).toBeDefined();
      expect(invalidateReportCacheMock).toHaveBeenCalledWith(orgId);
    });

    it("creates member with phone", async () => {
      const body = {
        identifier: "99112233",
        password: "password123",
        fullName: "Phone User",
        roleId: "role-1",
      };

      const req = new NextRequest(new URL(baseUrl), {
        method: "POST",
        body: JSON.stringify(body),
      });
      const response = await (POST as any)({ request: req, orgId });
      const bodyResponse = await response.json();

      expect(bodyResponse.data).toBeDefined();
    });

    it("throws ValidationError when no identifier provided", async () => {
      const req = new NextRequest(new URL(baseUrl), {
        method: "POST",
        body: JSON.stringify({
          password: "password123",
          fullName: "No ID",
          roleId: "role-1",
        }),
      });
      await expect((POST as any)({ request: req, orgId })).rejects.toThrow(
        "Username, phone, or email is required",
      );
    });

    it("throws ValidationError when password too short", async () => {
      const req = new NextRequest(new URL(baseUrl), {
        method: "POST",
        body: JSON.stringify({
          email: "test@test.com",
          password: "short",
          fullName: "Test",
          roleId: "role-1",
        }),
      });
      await expect((POST as any)({ request: req, orgId })).rejects.toThrow(
        "Password must be at least 8 characters",
      );
    });

    it("throws ValidationError when no roleId", async () => {
      const req = new NextRequest(new URL(baseUrl), {
        method: "POST",
        body: JSON.stringify({
          email: "test@test.com",
          password: "password123",
          fullName: "Test",
        }),
      });
      await expect((POST as any)({ request: req, orgId })).rejects.toThrow(
        "Role is required",
      );
    });
  });
});
