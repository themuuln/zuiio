// ── Dashboard data, daily timeline, and customer retention ──

import type { SupabaseClient } from "@supabase/supabase-js";

import { withDbCapture } from "@/lib/supabase/query";
import { withBranchFilter } from "@/lib/supabase/with-branch";

import type {
  CustomerRetentionData,
  DashboardData,
  DashboardSummary,
  WorkOrderStatusDistribution,
} from "@/lib/types";
import { generateInsights } from "./insights";

// ── Dashboard (single RPC call instead of ~18 queries) ──────

export async function getDashboardData(
  db: SupabaseClient,
  orgId: string,
  periodOrOpts:
    | "today"
    | "week"
    | "month"
    | "all"
    | { dateFrom: string; dateTo: string; branchId?: string | null } = "all",
  branchId: string | null = null,
): Promise<DashboardData> {
  const supabase = db;

  // Normalize params
  const resolvedPeriod =
    typeof periodOrOpts === "string" ? periodOrOpts : "all";
  const resolvedBranchId =
    typeof periodOrOpts === "object" && periodOrOpts.branchId !== undefined
      ? periodOrOpts.branchId
      : branchId;

  let dateFrom: string | undefined;
  let dateTo: string | undefined;
  if (typeof periodOrOpts === "object") {
    dateFrom = periodOrOpts.dateFrom;
    dateTo = periodOrOpts.dateTo;
  }

  // Single RPC call replaces ~18 PostgREST queries
  const { data, error } = await withDbCapture(
    "getFullDashboardData",
    supabase.rpc("get_full_dashboard_data", {
      p_org_id: orgId,
      p_period: resolvedPeriod,
      p_branch_id: resolvedBranchId,
      p_date_from: dateFrom ?? null,
      p_date_to: dateTo ?? null,
    }),
  );

  if (error) {
    throw new Error(error.message);
  }

  const result = data as Record<string, unknown>;

  const summary = result["summary"] as Record<string, number>;
  const summaryComparison = result["summaryComparison"] as Record<string, number> | null;
  const statusDist = result["workOrderStatusDistribution"] as WorkOrderStatusDistribution[];
  const revenueTrend = result["revenueTrend"] as DashboardData["revenueTrend"];
  const topServices = result["topServices"] as DashboardData["topServices"];
  const techPerf = result["technicianPerformance"] as DashboardData["technicianPerformance"];
  const recentOrders = result["recentWorkOrders"] as DashboardData["recentWorkOrders"];
  const categoryBreakdown = result["serviceCategoryBreakdown"] as DashboardData["serviceCategoryBreakdown"];
  const acquisitionTrend = result["customerAcquisitionTrend"] as DashboardData["customerAcquisitionTrend"];

  // Build comparison shape for insights
  const comparison: DashboardSummary | null = summaryComparison
    ? {
        totalRevenue: summaryComparison["total_revenue"] ?? 0,
        activeWorkOrders: summaryComparison["active_work_orders"] ?? 0,
        completedToday: summaryComparison["completed_today"] ?? 0,
        newCustomersToday: summaryComparison["new_customers_today"] ?? 0,
        avgRepairOrderValue: summaryComparison["avg_repair_order_value"] ?? 0,
        partsRevenue: summaryComparison["parts_revenue"] ?? 0,
        serviceRevenue: summaryComparison["service_revenue"] ?? 0,
        grossProfit: summaryComparison["gross_profit"] ?? 0,
        marginPercent: summaryComparison["margin_percent"] ?? 0,
        totalCustomers: summaryComparison["total_customers"] ?? 0,
        totalVehicles: summaryComparison["total_vehicles"] ?? 0,
      }
    : null;

  const fullSummary: DashboardSummary = {
    totalRevenue: summary["totalRevenue"] ?? 0,
    activeWorkOrders: summary["activeWorkOrders"] ?? 0,
    completedToday: summary["completedToday"] ?? 0,
    newCustomersToday: summary["newCustomersToday"] ?? 0,
    avgRepairOrderValue: summary["avgRepairOrderValue"] ?? 0,
    partsRevenue: summary["partsRevenue"] ?? 0,
    serviceRevenue: summary["serviceRevenue"] ?? 0,
    grossProfit: summary["grossProfit"] ?? 0,
    marginPercent: summary["marginPercent"] ?? 0,
    totalCustomers: summary["totalCustomers"] ?? 0,
    totalVehicles: summary["totalVehicles"] ?? 0,
  };

  const insights = generateInsights(
    fullSummary,
    comparison,
    statusDist,
  );

  return {
    summary: fullSummary,
    summaryComparison: comparison,
    insights,
    workOrderStatusDistribution: statusDist,
    revenueTrend,
    topServices,
    technicianPerformance: techPerf,
    recentWorkOrders: recentOrders,
    serviceCategoryBreakdown: categoryBreakdown,
    customerAcquisitionTrend: acquisitionTrend,
  };
}

// ── Daily Timeline ──────────────────────────────────────────

