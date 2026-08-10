import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

// ── Mocks ──────────────────────────────────────────────────────

const getItpRecordsMock = vi.fn();
const getItpStatsMock = vi.fn();
const getExpiringItpRecordsMock = vi.fn();
const recordItpInspectionMock = vi.fn();
const getVehiclesNeedingReminderMock = vi.fn();
const getItpHistoryMock = vi.fn();

vi.mock("@/lib/api-handler", () => ({
  createRouteHandler: vi.fn((handler: unknown) => handler),
}));

vi.mock("@/lib/services/itp-service", () => ({
  getItpRecords: getItpRecordsMock,
  getItpStats: getItpStatsMock,
  getExpiringItpRecords: getExpiringItpRecordsMock,
  recordItpInspection: recordItpInspectionMock,
  getVehiclesNeedingReminder: getVehiclesNeedingReminderMock,
  getItpHistory: getItpHistoryMock,
}));

const { GET, POST } = await import("./route");

// ── Tests ──────────────────────────────────────────────────────

describe("organizations/[id]/itp route", () => {
  const orgId = "org-1";
  const user = { id: "user-1" };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── GET ───────────────────────────────────────────

  describe("GET", () => {
    const baseUrl = `http://localhost/api/organizations/${orgId}/itp`;

    it("lists ITP records", async () => {
      getItpRecordsMock.mockResolvedValue({
        data: [{ vehicle_id: "v-1", plate_number: "5555УНА" }],
        total: 1,
      });

      const supabase = { from: vi.fn() };
      const request = new NextRequest(baseUrl);
      const response = await (GET as any)({ request, orgId, supabase });
      const body = await response.json();

      expect(getItpRecordsMock).toHaveBeenCalledWith(
        supabase,
        orgId,
        expect.objectContaining({ status: undefined }),
      );
      expect(body.data.data).toEqual([
        { vehicle_id: "v-1", plate_number: "5555УНА" },
      ]);
      expect(body.data.total).toBe(1);
    });

    it("filters by status", async () => {
      getItpRecordsMock.mockResolvedValue({
        data: [
          {
            vehicle_id: "v-2",
            plate_number: "6666УНА",
            itp_status: "expired",
          },
        ],
        total: 1,
      });

      const supabase = { from: vi.fn() };
      const request = new NextRequest(`${baseUrl}?status=expired`);
      const response = await (GET as any)({ request, orgId, supabase });
      await response.json();

      expect(getItpRecordsMock).toHaveBeenCalledWith(
        supabase,
        orgId,
        expect.objectContaining({ status: "expired" }),
      );
    });

    it("filters by search query", async () => {
      getItpRecordsMock.mockResolvedValue({ data: [], total: 0 });

      const supabase = { from: vi.fn() };
      const request = new NextRequest(`${baseUrl}?search=5555`);
      await (GET as any)({ request, orgId, supabase });

      expect(getItpRecordsMock).toHaveBeenCalledWith(
        supabase,
        orgId,
        expect.objectContaining({ search: "5555" }),
      );
    });

    it("filters by branch_id", async () => {
      getItpRecordsMock.mockResolvedValue({ data: [], total: 0 });

      const supabase = { from: vi.fn() };
      const request = new NextRequest(`${baseUrl}?branch_id=branch-1`);
      await (GET as any)({ request, orgId, supabase });

      expect(getItpRecordsMock).toHaveBeenCalledWith(
        supabase,
        orgId,
        expect.objectContaining({ branchId: "branch-1" }),
      );
    });

    it("returns stats when stats=true", async () => {
      getItpStatsMock.mockResolvedValue({
        total: 10,
        valid: 5,
        expiring_soon: 3,
        expired: 1,
        unknown: 1,
      });

      const supabase = { from: vi.fn() };
      const request = new NextRequest(`${baseUrl}?stats=true`);
      const response = await (GET as any)({ request, orgId, supabase });
      const body = await response.json();

      expect(getItpStatsMock).toHaveBeenCalledWith(supabase, orgId, null);
      expect(body.data.total).toBe(10);
      expect(body.data.valid).toBe(5);
    });

    it("returns expiring records when expiring=true", async () => {
      getExpiringItpRecordsMock.mockResolvedValue([
        { vehicle_id: "v-3", plate_number: "7777УНА" },
      ]);

      const supabase = { from: vi.fn() };
      const request = new NextRequest(`${baseUrl}?expiring=true`);
      const response = await (GET as any)({ request, orgId, supabase });
      const body = await response.json();

      expect(getExpiringItpRecordsMock).toHaveBeenCalledWith(
        supabase,
        orgId,
        null,
      );
      expect(body.data).toEqual([
        { vehicle_id: "v-3", plate_number: "7777УНА" },
      ]);
    });

    it("filters by vehicle_id", async () => {
      getItpRecordsMock.mockResolvedValue({ data: [], total: 0 });

      const supabase = { from: vi.fn() };
      const request = new NextRequest(`${baseUrl}?vehicle_id=v-9`);
      await (GET as any)({ request, orgId, supabase });

      expect(getItpRecordsMock).toHaveBeenCalledWith(
        supabase,
        orgId,
        expect.objectContaining({ vehicleId: "v-9" }),
      );
    });

    it("returns a vehicle's history when include_history=true with vehicle_id", async () => {
      getItpHistoryMock.mockResolvedValue([
        { id: "hist-1", vehicle_id: "v-9" },
      ]);

      const supabase = { from: vi.fn() };
      const request = new NextRequest(
        `${baseUrl}?include_history=true&vehicle_id=v-9`,
      );
      const response = await (GET as any)({ request, orgId, supabase });
      const body = await response.json();

      expect(getItpHistoryMock).toHaveBeenCalledWith(supabase, "v-9", orgId);
      expect(body.data).toEqual([{ id: "hist-1", vehicle_id: "v-9" }]);
      expect(getItpRecordsMock).not.toHaveBeenCalled();
    });

    it("returns vehicles needing reminder when needs_reminder=true", async () => {
      getVehiclesNeedingReminderMock.mockResolvedValue([
        { vehicle_id: "v-4", plate_number: "8888УНА" },
      ]);

      const supabase = { from: vi.fn() };
      const request = new NextRequest(`${baseUrl}?needs_reminder=true`);
      const response = await (GET as any)({ request, orgId, supabase });
      const body = await response.json();

      expect(getVehiclesNeedingReminderMock).toHaveBeenCalledWith(
        supabase,
        orgId,
      );
      expect(body.data).toEqual([
        { vehicle_id: "v-4", plate_number: "8888УНА" },
      ]);
    });

    it("handles service error", async () => {
      getItpRecordsMock.mockRejectedValue(new Error("DB error"));

      const supabase = { from: vi.fn() };
      const request = new NextRequest(baseUrl);
      await expect((GET as any)({ request, orgId, supabase })).rejects.toThrow(
        "DB error",
      );
    });
  });

  // ── POST ──────────────────────────────────────────

  describe("POST", () => {
    const url = `http://localhost/api/organizations/${orgId}/itp`;

    it("records an ITP inspection", async () => {
      recordItpInspectionMock.mockResolvedValue({
        vehicle_id: "v-1",
        itp_status: "valid",
      });

      const body = {
        vehicle_id: "v-1",
        itp_expiry_date: "2027-06-15",
        itp_last_passed_date: "2026-06-15",
        itp_notes: "Passed",
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

      expect(recordItpInspectionMock).toHaveBeenCalledWith(
        supabase,
        orgId,
        user.id,
        body,
      );
      expect(data.data).toEqual({ vehicle_id: "v-1", itp_status: "valid" });
      expect(response.status).toBe(201);
    });

    it("returns 400 when vehicle_id is missing", async () => {
      const supabase = { from: vi.fn() };
      const request = new NextRequest(url, {
        method: "POST",
        body: JSON.stringify({
          itp_expiry_date: "2027-06-15",
          itp_last_passed_date: "2026-06-15",
        }),
        headers: { "content-type": "application/json" },
      });
      const response = await (POST as any)({ request, orgId, user, supabase });
      expect(response.status).toBe(400);
    });

    it("returns 400 when itp_expiry_date is missing", async () => {
      const supabase = { from: vi.fn() };
      const request = new NextRequest(url, {
        method: "POST",
        body: JSON.stringify({
          vehicle_id: "v-1",
          itp_last_passed_date: "2026-06-15",
        }),
        headers: { "content-type": "application/json" },
      });
      const response = await (POST as any)({ request, orgId, user, supabase });
      expect(response.status).toBe(400);
    });

    it("returns 400 when itp_last_passed_date is missing", async () => {
      const supabase = { from: vi.fn() };
      const request = new NextRequest(url, {
        method: "POST",
        body: JSON.stringify({
          vehicle_id: "v-1",
          itp_expiry_date: "2027-06-15",
        }),
        headers: { "content-type": "application/json" },
      });
      const response = await (POST as any)({ request, orgId, user, supabase });
      expect(response.status).toBe(400);
    });

    it("returns 400 for invalid date format", async () => {
      const supabase = { from: vi.fn() };
      const request = new NextRequest(url, {
        method: "POST",
        body: JSON.stringify({
          vehicle_id: "v-1",
          itp_expiry_date: "not-a-date",
          itp_last_passed_date: "2026-06-15",
        }),
        headers: { "content-type": "application/json" },
      });
      const response = await (POST as any)({ request, orgId, user, supabase });
      expect(response.status).toBe(400);
    });

    it("handles service error", async () => {
      recordItpInspectionMock.mockRejectedValue(new Error("Validation failed"));

      const supabase = { from: vi.fn() };
      const request = new NextRequest(url, {
        method: "POST",
        body: JSON.stringify({
          vehicle_id: "v-1",
          itp_expiry_date: "2027-06-15",
          itp_last_passed_date: "2026-06-15",
        }),
        headers: { "content-type": "application/json" },
      });
      await expect(
        (POST as any)({ request, orgId, user, supabase }),
      ).rejects.toThrow("Validation failed");
    });
  });
});
