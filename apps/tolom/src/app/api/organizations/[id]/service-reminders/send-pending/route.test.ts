import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockSupabaseClient } from "@/test/mocks/supabase";

// ── Mocks ──────────────────────────────────────────────────────

const sendPendingRemindersMock = vi.fn();

vi.mock("@/lib/api-handler", () => ({
  createRouteHandler: vi.fn((handler: unknown) => handler),
}));

vi.mock("@/lib/services/service-reminder-service", () => ({
  sendPendingReminders: sendPendingRemindersMock,
}));

const { POST } = await import("./route");

// ── Tests ──────────────────────────────────────────────────────

describe("organizations/[id]/service-reminders/send-pending route", () => {
  const orgId = "org-1";
  const user = { id: "user-1" };
  const baseUrl = `http://localhost/api/organizations/${orgId}/service-reminders/send-pending`;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("POST", () => {
    it("returns ok({ sent: N }) on success", async () => {
      sendPendingRemindersMock.mockResolvedValue(5);

      const supabase = createMockSupabaseClient();
      const request = new NextRequest(baseUrl, { method: "POST" });
      const response = await (POST as any)({
        request,
        orgId,
        user,
        supabase,
      });
      const data = await response.json();

      expect(sendPendingRemindersMock).toHaveBeenCalledWith(supabase, orgId);
      expect(data.data).toEqual({ sent: 5 });
    });

    it("propagates service error", async () => {
      sendPendingRemindersMock.mockRejectedValue(new Error("Send failed"));

      const supabase = createMockSupabaseClient();
      const request = new NextRequest(baseUrl, { method: "POST" });
      await expect(
        (POST as any)({ request, orgId, user, supabase }),
      ).rejects.toThrow("Send failed");
    });
  });
});
