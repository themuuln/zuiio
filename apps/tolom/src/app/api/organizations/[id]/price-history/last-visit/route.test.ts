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
    is: vi.fn(() => chain),
    order: vi.fn(() => chain),
    limit: vi.fn(() => chain),
    maybeSingle: vi.fn(() => chain),
    then: vi.fn((onFulfilled: (v: unknown) => unknown) =>
      Promise.resolve(resolvedValue).then(onFulfilled),
    ),
    catch: vi.fn(),
  };
  return chain;
}

describe("organizations/[id]/price-history/last-visit route", () => {
  const orgId = "org-1";
  const baseUrl = `http://localhost/api/organizations/${orgId}/price-history/last-visit`;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET", () => {
    it("returns null when no vehicle_id provided", async () => {
      const request = new NextRequest(baseUrl);
      const response = await (GET as any)({ supabase: {}, orgId, request });
      const body = await response.json();

      expect(body.data).toBeNull();
    });

    it("returns last visit data with services, parts, owner", async () => {
      const ownerChain = makeChain({
        data: { customers: { id: "cust-1", name: "John Doe" } },
        error: null,
      });
      const woChain = makeChain({
        data: { id: "wo-1", mechanic_id: "mech-1", notes: "Oil change" },
        error: null,
      });
      const svcChain = makeChain({
        data: [
          {
            service_catalog_id: "svc-1",
            service_name: "Oil Change",
            unit_price: 100,
            quantity: 1,
          },
        ],
        error: null,
      });
      const partChain = makeChain({
        data: [
          {
            part_name: "Oil Filter",
            part_number: "OF-001",
            unit_price: 25,
            quantity: 1,
          },
        ],
        error: null,
      });

      const mockFrom = vi
        .fn()
        .mockReturnValueOnce(ownerChain)
        .mockReturnValueOnce(woChain)
        .mockReturnValueOnce(svcChain)
        .mockReturnValueOnce(partChain);

      const supabase = { from: mockFrom };
      const request = new NextRequest(`${baseUrl}?vehicle_id=v-1`);
      const response = await (GET as any)({ supabase, orgId, request });
      const body = await response.json();

      expect(body.data).toHaveProperty("services");
      expect(body.data).toHaveProperty("parts");
      expect(body.data).toHaveProperty("mechanic_id", "mech-1");
      expect(body.data).toHaveProperty("notes", "Oil change");
      expect(body.data).toHaveProperty("owner");
      expect(body.data.services).toHaveLength(1);
      expect(body.data.parts).toHaveLength(1);
    });

    it("returns null when no work order found", async () => {
      const ownerChain = makeChain({
        data: { customers: { id: "cust-1" } },
        error: null,
      });
      const woChain = makeChain({ data: null, error: null });

      const mockFrom = vi
        .fn()
        .mockReturnValueOnce(ownerChain)
        .mockReturnValueOnce(woChain);

      const supabase = { from: mockFrom };
      const request = new NextRequest(`${baseUrl}?vehicle_id=v-1`);
      const response = await (GET as any)({ supabase, orgId, request });
      const body = await response.json();

      expect(body.data).toBeNull();
    });

    it("handles query error on vehicle_owners", async () => {
      const chain = makeChain({ data: null, error: { message: "DB error" } });
      const supabase = { from: vi.fn(() => chain) };

      const request = new NextRequest(`${baseUrl}?vehicle_id=v-1`);
      await expect((GET as any)({ supabase, orgId, request })).rejects.toThrow(
        "DB error",
      );
    });
  });
});
