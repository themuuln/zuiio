import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockSupabaseClient } from "@/test/mocks/supabase";

// ── Mocks ──────────────────────────────────────────────────────

const getTransfersMock = vi.fn();
const createTransferMock = vi.fn();

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
}));

vi.mock("@/lib/services/transfer-service", () => ({
  getTransfers: getTransfersMock,
  createTransfer: createTransferMock,
}));

const { GET, POST } = await import("./route");

// ── Tests ──────────────────────────────────────────────────────

describe("organizations/[id]/inventory/transfers route", () => {
  const orgId = "org-1";
  const user = { id: "user-1" };
  const baseUrl = `http://localhost/api/organizations/${orgId}/inventory/transfers`;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── GET ─────────────────────────────────────────────

  describe("GET", () => {
    it("calls getTransfers with no filters when no params are provided", async () => {
      getTransfersMock.mockResolvedValue({ transfers: [], total: 0 });

      const supabase = createMockSupabaseClient();
      const request = new NextRequest(baseUrl);
      const response = await (GET as any)({ supabase, orgId, request });
      const body = await response.json();

      expect(getTransfersMock).toHaveBeenCalledWith(supabase, orgId, {});
      expect(body.data).toEqual({ transfers: [], total: 0 });
    });

    it("forwards status param", async () => {
      getTransfersMock.mockResolvedValue({ transfers: [], total: 0 });

      const supabase = createMockSupabaseClient();
      const request = new NextRequest(`${baseUrl}?status=active`);
      const response = await (GET as any)({ supabase, orgId, request });
      await response.json();

      expect(getTransfersMock).toHaveBeenCalledWith(supabase, orgId, {
        status: "active",
      });
    });

    it("forwards branch_id param", async () => {
      getTransfersMock.mockResolvedValue({ transfers: [], total: 0 });

      const supabase = createMockSupabaseClient();
      const request = new NextRequest(`${baseUrl}?branch_id=branch-1`);
      const response = await (GET as any)({ supabase, orgId, request });
      await response.json();

      expect(getTransfersMock).toHaveBeenCalledWith(supabase, orgId, {
        branchId: "branch-1",
      });
    });

    it("forwards page and page_size params", async () => {
      getTransfersMock.mockResolvedValue({ transfers: [], total: 0 });

      const supabase = createMockSupabaseClient();
      const request = new NextRequest(`${baseUrl}?page=2&page_size=50`);
      const response = await (GET as any)({ supabase, orgId, request });
      await response.json();

      expect(getTransfersMock).toHaveBeenCalledWith(supabase, orgId, {
        page: 2,
        pageSize: 50,
      });
    });

    it("handles service error", async () => {
      getTransfersMock.mockRejectedValue(new Error("DB error"));

      const supabase = createMockSupabaseClient();
      const request = new NextRequest(baseUrl);
      await expect((GET as any)({ supabase, orgId, request })).rejects.toThrow(
        "DB error",
      );
    });
  });

  // ── POST ────────────────────────────────────────────

  describe("POST", () => {
    it("creates a transfer", async () => {
      const newTransfer = { id: "transfer-1", status: "pending" };
      createTransferMock.mockResolvedValue(newTransfer);
      const body = {
        from_branch_id: "b-1",
        to_branch_id: "b-2",
        notes: "restock",
      };

      const supabase = createMockSupabaseClient();
      const request = new NextRequest(baseUrl, {
        method: "POST",
        body: JSON.stringify(body),
        headers: { "content-type": "application/json" },
      });
      const response = await (POST as any)({ supabase, orgId, request, user });
      const data = await response.json();

      expect(createTransferMock).toHaveBeenCalledWith(
        supabase,
        orgId,
        body,
        user.id,
      );
      expect(data.data).toEqual(newTransfer);
      expect(response.status).toBe(201);
    });

    it("handles service error on create", async () => {
      createTransferMock.mockRejectedValue(new Error("Invalid branch"));

      const supabase = createMockSupabaseClient();
      const request = new NextRequest(baseUrl, {
        method: "POST",
        body: JSON.stringify({ from_branch_id: "" }),
        headers: { "content-type": "application/json" },
      });
      await expect(
        (POST as any)({ supabase, orgId, request, user }),
      ).rejects.toThrow("Invalid branch");
    });
  });
});
