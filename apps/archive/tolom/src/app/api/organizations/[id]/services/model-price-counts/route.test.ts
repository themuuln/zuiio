import { beforeEach, describe, expect, it, vi } from "vitest";

// ── Mocks ──────────────────────────────────────────────────────

const getServiceModelPriceCountsMock = vi.fn();

vi.mock("@/lib/api-handler", () => ({
  createRouteHandler: vi.fn((handler: unknown) => handler),
}));

vi.mock("@/lib/api-response", () => ({
  ok: vi.fn(
    (data: unknown) => new Response(JSON.stringify({ data }), { status: 200 }),
  ),
}));

vi.mock("@/lib/services/service-catalog-service", () => ({
  getServiceModelPriceCounts: getServiceModelPriceCountsMock,
}));

const { GET } = await import("./route");

// ── Tests ──────────────────────────────────────────────────────

describe("organizations/[id]/services/model-price-counts route", () => {
  const orgId = "org-1";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET", () => {
    it("returns ok with data from service", async () => {
      const counts = { svc_1: 3, svc_2: 0 };
      getServiceModelPriceCountsMock.mockResolvedValue(counts);

      const response = await (GET as any)({ orgId, supabase: {} });
      const body = await response.json();

      expect(getServiceModelPriceCountsMock).toHaveBeenCalledWith({}, orgId);
      expect(body.data).toEqual(counts);
      expect(response.status).toBe(200);
    });

    it("service error propagates", async () => {
      getServiceModelPriceCountsMock.mockRejectedValue(new Error("DB error"));

      await expect((GET as any)({ orgId, supabase: {} })).rejects.toThrow(
        "DB error",
      );
    });
  });
});