export interface TimelineEvent {
  id: string;
  workOrderId: string;
  customerName: string | null;
  vehiclePlate: string | null;
  status: string;
  previousStatus: string | null;
  mechanicName: string | null;
  notes: string | null;
  createdAt: string;
  bayNumber: number | null;
}

export async function getDailyTimeline(
  db: SupabaseClient,
  orgId: string,
  branchId: string | null = null,
): Promise<TimelineEvent[]> {
  const supabase = db;
  const today = new Date().toISOString().split("T")[0];

  const { data: wos, error: woError } = await withBranchFilter(
    supabase
      .from("work_orders")
      .select(
        "id, customer:customers(first_name, last_name), vehicle:vehicles(plate_number), bay_number",
      )
      .eq("organization_id", orgId)
      .gte("updated_at", `${today}T00:00:00`)
      .order("updated_at", { ascending: false })
      .limit(40),
    branchId,
  );

  if (woError || !wos?.length) return [];

  const woIds = wos.map((w) => w.id);

  const { data: history, error: histError } = await supabase
    .from("work_order_status_history")
    .select(
      "id, work_order_id, previous_status, status, notes, changed_by, created_at",
    )
    .in("work_order_id", woIds)
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false })
    .limit(60);

  if (histError || !history?.length) return [];

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name")
    .in(
      "id",
      history.flatMap((h) => (h.changed_by ? [h.changed_by] : [])) as string[],
    );

  const profileMap = new Map<string, string>();
  for (const p of profiles ?? []) {
    if (p.full_name) profileMap.set(p.id as string, p.full_name as string);
  }

  const woMap = new Map<
    string,
    {
      customerName: string | null;
      vehiclePlate: string | null;
      bayNumber: number | null;
    }
  >();
  for (const wo of wos) {
    const customer = Array.isArray(wo.customer)
      ? wo.customer[0]
      : (wo.customer as unknown as unknown as Record<string, string> | null);
    const vehicle = Array.isArray(wo.vehicle)
      ? wo.vehicle[0]
      : (wo.vehicle as unknown as unknown as Record<string, string> | null);
    woMap.set(wo.id as string, {
      customerName: customer
        ? `${(customer as unknown as Record<string, string>).first_name ?? ""} ${(customer as unknown as Record<string, string>).last_name ?? ""}`.trim() ||
          null
        : null,
      vehiclePlate: vehicle
        ? ((vehicle as unknown as Record<string, string>).plate_number ?? null)
        : null,
      bayNumber: wo.bay_number ?? null,
    });
  }

  return history.map((h) => {
    const wo = woMap.get(h.work_order_id as string);
    return {
      id: h.id as string,
      workOrderId: h.work_order_id as string,
      customerName: wo?.customerName ?? null,
      vehiclePlate: wo?.vehiclePlate ?? null,
      status: h.status as string,
      previousStatus: h.previous_status ?? null,
      mechanicName: profileMap.get(h.changed_by as string) ?? null,
      notes: h.notes ?? null,
      createdAt: h.created_at as string,
      bayNumber: wo?.bayNumber ?? null,
    };
  });
}

// ── Customer Retention ──────────────────────────────────────

/**
 * Customer retention analytics.
 * Computes returning vs new customers, retention rate, and top customers.
 */
