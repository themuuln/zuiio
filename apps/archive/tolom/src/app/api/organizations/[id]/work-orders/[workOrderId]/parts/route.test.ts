import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockSupabaseClient } from "@/test/mocks/supabase";

// ── Mocks ──────────────────────────────────────────────────────

const addPartToWorkOrderMock = vi.fn();
const removePartFromWorkOrderMock = vi.fn();
const updateWorkOrderPartPriceMock = vi.fn();

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
  addPartToWorkOrder: addPartToWorkOrderMock,
  removePartFromWorkOrder: removePartFromWorkOrderMock,
  updateWorkOrderPartPrice: updateWorkOrderPartPriceMock,
}));

vi.mock("@/lib/validation/work-orders", () => ({
  parseBody: vi.fn().mockImplementation(async (request: Request) => {
    const text = await request.text();
    return text ? JSON.parse(text) : {};
  }),
  addWorkOrderPartSchema: {},
  updatePartPriceSchema: {},
}));

const { POST, PATCH, DELETE } = await import("./route");

// ── Tests ──────────────────────────────────────────────────────

describe("organizations/[id]/work-orders/[workOrderId]/parts route", () => {
  const orgId = "org-1";
  const workOrderId = "wo-1";
  const params = { workOrderId };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── POST ──────────────────────────────────────────

  describe("POST", () => {
    const url = `http://localhost/api/organizations/${orgId}/work-orders/${workOrderId}/parts`;

    it("adds a part to the work order", async () => {
      addPartToWorkOrderMock.mockResolvedValue({ id: "part-1" });
      const body = { part_id: "prt-1", quantity: 2, unit_price: 15000 };

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

      expect(addPartToWorkOrderMock).toHaveBeenCalledWith(
        supabase,
        workOrderId,
        orgId,
        body,
      );
      expect(data.data).toEqual({ id: "part-1" });
      expect(response.status).toBe(201);
    });

    it("handles service error on add", async () => {
      addPartToWorkOrderMock.mockRejectedValue(new Error("Part not found"));

      const supabase = createMockSupabaseClient();
      const request = new NextRequest(url, {
        method: "POST",
        body: JSON.stringify({ part_id: "prt-999" }),
        headers: { "content-type": "application/json" },
      });
      await expect(
        (POST as any)({ supabase, orgId, params, request }),
      ).rejects.toThrow("Part not found");
    });
  });

  // ── PATCH ─────────────────────────────────────────

  describe("PATCH", () => {
    const url = `http://localhost/api/organizations/${orgId}/work-orders/${workOrderId}/parts`;

    it("updates a part price on the work order", async () => {
      updateWorkOrderPartPriceMock.mockResolvedValue(undefined);
      const body = { final_price: 12000 };

      const supabase = createMockSupabaseClient();
      const request = new NextRequest(`${url}?partId=prt-1`, {
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

      expect(updateWorkOrderPartPriceMock).toHaveBeenCalledWith(
        supabase,
        "prt-1",
        workOrderId,
        { final_price: 12000 },
        orgId,
      );
      expect(data.data).toBeNull();
      expect(response.status).toBe(200);
    });

    it("returns error when partId is missing", async () => {
      const supabase = createMockSupabaseClient();
      const request = new NextRequest(url, {
        method: "PATCH",
        body: JSON.stringify({ final_price: 12000 }),
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
      expect(updateWorkOrderPartPriceMock).not.toHaveBeenCalled();
    });

    it("handles service error on update", async () => {
      updateWorkOrderPartPriceMock.mockRejectedValue(
        new Error("Update failed"),
      );

      const supabase = createMockSupabaseClient();
      const request = new NextRequest(`${url}?partId=prt-1`, {
        method: "PATCH",
        body: JSON.stringify({ final_price: 12000 }),
        headers: { "content-type": "application/json" },
      });
      await expect(
        (PATCH as any)({ supabase, orgId, params, request }),
      ).rejects.toThrow("Update failed");
    });
  });

  // ── DELETE ────────────────────────────────────────

  describe("DELETE", () => {
    const url = `http://localhost/api/organizations/${orgId}/work-orders/${workOrderId}/parts`;

    it("removes a part from the work order", async () => {
      removePartFromWorkOrderMock.mockResolvedValue(undefined);

      const supabase = createMockSupabaseClient();
      const request = new NextRequest(`${url}?partId=prt-1`, {
        method: "DELETE",
      });
      const response = await (DELETE as any)({
        supabase,
        orgId,
        params,
        request,
      });
      const data = await response.json();

      expect(removePartFromWorkOrderMock).toHaveBeenCalledWith(
        supabase,
        "prt-1",
        workOrderId,
        orgId,
      );
      expect(data.data).toBeNull();
      expect(response.status).toBe(200);
    });

    it("returns error when partId is missing", async () => {
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
      expect(removePartFromWorkOrderMock).not.toHaveBeenCalled();
    });

    it("handles service error on remove", async () => {
      removePartFromWorkOrderMock.mockRejectedValue(new Error("Delete failed"));

      const supabase = createMockSupabaseClient();
      const request = new NextRequest(`${url}?partId=prt-1`, {
        method: "DELETE",
      });
      await expect(
        (DELETE as any)({ supabase, orgId, params, request }),
      ).rejects.toThrow("Delete failed");
    });
  });
});
