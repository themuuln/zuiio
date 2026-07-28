import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockSupabaseClient } from "@/test/mocks/supabase";

// ── Mocks ──────────────────────────────────────────────────────

const getDashboardDataMock = vi.fn();
const checkSubscriptionStatusMock = vi.fn();

vi.mock("@/lib/api-handler", () => ({
  createRouteHandler: vi.fn((handler: unknown) => handler),
}));

vi.mock("@/lib/services/report-service/dashboard", () => ({
  getDashboardData: getDashboardDataMock,
}));

vi.mock("@/lib/services/subscription-service", () => ({
  checkSubscriptionStatus: checkSubscriptionStatusMock,
}));

const { GET } = await import("./route");

// ── Tests ──────────────────────────────────────────────────────

describe("organizations/[id]/dashboard-bundle route", () => {
  const orgId = "org-1";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET", () => {
    const baseUrl = `http://localhost/api/organizations/${orgId}/dashboard-bundle`;

    it("returns dashboard data and subscription status", async () => {
      const dashboardData = { revenue: 50000, orders: 120 };
      const subscription = { status: "active", plan: "pro" };

      getDashboardDataMock.mockResolvedValue(dashboardData);
      checkSubscriptionStatusMock.mockResolvedValue(subscription);

      const supabase = createMockSupabaseClient();
      const request = new NextRequest(baseUrl);
      const response = await (GET as any)({ request, orgId, supabase });
      const body = await response.json();

      expect(getDashboardDataMock).toHaveBeenCalledWith(
        supabase,
        orgId,
        "month",
        null,
      );
      expect(checkSubscriptionStatusMock).toHaveBeenCalledWith(supabase, orgId);
      expect(body.data).toEqual({
        dashboard: dashboardData,
        subscription,
      });
    });

    it("passes period and branch_id params", async () => {
      getDashboardDataMock.mockResolvedValue({ revenue: 10000 });
      checkSubscriptionStatusMock.mockResolvedValue({ status: "active" });

      const supabase = createMockSupabaseClient();
      const request = new NextRequest(
        `${baseUrl}?period=week&branch_id=branch-1`,
      );
      const response = await (GET as any)({ request, orgId, supabase });
      const body = await response.json();

      expect(getDashboardDataMock).toHaveBeenCalledWith(
        supabase,
        orgId,
        "week",
        "branch-1",
      );
      expect(body.data).toBeDefined();
    });

    it("handles service error from getDashboardData", async () => {
      getDashboardDataMock.mockRejectedValue(new Error("DB error"));
      checkSubscriptionStatusMock.mockResolvedValue({ status: "active" });

      const supabase = createMockSupabaseClient();
      const request = new NextRequest(baseUrl);
      await expect((GET as any)({ request, orgId, supabase })).rejects.toThrow(
        "DB error",
      );
    });

    it("handles service error from checkSubscriptionStatus", async () => {
      getDashboardDataMock.mockResolvedValue({ revenue: 50000 });
      checkSubscriptionStatusMock.mockRejectedValue(
        new Error("Subscription error"),
      );

      const supabase = createMockSupabaseClient();
      const request = new NextRequest(baseUrl);
      await expect((GET as any)({ request, orgId, supabase })).rejects.toThrow(
        "Subscription error",
      );
    });
  });
});
