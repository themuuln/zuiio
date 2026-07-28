import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock refs
const checkAdminRoleMock = vi.fn();
const getPlatformStatsMock = vi.fn();

vi.mock("@/lib/api-handler", () => ({
  createRouteHandler: vi.fn((handler: unknown) => handler),
}));

vi.mock("@/lib/services/admin-service", () => ({
  checkAdminRole: checkAdminRoleMock,
  getPlatformStats: getPlatformStatsMock,
}));

const { GET } = await import("./route");

describe("GET /api/admin/stats", () => {
  const user = { id: "user-1" };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns platform stats", async () => {
    checkAdminRoleMock.mockResolvedValue(true);
    getPlatformStatsMock.mockResolvedValue({
      total_organizations: 10,
      active_subscriptions: 8,
    });

    const req = new NextRequest(new URL("http://localhost/api/admin/stats"));
    const response = await GET({ request: req, supabase: {}, user });
    const body = await response.json();

    expect(body.data).toEqual({
      total_organizations: 10,
      active_subscriptions: 8,
    });
    expect(getPlatformStatsMock).toHaveBeenCalled();
  });

  it("returns 403 when not super admin", async () => {
    checkAdminRoleMock.mockResolvedValue(false);

    const req = new NextRequest(new URL("http://localhost/api/admin/stats"));
    const response = await GET({ request: req, supabase: {}, user });
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.error.code).toBe("FORBIDDEN");
  });

  it("handles service error", async () => {
    checkAdminRoleMock.mockResolvedValue(true);
    getPlatformStatsMock.mockRejectedValue(new Error("DB error"));

    const req = new NextRequest(new URL("http://localhost/api/admin/stats"));
    await expect(GET({ request: req, supabase: {}, user })).rejects.toThrow(
      "DB error",
    );
  });
});
