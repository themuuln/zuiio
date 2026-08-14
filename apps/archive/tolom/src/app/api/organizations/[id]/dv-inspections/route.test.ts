import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

// ── Mocks ──────────────────────────────────────────────────────

const getInspectionsMock = vi.fn();
const createInspectionMock = vi.fn();

vi.mock("@/lib/api-handler", () => ({
  createRouteHandler: vi.fn((handler: unknown) => handler),
}));

vi.mock("@/lib/services/dvi-service", () => ({
  getInspections: getInspectionsMock,
  createInspection: createInspectionMock,
}));

const { GET, POST } = await import("./route");

// ── Tests ──────────────────────────────────────────────────────

describe("organizations/[id]/dv-inspections route", () => {
  const orgId = "org-1";
  const user = { id: "user-1" };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── GET ───────────────────────────────────────────

  describe("GET", () => {
    const baseUrl = `http://localhost/api/organizations/${orgId}/dv-inspections`;

    it("lists inspections", async () => {
      getInspectionsMock.mockResolvedValue([
        { id: "i-1", vehicle_id: "v-1", status: "draft" },
      ]);

      const supabase = { from: vi.fn() };
      const request = new NextRequest(baseUrl);
      const response = await (GET as any)({ request, orgId, supabase });
      const body = await response.json();

      expect(getInspectionsMock).toHaveBeenCalledWith(
        supabase,
        orgId,
        expect.objectContaining({ status: undefined }),
      );
      expect(body.data).toEqual([
        { id: "i-1", vehicle_id: "v-1", status: "draft" },
      ]);
    });

    it("filters by status", async () => {
      getInspectionsMock.mockResolvedValue([]);

      const supabase = { from: vi.fn() };
      const request = new NextRequest(`${baseUrl}?status=approved`);
      await (GET as any)({ request, orgId, supabase });

      expect(getInspectionsMock).toHaveBeenCalledWith(
        supabase,
        orgId,
        expect.objectContaining({ status: "approved" }),
      );
    });

    it("filters by vehicle_id", async () => {
      getInspectionsMock.mockResolvedValue([]);

      const supabase = { from: vi.fn() };
      const request = new NextRequest(`${baseUrl}?vehicle_id=v-1`);
      await (GET as any)({ request, orgId, supabase });

      expect(getInspectionsMock).toHaveBeenCalledWith(
        supabase,
        orgId,
        expect.objectContaining({ vehicleId: "v-1" }),
      );
    });

    it("handles service error", async () => {
      getInspectionsMock.mockRejectedValue(new Error("DB error"));

      const supabase = { from: vi.fn() };
      const request = new NextRequest(baseUrl);
      await expect((GET as any)({ request, orgId, supabase })).rejects.toThrow(
        "DB error",
      );
    });
  });

  // ── POST ──────────────────────────────────────────

  describe("POST", () => {
    const url = `http://localhost/api/organizations/${orgId}/dv-inspections`;

    it("creates an inspection", async () => {
      createInspectionMock.mockResolvedValue({
        id: "i-1",
        vehicle_id: "v-1",
        status: "draft",
      });

      const body = {
        vehicle_id: "v-1",
        odometer: 50000,
        fuel_level: 75,
        technician_notes: "Front left tire low",
      };
      const supabase = { from: vi.fn() };
      const request = new NextRequest(url, {
        method: "POST",
        body: JSON.stringify(body),
        headers: { "content-type": "application/json" },
      });
      const response = await (POST as any)({
        request,
        orgId,
        user,
        supabase,
      });
      const data = await response.json();

      expect(createInspectionMock).toHaveBeenCalledWith(
        supabase,
        orgId,
        user.id,
        expect.objectContaining({
          vehicle_id: "v-1",
          odometer: 50000,
          fuel_level: 75,
          technician_notes: "Front left tire low",
        }),
      );
      expect(data.data).toEqual({
        id: "i-1",
        vehicle_id: "v-1",
        status: "draft",
      });
      expect(response.status).toBe(201);
    });

    it("returns 400 when vehicle_id is missing", async () => {
      const supabase = { from: vi.fn() };
      const request = new NextRequest(url, {
        method: "POST",
        body: JSON.stringify({ odometer: 50000 }),
        headers: { "content-type": "application/json" },
      });
      const response = await (POST as any)({
        request,
        orgId,
        user,
        supabase,
      });
      expect(response.status).toBe(400);
    });

    it("returns 400 when vehicle_id is empty", async () => {
      const supabase = { from: vi.fn() };
      const request = new NextRequest(url, {
        method: "POST",
        body: JSON.stringify({ vehicle_id: "" }),
        headers: { "content-type": "application/json" },
      });
      const response = await (POST as any)({
        request,
        orgId,
        user,
        supabase,
      });
      expect(response.status).toBe(400);
    });

    it("handles service error", async () => {
      createInspectionMock.mockRejectedValue(new Error("DB constraint"));

      const supabase = { from: vi.fn() };
      const request = new NextRequest(url, {
        method: "POST",
        body: JSON.stringify({ vehicle_id: "v-1" }),
        headers: { "content-type": "application/json" },
      });
      await expect(
        (POST as any)({ request, orgId, user, supabase }),
      ).rejects.toThrow("DB constraint");
    });
  });
});
