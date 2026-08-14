import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockSupabaseClient } from "@/test/mocks/supabase";

// ── Mocks ──────────────────────────────────────────────────────

const addServiceToWorkOrderMock = vi.fn();
const removeServiceFromWorkOrderMock = vi.fn();
const updateWorkOrderServicePriceMock = vi.fn();

vi.mock("@/lib/api-response", () => ({
  createRouteHandler: vi.fn((handler: unknown) => handler),
  apiError: vi.fn(
    (code: string, message: string, status: number) =>
      new Response(JSON.stringify({ error: { code, message } }), { status }),
  ),
  ok: vi.fn((data) => new Response(JSON.stringify({ data }), { status: 200 })),
  created: vi.fn(
    (data) => new Response(JSON.stringify({ data }), { status: 201 }),
  ),
}));

vi.mock("@/lib/services/work-order-items-service", () => ({
  addServiceToWorkOrder: addServiceToWorkOrderMock,
  removeServiceFromWorkOrder: removeServiceFromWorkOrderMock,
  updateWorkOrderServicePrice: updateWorkOrderServicePriceMock,
}));

vi.mock("@/lib/validation/work-orders", () => ({
  parseBody: vi.fn().mockImplementation(async (request: Request) => {
    const text = await request.text();
    return text ? JSON.parse(text) : {};
  }),
  addWorkOrderServiceSchema: {},
  updateServicePriceSchema: {},
}));

const { POST, PATCH, DELETE } = await import("./route");

// ── Tests ──────────────────────────────────────────────────────

describe("organizations/[id]/work-orders/[workOrderId]/services route", () => {
  const orgId = "org-1";
  const workOrderId = "wo-1";
  const params = { workOrderId };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── POST ──────────────────────────────────────────

  describe("POST", () => {
    const url = `http://localhost/api/organizations/${orgId}/work-orders/${workOrderId}/services`;

    it("adds a service to the work order", async () => {
      addServiceToWorkOrderMock.mockResolvedValue({ id: "svc-1" });
      const body = { service_id: "srv-1", quantity: 1, unit_price: 50000 };

      const supabase = createMockSupabaseClient();
      const request = new NextRequest(url, {
        method: "POST",
        body: JSON.stringify(body),
        headers: { "content-type": "application/json" },
      });
      const response = await (POST as any)({
        supabase,
        orgId,
        params,
        request,
      });
      const data = await response.json();

      expect(addServiceToWorkOrderMock).toHaveBeenCalledWith(
        supabase,
        workOrderId,
        orgId,
        body,
      );
      expect(data.data).toEqual({ id: "svc-1" });
      expect(response.status).toBe(201);
    });

    it("handles service error on add", async () => {
      addServiceToWorkOrderMock.mockRejectedValue(
        new Error("Service not found"),
      );

      const supabase = createMockSupabaseClient();
      const request = new NextRequest(url, {
        method: "POST",
        body: JSON.stringify({ service_id: "srv-999" }),
        headers: { "content-type": "application/json" },
      });
      await expect(
        (POST as any)({ supabase, orgId, params, request }),
      ).rejects.toThrow("Service not found");
    });
  });

  // ── PATCH ─────────────────────────────────────────

  describe("PATCH", () => {
    const url = `http://localhost/api/organizations/${orgId}/work-orders/${workOrderId}/services`;

    it("updates a service price on the work order", async () => {
      updateWorkOrderServicePriceMock.mockResolvedValue(undefined);
      const body = { final_price: 45000 };

      const supabase = createMockSupabaseClient();
      const request = new NextRequest(`${url}?serviceId=svc-1`, {
        method: "PATCH",
        body: JSON.stringify(body),
        headers: { "content-type": "application/json" },
      });
      const response = await (PATCH as any)({
        supabase,
        orgId,
        params,
        request,
      });
      const data = await response.json();

      expect(updateWorkOrderServicePriceMock).toHaveBeenCalledWith(
        supabase,
        "svc-1",
        workOrderId,
        { final_price: 45000 },
        orgId,
      );
      expect(data.data).toBeNull();
      expect(response.status).toBe(200);
    });

    it("returns error when serviceId is missing", async () => {
      const supabase = createMockSupabaseClient();
      const request = new NextRequest(url, {
        method: "PATCH",
        body: JSON.stringify({ final_price: 45000 }),
        headers: { "content-type": "application/json" },
      });
      const response = await (PATCH as any)({
        supabase,
        orgId,
        params,
        request,
      });
      const data = await response.json();

      expect(data.error).toBeDefined();
      expect(data.error.code).toBe("VALIDATION_ERROR");
      expect(response.status).toBe(400);
      expect(updateWorkOrderServicePriceMock).not.toHaveBeenCalled();
    });

    it("handles service error on update", async () => {
      updateWorkOrderServicePriceMock.mockRejectedValue(
        new Error("Update failed"),
      );

      const supabase = createMockSupabaseClient();
      const request = new NextRequest(`${url}?serviceId=svc-1`, {
        method: "PATCH",
        body: JSON.stringify({ final_price: 45000 }),
        headers: { "content-type": "application/json" },
      });
      await expect(
        (PATCH as any)({ supabase, orgId, params, request }),
      ).rejects.toThrow("Update failed");
    });
  });

  // ── DELETE ────────────────────────────────────────

  describe("DELETE", () => {
    const url = `http://localhost/api/organizations/${orgId}/work-orders/${workOrderId}/services`;

    it("removes a service from the work order", async () => {
      removeServiceFromWorkOrderMock.mockResolvedValue(undefined);

      const supabase = createMockSupabaseClient();
      const request = new NextRequest(`${url}?serviceId=svc-1`, {
        method: "DELETE",
      });
      const response = await (DELETE as any)({
        supabase,
        orgId,
        params,
        request,
      });
      const data = await response.json();

      expect(removeServiceFromWorkOrderMock).toHaveBeenCalledWith(
        supabase,
        "svc-1",
        workOrderId,
        orgId,
      );
      expect(data.data).toBeNull();
      expect(response.status).toBe(200);
    });

    it("returns error when serviceId is missing", async () => {
      const supabase = createMockSupabaseClient();
      const request = new NextRequest(url, { method: "DELETE" });
      const response = await (DELETE as any)({
        supabase,
        orgId,
        params,
        request,
      });
      const data = await response.json();

      expect(data.error).toBeDefined();
      expect(data.error.code).toBe("VALIDATION_ERROR");
      expect(response.status).toBe(400);
      expect(removeServiceFromWorkOrderMock).not.toHaveBeenCalled();
    });

    it("handles service error on remove", async () => {
      removeServiceFromWorkOrderMock.mockRejectedValue(
        new Error("Delete failed"),
      );

      const supabase = createMockSupabaseClient();
      const request = new NextRequest(`${url}?serviceId=svc-1`, {
        method: "DELETE",
      });
      await expect(
        (DELETE as any)({ supabase, orgId, params, request }),
      ).rejects.toThrow("Delete failed");
    });
  });
});
