import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import { ValidationError } from "@/lib/errors";
import {
  generateReportInsights,
  getCustomerRetention,
  getCustomReport,
  getDailyReport,
  getDailyTimeline,
  getDashboardData,
  getEndOfDaySummary,
  getMechanicPerformanceTrend,
  getMechanicsList,
  getMonthlyReport,
  getPnLSummary,
  getRevenueForecast,
  getRevenueTargets,
  getServiceBreakdown,
  getWeeklyReport,
  setRevenueTarget,
} from "@/lib/services/report-service";

export const GET = createRouteHandler(
  async ({ request, orgId }) => {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") ?? "daily";
    const mechanicId = searchParams.get("mechanic");
    const branchParam = searchParams.get("branch");
    const branchId =
      branchParam && branchParam !== "all" ? branchParam : null;
    const date =
      searchParams.get("date") ?? new Date().toISOString().split("T")[0];
    const dateFrom = searchParams.get("date_from") ?? date;
    const dateTo = searchParams.get("date_to") ?? date;

    if (type === "mechanics") {
      const mechanics = await getMechanicsList(orgId, branchId);
      return NextResponse.json({ data: mechanics });
    }

    if (type === "dashboard") {
      const period =
        (searchParams.get("period") as "today" | "week" | "month" | "all") ??
        "all";
      const dashboard = await getDashboardData(orgId, period, branchId);
      return NextResponse.json({ data: dashboard });
    }

    const mid = mechanicId ?? "";

    switch (type) {
      case "daily": {
        const report = await getDailyReport(orgId, mid || null, date, branchId);
        return NextResponse.json({ data: report });
      }
      case "custom": {
        const report = await getCustomReport(
          orgId,
          mid || null,
          dateFrom,
          dateTo,
          branchId,
        );
        return NextResponse.json({ data: report });
      }
      case "weekly": {
        const report = await getWeeklyReport(orgId, mid || null, date, branchId);
        return NextResponse.json({ data: report });
      }
      case "monthly": {
        const [year, month] = date.split("-").map(Number);
        const report = await getMonthlyReport(
          orgId,
          mid || null,
          year,
          month,
          branchId,
        );
        return NextResponse.json({ data: report });
      }
      case "eod": {
        const summary = await getEndOfDaySummary(orgId, date, branchId);
        return NextResponse.json({ data: summary });
      }
      case "timeline": {
        const timeline = await getDailyTimeline(orgId, branchId);
        return NextResponse.json({ data: timeline });
      }
      case "mechanic-trend": {
        if (!mid) {
          throw new ValidationError(
            "mechanic parameter is required for mechanic-trend",
          );
        }
        const period =
          (searchParams.get("period") as "weekly" | "monthly") ?? "weekly";
        const startDate = searchParams.get("startDate") ?? date;
        const endDate = searchParams.get("endDate") ?? date;
        const trend = await getMechanicPerformanceTrend(
          orgId,
          mid,
          period,
          startDate,
          endDate,
          branchId,
        );
        return NextResponse.json({ data: trend });
      }
      // ── ERP-Grade endpoints ────────────────────────────────
      case "insights": {
        const insights = await generateReportInsights(
          orgId,
          dateFrom,
          dateTo,
          branchId,
        );
        return NextResponse.json({ data: insights });
      }
      case "forecast": {
        const periodType =
          (searchParams.get("period_type") as "daily" | "weekly" | "monthly") ??
          "monthly";
        const forecast = await getRevenueForecast(
          orgId,
          periodType,
          date,
          branchId,
        );
        return NextResponse.json({ data: forecast });
      }
      case "targets": {
        const periodType =
          (searchParams.get("period_type") as "daily" | "weekly" | "monthly") ??
          "monthly";
        const targets = await getRevenueTargets(
          orgId,
          periodType,
          date,
          branchId,
        );
        return NextResponse.json({ data: targets });
      }
      case "retention": {
        const retention = await getCustomerRetention(
          orgId,
          dateFrom,
          dateTo,
          branchId,
        );
        return NextResponse.json({ data: retention });
      }
      case "pnl": {
        const pnl = await getPnLSummary(orgId, dateFrom, dateTo, branchId);
        return NextResponse.json({ data: pnl });
      }
      case "service-breakdown": {
        const breakdown = await getServiceBreakdown(
          orgId,
          dateFrom,
          dateTo,
          branchId,
        );
        return NextResponse.json({ data: breakdown });
      }
      default:
        throw new ValidationError(
          "Invalid report type. Use: daily, weekly, monthly, eod, dashboard, mechanics, mechanic-trend, insights, forecast, targets, retention, pnl, service-breakdown",
        );
    }
  },
  { requiredPermission: { resource: "reports", action: "read" } },
);

/** POST /api/organizations/[id]/reports — Set revenue target */
export const POST = createRouteHandler(async ({ request, orgId }) => {
  const body = await request.json();
  const { period_type, period_start, period_end, target_revenue } = body;

  if (
    !period_type ||
    !period_start ||
    !period_end ||
    target_revenue === undefined
  ) {
    throw new ValidationError(
      "period_type, period_start, period_end, and target_revenue are required",
    );
  }

  const target = await setRevenueTarget(
    orgId,
    period_type,
    period_start,
    period_end,
    Number(target_revenue),
  );
  return NextResponse.json({ data: target });
});
