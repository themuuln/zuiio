import type { SupabaseClient } from "@supabase/supabase-js";
import { ok } from "@/lib/api-response";
import { createRouteHandler } from "@/lib/api-handler";
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

// ── Role hierarchy (mirrors role-guard.ts) ──
const ROLE_HIERARCHY: Record<string, number> = {
  Guest: 0,
  Mechanic: 1,
  Manager: 2,
  "Org Owner": 3,
};

// ── Report types mechanics may access without reports.read permission ──
// "timeline": today's activity feed (non-financial, operational)
// "eod": end-of-day summary (filtered to self when no reports.read)
// "mechanic-trend": own performance trend (filtered to self when no reports.read)
// "mechanics": list of mechanics (names only, non-financial)
const MECHANIC_SAFE_TYPES = new Set([
  "custom",
  "timeline",
  "eod",
  "mechanic-trend",
  "mechanics",
]);

/**
 * Resolves the user's role name for a specific organization.
 * This is org-scoped (unlike getUserRole in role-guard.ts which checks
 * the primary org), so it works correctly for multi-org users.
 */
async function getRoleInOrg(
  supabase: SupabaseClient,
  userId: string,
  orgId: string,
): Promise<string | null> {
  const { data: membership } = await supabase
    .from("organization_users")
    .select("role_id, roles(name)")
    .eq("user_id", userId)
    .eq("organization_id", orgId)
    .is("removed_at", null)
    .maybeSingle();

  const rawRoles = membership?.roles;
  if (rawRoles === null || rawRoles === undefined) return null;
  return Array.isArray(rawRoles)
    ? (rawRoles[0]?.name ?? null)
    : ((rawRoles as unknown as { name: string }).name ?? null);
}

/**
 * Checks that the user's role level for the given org is >= the minimum.
 * Throws ForbiddenError otherwise.
 */
async function requireRoleInOrg(
  supabase: SupabaseClient,
  userId: string,
  orgId: string,
  minimumRole: "Mechanic" | "Manager" | "Org Owner",
): Promise<void> {
  const roleName = await getRoleInOrg(supabase, userId, orgId);
  const roleLevel = ROLE_HIERARCHY[roleName ?? ""] ?? -1;
  const requiredLevel = ROLE_HIERARCHY[minimumRole];
  if (roleLevel < requiredLevel) {
    throw new ForbiddenError("Insufficient permissions");
  }
}

/**
 * Authorizes access to a report type.
 *
 * - Users with reports.read permission → full access to all types.
 * - Users without reports.read can only access MECHANIC_SAFE_TYPES,
 *   with at least Mechanic role in the current org.
 */
async function authorizeReportAccess(
  type: string,
  orgId: string,
  userId: string,
  supabase: SupabaseClient,
): Promise<void> {
  if (await hasPermission("reports", "read", orgId)) {
    return; // full access
  }

  if (!MECHANIC_SAFE_TYPES.has(type)) {
    throw new ForbiddenError("Missing required permission: reports.read");
  }

  // Mechanic-safe types still require at least Mechanic role in THIS org
  await requireRoleInOrg(supabase, userId, orgId, "Mechanic");
}

export const GET = createRouteHandler(
  async ({ request, orgId, user, supabase }) => {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") ?? "daily";
    const requestedMechanicId = searchParams.get("mechanic");

    // Per-type authorization
    await authorizeReportAccess(type, orgId, user.id, supabase);

    const branchParam = searchParams.get("branch");
    const branchId = branchParam && branchParam !== "all" ? branchParam : null;
    const date =
      searchParams.get("date") ?? new Date().toISOString().split("T")[0];
    const dateFrom = searchParams.get("date_from") ?? date;
    const dateTo = searchParams.get("date_to") ?? date;

    // ── Enforce self-access for mechanic-specific types ──
    // Without reports.read, a mechanic can only access their own data
    const hasReportsRead = await hasPermission("reports", "read", orgId);
    const effectiveMid = hasReportsRead ? (requestedMechanicId ?? "") : user.id; // force self-access when no reports.read

    if (type === "mechanics") {
      const mechanics = await getMechanicsList(supabase, orgId, branchId);
      return ok(mechanics);
    }

    if (type === "dashboard") {
      const dateFromParam = searchParams.get("date_from");
      const dateToParam = searchParams.get("date_to");

      if (dateFromParam && dateToParam) {
        // Custom date range — pass as object
        const dashboard = await getDashboardData(supabase, orgId, {
          dateFrom: dateFromParam,
          dateTo: dateToParam,
          branchId,
        });
        return ok(dashboard);
      }

      // Backward compat with period string
      const period =
        (searchParams.get("period") as "today" | "week" | "month" | "all") ??
        "all";
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
          "Invalid report type. Use: daily, weekly, monthly, eod, dashboard, mechanics, mechanic-trend, insights, forecast, targets, retention, pnl, service-breakdown, branch-comparison",
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
