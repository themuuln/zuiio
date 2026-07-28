import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockSupabaseClient } from "@/test/mocks/supabase";

// ── Mocks ──────────────────────────────────────────────────────

const closeDayMock = vi.fn();
const getDayCloseStatusMock = vi.fn();

vi.mock("@/lib/api-handler", () => ({
  createRouteHandler: vi.fn((handler: unknown) => handler),
}));

vi.mock("@/lib/api-response", () => ({
  ok: vi.fn(
    (data: unknown) => new Response(JSON.stringify({ data }), { status: 200 }),
  ),
}));

vi.mock("@/lib/services/day-close-service", () => ({
  closeDay: closeDayMock,
  getDayCloseStatus: getDayCloseStatusMock,
}));

const { GET, POST } = await import("./route");

// ── Tests ──────────────────────────────────────────────────────

describe("organizations/[id]/day-close route", () => {
  const orgId = "org-1";
  const user = { id: "user-1" };
  const baseUrl = `http://localhost/api/organizations/${orgId}/day-close`;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── GET ───────────────────────────────────────────

  describe("GET", () => {
    it("returns day close status for specified date", async () => {
      const status = { closed: false, date: "2024-01-15" };
      getDayCloseStatusMock.mockResolvedValue(status);

      const supabase = createMockSupabaseClient();
      const request = new NextRequest(`${baseUrl}?date=2024-01-15`);
      const response = await (GET as any)({ supabase, orgId, request });
      const body = await response.json();

      expect(getDayCloseStatusMock).toHaveBeenCalledWith(
        supabase,
        orgId,
        "2024-01-15",
      );
      expect(body.data).toEqual(status);
    });

    it("defaults to today when no date provided", async () => {
      const status = { closed: false };
      getDayCloseStatusMock.mockResolvedValue(status);

      const supabase = createMockSupabaseClient();
      const request = new NextRequest(baseUrl);
      await (GET as any)({ supabase, orgId, request });

      // Should be called with today's date string (YYYY-MM-DD)
      const today = new Date().toISOString().split("T")[0];
      expect(getDayCloseStatusMock).toHaveBeenCalledWith(
        supabase,
        orgId,
        today,
      );
    });

    it("handles service error", async () => {
      getDayCloseStatusMock.mockRejectedValue(new Error("DB error"));

      const supabase = createMockSupabaseClient();
      const request = new NextRequest(`${baseUrl}?date=2024-01-15`);
      await expect((GET as any)({ supabase, orgId, request })).rejects.toThrow(
        "DB error",
      );
    });
  });

  // ── POST ──────────────────────────────────────────

  describe("POST", () => {
    it("closes the day with provided date", async () => {
      const result = { closed: true, date: "2024-01-15" };
      closeDayMock.mockResolvedValue(result);

      const supabase = createMockSupabaseClient();
      const request = new NextRequest(baseUrl, {
        method: "POST",
        body: JSON.stringify({ date: "2024-01-15" }),
        headers: { "content-type": "application/json" },
      });
      const response = await (POST as any)({ supabase, orgId, request, user });
      const body = await response.json();

      expect(closeDayMock).toHaveBeenCalledWith(
        supabase,
        orgId,
        user.id,
        "2024-01-15",
      );
      expect(body.data).toEqual(result);
    });

    it("defaults to today when no date in body", async () => {
      const result = { closed: true };
      closeDayMock.mockResolvedValue(result);

      const supabase = createMockSupabaseClient();
      const request = new NextRequest(baseUrl, {
        method: "POST",
        body: JSON.stringify({}),
        headers: { "content-type": "application/json" },
      });
      await (POST as any)({ supabase, orgId, request, user });

      const today = new Date().toISOString().split("T")[0];
      expect(closeDayMock).toHaveBeenCalledWith(
        supabase,
        orgId,
        user.id,
        today,
      );
    });

    it("handles service error on close", async () => {
      closeDayMock.mockRejectedValue(new Error("Close failed"));

      const supabase = createMockSupabaseClient();
      const request = new NextRequest(baseUrl, {
        method: "POST",
        body: JSON.stringify({ date: "2024-01-15" }),
        headers: { "content-type": "application/json" },
      });
      await expect(
        (POST as any)({ supabase, orgId, request, user }),
      ).rejects.toThrow("Close failed");
    });
  });
});
