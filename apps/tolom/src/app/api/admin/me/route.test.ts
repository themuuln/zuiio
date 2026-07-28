import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock refs
const getAdminUserMock = vi.fn();

vi.mock("@/lib/api-handler", () => ({
  createSimpleRouteHandler: vi.fn((handler: unknown) => handler),
}));

vi.mock("@/lib/services/admin-service", () => ({
  getAdminUser: getAdminUserMock,
}));

const { GET } = await import("./route");

describe("GET /api/admin/me", () => {
  const user = { id: "user-1" };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns admin info when user is super_admin", async () => {
    getAdminUserMock.mockResolvedValue({
      id: "admin-1",
      user_id: "user-1",
      role: "super_admin",
    });

    const req = new NextRequest(new URL("http://localhost/api/admin/me"));
    const response = await GET({ request: req, supabase: {}, user });
    const body = await response.json();

    expect(body.data).toEqual({
      isAdmin: true,
      isSuperAdmin: true,
      role: "super_admin",
    });
  });

  it("returns admin info when user is a regular admin", async () => {
    getAdminUserMock.mockResolvedValue({
      id: "admin-2",
      user_id: "user-2",
      role: "seller",
    });

    const req = new NextRequest(new URL("http://localhost/api/admin/me"));
    const response = await GET({ request: req, supabase: {}, user });
    const body = await response.json();

    expect(body.data).toEqual({
      isAdmin: true,
      isSuperAdmin: false,
      role: "seller",
    });
  });

  it("returns no admin info when user is not an admin", async () => {
    getAdminUserMock.mockResolvedValue(null);

    const req = new NextRequest(new URL("http://localhost/api/admin/me"));
    const response = await GET({ request: req, supabase: {}, user });
    const body = await response.json();

    expect(body.data).toEqual({
      isAdmin: false,
      isSuperAdmin: false,
      role: null,
    });
  });

  it("handles service error", async () => {
    getAdminUserMock.mockRejectedValue(new Error("DB error"));

    const req = new NextRequest(new URL("http://localhost/api/admin/me"));
    await expect(GET({ request: req, supabase: {}, user })).rejects.toThrow(
      "DB error",
    );
  });
});
