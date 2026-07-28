import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockSupabaseClient } from "@/test/mocks/supabase";

// ── Mocks ──────────────────────────────────────────────────────

const removePartsCarPartMock = vi.fn();

vi.mock("@/lib/api-handler", () => ({
  createRouteHandler: vi.fn((handler: unknown) => handler),
}));

vi.mock("@/lib/api-response", () => ({
  noContent: vi.fn(() => new Response(null, { status: 204 })),
}));

vi.mock("@/lib/services/parts-cars-service", () => ({
  removePartsCarPart: removePartsCarPartMock,
}));

const { DELETE } = await import("./route");

// ── Tests ──────────────────────────────────────────────────────

describe("organizations/[id]/inventory/parts-cars/[carId]/parts/[partId] route", () => {
  const orgId = "org-1";
  const carId = "car-1";
  const partId = "part-1";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("DELETE", () => {
    it("removes a part from a parts-car", async () => {
      removePartsCarPartMock.mockResolvedValue(undefined);

      const supabase = createMockSupabaseClient();
      const response = await (DELETE as any)({
        supabase,
        orgId,
        params: { carId, partId },
      });

      expect(removePartsCarPartMock).toHaveBeenCalledWith(
        supabase,
        orgId,
        carId,
        partId,
      );
      expect(response.status).toBe(204);
    });

    it("handles service error", async () => {
      removePartsCarPartMock.mockRejectedValue(new Error("Remove failed"));

      const supabase = createMockSupabaseClient();
      await expect(
        (DELETE as any)({ supabase, orgId, params: { carId, partId } }),
      ).rejects.toThrow("Remove failed");
    });
  });
});
