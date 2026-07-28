import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockSupabaseClient } from "@/test/mocks/supabase";

// ── Mocks ──────────────────────────────────────────────────────

const getAppointmentMock = vi.fn();
const updateAppointmentMock = vi.fn();
const deleteAppointmentMock = vi.fn();

vi.mock("@/lib/api-handler", () => ({
  createRouteHandler: vi.fn((handler: unknown) => handler),
}));

vi.mock("@/lib/api-response", () => ({
  apiError: vi.fn(
    (code: string, message: string, status: number) =>
      new Response(JSON.stringify({ code, message }), { status }),
  ),
  ok: vi.fn(
    (data: unknown) => new Response(JSON.stringify({ data }), { status: 200 }),
  ),
}));

vi.mock("@/lib/services/appointment-service", () => ({
  getAppointment: getAppointmentMock,
  updateAppointment: updateAppointmentMock,
  deleteAppointment: deleteAppointmentMock,
}));

const { GET, PATCH, DELETE } = await import("./route");

// ── Tests ──────────────────────────────────────────────────────

describe("organizations/[id]/appointments/[appointmentId] route", () => {
  const orgId = "org-1";
  const appointmentId = "apt-1";
  const baseUrl = `http://localhost/api/organizations/${orgId}/appointments/${appointmentId}`;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── GET ───────────────────────────────────────────

  describe("GET", () => {
    it("returns an appointment by id", async () => {
      const appointment = { id: appointmentId, title: "Oil Change" };
      getAppointmentMock.mockResolvedValue(appointment);

      const supabase = createMockSupabaseClient();
      const response = await (GET as any)({
        supabase,
        orgId,
        params: { appointmentId },
      });
      const body = await response.json();

      expect(getAppointmentMock).toHaveBeenCalledWith(supabase, appointmentId);
      expect(body.data).toEqual(appointment);
    });

    it("returns 404 when appointment is not found", async () => {
      getAppointmentMock.mockResolvedValue(null);

      const supabase = createMockSupabaseClient();
      const response = await (GET as any)({
        supabase,
        orgId,
        params: { appointmentId },
      });

      expect(getAppointmentMock).toHaveBeenCalledWith(supabase, appointmentId);
      expect(response.status).toBe(404);
      const body = await response.json();
      expect(body.code).toBe("NOT_FOUND");
      expect(body.message).toBe("Appointment not found");
    });

    it("handles service error", async () => {
      getAppointmentMock.mockRejectedValue(new Error("DB error"));

      const supabase = createMockSupabaseClient();
      await expect(
        (GET as any)({ supabase, orgId, params: { appointmentId } }),
      ).rejects.toThrow("DB error");
    });
  });

  // ── PATCH ─────────────────────────────────────────

  describe("PATCH", () => {
    it("updates an appointment", async () => {
      const updated = { id: appointmentId, title: "Tire Rotation" };
      updateAppointmentMock.mockResolvedValue(updated);

      const supabase = createMockSupabaseClient();
      const request = new NextRequest(baseUrl, {
        method: "PATCH",
        body: JSON.stringify({ title: "Tire Rotation" }),
        headers: { "content-type": "application/json" },
      });
      const response = await (PATCH as any)({
        supabase,
        orgId,
        params: { appointmentId },
        request,
        user: { id: "user-1" },
      });
      const body = await response.json();

      expect(updateAppointmentMock).toHaveBeenCalledWith(
        supabase,
        appointmentId,
        { title: "Tire Rotation" },
        "user-1",
      );
      expect(body.data).toEqual(updated);
    });

    it("handles service error on update", async () => {
      updateAppointmentMock.mockRejectedValue(new Error("Update failed"));

      const supabase = createMockSupabaseClient();
      const request = new NextRequest(baseUrl, {
        method: "PATCH",
        body: JSON.stringify({ title: "Tire Rotation" }),
        headers: { "content-type": "application/json" },
      });
      await expect(
        (PATCH as any)({
          supabase,
          orgId,
          params: { appointmentId },
          request,
          user: { id: "user-1" },
        }),
      ).rejects.toThrow("Update failed");
    });
  });

  // ── DELETE ────────────────────────────────────────

  describe("DELETE", () => {
    it("deletes an appointment", async () => {
      deleteAppointmentMock.mockResolvedValue(undefined);

      const supabase = createMockSupabaseClient();
      const response = await (DELETE as any)({
        supabase,
        orgId,
        params: { appointmentId },
        user: { id: "user-1" },
      });

      expect(deleteAppointmentMock).toHaveBeenCalledWith(
        supabase,
        appointmentId,
        "user-1",
      );
      const body = await response.json();
      expect(body.data).toBeNull();
    });

    it("handles service error on delete", async () => {
      deleteAppointmentMock.mockRejectedValue(new Error("Delete failed"));

      const supabase = createMockSupabaseClient();
      await expect(
        (DELETE as any)({
          supabase,
          orgId,
          params: { appointmentId },
          user: { id: "user-1" },
        }),
      ).rejects.toThrow("Delete failed");
    });
  });
});
