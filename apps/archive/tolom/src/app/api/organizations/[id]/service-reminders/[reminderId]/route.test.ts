import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockSupabaseClient } from "@/test/mocks/supabase";

// ── Mocks ──────────────────────────────────────────────────────

const getServiceScheduleMock = vi.fn();
const updateServiceScheduleMock = vi.fn();
const deleteServiceScheduleMock = vi.fn();

vi.mock("@/lib/api-handler", () => ({
  createRouteHandler: vi.fn((handler: unknown) => handler),
}));

vi.mock("@/lib/api-response", () => ({
  noContent: vi.fn(() => new Response(null, { status: 204 })),
  ok: vi.fn(
    (data: unknown) => new Response(JSON.stringify({ data }), { status: 200 }),
  ),
}));

vi.mock("@/lib/services/service-reminder-service", () => ({
  getServiceSchedule: getServiceScheduleMock,
  updateServiceSchedule: updateServiceScheduleMock,
  deleteServiceSchedule: deleteServiceScheduleMock,
}));

const { GET, PATCH, DELETE } = await import("./route");

// ── Tests ──────────────────────────────────────────────────────

describe("organizations/[id]/service-reminders/[reminderId] route", () => {
  const orgId = "org-1";
  const reminderId = "rem-1";
  const baseUrl = `http://localhost/api/organizations/${orgId}/service-reminders/${reminderId}`;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── GET ───────────────────────────────────────────

  describe("GET", () => {
    it("returns a service reminder by id", async () => {
      const schedule = { id: reminderId, service_name: "Oil Change" };
      getServiceScheduleMock.mockResolvedValue(schedule);

      const supabase = createMockSupabaseClient();
      const response = await (GET as any)({
        supabase,
        params: { reminderId },
      });
      const body = await response.json();

      expect(getServiceScheduleMock).toHaveBeenCalledWith(supabase, reminderId);
      expect(body.data).toEqual(schedule);
    });

    it("handles service error", async () => {
      getServiceScheduleMock.mockRejectedValue(new Error("Not found"));

      const supabase = createMockSupabaseClient();
      await expect(
        (GET as any)({ supabase, params: { reminderId } }),
      ).rejects.toThrow("Not found");
    });
  });

  // ── PATCH ─────────────────────────────────────────

  describe("PATCH", () => {
    const user = { id: "user-1" };
    const updateBody = { service_name: "Updated Oil Change" };

    it("updates a service reminder", async () => {
      const updated = { id: reminderId, service_name: "Updated Oil Change" };
      updateServiceScheduleMock.mockResolvedValue(updated);

      const supabase = createMockSupabaseClient();
      const request = new NextRequest(baseUrl, {
        method: "PATCH",
        body: JSON.stringify(updateBody),
        headers: { "content-type": "application/json" },
      });
      const response = await (PATCH as any)({
        supabase,
        orgId,
        params: { reminderId },
        request,
        user,
      });
      const body = await response.json();

      expect(updateServiceScheduleMock).toHaveBeenCalledWith(
        supabase,
        reminderId,
        orgId,
        user.id,
        updateBody,
      );
      expect(body.data).toEqual(updated);
    });

    it("handles service error on update", async () => {
      updateServiceScheduleMock.mockRejectedValue(new Error("Update failed"));

      const supabase = createMockSupabaseClient();
      const request = new NextRequest(baseUrl, {
        method: "PATCH",
        body: JSON.stringify(updateBody),
        headers: { "content-type": "application/json" },
      });
      await expect(
        (PATCH as any)({
          supabase,
          orgId,
          params: { reminderId },
          request,
          user,
        }),
      ).rejects.toThrow("Update failed");
    });
  });

  // ── DELETE ────────────────────────────────────────

  describe("DELETE", () => {
    it("deletes a service reminder", async () => {
      deleteServiceScheduleMock.mockResolvedValue(undefined);

      const supabase = createMockSupabaseClient();
      const response = await (DELETE as any)({
        supabase,
        orgId,
        params: { reminderId },
      });

      expect(deleteServiceScheduleMock).toHaveBeenCalledWith(
        supabase,
        reminderId,
        orgId,
      );
      expect(response.status).toBe(204);
    });

    it("handles service error on delete", async () => {
      deleteServiceScheduleMock.mockRejectedValue(new Error("Delete failed"));

      const supabase = createMockSupabaseClient();
      await expect(
        (DELETE as any)({ supabase, orgId, params: { reminderId } }),
      ).rejects.toThrow("Delete failed");
    });
  });
});
