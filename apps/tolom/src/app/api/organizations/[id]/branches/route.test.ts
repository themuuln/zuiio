import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

// ── Mocks ──────────────────────────────────────────────────────

const getBranchesMock = vi.fn();
const createBranchMock = vi.fn();

vi.mock("@/lib/api-handler", () => ({
  createRouteHandler: vi.fn((handler: unknown) => handler),
}));

vi.mock("@/lib/api-response", () => ({
  ok: vi.fn(
    (data: unknown) => new Response(JSON.stringify({ data }), { status: 200 }),
  ),
  created: vi.fn(
    (data: unknown) => new Response(JSON.stringify({ data }), { status: 201 }),
  ),
  apiError: vi.fn(
    (type: string, message: string, status: number) =>
      new Response(JSON.stringify({ error: { code: type, message } }), {
        status,
      }),
  ),
}));

vi.mock("@/lib/services/branch-service", () => ({
  getBranches: getBranchesMock,
  createBranch: createBranchMock,
}));

const { GET, POST } = await import("./route");

// ── Tests ──────────────────────────────────────────────────────

describe("organizations/[id]/branches route", () => {
  const orgId = "org-1";
  const userId = "user-1";
  const baseUrl = `http://localhost/api/organizations/${orgId}/branches`;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET", () => {
    it("returns branches on success", async () => {
      const branches = [{ id: "br-1", name: "Main Street" }];
      getBranchesMock.mockResolvedValue(branches);

      const response = await (GET as any)({ orgId, supabase: {} });
      const body = await response.json();

      expect(getBranchesMock).toHaveBeenCalledWith({}, orgId);
      expect(body.data).toEqual(branches);
      expect(response.status).toBe(200);
    });

    it("handles service error", async () => {
      getBranchesMock.mockRejectedValue(new Error("DB error"));

      await expect((GET as any)({ orgId, supabase: {} })).rejects.toThrow(
        "DB error",
      );
    });
  });

  describe("POST", () => {
    it("creates a branch on success", async () => {
      const branch = { id: "br-1", name: "Main Street" };
      createBranchMock.mockResolvedValue(branch);

      const request = new NextRequest(baseUrl, {
        method: "POST",
        body: JSON.stringify({ name: "Main Street", address: "123 Main St" }),
        headers: { "content-type": "application/json" },
      });
      const response = await (POST as any)({
        request,
        orgId,
        supabase: {},
        user: { id: userId },
      });
      const body = await response.json();

      expect(createBranchMock).toHaveBeenCalledWith(
        {},
        orgId,
        {
          name: "Main Street",
          address: "123 Main St",
        },
        userId,
      );
      expect(body.data).toEqual(branch);
      expect(response.status).toBe(201);
    });

    it("handles service error", async () => {
      createBranchMock.mockRejectedValue(new Error("DB error"));

      const request = new NextRequest(baseUrl, {
        method: "POST",
        body: JSON.stringify({ name: "Main Street" }),
        headers: { "content-type": "application/json" },
      });
      await expect(
        (POST as any)({ request, orgId, supabase: {}, user: { id: userId } }),
      ).rejects.toThrow("DB error");
    });
  });
});
