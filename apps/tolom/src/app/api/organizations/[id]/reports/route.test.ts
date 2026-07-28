import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockSupabaseClient } from "@/test/mocks/supabase";

// ── Mocks ──────────────────────────────────────────────────────

const getDailyReportMock = vi.fn();
const getCustomReportMock = vi.fn();
const getWeeklyReportMock = vi.fn();
const getMonthlyReportMock = vi.fn();
const getEndOfDaySummaryMock = vi.fn();
const getDailyTimelineMock = vi.fn();
const getDashboardDataMock = vi.fn();
const getMechanicsListMock = vi.fn();
const getMechanicPerformanceTrendMock = vi.fn();
const generateReportInsightsMock = vi.fn();
const getRevenueForecastMock = vi.fn();
const getRevenueTargetsMock = vi.fn();
const setRevenueTargetMock = vi.fn();
const getCustomerRetentionMock = vi.fn();
const getPnLSummaryMock = vi.fn();
const getServiceBreakdownMock = vi.fn();
const getFinanceSummaryFastMock = vi.fn();
const getMechanicLeaderboardFastMock = vi.fn();
const getBranchComparisonMock = vi.fn();

const hasPermissionMock = vi.fn();

class ForbiddenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ForbiddenError";
  }
}

class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

vi.mock("@/lib/api-handler", () => ({
  createRouteHandler: vi.fn((handler: unknown) => handler),
}));

vi.mock("@/lib/api-response", () => ({
  ok: vi.fn(
    (data: unknown) => new Response(JSON.stringify({ data }), { status: 200 }),
  ),
}));

vi.mock("@/lib/services/report-service", () => ({
  getDailyReport: getDailyReportMock,
  getCustomReport: getCustomReportMock,
  getWeeklyReport: getWeeklyReportMock,
  getMonthlyReport: getMonthlyReportMock,
  getEndOfDaySummary: getEndOfDaySummaryMock,
  getDailyTimeline: getDailyTimelineMock,
  getDashboardData: getDashboardDataMock,
  getMechanicsList: getMechanicsListMock,
  getMechanicPerformanceTrend: getMechanicPerformanceTrendMock,
  generateReportInsights: generateReportInsightsMock,
  getRevenueForecast: getRevenueForecastMock,
  getRevenueTargets: getRevenueTargetsMock,
  setRevenueTarget: setRevenueTargetMock,
  getCustomerRetention: getCustomerRetentionMock,
  getPnLSummary: getPnLSummaryMock,
  getServiceBreakdown: getServiceBreakdownMock,
  getFinanceSummaryFast: getFinanceSummaryFastMock,
  getMechanicLeaderboardFast: getMechanicLeaderboardFastMock,
  getBranchComparison: getBranchComparisonMock,
}));

vi.mock("@/lib/errors", () => ({
  ForbiddenError,
  ValidationError,
}));

vi.mock("@/lib/supabase/role-guard", () => ({
  hasPermission: hasPermissionMock,
}));

const { GET, POST } = await import("./route");

// ── Tests ──────────────────────────────────────────────────────

