// ── Profitability, P&L, and work order profit functions ──────

import type { SupabaseClient } from "@supabase/supabase-js";

import { withBranchFilter } from "@/lib/supabase/with-branch";

import type {
  PnLSummary,
  ReportComparison,
  ReportProfitability,
} from "@/lib/types";

/**
 * Calculate profitability metrics from work order service/part data.
 * Reuses the same logic as getWorkOrderProfit but batched for many WOs.
 */
export async function calculateProfitability(
  supabase: SupabaseClient,
  woIds: string[],
): Promise<ReportProfitability | null> {
  if (woIds.length === 0) return null;

  const [svcs, parts] = await Promise.all([
    supabase
      .from("work_order_services")
      .select("final_price, unit_cost, quantity")
      .in("work_order_id", woIds),
    supabase
      .from("work_order_parts")
      .select("final_price, unit_cost, quantity")
      .in("work_order_id", woIds),
  ]);

  const serviceRevenue = (svcs.data ?? []).reduce(
    (s, r) => s + Number(r.final_price),
    0,
  );
  const serviceCost = (svcs.data ?? []).reduce(
    (s, r) => s + Number(r.unit_cost ?? 0) * r.quantity,
    0,
  );
  const partsRevenue = (parts.data ?? []).reduce(
    (s, r) => s + Number(r.final_price),
    0,
  );
  const partsCost = (parts.data ?? []).reduce(
    (s, r) => s + Number(r.unit_cost ?? 0) * r.quantity,
    0,
  );

  const totalRevenue = serviceRevenue + partsRevenue;
  const totalCost = serviceCost + partsCost;
  const grossProfit = totalRevenue - totalCost;
  const marginPercent =
    totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
  const effectiveLaborRate =
    serviceRevenue > 0 && woIds.length > 0 ? serviceRevenue / woIds.length : 0;
  const avgRepairOrder =
    totalRevenue > 0 && woIds.length > 0 ? totalRevenue / woIds.length : 0;
  const partsToLaborRatio =
    serviceRevenue > 0 ? partsRevenue / serviceRevenue : 0;

  return {
    gross_profit: grossProfit,
    margin_percent: Math.round(marginPercent * 10) / 10,
    service_revenue: serviceRevenue,
    service_cost: serviceCost,
    parts_revenue: partsRevenue,
    parts_cost: partsCost,
    total_cost: totalCost,
    effective_labor_rate: Math.round(effectiveLaborRate),
    avg_repair_order: Math.round(avgRepairOrder),
    parts_to_labor_ratio: Math.round(partsToLaborRatio * 100) / 100,
  };
}

/**
 * Get comparison data from the previous equivalent period.
 * For daily: previous day. For weekly: previous week. For monthly: previous month.
 */
export async function getComparisonData(
  supabase: SupabaseClient,
  orgId: string,
  currentStart: string,
  currentEnd: string,
  mechanicId: string | null,
  branchId: string | null,
): Promise<ReportComparison | null> {
  const currentDuration =
    new Date(currentEnd).getTime() - new Date(currentStart).getTime();
  const prevEnd = new Date(new Date(currentStart).getTime() - 1);
  const prevStart = new Date(prevEnd.getTime() - currentDuration);

  const prevStartStr = prevStart.toISOString().split("T")[0];
  const prevEndStr = prevEnd.toISOString().split("T")[0];

  let query = supabase
    .from("work_orders")
    .select("id")
    .eq("organization_id", orgId)
    .gte("created_at", `${prevStartStr}T00:00:00`)
    .lte("created_at", `${prevEndStr}T23:59:59`)
    .eq("status", "Completed")
    .is("deleted_at", null);

  if (mechanicId) {
    query = query.eq("mechanic_id", mechanicId);
  }
  if (branchId) {
    query = query.eq("branch_id", branchId);
  }

  const { data: prevWOs } = await query;
  const prevWoIds = (prevWOs ?? []).map((w) => w.id);

  if (prevWoIds.length === 0) return null;

  const [servicesData, partsData] = await Promise.all([
    supabase
      .from("work_order_services")
      .select("final_price")
      .in("work_order_id", prevWoIds),
    supabase
      .from("work_order_parts")
      .select("final_price")
      .in("work_order_id", prevWoIds),
  ]);

  const prevServiceCount = (servicesData.data ?? []).length;
  const prevPartsCount = (partsData.data ?? []).length;
  let prevRevenue = 0;
  for (const s of servicesData.data ?? []) prevRevenue += Number(s.final_price);
  for (const p of partsData.data ?? []) prevRevenue += Number(p.final_price);

  const currentRevenue = 0; // will be set by caller
  const revenueChangePct =
    prevRevenue > 0
      ? ((currentRevenue - prevRevenue) / prevRevenue) * 100
      : null;

  return {
    work_orders_completed: prevWoIds.length,
    total_revenue: prevRevenue,
    services_count: prevServiceCount,
    parts_count: prevPartsCount,
    revenue_change_pct: revenueChangePct,
    work_orders_change_pct: null,
  };
}

