import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock refs
const checkAdminRoleMock = vi.fn();
const listOrganizationsMock = vi.fn();
const listSellerAssignmentsMock = vi.fn();

vi.mock("@/lib/api-handler", () => ({
  createRouteHandler: vi.fn((handler: unknown) => handler),
}));

vi.mock("@/lib/services/admin-service", () => ({
  checkAdminRole: checkAdminRoleMock,
  listOrganizations: listOrganizationsMock,
  listSellerAssignments: listSellerAssignmentsMock,
}));

const { GET } = await import("./route");

describe("GET /api/admin/sellers", () => {
  const user = { id: "user-1" };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns all orgs for super_admin role", async () => {
    checkAdminRoleMock.mockResolvedValue(true);
    const supabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: { id: "admin-1", user_id: "user-1", role: "super_admin" },
        error: null,
      }),
    };
    listOrganizationsMock.mockResolvedValue([{ id: "org-1", name: "Org 1" }]);

    const req = new NextRequest(new URL("http://localhost/api/admin/sellers"));
    const response = await GET({ request: req, supabase, user });
    const body = await response.json();

    expect(body.data.organizations).toEqual([{ id: "org-1", name: "Org 1" }]);
    expect(body.data.assignments).toEqual([]);
    expect(listOrganizationsMock).toHaveBeenCalled();
  });

  it("returns assigned orgs for seller role", async () => {
    checkAdminRoleMock.mockResolvedValue(true);
    const supabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: { id: "admin-2", user_id: "user-1", role: "seller" },
        error: null,
      }),
    };
    listSellerAssignmentsMock.mockResolvedValue([
      {
        id: "assign-1",
        seller_id: "admin-2",
        organization_id: "org-1",
        organization_name: "Org 1",
        organization_slug: "org-1",
      },
    ]);

    const req = new NextRequest(new URL("http://localhost/api/admin/sellers"));
    const response = await GET({ request: req, supabase, user });
    const body = await response.json();

    expect(body.data.organizations).toEqual([
      { id: "org-1", name: "Org 1", slug: "org-1" },
    ]);
    expect(body.data.assignments).toHaveLength(1);
    expect(listSellerAssignmentsMock).toHaveBeenCalledWith(supabase, "admin-2");
  });

  it("returns 403 when checkAdminRole returns false", async () => {
    checkAdminRoleMock.mockResolvedValue(false);

    const req = new NextRequest(new URL("http://localhost/api/admin/sellers"));
    const response = await GET({ request: req, supabase: {}, user });
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.error.code).toBe("FORBIDDEN");
  });

  it("returns 404 when admin user not found", async () => {
    checkAdminRoleMock.mockResolvedValue(true);
    const supabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    };

    const req = new NextRequest(new URL("http://localhost/api/admin/sellers"));
    const response = await GET({ request: req, supabase, user });
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error.code).toBe("NOT_FOUND");
  });

  it("handles service errors", async () => {
    checkAdminRoleMock.mockRejectedValue(new Error("DB error"));

    const req = new NextRequest(new URL("http://localhost/api/admin/sellers"));
    await expect(GET({ request: req, supabase: {}, user })).rejects.toThrow(
      "DB error",
    );
  });
});
