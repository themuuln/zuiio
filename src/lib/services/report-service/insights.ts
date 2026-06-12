// ── Insight generation (dashboard + report-level) ───────────

import type {
  DashboardSummary,
  ReportInsight,
  WorkOrderStatusDistribution,
} from "@/lib/types";

import type { SupabaseClient } from "@supabase/supabase-js";
import { withBranchFilter } from "@/lib/supabase/with-branch";

import { formatCurrencyHelper, formatNum } from "./utils";

/**
 * Generates human-readable smart insights from dashboard data deltas.
 */
export function generateInsights(
  summary: DashboardSummary,
  prevSummary: DashboardSummary | null,
  statusDist: WorkOrderStatusDistribution[],
): string[] {
  const insights: string[] = [];

  if (!prevSummary) return [];

  // Revenue delta
  const revChange = summary.totalRevenue - prevSummary.totalRevenue;
  if (Math.abs(revChange) > 0) {
    const revPct =
      prevSummary.totalRevenue > 0
        ? Math.round((revChange / prevSummary.totalRevenue) * 100)
        : 100;
    if (revChange > 0) {
      insights.push(
        `Revenue is ₮${formatNum(revChange)} (▲${revPct}%) above the previous ${prevSummary.totalRevenue > 0 ? "period" : "period — great start!"}`,
      );
    } else {
      insights.push(
        `Revenue is ₮${formatNum(Math.abs(revChange))} (▼${Math.abs(revPct)}%) below the previous period`,
      );
    }
  }

  // Active WOs
  if (summary.activeWorkOrders > 5) {
    insights.push(
      `You have ${summary.activeWorkOrders} active work orders — ${summary.activeWorkOrders > 10 ? "consider assigning more mechanics" : "keep up the momentum"}`,
    );
  }

  // Avg repair order comparison
  if (prevSummary.avgRepairOrderValue > 0 && summary.avgRepairOrderValue > 0) {
    const aroChange =
      summary.avgRepairOrderValue - prevSummary.avgRepairOrderValue;
    const aroPct = Math.round(
      (aroChange / prevSummary.avgRepairOrderValue) * 100,
    );
    if (Math.abs(aroPct) >= 5) {
      if (aroChange > 0) {
        insights.push(
          `Average repair order value is ▲${aroPct}% higher — customers are spending more per visit`,
        );
      } else {
        insights.push(
          `Average repair order value is ▼${Math.abs(aroPct)}% lower — consider reviewing service pricing`,
        );
      }
    }
  }

  // Service vs parts mix
  if (summary.totalRevenue > 0) {
    const servicePct = Math.round(
      (summary.serviceRevenue / summary.totalRevenue) * 100,
    );
    const partsPct = Math.round(
      (summary.partsRevenue / summary.totalRevenue) * 100,
    );
    if (servicePct > 70) {
      insights.push(
        `Services make up ${servicePct}% of revenue — high margin work is driving your business`,
      );
    } else if (partsPct > 60) {
      insights.push(
        `Parts make up ${partsPct}% of revenue — watch parts margins to maintain profitability`,
      );
    }
  }

  // Status distribution insights
  const diagnosingCount =
    statusDist.find((s) => s.status === "Diagnosing")?.count ?? 0;
  const inProgressCount =
    statusDist.find((s) => s.status === "In Progress")?.count ?? 0;
  const readyCount =
    statusDist.find((s) => s.status === "Ready for Pickup")?.count ?? 0;

  if (readyCount > 3) {
    insights.push(
      `${readyCount} vehicles ready for pickup — send reminders to free up space`,
    );
  }
  if (diagnosingCount > inProgressCount && diagnosingCount > 3) {
    insights.push(
      `More vehicles in diagnosis than in progress — consider streamlining the diagnosis process`,
    );
  }

  return insights.slice(0, 4); // max 4 insights to avoid noise
}

/**
 * Generate automated insights and alerts from report data.
 * Analyzes trends, margins, and comparisons to surface actionable intelligence.
 */
