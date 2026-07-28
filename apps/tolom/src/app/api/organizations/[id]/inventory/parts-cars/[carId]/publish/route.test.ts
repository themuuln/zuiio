import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockSupabaseClient } from "@/test/mocks/supabase";

// ── Mocks ──────────────────────────────────────────────────────

const publishPartsCarPartsToCatalogMock = vi.fn();

vi.mock("@/lib/api-handler", () => ({
  createRouteHandler: vi.fn((handler: unknown) => handler),
}));

vi.mock("@/lib/api-response", () => ({
  ok: vi.fn(
    (data: unknown) => new Response(JSON.stringify({ data }), { status: 200 }),
  ),
}));

vi.mock("@/lib/services/parts-cars-service", () => ({
  publishPartsCarPartsToCatalog: publishPartsCarPartsToCatalogMock,
}));

const { POST } = await import("./route");

// ── Tests ──────────────────────────────────────────────────────

describe("organizations/[id]/inventory/parts-cars/[carId]/publish route", () => {
  const orgId = "org-1";
  const user = { id: "user-1" };
  const carId = "car-1";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("POST", () => {
    it("publishes parts-car parts to catalog", async () => {
      const result = { published: 3, skipped: 0 };
      publishPartsCarPartsToCatalogMock.mockResolvedValue(result);

      const supabase = createMockSupabaseClient();
      const response = await (POST as any)({
        supabase,
        orgId,
        user,
        params: { carId },
      });
      const body = await response.json();

      expect(publishPartsCarPartsToCatalogMock).toHaveBeenCalledWith(
        supabase,
        orgId,
        user.id,
        carId,
      );
      expect(body.data).toEqual(result);
    });

    it("handles service error", async () => {
      publishPartsCarPartsToCatalogMock.mockRejectedValue(
        new Error("Publish failed"),
      );

      const supabase = createMockSupabaseClient();
      await expect(
        (POST as any)({ supabase, orgId, user, params: { carId } }),
      ).rejects.toThrow("Publish failed");
    });
  });
});
