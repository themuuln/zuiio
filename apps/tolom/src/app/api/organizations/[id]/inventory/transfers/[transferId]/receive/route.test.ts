import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockSupabaseClient } from "@/test/mocks/supabase";

// ── Mocks ──────────────────────────────────────────────────────

const receiveTransferMock = vi.fn();

vi.mock("@/lib/api-handler", () => ({
  createRouteHandler: vi.fn((handler: unknown) => handler),
}));

vi.mock("@/lib/api-response", () => ({
  ok: vi.fn(
    (data: unknown) => new Response(JSON.stringify({ data }), { status: 200 }),
  ),
}));

vi.mock("@/lib/services/transfer-service", () => ({
  receiveTransfer: receiveTransferMock,
}));

const { POST } = await import("./route");

// ── Tests ──────────────────────────────────────────────────────

describe("organizations/[id]/inventory/transfers/[transferId]/receive route", () => {
  const orgId = "org-1";
  const user = { id: "user-1" };
  const transferId = "transfer-1";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("POST", () => {
    it("receives a transfer", async () => {
      const transfer = { id: transferId, status: "received" };
      receiveTransferMock.mockResolvedValue(transfer);

      const supabase = createMockSupabaseClient();
      const response = await (POST as any)({
        supabase,
        orgId,
        user,
        params: { transferId },
      });
      const body = await response.json();

      expect(receiveTransferMock).toHaveBeenCalledWith(
        supabase,
        transferId,
        orgId,
        user.id,
      );
      expect(body.data).toEqual(transfer);
    });

    it("handles service error", async () => {
      receiveTransferMock.mockRejectedValue(new Error("Receive failed"));

      const supabase = createMockSupabaseClient();
      await expect(
        (POST as any)({ supabase, orgId, user, params: { transferId } }),
      ).rejects.toThrow("Receive failed");
    });
  });
});
