import type { SupabaseClient } from "@supabase/supabase-js";
import { beforeEach, describe, expect, it, vi } from "vitest";

const cancelRefundMock = vi.fn();

vi.mock("@/lib/api-handler", () => ({
  createRouteHandler: vi.fn((handler: unknown) => handler),
}));

vi.mock("@/lib/api-response", () => ({
  ok: vi.fn(
    (data: unknown) => new Response(JSON.stringify({ data }), { status: 200 }),
  ),
}));

vi.mock("@/lib/services/refund-service", () => ({
  cancelRefund: cancelRefundMock,
}));

const { PATCH } = await import("./route");

interface HandlerContext {
  supabase: SupabaseClient;
  orgId: string;
  params: Record<string, string>;
}

describe("organizations/[id]/refunds/[refundId] route", () => {
  const orgId = "org-1";
  const refundId = "ref-1";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("PATCH", () => {
    it("cancels refund and returns result", async () => {
      const refund = { id: refundId, status: "cancelled" };
      cancelRefundMock.mockResolvedValue(refund);

      const context: HandlerContext = {
        supabase: {} as SupabaseClient,
        orgId,
        params: { refundId },
      };
      const response = await PATCH(context);
      const body = await response.json();

      expect(cancelRefundMock).toHaveBeenCalledWith({}, refundId, orgId);
      expect(body.data).toEqual(refund);
    });

    it("handles service error", async () => {
      cancelRefundMock.mockRejectedValue(new Error("Cancel failed"));

      const context: HandlerContext = {
        supabase: {} as SupabaseClient,
        orgId,
        params: { refundId },
      };
      await expect(PATCH(context)).rejects.toThrow("Cancel failed");
    });
  });
});