describe("organizations/[id]/reports route", () => {
  const orgId = "org-1";
  const user = { id: "user-1" };
  const baseUrl = `http://localhost/api/organizations/${orgId}/reports`;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── GET ───────────────────────────────────────────

  describe("GET", () => {
    describe("authorization", () => {
      it("calls hasPermission with reports.read for full-access type", async () => {
        getDailyReportMock.mockResolvedValue({});
        hasPermissionMock.mockResolvedValue(true);

        const supabase = createMockSupabaseClient();
        const request = new NextRequest(baseUrl);
        await (GET as any)({ supabase, orgId, user, request });

        expect(hasPermissionMock).toHaveBeenCalledWith(
          "reports",
          "read",
          orgId,
        );
      });

      it("throws ForbiddenError when lacking reports.read for restricted type", async () => {
        hasPermissionMock.mockResolvedValue(false);

        const supabase = createMockSupabaseClient();
        const request = new NextRequest(`${baseUrl}?type=pnl`);
        await expect(
          (GET as any)({ supabase, orgId, user, request }),
        ).rejects.toThrow("Missing required permission: reports.read");
      });

      it("allows self-service types with work_orders.read", async () => {
        getCustomReportMock.mockResolvedValue({});

        // First call (reports.read) => false
        // Second call (work_orders.read) => true
        hasPermissionMock
          .mockResolvedValueOnce(false)
          .mockResolvedValueOnce(true);

        const supabase = createMockSupabaseClient();
        const request = new NextRequest(
          `${baseUrl}?type=custom&date_from=2024-01-01&date_to=2024-01-31`,
        );
        await (GET as any)({ supabase, orgId, user, request });

        expect(hasPermissionMock).toHaveBeenCalledWith(
          "work_orders",
          "read",
          orgId,
        );
      });
    });

    describe("type=daily", () => {
      it("returns daily report", async () => {
        const report = { revenue: 5000 };
        getDailyReportMock.mockResolvedValue(report);
        hasPermissionMock.mockResolvedValue(true);

        const supabase = createMockSupabaseClient();
        const request = new NextRequest(
          `${baseUrl}?type=daily&date=2024-01-15`,
        );
        const response = await (GET as any)({ supabase, orgId, user, request });
        const body = await response.json();

        expect(getDailyReportMock).toHaveBeenCalledWith(
          supabase,
          orgId,
          null,
          "2024-01-15",
          null,
        );
        expect(body.data).toEqual(report);
      });
    });

    describe("type=custom", () => {
      it("returns custom report with date range", async () => {
        const report = { revenue: 10000 };
        getCustomReportMock.mockResolvedValue(report);
        hasPermissionMock.mockResolvedValue(true);

        const supabase = createMockSupabaseClient();
        const request = new NextRequest(
          `${baseUrl}?type=custom&date_from=2024-01-01&date_to=2024-01-31`,
        );
        const response = await (GET as any)({ supabase, orgId, user, request });
        const body = await response.json();

        expect(getCustomReportMock).toHaveBeenCalledWith(
          supabase,
          orgId,
          null,
          "2024-01-01",
          "2024-01-31",
          null,
        );
        expect(body.data).toEqual(report);
      });
    });

    describe("type=weekly", () => {
      it("returns weekly report", async () => {
        const report = { revenue: 3000 };
        getWeeklyReportMock.mockResolvedValue(report);
        hasPermissionMock.mockResolvedValue(true);

        const supabase = createMockSupabaseClient();
        const request = new NextRequest(
          `${baseUrl}?type=weekly&date=2024-01-15`,
        );
        const response = await (GET as any)({ supabase, orgId, user, request });
        const body = await response.json();

        expect(getWeeklyReportMock).toHaveBeenCalledWith(
          supabase,
          orgId,
          null,
          "2024-01-15",
          null,
        );
        expect(body.data).toEqual(report);
      });
    });

    describe("type=monthly", () => {
      it("returns monthly report", async () => {
        const report = { revenue: 12000 };
        getMonthlyReportMock.mockResolvedValue(report);
        hasPermissionMock.mockResolvedValue(true);

        const supabase = createMockSupabaseClient();
        const request = new NextRequest(
          `${baseUrl}?type=monthly&date=2024-01-15`,
        );
        const response = await (GET as any)({ supabase, orgId, user, request });
        const body = await response.json();

        expect(getMonthlyReportMock).toHaveBeenCalledWith(
          supabase,
          orgId,
          null,
          2024,
          1,
          null,
        );
        expect(body.data).toEqual(report);
      });
    });

    describe("type=eod", () => {
      it("returns end-of-day summary", async () => {
        const summary = { closed: false };
        getEndOfDaySummaryMock.mockResolvedValue(summary);
        hasPermissionMock.mockResolvedValue(true);

        const supabase = createMockSupabaseClient();
        const request = new NextRequest(`${baseUrl}?type=eod&date=2024-01-15`);
        const response = await (GET as any)({ supabase, orgId, user, request });
        const body = await response.json();

        expect(getEndOfDaySummaryMock).toHaveBeenCalledWith(
          supabase,
          orgId,
          "2024-01-15",
          null,
          null,
        );
        expect(body.data).toEqual(summary);
      });
    });

    describe("type=mechanic-trend", () => {
      it("returns mechanic performance trend", async () => {
        const trend = { hours: 40 };
        getMechanicPerformanceTrendMock.mockResolvedValue(trend);
        hasPermissionMock.mockResolvedValue(true);

        const supabase = createMockSupabaseClient();
        const request = new NextRequest(
          `${baseUrl}?type=mechanic-trend&mechanic=mech-1`,
        );
        const response = await (GET as any)({ supabase, orgId, user, request });
        const body = await response.json();

        expect(getMechanicPerformanceTrendMock).toHaveBeenCalled();
        expect(body.data).toEqual(trend);
      });

      it("throws ValidationError when mechanic param missing", async () => {
        hasPermissionMock.mockResolvedValue(true);

        const supabase = createMockSupabaseClient();
        const request = new NextRequest(`${baseUrl}?type=mechanic-trend`);
        await expect(
          (GET as any)({ supabase, orgId, user, request }),
        ).rejects.toThrow("mechanic parameter is required");
      });
    });

    describe("type=mechanics", () => {
      it("returns mechanics list", async () => {
        const mechanics = [{ id: "mech-1", name: "John" }];
        getMechanicsListMock.mockResolvedValue(mechanics);
        hasPermissionMock.mockResolvedValue(true);

        const supabase = createMockSupabaseClient();
        const request = new NextRequest(`${baseUrl}?type=mechanics`);
        const response = await (GET as any)({ supabase, orgId, user, request });
        const body = await response.json();

        expect(getMechanicsListMock).toHaveBeenCalledWith(
          supabase,
          orgId,
          null,
        );
        expect(body.data).toEqual(mechanics);
      });
    });

    describe("type=dashboard", () => {
      it("returns dashboard with period", async () => {
        const dashboard = { revenue: 50000 };
        getDashboardDataMock.mockResolvedValue(dashboard);
        hasPermissionMock.mockResolvedValue(true);

        const supabase = createMockSupabaseClient();
        const request = new NextRequest(
          `${baseUrl}?type=dashboard&period=today`,
        );
        const response = await (GET as any)({ supabase, orgId, user, request });
        const body = await response.json();

        expect(getDashboardDataMock).toHaveBeenCalledWith(
          supabase,
          orgId,
          "today",
          null,
        );
        expect(body.data).toEqual(dashboard);
      });

      it("returns dashboard with date range", async () => {
        const dashboard = { revenue: 50000 };
        getDashboardDataMock.mockResolvedValue(dashboard);
        hasPermissionMock.mockResolvedValue(true);

        const supabase = createMockSupabaseClient();
        const request = new NextRequest(
          `${baseUrl}?type=dashboard&date_from=2024-01-01&date_to=2024-01-31`,
        );
        const response = await (GET as any)({ supabase, orgId, user, request });
        const body = await response.json();

        expect(getDashboardDataMock).toHaveBeenCalledWith(supabase, orgId, {
          dateFrom: "2024-01-01",
          dateTo: "2024-01-31",
          branchId: null,
        });
        expect(body.data).toEqual(dashboard);
      });
    });

    describe("type=insights", () => {
      it("returns report insights", async () => {
        const insights = { top_services: [] };
        generateReportInsightsMock.mockResolvedValue(insights);
        hasPermissionMock.mockResolvedValue(true);

        const supabase = createMockSupabaseClient();
        const request = new NextRequest(
          `${baseUrl}?type=insights&date_from=2024-01-01&date_to=2024-01-31`,
        );
        const response = await (GET as any)({ supabase, orgId, user, request });
        const body = await response.json();

        expect(generateReportInsightsMock).toHaveBeenCalledWith(
          supabase,
          orgId,
          "2024-01-01",
          "2024-01-31",
          null,
        );
        expect(body.data).toEqual(insights);
      });
    });

    describe("type=forecast", () => {
      it("returns revenue forecast", async () => {
        const forecast = { predicted: 50000 };
        getRevenueForecastMock.mockResolvedValue(forecast);
        hasPermissionMock.mockResolvedValue(true);

        const supabase = createMockSupabaseClient();
        const request = new NextRequest(
          `${baseUrl}?type=forecast&period_type=monthly`,
        );
        const response = await (GET as any)({ supabase, orgId, user, request });
        const body = await response.json();

        expect(getRevenueForecastMock).toHaveBeenCalled();
        expect(body.data).toEqual(forecast);
      });
    });

    describe("type=targets", () => {
      it("returns revenue targets", async () => {
        const targets = { target: 100000 };
        getRevenueTargetsMock.mockResolvedValue(targets);
        hasPermissionMock.mockResolvedValue(true);

        const supabase = createMockSupabaseClient();
        const request = new NextRequest(`${baseUrl}?type=targets`);
        const response = await (GET as any)({ supabase, orgId, user, request });
        const body = await response.json();

        expect(getRevenueTargetsMock).toHaveBeenCalled();
        expect(body.data).toEqual(targets);
      });
    });

    describe("type=retention", () => {
      it("returns customer retention", async () => {
        const retention = { rate: 0.8 };
        getCustomerRetentionMock.mockResolvedValue(retention);
        hasPermissionMock.mockResolvedValue(true);

        const supabase = createMockSupabaseClient();
        const request = new NextRequest(
          `${baseUrl}?type=retention&date_from=2024-01-01&date_to=2024-01-31`,
        );
        const response = await (GET as any)({ supabase, orgId, user, request });
        const body = await response.json();

        expect(getCustomerRetentionMock).toHaveBeenCalledWith(
          supabase,
          orgId,
          "2024-01-01",
          "2024-01-31",
          null,
        );
        expect(body.data).toEqual(retention);
      });
    });

    describe("type=pnl", () => {
      it("returns P&L summary", async () => {
        const pnl = { revenue: 50000, expenses: 30000 };
        getPnLSummaryMock.mockResolvedValue(pnl);
        hasPermissionMock.mockResolvedValue(true);

        const supabase = createMockSupabaseClient();
        const request = new NextRequest(
          `${baseUrl}?type=pnl&date_from=2024-01-01&date_to=2024-01-31`,
        );
        const response = await (GET as any)({ supabase, orgId, user, request });
        const body = await response.json();

        expect(getPnLSummaryMock).toHaveBeenCalledWith(
          supabase,
          orgId,
          "2024-01-01",
          "2024-01-31",
          null,
        );
        expect(body.data).toEqual(pnl);
      });
    });

    describe("type=service-breakdown", () => {
      it("returns service breakdown", async () => {
        const breakdown = { oil_change: 50 };
        getServiceBreakdownMock.mockResolvedValue(breakdown);
        hasPermissionMock.mockResolvedValue(true);

        const supabase = createMockSupabaseClient();
        const request = new NextRequest(
          `${baseUrl}?type=service-breakdown&date_from=2024-01-01&date_to=2024-01-31`,
        );
        const response = await (GET as any)({ supabase, orgId, user, request });
        const body = await response.json();

        expect(getServiceBreakdownMock).toHaveBeenCalledWith(
          supabase,
          orgId,
          "2024-01-01",
          "2024-01-31",
          null,
        );
        expect(body.data).toEqual(breakdown);
      });
    });

    describe("type=finance-summary", () => {
      it("returns finance summary", async () => {
        const finance = { revenue: 50000 };
        getFinanceSummaryFastMock.mockResolvedValue(finance);
        hasPermissionMock.mockResolvedValue(true);

        const supabase = createMockSupabaseClient();
        const request = new NextRequest(`${baseUrl}?type=finance-summary`);
        const response = await (GET as any)({ supabase, orgId, user, request });
        const body = await response.json();

        expect(getFinanceSummaryFastMock).toHaveBeenCalledWith(
          supabase,
          orgId,
          "month",
        );
        expect(body.data).toEqual(finance);
      });
    });

    describe("type=mechanic-leaderboard", () => {
      it("returns mechanic leaderboard", async () => {
        const leaderboard = [{ mechanic_id: "mech-1", revenue: 5000 }];
        getMechanicLeaderboardFastMock.mockResolvedValue(leaderboard);
        hasPermissionMock.mockResolvedValue(true);

        const supabase = createMockSupabaseClient();
        const request = new NextRequest(`${baseUrl}?type=mechanic-leaderboard`);
        const response = await (GET as any)({ supabase, orgId, user, request });
        const body = await response.json();

        expect(getMechanicLeaderboardFastMock).toHaveBeenCalledWith(
          supabase,
          orgId,
          "month",
        );
        expect(body.data).toEqual(leaderboard);
      });
    });

    describe("type=branch-comparison", () => {
      it("returns branch comparison", async () => {
        const comparison = { branches: [] };
        getBranchComparisonMock.mockResolvedValue(comparison);
        hasPermissionMock.mockResolvedValue(true);

        const supabase = createMockSupabaseClient();
        const request = new NextRequest(
          `${baseUrl}?type=branch-comparison&date_from=2024-01-01&date_to=2024-01-31`,
        );
        const response = await (GET as any)({ supabase, orgId, user, request });
        const body = await response.json();

        expect(getBranchComparisonMock).toHaveBeenCalledWith(
          supabase,
          orgId,
          "2024-01-01",
          "2024-01-31",
        );
        expect(body.data).toEqual(comparison);
      });
    });

    describe("type=timeline", () => {
      it("returns daily timeline", async () => {
        const timeline = { events: [] };
        getDailyTimelineMock.mockResolvedValue(timeline);
        hasPermissionMock.mockResolvedValue(true);

        const supabase = createMockSupabaseClient();
        const request = new NextRequest(`${baseUrl}?type=timeline`);
        const response = await (GET as any)({ supabase, orgId, user, request });
        const body = await response.json();

        expect(getDailyTimelineMock).toHaveBeenCalledWith(
          supabase,
          orgId,
          null,
        );
        expect(body.data).toEqual(timeline);
      });
    });

    describe("default type", () => {
      it("defaults to daily report when no type param", async () => {
        getDailyReportMock.mockResolvedValue({});
        hasPermissionMock.mockResolvedValue(true);

        const supabase = createMockSupabaseClient();
        const request = new NextRequest(baseUrl);
        await (GET as any)({ supabase, orgId, user, request });

        expect(getDailyReportMock).toHaveBeenCalled();
      });
    });

    describe("invalid type", () => {
      it("throws ValidationError for unknown type", async () => {
        hasPermissionMock.mockResolvedValue(true);

        const supabase = createMockSupabaseClient();
        const request = new NextRequest(`${baseUrl}?type=invalid`);
        await expect(
          (GET as any)({ supabase, orgId, user, request }),
        ).rejects.toThrow("Invalid report type");
      });
    });
  });

  // ── POST ──────────────────────────────────────────

  describe("POST", () => {
    it("sets a revenue target", async () => {
      const target = { id: "target-1", target_revenue: 100000 };
      setRevenueTargetMock.mockResolvedValue(target);
      hasPermissionMock.mockResolvedValue(true);

      const supabase = createMockSupabaseClient();
      const body = {
        period_type: "monthly",
        period_start: "2024-01-01",
        period_end: "2024-12-31",
        target_revenue: "100000",
      };
      const request = new NextRequest(baseUrl, {
        method: "POST",
        body: JSON.stringify(body),
        headers: { "content-type": "application/json" },
      });
      const response = await (POST as any)({ supabase, orgId, request });
      const data = await response.json();

      expect(setRevenueTargetMock).toHaveBeenCalledWith(
        supabase,
        orgId,
        "monthly",
        "2024-01-01",
        "2024-12-31",
        100000,
      );
      expect(data.data).toEqual(target);
    });

    it("throws ValidationError when required fields are missing", async () => {
      hasPermissionMock.mockResolvedValue(true);

      const supabase = createMockSupabaseClient();
      const request = new NextRequest(baseUrl, {
        method: "POST",
        body: JSON.stringify({}),
        headers: { "content-type": "application/json" },
      });
      await expect((POST as any)({ supabase, orgId, request })).rejects.toThrow(
        "period_type, period_start, period_end, and target_revenue are required",
      );
    });

    it("handles service error", async () => {
      setRevenueTargetMock.mockRejectedValue(new Error("Set failed"));
      hasPermissionMock.mockResolvedValue(true);

      const supabase = createMockSupabaseClient();
      const request = new NextRequest(baseUrl, {
        method: "POST",
        body: JSON.stringify({
          period_type: "monthly",
          period_start: "2024-01-01",
          period_end: "2024-12-31",
          target_revenue: "100000",
        }),
        headers: { "content-type": "application/json" },
      });
      await expect((POST as any)({ supabase, orgId, request })).rejects.toThrow(
        "Set failed",
      );
    });
  });
});
