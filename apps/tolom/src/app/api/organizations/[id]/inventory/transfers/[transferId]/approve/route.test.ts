import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockSupabaseClient } from "@/test/mocks/supabase";

// ── Mocks ──────────────────────────────────────────────────────

const approveTransferMock = vi.fn();

vi.mock("@/lib/api-handler", () => ({
  createRouteHandler: vi.fn((handler: unknown) => handler),
}));

vi.mock("@/lib/api-response", () => ({
  ok: vi.fn(
    (data: unknown) => new Response(JSON.stringify({ data }), { status: 200 }),
  ),
}));

vi.mock("@/lib/services/transfer-service", () => ({
  approveTransfer: approveTransferMock,
}));

const { POST } = await import("./route");

// ── Tests ──────────────────────────────────────────────────────

describe("organizations/[id]/inventory/transfers/[transferId]/approve route", () => {
  const orgId = "org-1";
  const user = { id: "user-1" };
  const transferId = "transfer-1";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("POST", () => {
    it("approves a transfer", async () => {
      const transfer = { id: transferId, status: "approved" };
      approveTransferMock.mockResolvedValue(transfer);

      const supabase = createMockSupabaseClient();
      const response = await (POST as any)({
        supabase,
        orgId,
        user,
        params: { transferId },
      });
      const body = await response.json();

      expect(approveTransferMock).toHaveBeenCalledWith(
        supabase,
        transferId,
        orgId,
        user.id,
      );
      expect(body.data).toEqual(transfer);
    });

    it("handles service error", async () => {
      approveTransferMock.mockRejectedValue(new Error("Approve failed"));

      const supabase = createMockSupabaseClient();
      await expect(
        (POST as any)({ supabase, orgId, user, params: { transferId } }),
      ).rejects.toThrow("Approve failed");
    });
  });
});
