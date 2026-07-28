import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockSupabaseClient } from "@/test/mocks/supabase";

// ── Mocks ──────────────────────────────────────────────────────

const getAppointmentsMock = vi.fn();
const createAppointmentMock = vi.fn();

vi.mock("@/lib/api-handler", () => ({
  createRouteHandler: vi.fn((handler: unknown) => handler),
}));

vi.mock("@/lib/services/appointment-service", () => ({
  getAppointments: getAppointmentsMock,
  createAppointment: createAppointmentMock,
}));

const { GET, POST } = await import("./route");

// ── Tests ──────────────────────────────────────────────────────

describe("organizations/[id]/appointments route", () => {
  const user = { id: "user-1" };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── GET ───────────────────────────────────────────

  describe("GET", () => {
    const baseUrl = "http://localhost/api/organizations/org-1/appointments";

    it("lists appointments with default filters", async () => {
      getAppointmentsMock.mockResolvedValue([{ id: "apt-1" }]);

      const supabase = createMockSupabaseClient();
      const request = new NextRequest(baseUrl);
      const response = await (GET as any)({ request, supabase });
      const body = await response.json();

      expect(getAppointmentsMock).toHaveBeenCalledWith(supabase, {
        status: undefined,
        mechanic_id: undefined,
        date: undefined,
        date_from: undefined,
        date_to: undefined,
        customer_id: undefined,
        branchId: undefined,
      });
      expect(body.data).toEqual([{ id: "apt-1" }]);
    });

    it("passes query params as filters", async () => {
      getAppointmentsMock.mockResolvedValue([{ id: "apt-2" }]);

      const supabase = createMockSupabaseClient();
      const request = new NextRequest(
        `${baseUrl}?status=confirmed&mechanic=mec-1&date=2025-01-15&customer_id=cust-1&branch_id=branch-1`,
      );
      const response = await (GET as any)({ request, supabase });
      const body = await response.json();

      expect(getAppointmentsMock).toHaveBeenCalledWith(supabase, {
        status: "confirmed",
        mechanic_id: "mec-1",
        date: "2025-01-15",
        date_from: undefined,
        date_to: undefined,
        customer_id: "cust-1",
        branchId: "branch-1",
      });
      expect(body.data).toEqual([{ id: "apt-2" }]);
    });

    it("handles service error", async () => {
      getAppointmentsMock.mockRejectedValue(new Error("DB error"));

      const supabase = createMockSupabaseClient();
      const request = new NextRequest(baseUrl);
      await expect((GET as any)({ request, supabase })).rejects.toThrow(
        "DB error",
      );
    });
  });

  // ── POST ──────────────────────────────────────────

  describe("POST", () => {
    const url = "http://localhost/api/organizations/org-1/appointments";

    it("creates an appointment", async () => {
      createAppointmentMock.mockResolvedValue({ id: "apt-1" });
      const body = { customer_id: "cust-1", date: "2025-01-15" };

      const supabase = createMockSupabaseClient();
      const request = new NextRequest(url, {
        method: "POST",
        body: JSON.stringify(body),
        headers: { "content-type": "application/json" },
      });
      const response = await (POST as any)({
        request,
        supabase,
        user,
      });
      const data = await response.json();

      expect(createAppointmentMock).toHaveBeenCalledWith(
        supabase,
        body,
        user.id,
      );
      expect(data.data).toEqual({ id: "apt-1" });
      expect(response.status).toBe(201);
    });

    it("handles service error", async () => {
      createAppointmentMock.mockRejectedValue(new Error("Validation failed"));

      const supabase = createMockSupabaseClient();
      const request = new NextRequest(url, {
        method: "POST",
        body: JSON.stringify({ customer_id: "cust-1" }),
        headers: { "content-type": "application/json" },
      });
      await expect((POST as any)({ request, supabase, user })).rejects.toThrow(
        "Validation failed",
      );
    });
  });
});
