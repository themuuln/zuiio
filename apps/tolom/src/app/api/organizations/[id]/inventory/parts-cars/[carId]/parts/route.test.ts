import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockSupabaseClient } from "@/test/mocks/supabase";

// ── Mocks ──────────────────────────────────────────────────────

const getPartsCarPartsMock = vi.fn();
const addPartsCarPartMock = vi.fn();

vi.mock("@/lib/api-handler", () => ({
  createRouteHandler: vi.fn((handler: unknown) => handler),
}));

vi.mock("@/lib/services/parts-cars-service", () => ({
  getPartsCarParts: getPartsCarPartsMock,
  addPartsCarPart: addPartsCarPartMock,
}));

const { GET, POST } = await import("./route");

// ── Tests ──────────────────────────────────────────────────────

describe("organizations/[id]/inventory/parts-cars/[carId]/parts route", () => {
  const orgId = "org-1";
  const user = { id: "user-1" };
  const carId = "car-1";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── GET ───────────────────────────────────────────

  describe("GET", () => {
    const url = `http://localhost/api/organizations/${orgId}/inventory/parts-cars/${carId}/parts`;

    it("returns parts for a car", async () => {
      getPartsCarPartsMock.mockResolvedValue([
        { id: "part-1", name: "Oil Filter" },
        { id: "part-2", name: "Brake Pad" },
      ]);

      const supabase = createMockSupabaseClient();
      const _request = new NextRequest(url);
      const response = await (GET as any)({
        supabase,
        orgId,
        params: { carId },
      });
      const body = await response.json();

      expect(getPartsCarPartsMock).toHaveBeenCalledWith(supabase, orgId, carId);
      expect(body.data).toEqual([
        { id: "part-1", name: "Oil Filter" },
        { id: "part-2", name: "Brake Pad" },
      ]);
    });

    it("handles service error", async () => {
      getPartsCarPartsMock.mockRejectedValue(new Error("DB error"));

      const supabase = createMockSupabaseClient();
      const _request = new NextRequest(url);
      await expect(
        (GET as any)({ supabase, orgId, params: { carId } }),
      ).rejects.toThrow("DB error");
    });
  });

  // ── POST ──────────────────────────────────────────

  describe("POST", () => {
    const url = `http://localhost/api/organizations/${orgId}/inventory/parts-cars/${carId}/parts`;

    it("creates a part for a car", async () => {
      addPartsCarPartMock.mockResolvedValue({ id: "pcp-1" });
      const body = { part_id: "part-1", quantity: 2 };

      const supabase = createMockSupabaseClient();
      const request = new NextRequest(url, {
        method: "POST",
        body: JSON.stringify(body),
        headers: { "content-type": "application/json" },
      });
      const response = await (POST as any)({
        supabase,
        orgId,
        params: { carId },
        request,
        user,
      });
      const data = await response.json();

      expect(addPartsCarPartMock).toHaveBeenCalledWith(
        supabase,
        orgId,
        user.id,
        carId,
        body,
      );
      expect(data.data).toEqual({ id: "pcp-1" });
      expect(response.status).toBe(201);
    });

    it("handles service error on create", async () => {
      addPartsCarPartMock.mockRejectedValue(new Error("Validation failed"));

      const supabase = createMockSupabaseClient();
      const request = new NextRequest(url, {
        method: "POST",
        body: JSON.stringify({ part_id: "" }),
        headers: { "content-type": "application/json" },
      });
      await expect(
        (POST as any)({ supabase, orgId, params: { carId }, request, user }),
      ).rejects.toThrow("Validation failed");
    });
  });
});
