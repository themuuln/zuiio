import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock refs
const checkSuperAdminMock = vi.fn();
const listOrganizationsMock = vi.fn();

vi.mock("@/lib/api-handler", () => ({
  createSimpleRouteHandler: vi.fn((handler: unknown) => handler),
}));

vi.mock("@/lib/errors", () => ({
  ForbiddenError: class ForbiddenError extends Error {
    constructor() {
      super("Forbidden");
      this.name = "ForbiddenError";
    }
  },
}));

vi.mock("@/lib/services/admin-service", () => ({
  checkSuperAdmin: checkSuperAdminMock,
  listOrganizations: listOrganizationsMock,
}));

const { GET } = await import("./route");

describe("GET /api/admin/organizations", () => {
  const user = { id: "user-1" };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns all organizations for super admin", async () => {
    checkSuperAdminMock.mockResolvedValue(true);
    listOrganizationsMock.mockResolvedValue([
      { id: "org-1", name: "Org 1", slug: "org-1" },
    ]);

    const req = new NextRequest(
      new URL("http://localhost/api/admin/organizations"),
    );
    const response = await GET({ request: req, supabase: {}, user });
    const body = await response.json();

    expect(body.data).toEqual([{ id: "org-1", name: "Org 1", slug: "org-1" }]);
    expect(listOrganizationsMock).toHaveBeenCalled();
  });

  it("throws ForbiddenError when not super admin", async () => {
    checkSuperAdminMock.mockResolvedValue(false);

    const req = new NextRequest(
      new URL("http://localhost/api/admin/organizations"),
    );
    await expect(GET({ request: req, supabase: {}, user })).rejects.toThrow(
      "Forbidden",
    );
  });

  it("handles service error", async () => {
    checkSuperAdminMock.mockResolvedValue(true);
    listOrganizationsMock.mockRejectedValue(new Error("DB error"));

    const req = new NextRequest(
      new URL("http://localhost/api/admin/organizations"),
    );
    await expect(GET({ request: req, supabase: {}, user })).rejects.toThrow(
      "DB error",
    );
  });
});
