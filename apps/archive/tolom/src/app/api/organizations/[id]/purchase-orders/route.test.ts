import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockSupabaseClient } from "@/test/mocks/supabase";

// ── Mocks ──────────────────────────────────────────────────────

const getPurchaseOrdersMock = vi.fn();
const createPurchaseOrderMock = vi.fn();

vi.mock("@/lib/api-handler", () => ({
  createRouteHandler: vi.fn((handler: unknown) => handler),
}));

vi.mock("@/lib/api-response", () => ({
  created: vi.fn(
    (data: unknown) => new Response(JSON.stringify({ data }), { status: 201 }),
  ),
  ok: vi.fn(
    (data: unknown) => new Response(JSON.stringify({ data }), { status: 200 }),
  ),
}));

vi.mock("@/lib/services/inventory-service", () => ({
  getPurchaseOrders: getPurchaseOrdersMock,
  createPurchaseOrder: createPurchaseOrderMock,
}));

const { GET, POST } = await import("./route");

// ── Tests ──────────────────────────────────────────────────────

describe("organizations/[id]/purchase-orders route", () => {
  const orgId = "org-1";
  const user = { id: "user-1" };
  const baseUrl = `http://localhost/api/organizations/${orgId}/purchase-orders`;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── GET ───────────────────────────────────────────

  describe("GET", () => {
    it("returns purchase orders", async () => {
      const orders = [{ id: "po-1", status: "pending" }];
      getPurchaseOrdersMock.mockResolvedValue(orders);

      const supabase = createMockSupabaseClient();
      const response = await (GET as any)({ supabase, orgId });
      const body = await response.json();

      expect(getPurchaseOrdersMock).toHaveBeenCalledWith(supabase, orgId);
      expect(body.data).toEqual(orders);
    });

    it("handles service error", async () => {
      getPurchaseOrdersMock.mockRejectedValue(new Error("DB error"));

      const supabase = createMockSupabaseClient();
      await expect((GET as any)({ supabase, orgId })).rejects.toThrow(
        "DB error",
      );
    });
  });

  // ── POST ──────────────────────────────────────────

  describe("POST", () => {
    it("creates a purchase order", async () => {
      const order = { id: "po-1", status: "pending" };
      createPurchaseOrderMock.mockResolvedValue(order);
      const bodyData = { supplier_id: "sup-1", items: [] };

      const supabase = createMockSupabaseClient();
      const request = new NextRequest(baseUrl, {
        method: "POST",
        body: JSON.stringify(bodyData),
        headers: { "content-type": "application/json" },
      });
      const response = await (POST as any)({
        supabase,
        orgId,
        request,
        user,
      });
      const data = await response.json();

      expect(createPurchaseOrderMock).toHaveBeenCalledWith(
        supabase,
        orgId,
        bodyData,
        user.id,
      );
      expect(data.data).toEqual(order);
      expect(response.status).toBe(201);
    });

    it("handles service error on create", async () => {
      createPurchaseOrderMock.mockRejectedValue(new Error("Create failed"));

      const supabase = createMockSupabaseClient();
      const request = new NextRequest(baseUrl, {
        method: "POST",
        body: JSON.stringify({ supplier_id: "sup-1" }),
        headers: { "content-type": "application/json" },
      });
      await expect(
        (POST as any)({ supabase, orgId, request, user }),
      ).rejects.toThrow("Create failed");
    });
  });
});