export async function getCustomerRetention(
  db: SupabaseClient,
  orgId: string,
  dateFrom: string,
  dateTo: string,
  branchId: string | null = null,
): Promise<CustomerRetentionData> {
  const supabase = db;

  // Get all WOs in period with customer info
  const { data: wos } = await withBranchFilter(
    supabase
      .from("work_orders")
      .select("id, customer_id, created_at")
      .eq("organization_id", orgId)
      .eq("status", "Completed")
      .gte("created_at", `${dateFrom}T00:00:00`)
      .lte("created_at", `${dateTo}T23:59:59`)
      .is("deleted_at", null),
    branchId,
  );

  if (!wos?.length) {
    return {
      total_customers: 0,
      returning_customers: 0,
      new_customers: 0,
      retention_rate: 0,
      avg_visits_per_customer: 0,
      avg_lifetime_value: 0,
      top_customers: [],
    };
  }

  const customerIds = [
    ...new Set(wos.map((w) => w.customer_id).filter(Boolean)),
  ] as string[];

  // For each customer, count total visits (all time) and visits in period
  const [allTimeWOs, prevWOs] = await Promise.all([
    customerIds.length > 0
      ? withBranchFilter(
          supabase
            .from("work_orders")
            .select("customer_id, total_amount")
            .eq("organization_id", orgId)
            .eq("status", "Completed")
            .in("customer_id", customerIds)
            .is("deleted_at", null),
          branchId,
        )
      : {
          data: [] as Array<{
            customer_id: string | null;
            total_amount: number | null;
          }>,
        },
    customerIds.length > 0
      ? withBranchFilter(
          supabase
            .from("work_orders")
            .select("customer_id")
            .eq("organization_id", orgId)
            .eq("status", "Completed")
            .lt("created_at", `${dateFrom}T00:00:00`)
            .in("customer_id", customerIds)
            .is("deleted_at", null),
          branchId,
        )
      : { data: [] as Array<{ customer_id: string | null }> },
  ]);

  // Build visit counts
  const lifetimeVisitMap = new Map<string, number>();
  const lifetimeRevenueMap = new Map<string, number>();
  for (const wo of allTimeWOs.data ?? []) {
    const cid = wo.customer_id as string;
    if (!cid) continue;
    lifetimeVisitMap.set(cid, (lifetimeVisitMap.get(cid) ?? 0) + 1);
    lifetimeRevenueMap.set(
      cid,
      (lifetimeRevenueMap.get(cid) ?? 0) + Number(wo.total_amount ?? 0),
    );
  }

  const prevVisitSet = new Set(
    (prevWOs.data ?? []).map((w) => w.customer_id).filter(Boolean),
  );

  // Period visit counts
  const periodVisitMap = new Map<string, number>();
  for (const wo of wos) {
    const cid = wo.customer_id as string;
    if (!cid) continue;
    periodVisitMap.set(cid, (periodVisitMap.get(cid) ?? 0) + 1);
  }

  let returningCount = 0;
  let newCount = 0;
  for (const cid of customerIds) {
    const hadPreviousVisit = prevVisitSet.has(cid);
    if (hadPreviousVisit) returningCount++;
    else newCount++;
  }

  const retentionRate =
    customerIds.length > 0 && returningCount + newCount > 0
      ? Math.round((returningCount / (returningCount + newCount)) * 1000) / 10
      : 0;

  const totalVisitsInPeriod = wos.length;
  const avgVisits =
    customerIds.length > 0
      ? Math.round((totalVisitsInPeriod / customerIds.length) * 10) / 10
      : 0;

  // Top customers by revenue in period
  // Fetch revenue per WO for period
  const periodWoIds = wos.map((w) => w.id);
  let revenueData: Array<{ work_order_id: string; final_price: number }> = [];
  if (periodWoIds.length > 0) {
    const [svcs, parts] = await Promise.all([
      supabase
        .from("work_order_services")
        .select("work_order_id, final_price")
        .in("work_order_id", periodWoIds),
      supabase
        .from("work_order_parts")
        .select("work_order_id, final_price")
        .in("work_order_id", periodWoIds),
    ]);
    revenueData = [...(svcs.data ?? []), ...(parts.data ?? [])] as Array<{
      work_order_id: string;
      final_price: number;
    }>;
  }

  const woRevenueMap = new Map<string, number>();
  for (const r of revenueData) {
    woRevenueMap.set(
      r.work_order_id,
      (woRevenueMap.get(r.work_order_id) ?? 0) + Number(r.final_price),
    );
  }

  const customerRevenueMap = new Map<string, number>();
  for (const wo of wos) {
    const cid = wo.customer_id as string;
    if (!cid) continue;
    customerRevenueMap.set(
      cid,
      (customerRevenueMap.get(cid) ?? 0) + (woRevenueMap.get(wo.id) ?? 0),
    );
  }

  // Fetch customer names
  const { data: customerProfiles } =
    customerIds.length > 0
      ? await supabase
          .from("customers")
          .select("id, first_name, last_name")
          .in("id", customerIds)
      : {
          data: [] as Array<{
            id: string;
            first_name: string | null;
            last_name: string | null;
          }>,
        };

  const nameMap = new Map<string, string>();
  for (const c of customerProfiles ?? []) {
    nameMap.set(
      c.id,
      [c.first_name, c.last_name].filter(Boolean).join(" ") || "Customer",
    );
  }

  const topCustomers = [...customerRevenueMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([cid, revenue]) => ({
      customer_id: cid,
      customer_name: nameMap.get(cid) ?? "Customer",
      total_revenue: revenue,
      visit_count: periodVisitMap.get(cid) ?? 1,
    }));

  // Average lifetime value
  const totalLifetimeRevenue = [...lifetimeRevenueMap.values()].reduce(
    (s, v) => s + v,
    0,
  );
  const avgLTV =
    customerIds.length > 0
      ? Math.round(totalLifetimeRevenue / customerIds.length)
      : 0;

  return {
    total_customers: customerIds.length,
    returning_customers: returningCount,
    new_customers: newCount,
    retention_rate: retentionRate,
    avg_visits_per_customer: avgVisits,
    avg_lifetime_value: avgLTV,
    top_customers: topCustomers,
  };
}

/**
 * Fast dashboard metrics using the get_dashboard_metrics RPC.
 * Single DB call replaces the multi-query dashboard summary for the home page KPI view.
 */
export async function getDashboardMetricsFast(
  db: SupabaseClient,
  orgId: string,
): Promise<Record<string, unknown>> {
  const { data, error } = await withDbCapture(
    "getDashboardMetricsFast",
    db.rpc("get_dashboard_metrics", {
      p_org_id: orgId,
    }),
  );
  if (error) throw new Error(error.message);
  return (data as Record<string, unknown>) ?? {};
}

