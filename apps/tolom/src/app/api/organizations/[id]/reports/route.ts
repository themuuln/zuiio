import { createRouteHandler } from "@/lib/api-handler";
import { ok } from "@/lib/api-response";
import { ForbiddenError, ValidationError } from "@/lib/errors";
import {
  generateReportInsights,
  getBranchComparison,
  getCustomerRetention,
  getCustomReport,
  getDailyReport,
  getDailyTimeline,
  getDashboardData,
  getEndOfDaySummary,
  getFinanceSummaryFast,
  getMechanicLeaderboardFast,
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
import { hasPermission } from "@/lib/supabase/role-guard";

// ── Report types accessible with work_orders.read (self-scoped) ──
// These types are operational, not financial, and are scoped to the
// authenticated user's own mechanic data when reports.read is absent.
const SELF_SERVICE_REPORT_TYPES = new Set([
  "custom",
  "timeline",
  "eod",
  "mechanic-trend",
  "mechanics",
]);

/**
 * Authorizes access to a report type using the permission system.
 *
 * - Users with `reports.read` → full access to all report types.
 * - Users with `work_orders.read` but no `reports.read` → access only
 *   to SELF_SERVICE_REPORT_TYPES, forced to their own mechanic ID.
 * - Otherwise → ForbiddenError.
 */
async function authorizeReportAccess(
  type: string,
  orgId: string,
): Promise<"full" | "self-service"> {
  if (await hasPermission("reports", "read", orgId)) {
    return "full";
  }

  if (SELF_SERVICE_REPORT_TYPES.has(type)) {
    // Self-service types still require work_orders.read
    if (!(await hasPermission("work_orders", "read", orgId))) {
      throw new ForbiddenError("Missing required permission: work_orders.read");
    }
    return "self-service";
  }

  throw new ForbiddenError("Missing required permission: reports.read");
}

export const GET = createRouteHandler(
  async ({ request, orgId, user, supabase }) => {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") ?? "daily";
    const requestedMechanicId = searchParams.get("mechanic");

    // Per-type authorization — returns "full" or "self-service"
    const accessLevel = await authorizeReportAccess(type, orgId);

    const branchParam = searchParams.get("branch");
    const branchId = branchParam && branchParam !== "all" ? branchParam : null;
    const date =
      searchParams.get("date") ?? new Date().toISOString().split("T")[0];
    const dateFrom = searchParams.get("date_from") ?? date;
    const dateTo = searchParams.get("date_to") ?? date;

    // ── Enforce self-access for self-service types ──
    // Without reports.read, a user can only access their own data
    const effectiveMid =
      accessLevel === "full" ? (requestedMechanicId ?? "") : user.id;

    if (type === "mechanics") {
      const mechanics = await getMechanicsList(supabase, orgId, branchId);
      return ok(mechanics);
    }

    if (type === "dashboard") {
      const dateFromParam = searchParams.get("date_from");
      const dateToParam = searchParams.get("date_to");
      const period =
        (searchParams.get("period") as "today" | "week" | "month" | "all") ??
        "all";

      if (dateFromParam && dateToParam) {
        const dashboard = await getDashboardData(supabase, orgId, {
          dateFrom: dateFromParam,
          dateTo: dateToParam,
          branchId,
        });
        return ok(dashboard);
      }

      const dashboard = await getDashboardData(
        supabase,
        orgId,
        period,
        branchId,
      );
      return ok(dashboard);
    }

    const mid = effectiveMid;

    switch (type) {
      case "daily": {
        const report = await getDailyReport(
          supabase,
          orgId,
          mid || null,
          date,
          branchId,
        );
        return ok(report);
      }
      case "custom": {
        const report = await getCustomReport(
          supabase,
          orgId,
          mid || null,
          dateFrom,
          dateTo,
          branchId,
        );
        return ok(report);
      }
      case "weekly": {
        const report = await getWeeklyReport(
          supabase,
          orgId,
          mid || null,
          date,
          branchId,
        );
        return ok(report);
      }
      case "monthly": {
        const [year, month] = date.split("-").map(Number);
        const report = await getMonthlyReport(
          supabase,
          orgId,
          mid || null,
          year,
          month,
          branchId,
        );
        return ok(report);
      }
      case "eod": {
        const summary = await getEndOfDaySummary(
          supabase,
          orgId,
          date,
          branchId,
          mid || null,
        );
        return ok(summary);
      }
      case "timeline": {
        const timeline = await getDailyTimeline(supabase, orgId, branchId);
        return ok(timeline);
      }
      case "mechanic-trend": {
        if (!effectiveMid) {
          throw new ValidationError(
            "mechanic parameter is required for mechanic-trend",
          );
        }
        const period =
          (searchParams.get("period") as "weekly" | "monthly") ?? "weekly";
        const startDate = searchParams.get("startDate") ?? date;
        const endDate = searchParams.get("endDate") ?? date;
        const trend = await getMechanicPerformanceTrend(
          supabase,
          orgId,
          effectiveMid,
          period,
          startDate,
          endDate,
          branchId,
        );
        return ok(trend);
      }
      // ── ERP-Grade endpoints ────────────────────────────────
      case "insights": {
        const insights = await generateReportInsights(
          supabase,
          orgId,
          dateFrom,
          dateTo,
          branchId,
        );
        return ok(insights);
      }
      case "forecast": {
        const periodType =
          (searchParams.get("period_type") as "daily" | "weekly" | "monthly") ??
          "monthly";
        const forecast = await getRevenueForecast(
          supabase,
          orgId,
          periodType,
          date,
          branchId,
        );
        return ok(forecast);
      }
      case "targets": {
        const periodType =
          (searchParams.get("period_type") as "daily" | "weekly" | "monthly") ??
          "monthly";
        const targets = await getRevenueTargets(
          supabase,
          orgId,
          periodType,
          date,
          branchId,
        );
        return ok(targets);
      }
      case "retention": {
        const retention = await getCustomerRetention(
          supabase,
          orgId,
          dateFrom,
          dateTo,
          branchId,
        );
        return ok(retention);
      }
      case "pnl": {
        const pnl = await getPnLSummary(
          supabase,
          orgId,
          dateFrom,
          dateTo,
          branchId,
        );
        return ok(pnl);
      }
      case "service-breakdown": {
        const breakdown = await getServiceBreakdown(
          supabase,
          orgId,
          dateFrom,
          dateTo,
          branchId,
        );
        return ok(breakdown);
      }
      case "finance-summary": {
        const period =
          (searchParams.get("period") as "day" | "week" | "month" | "year") ??
          "month";
        const finance = await getFinanceSummaryFast(supabase, orgId, period);
        return ok(finance);
      }
      case "mechanic-leaderboard": {
        const period =
          (searchParams.get("period") as "week" | "month" | "year") ?? "month";
        const leaderboard = await getMechanicLeaderboardFast(
          supabase,
          orgId,
          period,
        );
        return ok(leaderboard);
      }
      case "branch-comparison": {
        const comparison = await getBranchComparison(
          supabase,
          orgId,
          dateFrom,
          dateTo,
        );
        return ok(comparison);
      }
      default:
        throw new ValidationError(
          "Invalid report type. Use: daily, weekly, monthly, eod, dashboard, finance-summary, mechanic-leaderboard, mechanics, mechanic-trend, insights, forecast, targets, retention, pnl, service-breakdown, branch-comparison",
        );
    }
  },
);

/** POST /api/organizations/[id]/reports — Set revenue target */
export const POST = createRouteHandler(
  async ({ request, orgId, supabase }) => {
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
      supabase,
      orgId,
      period_type,
      period_start,
      period_end,
      Number(target_revenue),
    );
    return ok(target);
  },
  { requiredPermission: { resource: "reports", action: "read" } },
);
