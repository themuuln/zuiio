import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

// ── Mocks ──────────────────────────────────────────────────────

const getServiceVehicleModelsMock = vi.fn();
const upsertServiceVehicleModelPriceMock = vi.fn();
const deleteServiceVehicleModelPriceMock = vi.fn();

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

vi.mock("@/lib/services/service-catalog-service", () => ({
  getServiceVehicleModels: getServiceVehicleModelsMock,
  upsertServiceVehicleModelPrice: upsertServiceVehicleModelPriceMock,
  deleteServiceVehicleModelPrice: deleteServiceVehicleModelPriceMock,
}));

const { GET, POST, DELETE } = await import("./route");

// ── Tests ──────────────────────────────────────────────────────

describe("organizations/[id]/services/[serviceId]/vehicle-models route", () => {
  const orgId = "org-1";
  const serviceId = "svc-1";
  const baseUrl = `http://localhost/api/organizations/${orgId}/services/${serviceId}/vehicle-models`;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET", () => {
    it("returns vehicle model prices on success", async () => {
      const rows = [{ vehicle_model_id: "vm-1", specific_price: 5000 }];
      getServiceVehicleModelsMock.mockResolvedValue(rows);

      const response = await (GET as any)({
        orgId,
        params: { serviceId },
        supabase: {},
      });
      const body = await response.json();

      expect(getServiceVehicleModelsMock).toHaveBeenCalledWith(
        {},
        orgId,
        serviceId,
      );
      expect(body.data).toEqual(rows);
      expect(response.status).toBe(200);
    });

    it("handles service error", async () => {
      getServiceVehicleModelsMock.mockRejectedValue(new Error("DB error"));

      await expect(
        (GET as any)({ orgId, params: { serviceId }, supabase: {} }),
      ).rejects.toThrow("DB error");
    });
  });

  describe("POST", () => {
    it("upserts price on success", async () => {
      const row = { vehicle_model_id: "vm-1", specific_price: 5000 };
      upsertServiceVehicleModelPriceMock.mockResolvedValue(row);

      const request = new NextRequest(baseUrl, {
        method: "POST",
        body: JSON.stringify({
          vehicle_model_id: "vm-1",
          specific_price: 5000,
        }),
        headers: { "content-type": "application/json" },
      });
      const response = await (POST as any)({
        request,
        orgId,
        params: { serviceId },
        supabase: {},
      });
      const body = await response.json();

      expect(upsertServiceVehicleModelPriceMock).toHaveBeenCalledWith(
        {},
        orgId,
        serviceId,
        "vm-1",
        5000,
      );
      expect(body.data).toEqual(row);
      expect(response.status).toBe(201);
    });

    it("returns 400 when vehicle_model_id is missing", async () => {
      const request = new NextRequest(baseUrl, {
        method: "POST",
        body: JSON.stringify({ specific_price: 5000 }),
        headers: { "content-type": "application/json" },
      });
      const response = await (POST as any)({
        request,
        orgId,
        params: { serviceId },
        supabase: {},
      });

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error.code).toBe("BAD_REQUEST");
    });

    it("handles service error", async () => {
      upsertServiceVehicleModelPriceMock.mockRejectedValue(
        new Error("DB error"),
      );

      const request = new NextRequest(baseUrl, {
        method: "POST",
        body: JSON.stringify({
          vehicle_model_id: "vm-1",
          specific_price: 5000,
        }),
        headers: { "content-type": "application/json" },
      });
      await expect(
        (POST as any)({ request, orgId, params: { serviceId }, supabase: {} }),
      ).rejects.toThrow("DB error");
    });
  });

  describe("DELETE", () => {
    it("deletes price entry on success", async () => {
      deleteServiceVehicleModelPriceMock.mockResolvedValue(undefined);

      const request = new NextRequest(baseUrl, {
        method: "DELETE",
        body: JSON.stringify({ vehicle_model_id: "vm-1" }),
        headers: { "content-type": "application/json" },
      });
      const response = await (DELETE as any)({
        request,
        orgId,
        params: { serviceId },
        supabase: {},
      });

      expect(deleteServiceVehicleModelPriceMock).toHaveBeenCalledWith(
        {},
        orgId,
        serviceId,
        "vm-1",
      );
      expect(response.status).toBe(200);
    });

    it("returns 400 when vehicle_model_id is missing", async () => {
      const request = new NextRequest(baseUrl, {
        method: "DELETE",
        body: JSON.stringify({}),
        headers: { "content-type": "application/json" },
      });
      const response = await (DELETE as any)({
        request,
        orgId,
        params: { serviceId },
        supabase: {},
      });

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error.code).toBe("BAD_REQUEST");
    });

    it("handles service error", async () => {
      deleteServiceVehicleModelPriceMock.mockRejectedValue(
        new Error("DB error"),
      );

      const request = new NextRequest(baseUrl, {
        method: "DELETE",
        body: JSON.stringify({ vehicle_model_id: "vm-1" }),
        headers: { "content-type": "application/json" },
      });
      await expect(
        (DELETE as any)({
          request,
          orgId,
          params: { serviceId },
          supabase: {},
        }),
      ).rejects.toThrow("DB error");
    });
  });
});
