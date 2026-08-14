import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockSupabaseClient } from "@/test/mocks/supabase";

// ── Mocks ──────────────────────────────────────────────────────

const createVehicleMock = vi.fn();
const getVehiclesMock = vi.fn();
const getVehiclesFastMock = vi.fn();
const searchByPlateMock = vi.fn();

vi.mock("@/lib/api-handler", () => ({
  createRouteHandler: vi.fn((handler: unknown) => handler),
}));

vi.mock("@/lib/services/vehicle-service", () => ({
  createVehicle: createVehicleMock,
  getVehicles: getVehiclesMock,
  getVehiclesFast: getVehiclesFastMock,
  searchByPlate: searchByPlateMock,
}));

const { GET, POST } = await import("./route");

// ── Tests ──────────────────────────────────────────────────────

describe("organizations/[id]/vehicles route", () => {
  const orgId = "org-1";
  const user = { id: "user-1" };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── GET ───────────────────────────────────────────

  describe("GET", () => {
    const listUrl = `http://localhost/api/organizations/${orgId}/vehicles`;

    it("returns vehicles fast when fast=true and no filters", async () => {
      getVehiclesFastMock.mockResolvedValue([{ id: "v-1", plate: "УНС001" }]);

      const supabase = createMockSupabaseClient();
      const request = new NextRequest(`${listUrl}?fast=true`);
      const response = await (GET as any)({ supabase, orgId, request });
      const body = await response.json();

      expect(getVehiclesFastMock).toHaveBeenCalledWith(supabase, orgId);
      expect(body.data).toEqual([{ id: "v-1", plate: "УНС001" }]);
    });

    it("returns search results when q param is provided", async () => {
      searchByPlateMock.mockResolvedValue([{ id: "v-1", plate: "УНС001" }]);

      const supabase = createMockSupabaseClient();
      const request = new NextRequest(`${listUrl}?q=УНС001`);
      const response = await (GET as any)({ supabase, orgId, request });
      const body = await response.json();

      expect(searchByPlateMock).toHaveBeenCalledWith(supabase, orgId, "УНС001");
      expect(body.data).toEqual([{ id: "v-1", plate: "УНС001" }]);
    });

    it("returns search results when plate param is provided", async () => {
      searchByPlateMock.mockResolvedValue([{ id: "v-1", plate: "УНС001" }]);

      const supabase = createMockSupabaseClient();
      const request = new NextRequest(`${listUrl}?plate=УНС001`);
      const response = await (GET as any)({ supabase, orgId, request });
      const body = await response.json();

      expect(searchByPlateMock).toHaveBeenCalledWith(supabase, orgId, "УНС001");
      expect(body.data).toEqual([{ id: "v-1", plate: "УНС001" }]);
    });

    it("returns vehicles with customer and branch filters", async () => {
      getVehiclesMock.mockResolvedValue([{ id: "v-1", plate: "УНС001" }]);

      const supabase = createMockSupabaseClient();
      const request = new NextRequest(
        `${listUrl}?customer=cust-1&branch_id=br-1`,
      );
      const response = await (GET as any)({ supabase, orgId, request });
      const body = await response.json();

      expect(getVehiclesMock).toHaveBeenCalledWith(supabase, orgId, {
        customerId: "cust-1",
        branchId: "br-1",
      });
      expect(body.data).toEqual([{ id: "v-1", plate: "УНС001" }]);
    });

    it("handles service error", async () => {
      getVehiclesMock.mockRejectedValue(new Error("DB error"));

      const supabase = createMockSupabaseClient();
      const request = new NextRequest(`${listUrl}?customer=cust-1`);
      await expect((GET as any)({ supabase, orgId, request })).rejects.toThrow(
        "DB error",
      );
    });
  });

  // ── POST ──────────────────────────────────────────

  describe("POST", () => {
    const url = `http://localhost/api/organizations/${orgId}/vehicles`;

    it("creates a vehicle", async () => {
      createVehicleMock.mockResolvedValue({ id: "v-1" });
      const body = { plate: "УНС001", make: "Toyota", model: "Camry" };

      const supabase = createMockSupabaseClient();
      const request = new NextRequest(url, {
        method: "POST",
        body: JSON.stringify(body),
        headers: { "content-type": "application/json" },
      });
      const response = await (POST as any)({ supabase, orgId, request, user });
      const data = await response.json();

      expect(createVehicleMock).toHaveBeenCalledWith(
        supabase,
        orgId,
        body,
        user.id,
      );
      expect(data.data).toEqual({ id: "v-1" });
      expect(response.status).toBe(201);
    });

    it("handles service error on create", async () => {
      createVehicleMock.mockRejectedValue(new Error("Validation failed"));

      const supabase = createMockSupabaseClient();
      const request = new NextRequest(url, {
        method: "POST",
        body: JSON.stringify({ plate: "" }),
        headers: { "content-type": "application/json" },
      });
      await expect(
        (POST as any)({ supabase, orgId, request, user }),
      ).rejects.toThrow("Validation failed");
    });
  });
});
