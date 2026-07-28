import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockSupabaseClient } from "@/test/mocks/supabase";

// ── Mocks ──────────────────────────────────────────────────────

const getReminderLogsMock = vi.fn();

vi.mock("@/lib/api-handler", () => ({
  createRouteHandler: vi.fn((handler: unknown) => handler),
}));

vi.mock("@/lib/api-response", () => ({
  ok: vi.fn(
    (data: unknown) => new Response(JSON.stringify({ data }), { status: 200 }),
  ),
}));

vi.mock("@/lib/services/service-reminder-service", () => ({
  getReminderLogs: getReminderLogsMock,
}));

const { GET } = await import("./route");

// ── Tests ──────────────────────────────────────────────────────

describe("organizations/[id]/service-reminder-logs route", () => {
  const orgId = "org-1";
  const baseUrl = `http://localhost/api/organizations/${orgId}/service-reminder-logs`;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET", () => {
    it("returns reminder logs with no filters", async () => {
      const logs = [{ id: "log-1", reminder_id: "rem-1", status: "sent" }];
      getReminderLogsMock.mockResolvedValue(logs);

      const supabase = createMockSupabaseClient();
      const request = new NextRequest(baseUrl);
      const response = await (GET as any)({ supabase, orgId, request });
      const body = await response.json();

      expect(getReminderLogsMock).toHaveBeenCalledWith(
        supabase,
        orgId,
        undefined,
        null,
      );
      expect(body.data).toEqual(logs);
    });

    it("forwards vehicle_id param", async () => {
      getReminderLogsMock.mockResolvedValue([]);

      const supabase = createMockSupabaseClient();
      const request = new NextRequest(`${baseUrl}?vehicle_id=v-1`);
      await (GET as any)({ supabase, orgId, request });

      expect(getReminderLogsMock).toHaveBeenCalledWith(
        supabase,
        orgId,
        "v-1",
        null,
      );
    });

    it("forwards branch_id param", async () => {
      getReminderLogsMock.mockResolvedValue([]);

      const supabase = createMockSupabaseClient();
      const request = new NextRequest(`${baseUrl}?branch_id=branch-1`);
      await (GET as any)({ supabase, orgId, request });

      expect(getReminderLogsMock).toHaveBeenCalledWith(
        supabase,
        orgId,
        undefined,
        "branch-1",
      );
    });

    it("handles service error", async () => {
      getReminderLogsMock.mockRejectedValue(new Error("DB error"));

      const supabase = createMockSupabaseClient();
      const request = new NextRequest(baseUrl);
      await expect((GET as any)({ supabase, orgId, request })).rejects.toThrow(
        "DB error",
      );
    });
  });
});
