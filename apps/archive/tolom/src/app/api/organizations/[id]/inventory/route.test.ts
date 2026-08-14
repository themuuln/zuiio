import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

// ── Mocks ──────────────────────────────────────────────────────

const requirePermissionMock = vi.fn();

vi.mock("@/lib/api-handler", () => ({
  createRouteHandler: vi.fn((handler: unknown) => handler),
}));

vi.mock("@/lib/api-response", () => ({
  apiError: vi.fn(
    (type: string, message: string, status: number) =>
      new Response(JSON.stringify({ error: { code: type, message } }), {
        status,
      }),
  ),
}));

vi.mock("@/lib/supabase/role-guard", () => ({
  requirePermission: requirePermissionMock,
}));

const { GET, POST, PATCH, DELETE } = await import("./route");

// ── Tests ──────────────────────────────────────────────────────

describe("organizations/[id]/inventory route (redirect)", () => {
  const orgId = "org-1";
  const baseUrl = `http://localhost/api/organizations/${orgId}/inventory`;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET", () => {
    it("redirects to /parts by default", async () => {
      requirePermissionMock.mockResolvedValue(undefined);

      const supabase = {};
      const user = { id: "test-user" };
      const request = new NextRequest(baseUrl);
      const response = await (GET as any)({ request, orgId, supabase, user });

      expect(response.status).toBe(308);
      expect(response.headers.get("location")).toContain("/inventory/parts");
    });

    it("redirects to /balances when type=balances", async () => {
      requirePermissionMock.mockResolvedValue(undefined);

      const supabase = {};
      const user = { id: "test-user" };
      const request = new NextRequest(`${baseUrl}?type=balances`);
      const response = await (GET as any)({ request, orgId, supabase, user });

      expect(response.status).toBe(308);
      expect(response.headers.get("location")).toContain("/inventory/balances");
    });

    it("redirects to /movements when type=movements", async () => {
      requirePermissionMock.mockResolvedValue(undefined);

      const supabase = {};
      const user = { id: "test-user" };
      const request = new NextRequest(`${baseUrl}?type=movements`);
      const response = await (GET as any)({ request, orgId, supabase, user });

      expect(response.status).toBe(308);
      expect(response.headers.get("location")).toContain(
        "/inventory/movements",
      );
    });

    it("forwards query params on redirect", async () => {
      requirePermissionMock.mockResolvedValue(undefined);

      const supabase = {};
      const user = { id: "test-user" };
      const request = new NextRequest(`${baseUrl}?type=parts&q=filter`);
      const response = await (GET as any)({ request, orgId, supabase, user });

      expect(response.status).toBe(308);
      const location = response.headers.get("location") as string;
      expect(location).toContain("q=filter");
    });

    it("checks permission with read", async () => {
      requirePermissionMock.mockResolvedValue(undefined);

      const supabase = {};
      const user = { id: "test-user" };
      const request = new NextRequest(baseUrl);
      await (GET as any)({ request, orgId, supabase, user });

      expect(requirePermissionMock).toHaveBeenCalledWith(
        "inventory",
        "read",
        orgId,
        { supabase, userId: user.id },
      );
    });
  });

  describe("POST", () => {
    it("checks permission with update and redirects for valid type", async () => {
      requirePermissionMock.mockResolvedValue(undefined);

      const supabase = {};
      const user = { id: "test-user" };
      const request = new NextRequest(`${baseUrl}?type=movement`, {
        method: "POST",
        body: JSON.stringify({}),
        headers: { "content-type": "application/json" },
      });
      const response = await (POST as any)({ request, orgId, supabase, user });

      expect(requirePermissionMock).toHaveBeenCalledWith(
        "inventory",
        "update",
        orgId,
        { supabase, userId: user.id },
      );
      expect(response.status).toBe(308);
    });
  });

  describe("PATCH / DELETE", () => {
    it("PATCH checks update permission and redirects for valid type", async () => {
      requirePermissionMock.mockResolvedValue(undefined);

      const supabase = {};
      const user = { id: "test-user" };
      const request = new NextRequest(`${baseUrl}?type=part`, {
        method: "PATCH",
      });
      const response = await (PATCH as any)({ request, orgId, supabase, user });

      expect(requirePermissionMock).toHaveBeenCalledWith(
        "inventory",
        "update",
        orgId,
        { supabase, userId: user.id },
      );
      expect(response.status).toBe(308);
    });

    it("DELETE checks update permission and redirects for valid type", async () => {
      requirePermissionMock.mockResolvedValue(undefined);

      const supabase = {};
      const user = { id: "test-user" };
      const request = new NextRequest(`${baseUrl}?type=supplier`, {
        method: "DELETE",
      });
      const response = await (DELETE as any)({
        request,
        orgId,
        supabase,
        user,
      });

      expect(requirePermissionMock).toHaveBeenCalledWith(
        "inventory",
        "update",
        orgId,
        { supabase, userId: user.id },
      );
      expect(response.status).toBe(308);
    });
  });

  it("returns 400 for unsupported type", async () => {
    requirePermissionMock.mockResolvedValue(undefined);

    const supabase = {};
    const user = { id: "test-user" };
    const request = new NextRequest(`${baseUrl}?type=nonexistent`);
    const response = await (GET as any)({ request, orgId, supabase, user });

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error.code).toBe("VALIDATION");
  });
});
