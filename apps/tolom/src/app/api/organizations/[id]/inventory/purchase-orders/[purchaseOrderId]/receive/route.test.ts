import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockSupabaseClient } from "@/test/mocks/supabase";

// ── Mocks ──────────────────────────────────────────────────────

const receivePurchaseOrderMock = vi.fn();

vi.mock("@/lib/api-handler", () => ({
  createRouteHandler: vi.fn((handler: unknown) => handler),
}));

vi.mock("@/lib/api-response", () => ({
  ok: vi.fn(
    (data: unknown) => new Response(JSON.stringify({ data }), { status: 200 }),
  ),
}));

vi.mock("@/lib/services/purchase-order-service", () => ({
  receivePurchaseOrder: receivePurchaseOrderMock,
}));

const { POST } = await import("./route");

// ── Tests ──────────────────────────────────────────────────────

describe("organizations/[id]/inventory/purchase-orders/[purchaseOrderId]/receive route", () => {
  const orgId = "org-1";
  const user = { id: "user-1" };
  const purchaseOrderId = "po-1";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("POST", () => {
    it("receives a purchase order", async () => {
      const po = { id: purchaseOrderId, status: "received" };
      receivePurchaseOrderMock.mockResolvedValue(po);

      const supabase = createMockSupabaseClient();
      const response = await (POST as any)({
        supabase,
        params: { purchaseOrderId },
        orgId,
        user,
      });
      const body = await response.json();

      expect(receivePurchaseOrderMock).toHaveBeenCalledWith(
        supabase,
        purchaseOrderId,
        orgId,
        user.id,
      );
      expect(body.data).toEqual(po);
    });

    it("handles service error", async () => {
      receivePurchaseOrderMock.mockRejectedValue(new Error("Receive failed"));

      const supabase = createMockSupabaseClient();
      await expect(
        (POST as any)({ supabase, params: { purchaseOrderId }, orgId, user }),
      ).rejects.toThrow("Receive failed");
    });
  });
});
