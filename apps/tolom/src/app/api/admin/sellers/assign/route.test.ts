import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock refs
const checkSuperAdminMock = vi.fn();
const assignSellerToOrgMock = vi.fn();

vi.mock("@/lib/api-handler", () => ({
  createRouteHandler: vi.fn((handler: unknown) => handler),
}));

vi.mock("@/lib/services/admin-service", () => ({
  checkSuperAdmin: checkSuperAdminMock,
  assignSellerToOrg: assignSellerToOrgMock,
}));

const { POST } = await import("./route");

describe("POST /api/admin/sellers/assign", () => {
  const user = { id: "user-1" };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("assigns seller to org successfully", async () => {
    checkSuperAdminMock.mockResolvedValue(true);
    assignSellerToOrgMock.mockResolvedValue({
      id: "assign-1",
      seller_id: "seller-1",
      organization_id: "org-1",
    });

    const req = new NextRequest("http://localhost/api/admin/sellers/assign", {
      method: "POST",
      body: JSON.stringify({ seller_id: "seller-1", organization_id: "org-1" }),
    });
    const response = await POST({ request: req, supabase: {}, user });
    const body = await response.json();

    expect(body.data.id).toBe("assign-1");
    expect(assignSellerToOrgMock).toHaveBeenCalledWith({}, "seller-1", "org-1");
  });

  it("returns 403 when not super admin", async () => {
    checkSuperAdminMock.mockResolvedValue(false);

    const req = new NextRequest("http://localhost/api/admin/sellers/assign", {
      method: "POST",
      body: JSON.stringify({ seller_id: "seller-1", organization_id: "org-1" }),
    });
    const response = await POST({ request: req, supabase: {}, user });
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.error.code).toBe("FORBIDDEN");
  });

  it("returns 400 when seller_id is missing", async () => {
    checkSuperAdminMock.mockResolvedValue(true);

    const req = new NextRequest("http://localhost/api/admin/sellers/assign", {
      method: "POST",
      body: JSON.stringify({ organization_id: "org-1" }),
    });
    const response = await POST({ request: req, supabase: {}, user });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 400 when organization_id is missing", async () => {
    checkSuperAdminMock.mockResolvedValue(true);

    const req = new NextRequest("http://localhost/api/admin/sellers/assign", {
      method: "POST",
      body: JSON.stringify({ seller_id: "seller-1" }),
    });
    const response = await POST({ request: req, supabase: {}, user });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 400 when both fields are missing", async () => {
    checkSuperAdminMock.mockResolvedValue(true);

    const req = new NextRequest("http://localhost/api/admin/sellers/assign", {
      method: "POST",
      body: JSON.stringify({}),
    });
    const response = await POST({ request: req, supabase: {}, user });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });

  it("handles service error", async () => {
    checkSuperAdminMock.mockResolvedValue(true);
    assignSellerToOrgMock.mockRejectedValue(new Error("DB error"));

    const req = new NextRequest("http://localhost/api/admin/sellers/assign", {
      method: "POST",
      body: JSON.stringify({ seller_id: "seller-1", organization_id: "org-1" }),
    });
    await expect(POST({ request: req, supabase: {}, user })).rejects.toThrow(
      "DB error",
    );
  });
});
