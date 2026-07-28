import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockSupabaseClient } from "@/test/mocks/supabase";

// ── Mocks ──────────────────────────────────────────────────────

const getPurchaseOrderItemsMock = vi.fn();

vi.mock("@/lib/api-handler", () => ({
  createRouteHandler: vi.fn((handler: unknown) => handler),
}));

vi.mock("@/lib/api-response", () => ({
  ok: vi.fn(
    (data: unknown) => new Response(JSON.stringify({ data }), { status: 200 }),
  ),
}));

vi.mock("@/lib/services/purchase-order-service", () => ({
  getPurchaseOrderItems: getPurchaseOrderItemsMock,
}));

const { GET } = await import("./route");

// ── Tests ──────────────────────────────────────────────────────

describe("organizations/[id]/inventory/purchase-orders/[purchaseOrderId]/items route", () => {
  const purchaseOrderId = "po-1";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET", () => {
    it("returns purchase order items", async () => {
      const items = [{ id: "item-1", part_name: "Oil Filter", quantity: 10 }];
      getPurchaseOrderItemsMock.mockResolvedValue(items);

      const supabase = createMockSupabaseClient();
      const response = await (GET as any)({
        supabase,
        params: { purchaseOrderId },
      });
      const body = await response.json();

      expect(getPurchaseOrderItemsMock).toHaveBeenCalledWith(
        supabase,
        purchaseOrderId,
      );
      expect(body.data).toEqual(items);
    });

    it("handles service error", async () => {
      getPurchaseOrderItemsMock.mockRejectedValue(new Error("DB error"));

      const supabase = createMockSupabaseClient();
      await expect(
        (GET as any)({ supabase, params: { purchaseOrderId } }),
      ).rejects.toThrow("DB error");
    });
  });
});
