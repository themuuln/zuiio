import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockSupabaseClient } from "@/test/mocks/supabase";

// ── Mocks ──────────────────────────────────────────────────────

const getTransferMock = vi.fn();

vi.mock("@/lib/api-handler", () => ({
  createRouteHandler: vi.fn((handler: unknown) => handler),
}));

vi.mock("@/lib/api-response", () => ({
  ok: vi.fn(
    (data: unknown) => new Response(JSON.stringify({ data }), { status: 200 }),
  ),
}));

vi.mock("@/lib/services/transfer-service", () => ({
  getTransfer: getTransferMock,
}));

const { GET } = await import("./route");

// ── Tests ──────────────────────────────────────────────────────

describe("organizations/[id]/inventory/transfers/[transferId] route", () => {
  const orgId = "org-1";
  const transferId = "transfer-1";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET", () => {
    it("returns a transfer by id", async () => {
      const transfer = { id: transferId, status: "pending" };
      getTransferMock.mockResolvedValue(transfer);

      const supabase = createMockSupabaseClient();
      const response = await (GET as any)({
        supabase,
        orgId,
        params: { transferId },
      });
      const body = await response.json();

      expect(getTransferMock).toHaveBeenCalledWith(supabase, transferId, orgId);
      expect(body.data).toEqual(transfer);
    });

    it("handles service error", async () => {
      getTransferMock.mockRejectedValue(new Error("Not found"));

      const supabase = createMockSupabaseClient();
      await expect(
        (GET as any)({ supabase, orgId, params: { transferId } }),
      ).rejects.toThrow("Not found");
    });
  });
});
