import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockSupabaseClient } from "@/test/mocks/supabase";

// ── Mocks ──────────────────────────────────────────────────────

const getPartsCarMock = vi.fn();
const updatePartsCarMock = vi.fn();
const deletePartsCarMock = vi.fn();

vi.mock("@/lib/api-handler", () => ({
  createRouteHandler: vi.fn((handler: unknown) => handler),
}));

vi.mock("@/lib/api-response", () => ({
  noContent: vi.fn(() => new Response(null, { status: 204 })),
  ok: vi.fn(
    (data: unknown) => new Response(JSON.stringify({ data }), { status: 200 }),
  ),
}));

vi.mock("@/lib/services/parts-cars-service", () => ({
  getPartsCar: getPartsCarMock,
  updatePartsCar: updatePartsCarMock,
  deletePartsCar: deletePartsCarMock,
}));

const { GET, PATCH, DELETE } = await import("./route");

// ── Tests ──────────────────────────────────────────────────────

describe("organizations/[id]/inventory/parts-cars/[carId] route", () => {
  const orgId = "org-1";
  const user = { id: "user-1" };
  const carId = "car-1";
  const baseUrl = `http://localhost/api/organizations/${orgId}/inventory/parts-cars/${carId}`;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── GET ───────────────────────────────────────────

  describe("GET", () => {
    it("returns a parts-car by id", async () => {
      const car = { id: carId, make: "Toyota", model: "Camry", year: 2020 };
      getPartsCarMock.mockResolvedValue(car);

      const supabase = createMockSupabaseClient();
      const response = await (GET as any)({
        supabase,
        orgId,
        params: { carId },
      });
      const body = await response.json();

      expect(getPartsCarMock).toHaveBeenCalledWith(supabase, orgId, carId);
      expect(body.data).toEqual(car);
    });

    it("handles service error", async () => {
      getPartsCarMock.mockRejectedValue(new Error("Not found"));

      const supabase = createMockSupabaseClient();
      await expect(
        (GET as any)({ supabase, orgId, params: { carId } }),
      ).rejects.toThrow("Not found");
    });
  });

  // ── PATCH ─────────────────────────────────────────

  describe("PATCH", () => {
    it("updates a parts-car", async () => {
      const updated = { id: carId, make: "Toyota", model: "Camry", year: 2021 };
      updatePartsCarMock.mockResolvedValue(updated);

      const supabase = createMockSupabaseClient();
      const request = new NextRequest(baseUrl, {
        method: "PATCH",
        body: JSON.stringify({ year: 2021 }),
        headers: { "content-type": "application/json" },
      });
      const response = await (PATCH as any)({
        supabase,
        orgId,
        params: { carId },
        request,
        user,
      });
      const body = await response.json();

      expect(updatePartsCarMock).toHaveBeenCalledWith(
        supabase,
        orgId,
        carId,
        { year: 2021 },
        user.id,
      );
      expect(body.data).toEqual(updated);
    });

    it("handles service error on update", async () => {
      updatePartsCarMock.mockRejectedValue(new Error("Update failed"));

      const supabase = createMockSupabaseClient();
      const request = new NextRequest(baseUrl, {
        method: "PATCH",
        body: JSON.stringify({ year: 2021 }),
        headers: { "content-type": "application/json" },
      });
      await expect(
        (PATCH as any)({ supabase, orgId, params: { carId }, request, user }),
      ).rejects.toThrow("Update failed");
    });
  });

  // ── DELETE ────────────────────────────────────────

  describe("DELETE", () => {
    it("deletes a parts-car", async () => {
      deletePartsCarMock.mockResolvedValue(undefined);

      const supabase = createMockSupabaseClient();
      const response = await (DELETE as any)({
        supabase,
        orgId,
        params: { carId },
        user,
      });

      expect(deletePartsCarMock).toHaveBeenCalledWith(
        supabase,
        orgId,
        carId,
        user.id,
      );
      expect(response.status).toBe(204);
    });

    it("handles service error on delete", async () => {
      deletePartsCarMock.mockRejectedValue(new Error("Delete failed"));

      const supabase = createMockSupabaseClient();
      await expect(
        (DELETE as any)({ supabase, orgId, params: { carId }, user }),
      ).rejects.toThrow("Delete failed");
    });
  });
});
