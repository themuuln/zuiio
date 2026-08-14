import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

// ── Mocks ──────────────────────────────────────────────────────

const getInspectionMock = vi.fn();
const updateInspectionMock = vi.fn();

vi.mock("@/lib/api-handler", () => ({
  createRouteHandler: vi.fn((handler: unknown) => handler),
}));

vi.mock("@/lib/services/dvi-service", () => ({
  getInspection: getInspectionMock,
  updateInspection: updateInspectionMock,
}));

const { GET, PATCH } = await import("./route");

// ── Tests ──────────────────────────────────────────────────────

describe("organizations/[id]/dv-inspections/[inspectionId] route", () => {
  const orgId = "org-1";
  const inspectionId = "insp-1";
  const user = { id: "user-1" };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── GET ───────────────────────────────────────────

  describe("GET", () => {
    it("returns inspection with items", async () => {
      const mockInspection = {
        id: inspectionId,
        vehicle_id: "v-1",
        status: "draft",
        odometer: 50000,
        fuel_level: 75,
        items: [
          { id: "item-1", category: "tires", item_name: "Front left tire" },
        ],
      };
      getInspectionMock.mockResolvedValue(mockInspection);

      const supabase = { from: vi.fn() };
      const response = await (GET as any)({
        supabase,
        orgId,
        params: { inspectionId },
      });
      const body = await response.json();

      expect(getInspectionMock).toHaveBeenCalledWith(
        supabase,
        inspectionId,
        orgId,
      );
      expect(body.data).toEqual(mockInspection);
    });

    it("returns 400 when inspectionId is missing", async () => {
      const supabase = { from: vi.fn() };
      const response = await (GET as any)({
        supabase,
        orgId,
        params: {},
      });
      expect(response.status).toBe(400);
    });
  });

  // ── PATCH ─────────────────────────────────────────

  describe("PATCH", () => {
    const url = `http://localhost/api/organizations/${orgId}/dv-inspections/${inspectionId}`;

    it("updates inspection fields", async () => {
      updateInspectionMock.mockResolvedValue({
        id: inspectionId,
        status: "approved",
        technician_notes: "All good",
      });

      const body = {
        status: "approved",
        technician_notes: "All good",
        odometer: 52000,
      };
      const supabase = { from: vi.fn() };
      const request = new NextRequest(url, {
        method: "PATCH",
        body: JSON.stringify(body),
        headers: { "content-type": "application/json" },
      });
      const response = await (PATCH as any)({
        request,
        orgId,
        user,
        supabase,
        params: { inspectionId },
      });
      const data = await response.json();

      expect(updateInspectionMock).toHaveBeenCalledWith(
        supabase,
        inspectionId,
        orgId,
        user.id,
        body,
      );
      expect(data.data).toEqual({
        id: inspectionId,
        status: "approved",
        technician_notes: "All good",
      });
    });

    it("returns 400 when no fields provided", async () => {
      const supabase = { from: vi.fn() };
      const request = new NextRequest(url, {
        method: "PATCH",
        body: JSON.stringify({}),
        headers: { "content-type": "application/json" },
      });
      const response = await (PATCH as any)({
        request,
        orgId,
        user,
        supabase,
        params: { inspectionId },
      });
      expect(response.status).toBe(400);
    });

    it("returns 400 when inspectionId is missing", async () => {
      const supabase = { from: vi.fn() };
      const request = new NextRequest(url, {
        method: "PATCH",
        body: JSON.stringify({ status: "approved" }),
        headers: { "content-type": "application/json" },
      });
      const response = await (PATCH as any)({
        request,
        orgId,
        user,
        supabase,
        params: {},
      });
      expect(response.status).toBe(400);
    });

    it("handles service error", async () => {
      updateInspectionMock.mockRejectedValue(new Error("Update failed"));

      const supabase = { from: vi.fn() };
      const request = new NextRequest(url, {
        method: "PATCH",
        body: JSON.stringify({ status: "approved" }),
        headers: { "content-type": "application/json" },
      });
      await expect(
        (PATCH as any)({
          request,
          orgId,
          user,
          supabase,
          params: { inspectionId },
        }),
      ).rejects.toThrow("Update failed");
    });
  });
});
