import type { SupabaseClient } from "@supabase/supabase-js";
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

// ── Mocks ────────────────────────────────────────────────────────

const getWorkOrderMock = vi.fn();
const cancelWorkOrderMock = vi.fn();
const assignMechanicMock = vi.fn();
const updateWorkOrderStatusMock = vi.fn();
const parseBodyMock = vi.fn();

vi.mock("@/lib/api-response", () => ({
  createRouteHandler: vi.fn((handler: unknown) => handler),
  ok: vi.fn(
    (data: unknown) => new Response(JSON.stringify({ data }), { status: 200 }),
  ),
  apiError: vi.fn(
    (type: string, message: string, status: number) =>
      new Response(JSON.stringify({ error: { code: type, message } }), {
        status,
      }),
  ),
}));

vi.mock("@/lib/services/work-order-service", () => ({
  getWorkOrder: getWorkOrderMock,
  cancelWorkOrder: cancelWorkOrderMock,
}));

vi.mock("@/lib/services/work-order-workflow", () => ({
  assignMechanic: assignMechanicMock,
  updateWorkOrderStatus: updateWorkOrderStatusMock,
}));

vi.mock("@/lib/validation/work-orders", () => ({
  parseBody: parseBodyMock,
  updateWorkOrderSchema: {},
}));

const { GET, PATCH, DELETE } = await import("./route");

// ── Helpers ──────────────────────────────────────────────────────

/** Build a supabase mock with a .from("work_orders").update().eq().eq() chain */
function mockSupabaseChain(error: unknown = null) {
  const eq2 = vi.fn().mockResolvedValue({ error }); // second .eq() resolves
  const eq1 = vi.fn().mockReturnValue({ eq: eq2 }); // first .eq() returns obj with second .eq
  return {
    from: vi.fn((table: string) => {
      if (table === "work_orders") {
        return { update: vi.fn(() => ({ eq: eq1 })) };
      }
      return {};
    }),
  } as unknown as SupabaseClient;
}

type HandlerFn = (args: Record<string, unknown>) => Promise<Response>;

// ── Tests ────────────────────────────────────────────────────────

describe("organizations/[id]/work-orders/[workOrderId] route", () => {
  const orgId = "org-1";
  const workOrderId = "550e8400-e29b-41d4-a716-446655440000";
  const userId = "user-1";
  const baseUrl = `http://localhost/api/organizations/${orgId}/work-orders/${workOrderId}`;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET", () => {
    it("returns work order for valid UUID", async () => {
      const wo = { id: workOrderId, complaint: "Engine noise" };
      getWorkOrderMock.mockResolvedValue(wo);

      const response = await (GET as HandlerFn)({
        params: { workOrderId },
        orgId,
        supabase: {},
      });
      const body = await response.json();

      expect(getWorkOrderMock).toHaveBeenCalledWith({}, workOrderId, orgId);
      expect(body.data).toEqual(wo);
      expect(response.status).toBe(200);
    });

    it("returns 400 for invalid UUID", async () => {
      const response = await (GET as HandlerFn)({
        params: { workOrderId: "not-a-uuid" },
        orgId,
        supabase: {},
      });
      const body = await response.json();

      expect(getWorkOrderMock).not.toHaveBeenCalled();
      expect(body).toEqual({
        error: { code: "VALIDATION_ERROR", message: "Invalid work order ID" },
      });
      expect(response.status).toBe(400);
    });
  });

  describe("PATCH", () => {
    it("updates field (complaint) on field update", async () => {
      const supabase = mockSupabaseChain(null);
      parseBodyMock.mockResolvedValue({ complaint: "Engine knocking" });
      const updatedWo = { id: workOrderId, complaint: "Engine knocking" };
      getWorkOrderMock.mockResolvedValue(updatedWo);

      const request = new NextRequest(baseUrl, {
        method: "PATCH",
        body: JSON.stringify({ complaint: "Engine knocking" }),
        headers: { "content-type": "application/json" },
      });

      const response = await (PATCH as HandlerFn)({
        request,
        params: { workOrderId },
        orgId,
        supabase,
        user: { id: userId },
      });
      const body = await response.json();

      // Verify supabase was called with field update
      expect(supabase.from).toHaveBeenCalledWith("work_orders");
      expect(getWorkOrderMock).toHaveBeenCalledWith(
        supabase,
        workOrderId,
        orgId,
      );
      expect(body.data).toEqual(updatedWo);
      expect(response.status).toBe(200);
    });

    it("updates status via updateWorkOrderStatus", async () => {
      parseBodyMock.mockResolvedValue({ status: "in_progress" });
      const updatedWo = { id: workOrderId, status: "in_progress" };
      updateWorkOrderStatusMock.mockResolvedValue(updatedWo);

      const request = new NextRequest(baseUrl, {
        method: "PATCH",
        body: JSON.stringify({ status: "in_progress" }),
        headers: { "content-type": "application/json" },
      });

      const response = await (PATCH as HandlerFn)({
        request,
        params: { workOrderId },
        orgId,
        supabase: {},
        user: { id: userId },
      });
      const body = await response.json();

      expect(updateWorkOrderStatusMock).toHaveBeenCalledWith(
        {},
        workOrderId,
        orgId,
        "in_progress",
        undefined, // notes
        undefined, // loss_reason
        userId,
      );
      expect(body.data).toEqual(updatedWo);
      expect(response.status).toBe(200);
    });

    it("assigns mechanic via assignMechanic", async () => {
      parseBodyMock.mockResolvedValue({ mechanic_id: "mec-123" });
      const assignment = { id: workOrderId, mechanic_id: "mec-123" };
      assignMechanicMock.mockResolvedValue(assignment);

      const request = new NextRequest(baseUrl, {
        method: "PATCH",
        body: JSON.stringify({ mechanic_id: "mec-123" }),
        headers: { "content-type": "application/json" },
      });

      const response = await (PATCH as HandlerFn)({
        request,
        params: { workOrderId },
        orgId,
        supabase: {},
        user: { id: userId },
      });
      const body = await response.json();

      expect(assignMechanicMock).toHaveBeenCalledWith(
        {},
        workOrderId,
        orgId,
        "mec-123",
        userId,
      );
      expect(body.data).toEqual(assignment);
      expect(response.status).toBe(200);
    });
  });

  describe("DELETE", () => {
    it("cancels work order and returns null", async () => {
      cancelWorkOrderMock.mockResolvedValue(undefined);

      const response = await (DELETE as HandlerFn)({
        params: { workOrderId },
        orgId,
        supabase: {},
        user: { id: userId },
      });
      const body = await response.json();

      expect(cancelWorkOrderMock).toHaveBeenCalledWith(
        {},
        workOrderId,
        orgId,
        userId,
      );
      expect(body.data).toBeNull();
      expect(response.status).toBe(200);
    });
  });
});
