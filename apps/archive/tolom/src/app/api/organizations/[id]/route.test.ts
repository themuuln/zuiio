import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

// ── Mocks ──────────────────────────────────────────────────────

const getOrganizationMock = vi.fn();
const updateOrganizationMock = vi.fn();

vi.mock("@/lib/api-handler", () => ({
  createRouteHandler: vi.fn((handler: unknown) => handler),
}));

vi.mock("@/lib/services/organization-service", () => ({
  getOrganization: getOrganizationMock,
  updateOrganization: updateOrganizationMock,
}));

const { GET, PATCH } = await import("./route");

// ── Tests ──────────────────────────────────────────────────────

describe("GET /api/organizations/[id]", () => {
  const orgId = "org-1";
  const org = {
    id: orgId,
    name: "Test Organization",
    slug: "test-org",
    logo_url: null,
    settings: {},
    is_active: true,
    branch_limit: 5,
    created_by: "user-1",
    updated_by: "user-1",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    deleted_at: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns organization on success", async () => {
    getOrganizationMock.mockResolvedValue(org);

    const response = await (GET as any)({ orgId, supabase: {} });
    const body = await response.json();

    expect(getOrganizationMock).toHaveBeenCalledWith({}, orgId);
    expect(body.data).toEqual(org);
    expect(response.status).toBe(200);
  });

  it("handles service error", async () => {
    getOrganizationMock.mockRejectedValue(new Error("DB error"));

    await expect((GET as any)({ orgId, supabase: {} })).rejects.toThrow(
      "DB error",
    );
  });
});

describe("PATCH /api/organizations/[id]", () => {
  const orgId = "org-1";
  const user = { id: "user-1" };
  const baseUrl = `http://localhost/api/organizations/${orgId}`;
  const updates = { name: "Updated Org", settings: { theme: "dark" } };
  const updatedOrg = {
    id: orgId,
    name: "Updated Org",
    slug: "test-org",
    logo_url: null,
    settings: { theme: "dark" },
    is_active: true,
    branch_limit: 5,
    created_by: "user-1",
    updated_by: "user-1",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-02T00:00:00Z",
    deleted_at: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("updates organization successfully", async () => {
    updateOrganizationMock.mockResolvedValue(updatedOrg);

    const request = new NextRequest(baseUrl, {
      method: "PATCH",
      body: JSON.stringify(updates),
      headers: { "content-type": "application/json" },
    });
    const response = await (PATCH as any)({
      request,
      orgId,
      supabase: {},
      user,
    });
    const body = await response.json();

    expect(updateOrganizationMock).toHaveBeenCalledWith(
      {},
      orgId,
      updates,
      user.id,
    );
    expect(body.data).toEqual(updatedOrg);
    expect(response.status).toBe(200);
  });

  it("handles service error", async () => {
    updateOrganizationMock.mockRejectedValue(new Error("Update failed"));

    const request = new NextRequest(baseUrl, {
      method: "PATCH",
      body: JSON.stringify(updates),
      headers: { "content-type": "application/json" },
    });
    await expect(
      (PATCH as any)({ request, orgId, supabase: {}, user }),
    ).rejects.toThrow("Update failed");
  });
});
