import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api-handler", () => ({
  createRouteHandler: vi.fn((handler: unknown) => handler),
}));

vi.mock("@/lib/api-response", () => ({
  ok: vi.fn(
    (data: unknown) => new Response(JSON.stringify({ data }), { status: 200 }),
  ),
  created: vi.fn(
    (data: unknown) => new Response(JSON.stringify({ data }), { status: 201 }),
  ),
  apiError: vi.fn(
    (type: string, message: string, status: number) =>
      new Response(JSON.stringify({ error: { code: type, message } }), {
        status,
      }),
  ),
}));

const { GET } = await import("./route");

describe("GET /api/organizations/[id]/inventory/parts/[partId]/vehicle-models", () => {
  const orgId = "org-1";
  const partId = "part-1";
  const mockVehicleModels = [
    {
      id: "vm-1",
      part_id: partId,
      vehicle_model_id: "vm-1",
      specific_price: "150.00",
      compatibility_notes: "Fits all trims",
      created_at: "2025-01-15T00:00:00Z",
      updated_at: "2025-01-15T00:00:00Z",
      vehicle_model: { id: "vm-1", make: "Toyota", model: "Camry" },
    },
    {
      id: "vm-2",
      part_id: partId,
      vehicle_model_id: "vm-2",
      specific_price: null,
      compatibility_notes: null,
      created_at: "2025-01-10T00:00:00Z",
      updated_at: "2025-01-10T00:00:00Z",
      vehicle_model: { id: "vm-2", make: "Honda", model: "Accord" },
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET", () => {
    it("returns vehicle models on success", async () => {
      const chain = {
        select: vi.fn(() => chain),
        eq: vi.fn(() => chain),
        order: vi.fn(() =>
          Promise.resolve({ data: mockVehicleModels, error: null }),
        ),
      };
      const mockFrom = vi.fn(() => chain);
      const supabase = { from: mockFrom };

      const response = await (GET as any)({
        supabase,
        orgId,
        params: { partId },
      });
      const body = await response.json();

      expect(supabase.from).toHaveBeenCalledWith("vehicle_model_parts");
      expect(chain.select).toHaveBeenCalledWith(
        "id, part_id, vehicle_model_id, specific_price, compatibility_notes, created_at, updated_at, vehicle_model:vehicle_models!vehicle_model_id(id, make, model)",
      );
      expect(chain.eq).toHaveBeenCalledWith("part_id", partId);
      expect(chain.eq).toHaveBeenCalledWith("organization_id", orgId);
      expect(chain.order).toHaveBeenCalledWith("created_at", {
        ascending: false,
      });
      expect(response.status).toBe(200);
      expect(body.data).toEqual(mockVehicleModels);
    });

    it("returns empty array when data is null", async () => {
      const chain = {
        select: vi.fn(() => chain),
        eq: vi.fn(() => chain),
        order: vi.fn(() => Promise.resolve({ data: null, error: null })),
      };
      const mockFrom = vi.fn(() => chain);
      const supabase = { from: mockFrom };

      const response = await (GET as any)({
        supabase,
        orgId,
        params: { partId },
      });
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.data).toEqual([]);
    });

    it("throws on database error", async () => {
      const chain = {
        select: vi.fn(() => chain),
        eq: vi.fn(() => chain),
        order: vi.fn(() =>
          Promise.resolve({ data: null, error: new Error("DB error") }),
        ),
      };
      const mockFrom = vi.fn(() => chain);
      const supabase = { from: mockFrom };

      await expect(
        (GET as any)({ supabase, orgId, params: { partId } }),
      ).rejects.toThrow("DB error");
    });
  });
});
