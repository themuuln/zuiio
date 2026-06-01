import type { SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import { ForbiddenError, ValidationError } from "@/lib/errors";
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

    const mid = effectiveMid;

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
        const report = await getWeeklyReport(
          orgId,
          mid || null,
          date,
          branchId,
        );
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
          orgId,
          effectiveMid,
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
);

/** POST /api/organizations/[id]/reports — Set revenue target */
export const POST = createRouteHandler(
  async ({ request, orgId }) => {
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
  },
  { requiredPermission: { resource: "reports", action: "read" } },
);
