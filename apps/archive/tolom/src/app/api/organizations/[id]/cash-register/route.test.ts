import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockSupabaseClient } from "@/test/mocks/supabase";

// ── Mocks ──────────────────────────────────────────────────────

const getCurrentSessionMock = vi.fn();
const openSessionMock = vi.fn();

vi.mock("@/lib/api-handler", () => ({
  createRouteHandler: vi.fn((handler: unknown) => handler),
}));

vi.mock("@/lib/services/cash-register-service", () => ({
  getCurrentSession: getCurrentSessionMock,
  openSession: openSessionMock,
}));

const { GET, POST } = await import("./route");

// ── Tests ──────────────────────────────────────────────────────

describe("organizations/[id]/cash-register route", () => {
  const orgId = "org-1";
  const user = { id: "user-1" };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── GET ───────────────────────────────────────────

  describe("GET", () => {
    const baseUrl = `http://localhost/api/organizations/${orgId}/cash-register`;

    it("returns current session without branch filter", async () => {
      getCurrentSessionMock.mockResolvedValue({
        id: "session-1",
        opened_at: "2025-01-15T08:00:00Z",
      });

      const supabase = createMockSupabaseClient();
      const request = new NextRequest(baseUrl);
      const response = await (GET as any)({ orgId, supabase, request });
      const body = await response.json();

      expect(getCurrentSessionMock).toHaveBeenCalledWith(
        supabase,
        orgId,
        undefined,
      );
      expect(body.data).toEqual({
        id: "session-1",
        opened_at: "2025-01-15T08:00:00Z",
      });
    });

    it("filters by branch_id", async () => {
      getCurrentSessionMock.mockResolvedValue({
        id: "session-2",
        branch_id: "branch-1",
      });

      const supabase = createMockSupabaseClient();
      const request = new NextRequest(`${baseUrl}?branch_id=branch-1`);
      const response = await (GET as any)({ orgId, supabase, request });
      const body = await response.json();

      expect(getCurrentSessionMock).toHaveBeenCalledWith(
        supabase,
        orgId,
        "branch-1",
      );
      expect(body.data).toEqual({
        id: "session-2",
        branch_id: "branch-1",
      });
    });

    it("handles service error", async () => {
      getCurrentSessionMock.mockRejectedValue(new Error("DB error"));

      const supabase = createMockSupabaseClient();
      const request = new NextRequest(baseUrl);
      await expect((GET as any)({ orgId, supabase, request })).rejects.toThrow(
        "DB error",
      );
    });
  });

  // ── POST ──────────────────────────────────────────

  describe("POST", () => {
    const url = `http://localhost/api/organizations/${orgId}/cash-register`;

    it("opens a new session", async () => {
      openSessionMock.mockResolvedValue({ id: "session-1" });
      const body = { opening_balance: 1000, branch_id: "branch-1" };

      const supabase = createMockSupabaseClient();
      const request = new NextRequest(url, {
        method: "POST",
        body: JSON.stringify(body),
        headers: { "content-type": "application/json" },
      });
      const response = await (POST as any)({
        orgId,
        user,
        supabase,
        request,
      });
      const data = await response.json();

      expect(openSessionMock).toHaveBeenCalledWith(
        supabase,
        orgId,
        user.id,
        1000,
        "branch-1",
      );
      expect(data.data).toEqual({ id: "session-1" });
      expect(response.status).toBe(201);
    });

    it("returns 400 when opening_balance is missing", async () => {
      const supabase = createMockSupabaseClient();
      const request = new NextRequest(url, {
        method: "POST",
        body: JSON.stringify({ branch_id: "branch-1" }),
        headers: { "content-type": "application/json" },
      });
      const response = await (POST as any)({
        orgId,
        user,
        supabase,
        request,
      });
      const data = await response.json();

      expect(data.error).toBeDefined();
      expect(data.error.code).toBe("VALIDATION_ERROR");
      expect(data.error.message).toBe("Opening balance is required");
      expect(response.status).toBe(400);
    });

    it("handles service error", async () => {
      openSessionMock.mockRejectedValue(new Error("Session already open"));

      const supabase = createMockSupabaseClient();
      const request = new NextRequest(url, {
        method: "POST",
        body: JSON.stringify({ opening_balance: 500 }),
        headers: { "content-type": "application/json" },
      });
      await expect(
        (POST as any)({ orgId, user, supabase, request }),
      ).rejects.toThrow("Session already open");
    });
  });
});
