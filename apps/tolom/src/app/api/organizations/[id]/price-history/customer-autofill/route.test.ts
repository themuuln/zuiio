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
    in: vi.fn(() => chain),
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

describe("organizations/[id]/price-history/customer-autofill route", () => {
  const orgId = "org-1";
  const baseUrl = `http://localhost/api/organizations/${orgId}/price-history/customer-autofill`;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET", () => {
    it("returns null when no customer_id provided", async () => {
      const request = new NextRequest(baseUrl);
      const response = await (GET as any)({ supabase: {}, orgId, request });
      const body = await response.json();

      expect(body.data).toBeNull();
    });

    it("returns autofill data with vehicles and last vehicle id", async () => {
      const vehicleOwnersChain = makeChain({
        data: [{ vehicle_id: "v-1" }],
        error: null,
      });
      const vehiclesChain = makeChain({
        data: [
          {
            id: "v-1",
            plate_number: "ABC123",
            make: "Toyota",
            model: "Camry",
            year: 2020,
          },
        ],
        error: null,
      });
      const workOrderChain = makeChain({
        data: { vehicle_id: "v-1" },
        error: null,
      });

      const mockFrom = vi
        .fn()
        .mockReturnValueOnce(vehicleOwnersChain)
        .mockReturnValueOnce(vehiclesChain)
        .mockReturnValueOnce(workOrderChain);

      const supabase = { from: mockFrom };
      const request = new NextRequest(`${baseUrl}?customer_id=cust-1`);
      const response = await (GET as any)({ supabase, orgId, request });
      const body = await response.json();

      expect(body.data).toHaveProperty("vehicles");
      expect(body.data).toHaveProperty("lastVehicleId");
      expect(body.data.vehicles).toHaveLength(1);
      expect(body.data.lastVehicleId).toBe("v-1");
    });

    it("returns empty vehicles when customer has no owned vehicles", async () => {
      const chain = makeChain({ data: [], error: null });
      const supabase = { from: vi.fn(() => chain) };

      const request = new NextRequest(`${baseUrl}?customer_id=cust-1`);
      const response = await (GET as any)({ supabase, orgId, request });
      const body = await response.json();

      expect(body.data.vehicles).toEqual([]);
    });

    it("handles query error", async () => {
      const chain = makeChain({ data: null, error: { message: "DB error" } });
      const supabase = { from: vi.fn(() => chain) };

      const request = new NextRequest(`${baseUrl}?customer_id=cust-1`);
      await expect((GET as any)({ supabase, orgId, request })).rejects.toThrow(
        "DB error",
      );
    });
  });
});
