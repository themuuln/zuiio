import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockSupabaseClient } from "@/test/mocks/supabase";

// ── Mocks ──────────────────────────────────────────────────────

const getWorkOrdersMock = vi.fn();
const createWorkOrderMock = vi.fn();

vi.mock("@/lib/api-response", () => ({
  createRouteHandler: vi.fn((handler: unknown) => handler),
  ok: vi.fn((data) => new Response(JSON.stringify({ data }), { status: 200 })),
  created: vi.fn(
    (data) => new Response(JSON.stringify({ data }), { status: 201 }),
  ),
}));

vi.mock("@/lib/services/work-order-service", () => ({
  getWorkOrders: getWorkOrdersMock,
  createWorkOrder: createWorkOrderMock,
}));

vi.mock("@/lib/validation/work-orders", () => ({
  parseBody: vi.fn().mockImplementation(async (request: Request) => {
    const text = await request.text();
    return text ? JSON.parse(text) : {};
  }),
  createWorkOrderSchema: {},
}));

const { GET, POST } = await import("./route");

// ── Tests ──────────────────────────────────────────────────────

describe("organizations/[id]/work-orders route", () => {
  const orgId = "org-1";
  const user = { id: "user-1" };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── GET ───────────────────────────────────────────

  describe("GET", () => {
    const listUrl = `http://localhost/api/organizations/${orgId}/work-orders`;

    it("lists work orders for the organization", async () => {
      getWorkOrdersMock.mockResolvedValue([
        { id: "wo-1", title: "Oil Change" },
      ]);

      const supabase = createMockSupabaseClient();
      const request = new NextRequest(listUrl);
      const response = await (GET as any)({ supabase, orgId, request });
      const body = await response.json();

      expect(getWorkOrdersMock).toHaveBeenCalledWith(supabase, orgId, {
        status: undefined,
        mechanic_id: undefined,
        date: undefined,
        search: undefined,
        branchId: undefined,
      });
      expect(body.data).toEqual([{ id: "wo-1", title: "Oil Change" }]);
    });

    it("passes query filters to getWorkOrders", async () => {
      getWorkOrdersMock.mockResolvedValue([]);

      const supabase = createMockSupabaseClient();
      const request = new NextRequest(
        `${listUrl}?status=pending&status=in_progress&mechanic=mec-1&date=2025-01-15&q=brake&branch_id=br-1`,
      );
      const response = await (GET as any)({ supabase, orgId, request });
      const body = await response.json();

      expect(getWorkOrdersMock).toHaveBeenCalledWith(supabase, orgId, {
        status: ["pending", "in_progress"],
        mechanic_id: "mec-1",
        date: "2025-01-15",
        search: "brake",
        branchId: "br-1",
      });
      expect(body.data).toEqual([]);
    });

    it("handles service error", async () => {
      getWorkOrdersMock.mockRejectedValue(new Error("DB error"));

      const supabase = createMockSupabaseClient();
      const request = new NextRequest(listUrl);
      await expect((GET as any)({ supabase, orgId, request })).rejects.toThrow(
        "DB error",
      );
    });
  });

  // ── POST ──────────────────────────────────────────

  describe("POST", () => {
    const url = `http://localhost/api/organizations/${orgId}/work-orders`;

    it("creates a work order", async () => {
      createWorkOrderMock.mockResolvedValue({ id: "wo-1" });
      const body = { title: "Brake Replacement" };

      const supabase = createMockSupabaseClient();
      const request = new NextRequest(url, {
        method: "POST",
        body: JSON.stringify(body),
        headers: { "content-type": "application/json" },
      });
      const response = await (POST as any)({ supabase, orgId, request, user });
      const data = await response.json();

      expect(createWorkOrderMock).toHaveBeenCalledWith(
        supabase,
        orgId,
        body,
        user.id,
      );
      expect(data.data).toEqual({ id: "wo-1" });
      expect(response.status).toBe(201);
    });

    it("handles service error on create", async () => {
      createWorkOrderMock.mockRejectedValue(new Error("Validation failed"));

      const supabase = createMockSupabaseClient();
      const request = new NextRequest(url, {
        method: "POST",
        body: JSON.stringify({ title: "Test" }),
        headers: { "content-type": "application/json" },
      });
      await expect(
        (POST as any)({ supabase, orgId, request, user }),
      ).rejects.toThrow("Validation failed");
    });
  });
});
