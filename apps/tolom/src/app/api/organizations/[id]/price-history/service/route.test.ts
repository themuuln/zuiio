import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api-handler", () => ({
  createRouteHandler: vi.fn((handler: unknown) => handler),
}));

vi.mock("@/lib/api-response", () => ({
  ok: vi.fn(
    (data: unknown) => new Response(JSON.stringify({ data }), { status: 200 }),
  ),
}));

const { GET } = await import("./route");

// ── Tests ──────────────────────────────────────────────────────

function makeChain(resolvedValue: unknown) {
  const chain: Record<string, unknown> = {
    select: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    limit: vi.fn(() => chain),
    order: vi.fn(() => chain),
    then: vi.fn((onFulfilled: (v: unknown) => unknown) =>
      Promise.resolve(resolvedValue).then(onFulfilled),
    ),
    catch: vi.fn(),
  };
  return chain;
}

describe("organizations/[id]/price-history/service route", () => {
  const orgId = "org-1";
  const baseUrl = `http://localhost/api/organizations/${orgId}/price-history/service`;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET", () => {
    it("returns service price history with service_catalog_id filter", async () => {
      const prices = [
        {
          unit_price: 100,
          final_price: 120,
          vehicle_make: "Toyota",
          vehicle_model: "Camry",
          created_at: "2024-01-01",
        },
      ];
      const chain = makeChain({ data: prices, error: null });
      const supabase = { from: vi.fn(() => chain) };

      const request = new NextRequest(`${baseUrl}?service_catalog_id=svc-1`);
      const response = await (GET as any)({ supabase, orgId, request });
      const body = await response.json();

      expect(supabase.from).toHaveBeenCalledWith("service_price_history");
      expect(body.data).toEqual(prices);
    });

    it("forwards vehicle_make and vehicle_model filters", async () => {
      const chain = makeChain({ data: [], error: null });
      const supabase = { from: vi.fn(() => chain) };

      const request = new NextRequest(
        `${baseUrl}?service_catalog_id=svc-1&vehicle_make=Toyota&vehicle_model=Camry`,
      );
      await (GET as any)({ supabase, orgId, request });

      expect(chain.eq).toHaveBeenCalledWith("service_catalog_id", "svc-1");
      expect(chain.eq).toHaveBeenCalledWith("vehicle_make", "Toyota");
      expect(chain.eq).toHaveBeenCalledWith("vehicle_model", "Camry");
    });

    it("handles query error", async () => {
      const chain = makeChain({ data: null, error: { message: "DB error" } });
      const supabase = { from: vi.fn(() => chain) };

      const request = new NextRequest(baseUrl);
      await expect((GET as any)({ supabase, orgId, request })).rejects.toThrow(
        "DB error",
      );
    });

    it("returns empty array when no data", async () => {
      const chain = makeChain({ data: null, error: null });
      const supabase = { from: vi.fn(() => chain) };

      const request = new NextRequest(baseUrl);
      const response = await (GET as any)({ supabase, orgId, request });
      const body = await response.json();

      expect(body.data).toEqual([]);
    });
  });
});
