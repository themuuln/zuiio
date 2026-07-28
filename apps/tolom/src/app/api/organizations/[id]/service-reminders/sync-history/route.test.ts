import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockSupabaseClient } from "@/test/mocks/supabase";

// ── Mocks ──────────────────────────────────────────────────────

const backfillSchedulesFromHistoryMock = vi.fn();

vi.mock("@/lib/api-handler", () => ({
  createRouteHandler: vi.fn((handler: unknown) => handler),
}));

vi.mock("@/lib/services/service-reminder-service", () => ({
  backfillSchedulesFromHistory: backfillSchedulesFromHistoryMock,
}));

const { POST } = await import("./route");

// ── Tests ──────────────────────────────────────────────────────

describe("organizations/[id]/service-reminders/sync-history route", () => {
  const orgId = "org-1";
  const user = { id: "user-1" };
  const baseUrl = `http://localhost/api/organizations/${orgId}/service-reminders/sync-history`;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("POST", () => {
    it("returns ok({ synced: N }) on success", async () => {
      backfillSchedulesFromHistoryMock.mockResolvedValue(3);

      const supabase = createMockSupabaseClient();
      const request = new NextRequest(baseUrl, { method: "POST" });
      const response = await (POST as any)({
        request,
        orgId,
        user,
        supabase,
      });
      const data = await response.json();

      expect(backfillSchedulesFromHistoryMock).toHaveBeenCalledWith(
        supabase,
        orgId,
      );
      expect(data.data).toEqual({ synced: 3 });
    });

    it("propagates service error", async () => {
      backfillSchedulesFromHistoryMock.mockRejectedValue(
        new Error("Sync failed"),
      );

      const supabase = createMockSupabaseClient();
      const request = new NextRequest(baseUrl, { method: "POST" });
      await expect(
        (POST as any)({ request, orgId, user, supabase }),
      ).rejects.toThrow("Sync failed");
    });
  });
});