export async function getWorkOrderProfit(
  db: SupabaseClient,
  workOrderId: string,
  _orgId: string,
): Promise<import("@/lib/types").WorkOrderProfit> {
  const supabase = db;

  const [servicesResult, partsResult] = await Promise.all([
    supabase
      .from("work_order_services")
      .select("final_price, unit_cost, quantity")
      .eq("work_order_id", workOrderId),
    supabase
      .from("work_order_parts")
      .select("final_price, unit_cost, quantity")
      .eq("work_order_id", workOrderId),
  ]);

  const serviceRevenue = (servicesResult.data ?? []).reduce(
    (sum, s) => sum + Number(s.final_price),
    0,
  );
  const serviceCost = (servicesResult.data ?? []).reduce(
    (sum, s) => sum + Number(s.unit_cost ?? 0) * s.quantity,
    0,
  );
  const partsRevenue = (partsResult.data ?? []).reduce(
    (sum, p) => sum + Number(p.final_price),
    0,
  );
  const partsCost = (partsResult.data ?? []).reduce(
    (sum, p) => sum + Number(p.unit_cost ?? 0) * p.quantity,
    0,
  );

  const totalRevenue = serviceRevenue + partsRevenue;
  const totalCost = serviceCost + partsCost;
  const grossProfit = totalRevenue - totalCost;
  const marginPercent =
    totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

  return {
    totalRevenue,
    totalCost,
    grossProfit,
    marginPercent,
    serviceRevenue,
    serviceCost,
    partsRevenue,
    partsCost,
  };
}

