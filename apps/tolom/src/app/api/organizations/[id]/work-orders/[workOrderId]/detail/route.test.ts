import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockSupabaseClient } from "@/test/mocks/supabase";

// ── Mocks ──────────────────────────────────────────────────────

const getWorkOrderMock = vi.fn();

vi.mock("@/lib/api-handler", () => ({
  createRouteHandler: vi.fn((handler: unknown) => handler),
}));

vi.mock("@/lib/services/work-order-service", () => ({
  getWorkOrder: getWorkOrderMock,
}));

const { GET } = await import("./route");

// ── Tests ──────────────────────────────────────────────────────

describe("organizations/[id]/work-orders/[workOrderId]/detail route", () => {
  const orgId = "org-1";
  const workOrderId = "wo-1";
  const params = { workOrderId };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET", () => {
    it("returns work order detail on success", async () => {
      const workOrder = {
        id: workOrderId,
        services: [{ id: "svc-1", name: "Oil Change" }],
        status: "in_progress",
      };
      getWorkOrderMock.mockResolvedValue(workOrder);

      const supabase = createMockSupabaseClient();
      const response = await (GET as any)({ params, orgId, supabase });
      const body = await response.json();

      expect(getWorkOrderMock).toHaveBeenCalledWith(
        supabase,
        workOrderId,
        orgId,
      );
      expect(body.data).toEqual({ workOrder });
      expect(response.status).toBe(200);
    });

    it("propagates service error", async () => {
      getWorkOrderMock.mockRejectedValue(new Error("DB error"));

      const supabase = createMockSupabaseClient();
      await expect((GET as any)({ params, orgId, supabase })).rejects.toThrow(
        "DB error",
      );
    });
  });
});
