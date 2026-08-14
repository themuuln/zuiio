import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

// ── Mocks ──────────────────────────────────────────────────────

const getVehicleMock = vi.fn();
const getVehicleServiceHistoryMock = vi.fn();
const updateVehicleMock = vi.fn();
const deleteVehicleMock = vi.fn();

vi.mock("@/lib/api-handler", () => ({
  createRouteHandler: vi.fn((handler: unknown) => handler),
}));

vi.mock("@/lib/api-response", () => ({
  ok: vi.fn(
    (data: unknown) => new Response(JSON.stringify({ data }), { status: 200 }),
  ),
  noContent: vi.fn(() => new Response(null, { status: 204 })),
  apiError: vi.fn(
    (type: string, message: string, status: number) =>
      new Response(JSON.stringify({ error: { code: type, message } }), {
        status,
      }),
  ),
}));

vi.mock("@/lib/services/vehicle-service", () => ({
  getVehicle: getVehicleMock,
  getVehicleServiceHistory: getVehicleServiceHistoryMock,
  updateVehicle: updateVehicleMock,
  deleteVehicle: deleteVehicleMock,
}));

const { GET, PATCH, DELETE } = await import("./route");

// ── Tests ──────────────────────────────────────────────────────

describe("organizations/[id]/vehicles/[vehicleId] route", () => {
  const orgId = "org-1";
  const vehicleId = "veh-1";
  const userId = "user-1";
  const baseUrl = `http://localhost/api/organizations/${orgId}/vehicles/${vehicleId}`;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET", () => {
    it("returns vehicle with service history on success", async () => {
      const vehicle = { id: vehicleId, plate: "ABC123" };
      const serviceHistory = [{ id: "svc-1", description: "Oil change" }];
      getVehicleMock.mockResolvedValue(vehicle);
      getVehicleServiceHistoryMock.mockResolvedValue(serviceHistory);

      const response = await (GET as any)({
        orgId,
        params: { vehicleId },
        supabase: {},
      });
      const body = await response.json();

      expect(getVehicleMock).toHaveBeenCalledWith({}, vehicleId, orgId);
      expect(getVehicleServiceHistoryMock).toHaveBeenCalledWith(
        {},
        orgId,
        vehicleId,
      );
      expect(body.data).toEqual({
        ...vehicle,
        service_history: serviceHistory,
      });
      expect(response.status).toBe(200);
    });

    it("handles service error", async () => {
      getVehicleMock.mockRejectedValue(new Error("DB error"));

      await expect(
        (GET as any)({ orgId, params: { vehicleId }, supabase: {} }),
      ).rejects.toThrow("DB error");
    });
  });

  describe("PATCH", () => {
    it("updates vehicle on success", async () => {
      const updated = { id: vehicleId, plate: "XYZ789" };
      updateVehicleMock.mockResolvedValue(updated);

      const request = new NextRequest(baseUrl, {
        method: "PATCH",
        body: JSON.stringify({ plate: "XYZ789" }),
        headers: { "content-type": "application/json" },
      });
      const response = await (PATCH as any)({
        request,
        orgId,
        params: { vehicleId },
        user: { id: userId },
        supabase: {},
      });
      const body = await response.json();

      expect(updateVehicleMock).toHaveBeenCalledWith(
        {},
        vehicleId,
        orgId,
        { plate: "XYZ789" },
        userId,
      );
      expect(body.data).toEqual(updated);
      expect(response.status).toBe(200);
    });

    it("handles service error", async () => {
      updateVehicleMock.mockRejectedValue(new Error("DB error"));

      const request = new NextRequest(baseUrl, {
        method: "PATCH",
        body: JSON.stringify({ plate: "XYZ789" }),
        headers: { "content-type": "application/json" },
      });
      await expect(
        (PATCH as any)({
          request,
          orgId,
          params: { vehicleId },
          user: { id: userId },
          supabase: {},
        }),
      ).rejects.toThrow("DB error");
    });
  });

  describe("DELETE", () => {
    it("deletes vehicle on success", async () => {
      deleteVehicleMock.mockResolvedValue(undefined);

      const response = await (DELETE as any)({
        orgId,
        params: { vehicleId },
        user: { id: userId },
        supabase: {},
      });

      expect(deleteVehicleMock).toHaveBeenCalledWith(
        {},
        vehicleId,
        orgId,
        userId,
      );
      expect(response.status).toBe(200);
    });

    it("handles service error", async () => {
      deleteVehicleMock.mockRejectedValue(new Error("DB error"));

      await expect(
        (DELETE as any)({
          orgId,
          params: { vehicleId },
          user: { id: userId },
          supabase: {},
        }),
      ).rejects.toThrow("DB error");
    });
  });
});
