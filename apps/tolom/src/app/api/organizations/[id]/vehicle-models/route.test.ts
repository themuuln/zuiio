import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

// ── Mocks ──────────────────────────────────────────────────────

const getVehicleModelsMock = vi.fn();
const getDistinctMakesMock = vi.fn();
const createVehicleModelMock = vi.fn();

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

vi.mock("@/lib/services/vehicle-models-service", () => ({
  getVehicleModels: getVehicleModelsMock,
  getDistinctMakes: getDistinctMakesMock,
  createVehicleModel: createVehicleModelMock,
}));

const { GET, POST } = await import("./route");

// ── Tests ──────────────────────────────────────────────────────

describe("organizations/[id]/vehicle-models route", () => {
  const orgId = "org-1";
  const baseUrl = `http://localhost/api/organizations/${orgId}/vehicle-models`;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET", () => {
    it("returns distinct makes when mode=makes", async () => {
      const makes = ["Toyota", "Honda"];
      getDistinctMakesMock.mockResolvedValue(makes);

      const request = new NextRequest(`${baseUrl}?mode=makes`);
      const response = await (GET as any)({ request, orgId, supabase: {} });
      const body = await response.json();

      expect(getDistinctMakesMock).toHaveBeenCalledWith({}, orgId);
      expect(body.data).toEqual(makes);
      expect(response.status).toBe(200);
    });

    it("returns all models when no make filter", async () => {
      const models = [
        { id: "m1", make: "Toyota", model: "Camry" },
        { id: "m2", make: "Honda", model: "Civic" },
      ];
      getVehicleModelsMock.mockResolvedValue(models);

      const request = new NextRequest(baseUrl);
      const response = await (GET as any)({ request, orgId, supabase: {} });
      const body = await response.json();

      expect(getVehicleModelsMock).toHaveBeenCalledWith({}, orgId);
      expect(body.data).toEqual(models);
      expect(response.status).toBe(200);
    });

    it("filters models by make", async () => {
      const models = [
        { id: "m1", make: "Toyota", model: "Camry" },
        { id: "m2", make: "Honda", model: "Civic" },
      ];
      getVehicleModelsMock.mockResolvedValue(models);

      const request = new NextRequest(`${baseUrl}?make=Toyota`);
      const response = await (GET as any)({ request, orgId, supabase: {} });
      const body = await response.json();

      expect(getVehicleModelsMock).toHaveBeenCalledWith({}, orgId);
      expect(body.data).toEqual([{ id: "m1", make: "Toyota", model: "Camry" }]);
      expect(response.status).toBe(200);
    });

    it("handles service error", async () => {
      getVehicleModelsMock.mockRejectedValue(new Error("DB error"));

      const request = new NextRequest(baseUrl);
      await expect(
        (GET as any)({ request, orgId, supabase: {} }),
      ).rejects.toThrow("DB error");
    });
  });

  describe("POST", () => {
    it("creates a vehicle model on success", async () => {
      const model = { id: "m1", make: "Toyota", model: "Camry" };
      createVehicleModelMock.mockResolvedValue(model);

      const request = new NextRequest(baseUrl, {
        method: "POST",
        body: JSON.stringify({ make: "Toyota", model: "Camry" }),
        headers: { "content-type": "application/json" },
      });
      const response = await (POST as any)({ request, orgId, supabase: {} });
      const body = await response.json();

      expect(createVehicleModelMock).toHaveBeenCalledWith({}, orgId, {
        make: "Toyota",
        model: "Camry",
      });
      expect(body.data).toEqual(model);
      expect(response.status).toBe(201);
    });

    it("handles service error", async () => {
      createVehicleModelMock.mockRejectedValue(new Error("DB error"));

      const request = new NextRequest(baseUrl, {
        method: "POST",
        body: JSON.stringify({ make: "Toyota", model: "Camry" }),
        headers: { "content-type": "application/json" },
      });
      await expect(
        (POST as any)({ request, orgId, supabase: {} }),
      ).rejects.toThrow("DB error");
    });
  });
});