export async function generateReportInsights(
  db: SupabaseClient,
  orgId: string,
  dateFrom: string,
  dateTo: string,
  branchId: string | null = null,
): Promise<ReportInsight[]> {
  const supabase = db;
  const insights: ReportInsight[] = [];
  let insightId = 0;

  // Fetch current period data
  const { data: currentWOs } = await withBranchFilter(
    supabase
      .from("work_orders")
      .select("id, mechanic_id, created_at")
      .eq("organization_id", orgId)
      .eq("status", "Completed")
      .gte("created_at", `${dateFrom}T00:00:00`)
      .lte("created_at", `${dateTo}T23:59:59`)
      .is("deleted_at", null),
    branchId,
  );

  const currentWoIds = (currentWOs ?? []).map((w) => w.id);
  if (currentWoIds.length === 0) {
    insights.push({
      id: `insight-${++insightId}`,
      severity: "info",
      title: "No activity this period",
      message: "There were no completed work orders in this period.",
      action: "Check if there are pending work orders that need completion.",
    });
    return insights;
  }

  // Fetch previous period data (same duration, immediately before)
  const durationMs = new Date(dateTo).getTime() - new Date(dateFrom).getTime();
  const prevFrom = new Date(
    new Date(dateFrom).getTime() - durationMs - 86400000,
  )
    .toISOString()
    .split("T")[0];
  const prevTo = new Date(new Date(dateFrom).getTime() - 86400000)
    .toISOString()
    .split("T")[0];

  const { data: prevWOs } = await withBranchFilter(
    supabase
      .from("work_orders")
      .select("id")
      .eq("organization_id", orgId)
      .eq("status", "Completed")
      .gte("created_at", `${prevFrom}T00:00:00`)
      .lte("created_at", `${prevTo}T23:59:59`)
      .is("deleted_at", null),
    branchId,
  );

  const prevWoIds = (prevWOs ?? []).map((w) => w.id);

  // Revenue comparison
  const [curServices, curParts, prevServices, prevParts] = await Promise.all([
    supabase
      .from("work_order_services")
      .select("final_price, unit_cost, quantity, service_name")
      .in("work_order_id", currentWoIds),
    supabase
      .from("work_order_parts")
      .select("final_price, unit_cost, quantity")
      .in("work_order_id", currentWoIds),
    prevWoIds.length > 0
      ? supabase
          .from("work_order_services")
          .select("final_price, unit_cost, quantity")
          .in("work_order_id", prevWoIds)
      : { data: [] as any[] },
    prevWoIds.length > 0
      ? supabase
          .from("work_order_parts")
          .select("final_price, unit_cost, quantity")
          .in("work_order_id", prevWoIds)
      : { data: [] as any[] },
  ]);

  const curSvcRev = (curServices.data ?? []).reduce(
    (s, r) => s + Number(r.final_price),
    0,
  );
  const curPartsRev = (curParts.data ?? []).reduce(
    (s, r) => s + Number(r.final_price),
    0,
  );
  const curSvcCost = (curServices.data ?? []).reduce(
    (s, r) => s + Number(r.unit_cost ?? 0) * r.quantity,
    0,
  );
  const curPartsCost = (curParts.data ?? []).reduce(
    (s, r) => s + Number(r.unit_cost ?? 0) * r.quantity,
    0,
  );
  const curTotalRev = curSvcRev + curPartsRev;
  const curTotalCost = curSvcCost + curPartsCost;
  const curMargin =
    curTotalRev > 0 ? ((curTotalRev - curTotalCost) / curTotalRev) * 100 : 0;

  const prevSvcRev = (prevServices.data ?? []).reduce(
    (s, r) => s + Number(r.final_price),
    0,
  );
  const prevPartsRev = (prevParts.data ?? []).reduce(
    (s, r) => s + Number(r.final_price),
    0,
  );
  const prevTotalRev = prevSvcRev + prevPartsRev;
  const prevSvcCost = (prevServices.data ?? []).reduce(
    (s, r) => s + Number(r.unit_cost ?? 0) * r.quantity,
    0,
  );
  const prevPartsCost = (prevParts.data ?? []).reduce(
    (s, r) => s + Number(r.unit_cost ?? 0) * r.quantity,
    0,
  );
  const prevMargin =
    prevTotalRev > 0
      ? ((prevTotalRev - (prevSvcCost + prevPartsCost)) / prevTotalRev) * 100
      : 0;

  // Revenue insight
  if (prevTotalRev > 0) {
    const revChange = ((curTotalRev - prevTotalRev) / prevTotalRev) * 100;
    if (revChange > 10) {
      insights.push({
        id: `insight-${++insightId}`,
        severity: "positive",
        title: `Revenue up ${revChange.toFixed(1)}%`,
        message: `${formatCurrencyHelper(curTotalRev)} vs ${formatCurrencyHelper(prevTotalRev)} in the previous period.`,
        metric_value: curTotalRev,
        comparison_value: prevTotalRev,
        action:
          "Great momentum — consider increasing marketing to sustain growth.",
      });
    } else if (revChange < -10) {
      insights.push({
        id: `insight-${++insightId}`,
        severity: "danger",
        title: `Revenue down ${Math.abs(revChange).toFixed(1)}%`,
        message: `${formatCurrencyHelper(curTotalRev)} vs ${formatCurrencyHelper(prevTotalRev)} in the previous period.`,
        metric_value: curTotalRev,
        comparison_value: prevTotalRev,
        action: "Review marketing channels and customer follow-up pipeline.",
      });
    }
  }

  // Margin insight
  const marginDelta = curMargin - prevMargin;
  if (Math.abs(marginDelta) > 3 && prevTotalRev > 0) {
    insights.push({
      id: `insight-${++insightId}`,
      severity: marginDelta > 0 ? "positive" : "warning",
      title: `Margin ${marginDelta > 0 ? "improved" : "dropped"} by ${Math.abs(marginDelta).toFixed(1)}pp`,
      message: `Gross margin: ${curMargin.toFixed(1)}% vs ${prevMargin.toFixed(1)}% previous.`,
      metric_value: curMargin,
      comparison_value: prevMargin,
      action:
        marginDelta > 0
          ? "Cost control is improving — maintain supplier negotiation pressure."
          : "Check parts pricing and labor rate alignment. Discount abuse may be a factor.",
    });
  }

  // Parts-to-labor ratio insight
  if (curSvcRev > 0) {
    const partsRatio = curPartsRev / curSvcRev;
    if (partsRatio > 0.6) {
      insights.push({
        id: `insight-${++insightId}`,
        severity: "warning",
        title: "Parts-heavy revenue mix",
        message: `Parts are ${Math.round(partsRatio * 100)}% of labor revenue. Industry target is 40-50%.`,
        metric_value: partsRatio,
        action:
          "Review parts markup strategy. Consider value-added services to balance the mix.",
      });
    }
  }

  // Work order count insight
  if (prevWoIds.length > 0) {
    const woChange =
      ((currentWoIds.length - prevWoIds.length) / prevWoIds.length) * 100;
    if (woChange < -15) {
      insights.push({
        id: `insight-${++insightId}`,
        severity: "warning",
        title: `Job volume down ${Math.abs(woChange).toFixed(0)}%`,
        message: `${currentWoIds.length} jobs vs ${prevWoIds.length} in previous period.`,
        metric_value: currentWoIds.length,
        comparison_value: prevWoIds.length,
        action: "Check appointment pipeline and customer follow-up lists.",
      });
    } else if (woChange > 15) {
      insights.push({
        id: `insight-${++insightId}`,
        severity: "positive",
        title: `Job volume up ${woChange.toFixed(0)}%`,
        message: `${currentWoIds.length} jobs vs ${prevWoIds.length} in previous period.`,
        metric_value: currentWoIds.length,
        comparison_value: prevWoIds.length,
      });
    }
  }

  // Top service insight
  const svcMap = new Map<string, { count: number; revenue: number }>();
  for (const s of curServices.data ?? []) {
    const name = (s.service_name as string) ?? "Unknown";
    const existing = svcMap.get(name) ?? { count: 0, revenue: 0 };
    existing.count++;
    existing.revenue += Number(s.final_price);
    svcMap.set(name, existing);
  }
  const topServices = [...svcMap.entries()]
    .sort((a, b) => b[1].revenue - a[1].revenue)
    .slice(0, 3);

  if (topServices.length > 0) {
    const topName = topServices[0][0];
    const topRev = topServices[0][1].revenue;
    const topPct =
      curTotalRev > 0 ? Math.round((topRev / curTotalRev) * 100) : 0;
    insights.push({
      id: `insight-${++insightId}`,
      severity: "info",
      title: `Top service: ${topName}`,
      message: `${formatCurrencyHelper(topRev)} revenue (${topPct}% of total) from ${topServices[0][1].count} jobs.`,
      metric_value: topRev,
    });
  }

  return insights;
}
