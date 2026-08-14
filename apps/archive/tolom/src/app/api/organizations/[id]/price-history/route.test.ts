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
    order: vi.fn(() => chain),
    then: vi.fn((onFulfilled: (v: unknown) => unknown) =>
      Promise.resolve(resolvedValue).then(onFulfilled),
    ),
    catch: vi.fn(),
  };
  return chain;
}

describe("organizations/[id]/price-history route", () => {
  const orgId = "org-1";
  const baseUrl = `http://localhost/api/organizations/${orgId}/price-history`;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET", () => {
    it("returns service and part price history", async () => {
      const svcChain = makeChain({
        data: [
          {
            service_catalog_id: "s1",
            unit_price: 100,
            vehicle_make: "Toyota",
            vehicle_model: "Camry",
            created_at: "2024-01-01",
          },
        ],
        error: null,
      });
      const partChain = makeChain({
        data: [
          {
            part_name: "Oil Filter",
            unit_price: 25,
            vehicle_make: "Toyota",
            vehicle_model: null,
            created_at: "2024-01-01",
          },
        ],
        error: null,
      });

      const mockFrom = vi
        .fn()
        .mockReturnValueOnce(svcChain)
        .mockReturnValueOnce(partChain);

      const supabase = { from: mockFrom };
      const request = new NextRequest(baseUrl);
      const response = await (GET as any)({ supabase, orgId, request });
      const body = await response.json();

      expect(body.data).toHaveProperty("services");
      expect(body.data).toHaveProperty("parts");
      expect(body.data.services).toHaveProperty("s1");
      expect(body.data.parts).toHaveProperty("oil filter");
    });

    it("handles service price query error", async () => {
      const chain = makeChain({ data: null, error: { message: "DB error" } });
      const supabase = { from: vi.fn(() => chain) };

      const request = new NextRequest(baseUrl);
      await expect((GET as any)({ supabase, orgId, request })).rejects.toThrow(
        "DB error",
      );
    });
  });
});