export async function getDashboardProfitSummary(
  db: SupabaseClient,
  orgId: string,
): Promise<{
  todayProfit: import("@/lib/types").WorkOrderProfit;
  weekProfit: import("@/lib/types").WorkOrderProfit;
  monthProfit: import("@/lib/types").WorkOrderProfit;
}> {
  const supabase = db;
  const now = new Date();
  const todayStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  ).toISOString();
  const weekStart = new Date(
    now.getTime() - 7 * 24 * 60 * 60 * 1000,
  ).toISOString();
  const monthStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    1,
  ).toISOString();

  async function getProfitForRange(
    startDate: string,
  ): Promise<import("@/lib/types").WorkOrderProfit> {
    const { data: wos } = await supabase
      .from("work_orders")
      .select("id")
      .eq("organization_id", orgId)
      .eq("status", "Completed")
      .gte("updated_at", startDate)
      .is("deleted_at", null);

    const woIds = (wos ?? []).map((w) => w.id);
    if (woIds.length === 0)
      return {
        totalRevenue: 0,
        totalCost: 0,
        grossProfit: 0,
        marginPercent: 0,
        serviceRevenue: 0,
        serviceCost: 0,
        partsRevenue: 0,
        partsCost: 0,
      };

    const [svcs, parts] = await Promise.all([
      supabase
        .from("work_order_services")
        .select("final_price, unit_cost, quantity")
        .in("work_order_id", woIds),
      supabase
        .from("work_order_parts")
        .select("final_price, unit_cost, quantity")
        .in("work_order_id", woIds),
    ]);

    const serviceRevenue = (svcs.data ?? []).reduce(
      (s, r) => s + Number(r.final_price),
      0,
    );
    const serviceCost = (svcs.data ?? []).reduce(
      (s, r) => s + Number(r.unit_cost ?? 0) * r.quantity,
      0,
    );
    const partsRevenue = (parts.data ?? []).reduce(
      (s, r) => s + Number(r.final_price),
      0,
    );
    const partsCost = (parts.data ?? []).reduce(
      (s, r) => s + Number(r.unit_cost ?? 0) * r.quantity,
      0,
    );
    const totalRevenue = serviceRevenue + partsRevenue;
    const totalCost = serviceCost + partsCost;
    const grossProfit = totalRevenue - totalCost;
    return {
      totalRevenue,
      totalCost,
      grossProfit,
      marginPercent: totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0,
      serviceRevenue,
      serviceCost,
      partsRevenue,
      partsCost,
    };
  }

  const [todayProfit, weekProfit, monthProfit] = await Promise.all([
    getProfitForRange(todayStart),
    getProfitForRange(weekStart),
    getProfitForRange(monthStart),
  ]);

  return { todayProfit, weekProfit, monthProfit };
}

/**
 * Returns a lightweight summary for a previous period of the same length.
 * Only computes revenue + count — not full detail.
 */
export async function getPreviousPeriodSummary(
  supabase: SupabaseClient,
  orgId: string,
  period: "today" | "week" | "month" | "all",
  branchId: string | null = null,
): Promise<Omit<
  import("@/lib/types").DashboardSummary,
  | "activeWorkOrders"
  | "totalCustomers"
  | "totalVehicles"
  | "grossProfit"
  | "marginPercent"
> | null> {
  if (period === "all") return null; // no previous period for "all time"

  const now = new Date();
  const currentStart = new Date(now);
  const durationMs =
    period === "today"
      ? 24 * 60 * 60 * 1000
      : period === "week"
        ? 7 * 24 * 60 * 60 * 1000
        : 30 * 24 * 60 * 60 * 1000;

  const prevEnd = new Date(currentStart.getTime() - 1);
  const prevStart = new Date(prevEnd.getTime() - durationMs + 1);

  const prevFrom = prevStart.toISOString().split("T")[0];
  const prevTo = prevEnd.toISOString().split("T")[0];

  // Get completed WOs in previous period
  const { data: prevWos } = await withBranchFilter(
    supabase
      .from("work_orders")
      .select("id")
      .eq("organization_id", orgId)
      .eq("status", "Completed")
      .gte("updated_at", `${prevFrom}T00:00:00`)
      .lte("updated_at", `${prevTo}T23:59:59`)
      .is("deleted_at", null),
    branchId,
  );

  const prevIds = (prevWos ?? []).map((w: { id: string }) => w.id);
  if (prevIds.length === 0) {
    return {
      totalRevenue: 0,
      completedToday: 0,
      newCustomersToday: 0,
      avgRepairOrderValue: 0,
      partsRevenue: 0,
      serviceRevenue: 0,
    };
  }

  const [prevSvcs, prevParts] = await Promise.all([
    prevIds.length > 0
      ? supabase
          .from("work_order_services")
          .select("final_price")
          .in("work_order_id", prevIds)
      : { data: [] as any[] },
    prevIds.length > 0
      ? supabase
          .from("work_order_parts")
          .select("final_price")
          .in("work_order_id", prevIds)
      : { data: [] as any[] },
  ]);

  const prevServiceRev = (prevSvcs.data ?? []).reduce(
    (sum: number, s: { final_price: number }) => sum + Number(s.final_price),
    0,
  );
  const prevPartsRev = (prevParts.data ?? []).reduce(
    (sum: number, p: { final_price: number }) => sum + Number(p.final_price),
    0,
  );
  const prevTotalRev = prevServiceRev + prevPartsRev;

  return {
    totalRevenue: prevTotalRev,
    completedToday: prevIds.length,
    newCustomersToday: 0,
    avgRepairOrderValue:
      prevIds.length > 0
        ? Math.round((prevTotalRev / prevIds.length) * 100) / 100
        : 0,
    partsRevenue: prevPartsRev,
    serviceRevenue: prevServiceRev,
  };
}

