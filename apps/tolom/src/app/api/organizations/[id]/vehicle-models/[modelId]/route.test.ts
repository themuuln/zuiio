import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

// ── Mocks ──────────────────────────────────────────────────────

const updateVehicleModelMock = vi.fn();
const deleteVehicleModelMock = vi.fn();

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

vi.mock("@/lib/services/vehicle-models-service", () => ({
  updateVehicleModel: updateVehicleModelMock,
  deleteVehicleModel: deleteVehicleModelMock,
}));

const { PATCH, DELETE } = await import("./route");

// ── Tests ──────────────────────────────────────────────────────

describe("organizations/[id]/vehicle-models/[modelId] route", () => {
  const orgId = "org-1";
  const modelId = "m1";
  const baseUrl = `http://localhost/api/organizations/${orgId}/vehicle-models/${modelId}`;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("PATCH", () => {
    it("updates vehicle model on success", async () => {
      const updated = { id: modelId, make: "Toyota", model: "Camry" };
      updateVehicleModelMock.mockResolvedValue(updated);

      const request = new NextRequest(baseUrl, {
        method: "PATCH",
        body: JSON.stringify({ model: "Camry LE" }),
        headers: { "content-type": "application/json" },
      });
      const response = await (PATCH as any)({
        request,
        orgId,
        params: { modelId },
        supabase: {},
      });
      const body = await response.json();

      expect(updateVehicleModelMock).toHaveBeenCalledWith({}, modelId, orgId, {
        model: "Camry LE",
      });
      expect(body.data).toEqual(updated);
      expect(response.status).toBe(200);
    });

    it("handles service error", async () => {
      updateVehicleModelMock.mockRejectedValue(new Error("DB error"));

      const request = new NextRequest(baseUrl, {
        method: "PATCH",
        body: JSON.stringify({ model: "Camry LE" }),
        headers: { "content-type": "application/json" },
      });
      await expect(
        (PATCH as any)({ request, orgId, params: { modelId }, supabase: {} }),
      ).rejects.toThrow("DB error");
    });
  });

  describe("DELETE", () => {
    it("deletes vehicle model on success", async () => {
      deleteVehicleModelMock.mockResolvedValue(undefined);

      const response = await (DELETE as any)({
        orgId,
        params: { modelId },
        supabase: {},
      });

      expect(deleteVehicleModelMock).toHaveBeenCalledWith({}, modelId, orgId);
      expect(response.status).toBe(204);
    });

    it("handles service error", async () => {
      deleteVehicleModelMock.mockRejectedValue(new Error("DB error"));

      await expect(
        (DELETE as any)({ orgId, params: { modelId }, supabase: {} }),
      ).rejects.toThrow("DB error");
    });
  });
});
