import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

// ── Mocks ──────────────────────────────────────────────────────

const getItpRecordMock = vi.fn();
const updateItpRecordMock = vi.fn();
const getItpHistoryMock = vi.fn();

vi.mock("@/lib/api-handler", () => ({
  createRouteHandler: vi.fn((handler: unknown) => handler),
}));

vi.mock("@/lib/services/itp-service", () => ({
  getItpRecord: getItpRecordMock,
  updateItpRecord: updateItpRecordMock,
  getItpHistory: getItpHistoryMock,
}));

const { GET, PATCH } = await import("./route");

// ── Tests ──────────────────────────────────────────────────────

describe("organizations/[id]/itp/[vehicleId] route", () => {
  const orgId = "org-1";
  const vehicleId = "v-1";
  const user = { id: "user-1" };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── GET ───────────────────────────────────────────

  describe("GET", () => {
    const baseUrl = `http://localhost/api/organizations/${orgId}/itp/${vehicleId}`;

    it("returns a single ITP record", async () => {
      getItpRecordMock.mockResolvedValue({
        vehicle_id: vehicleId,
        plate_number: "5555УНА",
        itp_status: "valid",
      });

      const supabase = { from: vi.fn() };
      const request = new NextRequest(baseUrl);
      const response = await (GET as any)({
        request,
        orgId,
        supabase,
        params: { vehicleId },
      });
      const body = await response.json();

      expect(getItpRecordMock).toHaveBeenCalledWith(supabase, vehicleId, orgId);
      expect(body.data.vehicle_id).toBe(vehicleId);
      expect(body.data.itp_status).toBe("valid");
    });

    it("includes history when include_history=true", async () => {
      getItpRecordMock.mockResolvedValue({
        vehicle_id: vehicleId,
        plate_number: "5555УНА",
        itp_status: "valid",
      });
      getItpHistoryMock.mockResolvedValue([
        { id: "hist-1", action_type: "record_inspection" },
      ]);

      const supabase = { from: vi.fn() };
      const request = new NextRequest(`${baseUrl}?include_history=true`);
      const response = await (GET as any)({
        request,
        orgId,
        supabase,
        params: { vehicleId },
      });
      const body = await response.json();

      expect(getItpHistoryMock).toHaveBeenCalledWith(
        supabase,
        vehicleId,
        orgId,
      );
      expect(body.data.history).toHaveLength(1);
      expect(body.data.history[0].action_type).toBe("record_inspection");
    });

    it("returns 400 when vehicleId param is missing", async () => {
      const supabase = { from: vi.fn() };
      const request = new NextRequest(baseUrl);
      const response = await (GET as any)({
        request,
        orgId,
        supabase,
        params: {},
      });
      expect(response.status).toBe(400);
    });

    it("handles service error", async () => {
      getItpRecordMock.mockRejectedValue(new Error("Not found"));

      const supabase = { from: vi.fn() };
      const request = new NextRequest(baseUrl);
      await expect(
        (GET as any)({ request, orgId, supabase, params: { vehicleId } }),
      ).rejects.toThrow("Not found");
    });
  });

  // ── PATCH ────────────────────────────────────────

  describe("PATCH", () => {
    const url = `http://localhost/api/organizations/${orgId}/itp/${vehicleId}`;

    it("updates ITP fields", async () => {
      updateItpRecordMock.mockResolvedValue({
        vehicle_id: vehicleId,
        itp_notes: "Updated notes",
      });

      const body = { itp_notes: "Updated notes" };

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
        params: { vehicleId },
      });
      const data = await response.json();

      expect(updateItpRecordMock).toHaveBeenCalledWith(
        supabase,
        vehicleId,
        orgId,
        user.id,
        body,
      );
      expect(data.data.itp_notes).toBe("Updated notes");
    });

    it("returns 400 when vehicleId param is missing", async () => {
      const supabase = { from: vi.fn() };
      const request = new NextRequest(url, {
        method: "PATCH",
        body: JSON.stringify({ itp_notes: "test" }),
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
        params: { vehicleId },
      });
      expect(response.status).toBe(400);
    });

    it("returns 400 for invalid date format", async () => {
      const supabase = { from: vi.fn() };
      const request = new NextRequest(url, {
        method: "PATCH",
        body: JSON.stringify({ itp_expiry_date: "not-a-date" }),
        headers: { "content-type": "application/json" },
      });
      const response = await (PATCH as any)({
        request,
        orgId,
        user,
        supabase,
        params: { vehicleId },
      });
      expect(response.status).toBe(400);
    });

    it("handles service error", async () => {
      updateItpRecordMock.mockRejectedValue(new Error("Update failed"));

      const supabase = { from: vi.fn() };
      const request = new NextRequest(url, {
        method: "PATCH",
        body: JSON.stringify({ itp_notes: "test" }),
        headers: { "content-type": "application/json" },
      });
      await expect(
        (PATCH as any)({
          request,
          orgId,
          user,
          supabase,
          params: { vehicleId },
        }),
      ).rejects.toThrow("Update failed");
    });
  });
});
