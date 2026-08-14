import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockSupabaseClient } from "@/test/mocks/supabase";

// ── Mocks ──────────────────────────────────────────────────────

const getServiceSchedulesMock = vi.fn();
const createServiceScheduleMock = vi.fn();

vi.mock("@/lib/api-handler", () => ({
  createRouteHandler: vi.fn((handler: unknown) => handler),
}));

vi.mock("@/lib/services/service-reminder-service", () => ({
  getServiceSchedules: getServiceSchedulesMock,
  createServiceSchedule: createServiceScheduleMock,
}));

const { GET, POST } = await import("./route");

// ── Tests ──────────────────────────────────────────────────────

describe("organizations/[id]/service-reminders route", () => {
  const orgId = "org-1";
  const user = { id: "user-1" };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── GET ───────────────────────────────────────────

  describe("GET", () => {
    const baseUrl = `http://localhost/api/organizations/${orgId}/service-reminders`;

    it("lists service schedules", async () => {
      getServiceSchedulesMock.mockResolvedValue([
        { id: "sched-1", vehicle_id: "v-1" },
      ]);

      const supabase = createMockSupabaseClient();
      const request = new NextRequest(baseUrl);
      const response = await (GET as any)({ request, orgId, supabase });
      const body = await response.json();

      expect(getServiceSchedulesMock).toHaveBeenCalledWith(
        supabase,
        orgId,
        undefined,
        null,
      );
      expect(body.data).toEqual([{ id: "sched-1", vehicle_id: "v-1" }]);
    });

    it("filters by vehicle_id and branch_id", async () => {
      getServiceSchedulesMock.mockResolvedValue([
        { id: "sched-2", vehicle_id: "v-2" },
      ]);

      const supabase = createMockSupabaseClient();
      const request = new NextRequest(
        `${baseUrl}?vehicle_id=v-2&branch_id=branch-1`,
      );
      const response = await (GET as any)({ request, orgId, supabase });
      const body = await response.json();

      expect(getServiceSchedulesMock).toHaveBeenCalledWith(
        supabase,
        orgId,
        "v-2",
        "branch-1",
      );
      expect(body.data).toEqual([{ id: "sched-2", vehicle_id: "v-2" }]);
    });

    it("handles service error", async () => {
      getServiceSchedulesMock.mockRejectedValue(new Error("DB error"));

      const supabase = createMockSupabaseClient();
      const request = new NextRequest(baseUrl);
      await expect((GET as any)({ request, orgId, supabase })).rejects.toThrow(
        "DB error",
      );
    });
  });

  // ── POST ──────────────────────────────────────────

  describe("POST", () => {
    const url = `http://localhost/api/organizations/${orgId}/service-reminders`;

    it("creates a service schedule", async () => {
      createServiceScheduleMock.mockResolvedValue({ id: "sched-1" });
      const body = {
        vehicle_id: "v-1",
        reminder_date: "2025-02-01",
      };

      const supabase = createMockSupabaseClient();
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

      expect(createServiceScheduleMock).toHaveBeenCalledWith(
        supabase,
        orgId,
        user.id,
        body,
      );
      expect(data.data).toEqual({ id: "sched-1" });
      expect(response.status).toBe(201);
    });

    it("handles service error", async () => {
      createServiceScheduleMock.mockRejectedValue(
        new Error("Validation failed"),
      );

      const supabase = createMockSupabaseClient();
      const request = new NextRequest(url, {
        method: "POST",
        body: JSON.stringify({ vehicle_id: "v-1" }),
        headers: { "content-type": "application/json" },
      });
      await expect(
        (POST as any)({ request, orgId, user, supabase }),
      ).rejects.toThrow("Validation failed");
    });
  });
});