/**
 * Simplified P&L (Profit & Loss) statement.
 */
export async function getPnLSummary(
  db: SupabaseClient,
  orgId: string,
  dateFrom: string,
  dateTo: string,
  branchId: string | null = null,
): Promise<PnLSummary> {
  const supabase = db;

  // Fetch completed WOs in period
  const { data: wos } = await withBranchFilter(
    supabase
      .from("work_orders")
      .select("id")
      .eq("organization_id", orgId)
      .eq("status", "Completed")
      .gte("created_at", `${dateFrom}T00:00:00`)
      .lte("created_at", `${dateTo}T23:59:59`)
      .is("deleted_at", null),
    branchId,
  );

  const woIds = (wos ?? []).map((w) => w.id);

  // Fetch services + parts with costs
  const [svcs, parts, expenses] = await Promise.all([
    woIds.length > 0
      ? supabase
          .from("work_order_services")
          .select("final_price, unit_cost, quantity")
          .in("work_order_id", woIds)
      : { data: [] as any[] },
    woIds.length > 0
      ? supabase
          .from("work_order_parts")
          .select("final_price, unit_cost, quantity")
          .in("work_order_id", woIds)
      : { data: [] as any[] },
    withBranchFilter(
      supabase
        .from("expenses")
        .select("amount, category")
        .eq("organization_id", orgId)
        .gte("expense_date", dateFrom)
        .lte("expense_date", dateTo)
        .is("deleted_at", null),
      branchId,
    ),
  ]);

  const serviceRevenue = (svcs.data ?? []).reduce(
    (s, r) => s + Number(r.final_price),
    0,
  );
  const serviceCost = (svcs.data ?? []).reduce(
    (s, r) => s + Number(r.unit_cost ?? 0) * r.quantity,
    0,
  );
  const partsRevenue = (parts.data ?? []).reduce(
    (s, r) => s + Number(r.final_price),
    0,
  );
  const partsCost = (parts.data ?? []).reduce(
    (s, r) => s + Number(r.unit_cost ?? 0) * r.quantity,
    0,
  );

  const totalRevenue = serviceRevenue + partsRevenue;
  const totalCOGS = serviceCost + partsCost;
  const grossProfit = totalRevenue - totalCOGS;
  const grossMarginPct =
    totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

  // Expenses by category
  const expenseMap = new Map<string, number>();
  for (const e of expenses.data ?? []) {
    const cat = (e.category as string) ?? "Other";
    expenseMap.set(cat, (expenseMap.get(cat) ?? 0) + Number(e.amount));
  }
  const totalExpenses = [...expenseMap.values()].reduce((s, v) => s + v, 0);
  const expenseByCategory = [...expenseMap.entries()]
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount);

  const netProfit = grossProfit - totalExpenses;
  const netMarginPct = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

  return {
    period_start: dateFrom,
    period_end: dateTo,
    revenue: {
      service_revenue: serviceRevenue,
      parts_revenue: partsRevenue,
      other_revenue: 0,
      total: totalRevenue,
    },
    cogs: {
      service_cost: serviceCost,
      parts_cost: partsCost,
      total: totalCOGS,
    },
    gross_profit: grossProfit,
    gross_margin_pct: Math.round(grossMarginPct * 10) / 10,
    expenses: {
      total: totalExpenses,
      by_category: expenseByCategory,
    },
    net_profit: netProfit,
    net_margin_pct: Math.round(netMarginPct * 10) / 10,
  };
}
