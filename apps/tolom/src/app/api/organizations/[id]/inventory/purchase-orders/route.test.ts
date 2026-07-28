import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockSupabaseClient } from "@/test/mocks/supabase";

// ── Mocks ──────────────────────────────────────────────────────

const getPurchaseOrdersMock = vi.fn();
const createPurchaseOrderMock = vi.fn();
const updatePurchaseOrderMock = vi.fn();

vi.mock("@/lib/api-handler", () => ({
  createRouteHandler: vi.fn((handler: unknown) => handler),
}));

vi.mock("@/lib/services/purchase-order-service", () => ({
  getPurchaseOrders: getPurchaseOrdersMock,
  createPurchaseOrder: createPurchaseOrderMock,
  updatePurchaseOrder: updatePurchaseOrderMock,
}));

const { GET, POST, PATCH } = await import("./route");

// ── Tests ──────────────────────────────────────────────────────

describe("organizations/[id]/inventory/purchase-orders route", () => {
  const orgId = "org-1";
  const user = { id: "user-1" };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── GET ───────────────────────────────────────────

  describe("GET", () => {
    const baseUrl = `http://localhost/api/organizations/${orgId}/inventory/purchase-orders`;

    it("lists purchase orders", async () => {
      getPurchaseOrdersMock.mockResolvedValue([
        { id: "po-1", status: "pending" },
      ]);

      const supabase = createMockSupabaseClient();
      const request = new NextRequest(baseUrl);
      const response = await (GET as any)({ supabase, orgId, request });
      const body = await response.json();

      expect(getPurchaseOrdersMock).toHaveBeenCalledWith(
        supabase,
        orgId,
        undefined,
        undefined,
        undefined,
      );
      expect(body.data).toEqual([{ id: "po-1", status: "pending" }]);
    });

    it("filters by branch_id", async () => {
      getPurchaseOrdersMock.mockResolvedValue([{ id: "po-2" }]);

      const supabase = createMockSupabaseClient();
      const request = new NextRequest(`${baseUrl}?branch_id=branch-1`);
      const response = await (GET as any)({ supabase, orgId, request });
      const body = await response.json();

      expect(getPurchaseOrdersMock).toHaveBeenCalledWith(
        supabase,
        orgId,
        undefined,
        undefined,
        "branch-1",
      );
      expect(body.data).toEqual([{ id: "po-2" }]);
    });

    it("handles service error", async () => {
      getPurchaseOrdersMock.mockRejectedValue(new Error("DB error"));

      const supabase = createMockSupabaseClient();
      const request = new NextRequest(baseUrl);
      await expect((GET as any)({ supabase, orgId, request })).rejects.toThrow(
        "DB error",
      );
    });
  });

  // ── POST ──────────────────────────────────────────

  describe("POST", () => {
    const url = `http://localhost/api/organizations/${orgId}/inventory/purchase-orders`;

    it("creates a purchase order", async () => {
      createPurchaseOrderMock.mockResolvedValue({ id: "po-1" });
      const body = { supplier_id: "sup-1", items: [] };

      const supabase = createMockSupabaseClient();
      const request = new NextRequest(url, {
        method: "POST",
        body: JSON.stringify(body),
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
        body,
        user.id,
      );
      expect(data.data).toEqual({ id: "po-1" });
      expect(response.status).toBe(201);
    });

    it("handles service error", async () => {
      createPurchaseOrderMock.mockRejectedValue(new Error("Validation failed"));

      const supabase = createMockSupabaseClient();
      const request = new NextRequest(url, {
        method: "POST",
        body: JSON.stringify({ supplier_id: "sup-1" }),
        headers: { "content-type": "application/json" },
      });
      await expect(
        (POST as any)({ supabase, orgId, request, user }),
      ).rejects.toThrow("Validation failed");
    });
  });

  // ── PATCH ─────────────────────────────────────────

  describe("PATCH", () => {
    const url = `http://localhost/api/organizations/${orgId}/inventory/purchase-orders`;

    it("updates a purchase order", async () => {
      updatePurchaseOrderMock.mockResolvedValue({
        id: "po-1",
        status: "approved",
      });
      const body = { status: "approved" };

      const supabase = createMockSupabaseClient();
      const request = new NextRequest(`${url}?poId=po-1`, {
        method: "PATCH",
        body: JSON.stringify(body),
        headers: { "content-type": "application/json" },
      });
      const response = await (PATCH as any)({
        supabase,
        orgId,
        request,
        user,
      });
      const data = await response.json();

      expect(updatePurchaseOrderMock).toHaveBeenCalledWith(
        supabase,
        "po-1",
        orgId,
        body,
        user.id,
      );
      expect(data.data).toEqual({ id: "po-1", status: "approved" });
    });

    it("returns 400 when poId is missing", async () => {
      const supabase = createMockSupabaseClient();
      const request = new NextRequest(url, {
        method: "PATCH",
        body: JSON.stringify({ status: "approved" }),
        headers: { "content-type": "application/json" },
      });
      const response = await (PATCH as any)({
        supabase,
        orgId,
        request,
        user,
      });
      const data = await response.json();

      expect(data.error).toBeDefined();
      expect(data.error.code).toBe("VALIDATION");
      expect(data.error.message).toBe("poId required");
      expect(response.status).toBe(400);
    });

    it("handles service error on update", async () => {
      updatePurchaseOrderMock.mockRejectedValue(new Error("Update failed"));

      const supabase = createMockSupabaseClient();
      const request = new NextRequest(`${url}?poId=po-1`, {
        method: "PATCH",
        body: JSON.stringify({ status: "approved" }),
        headers: { "content-type": "application/json" },
      });
      await expect(
        (PATCH as any)({ supabase, orgId, request, user }),
      ).rejects.toThrow("Update failed");
    });
  });
});
