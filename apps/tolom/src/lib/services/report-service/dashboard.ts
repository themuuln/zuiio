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
import { getPreviousPeriodSummary } from "./profitability";
import {
  getCustomerAcquisitionTrendBatched,
  getRecentWorkOrdersBatched,
  getRevenueTrendBatched,
  getServiceCategoryBreakdownBatched,
  getTechnicianPerformanceBatched,
  getTopServicesBatched,
} from "./queries";

// ── Dashboard (optimized: ~10 queries instead of ~236) ──────

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

  // Normalize params: support both string period and object with dateFrom/dateTo
  const resolvedPeriod =
    typeof periodOrOpts === "string" ? periodOrOpts : "all";
  const resolvedBranchId =
    typeof periodOrOpts === "object" && periodOrOpts.branchId !== undefined
      ? periodOrOpts.branchId
      : branchId;

  const today = new Date().toISOString().split("T")[0];
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];
  const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  // When dateFrom/dateTo provided as object, use those directly
  let dateFrom: string;
  let dateTo: string | null;
  if (typeof periodOrOpts === "object") {
    dateFrom = periodOrOpts.dateFrom;
    dateTo = periodOrOpts.dateTo;
  } else {
    dateFrom =
      periodOrOpts === "today"
        ? today
        : periodOrOpts === "week"
          ? weekAgo
          : periodOrOpts === "month"
            ? monthAgo
            : "2000-01-01";
    dateTo = null; // no upper bound for period-based filters
  }
  const dayCount = dateTo
    ? Math.ceil(
        (new Date(dateTo).getTime() - new Date(dateFrom).getTime()) /
          (24 * 60 * 60 * 1000),
      ) + 1
    : typeof periodOrOpts === "string"
      ? periodOrOpts === "today"
        ? 1
        : periodOrOpts === "week"
          ? 7
          : 30
      : 30;

  // ── Batch 1: All work-orders data in parallel ──────────
  const [
    completedWos,
    activeWos,
    statusData,
    recentIds,
    summaryCust,
    summaryVehicles,
    allCompletedWos,
  ] = await Promise.all([
    // Completed WOs in period (for revenue)
    (() => {
      let q = withBranchFilter(
        supabase
          .from("work_orders")
          .select("id")
          .eq("organization_id", orgId)
          .eq("status", "Completed")
          .gte("updated_at", `${dateFrom}T00:00:00`)
          .is("deleted_at", null),
        resolvedBranchId,
      );
      if (dateTo) {
        q = q.lte("updated_at", `${dateTo}T23:59:59`);
      }
      return q;
    })(),

    // Active WOs
    withBranchFilter(
      supabase
        .from("work_orders")
        .select("id")
        .eq("organization_id", orgId)
        .not("status", "in", '("Completed","Cancelled")')
        .is("deleted_at", null),
      resolvedBranchId,
    ),

    // All WO statuses for distribution
    withBranchFilter(
      supabase
        .from("work_orders")
        .select("status")
        .eq("organization_id", orgId)
        .is("deleted_at", null),
      resolvedBranchId,
    ),

    // Recent 10 WO ids (we'll batch-fetch details)
    withBranchFilter(
      supabase
        .from("work_orders")
        .select("id")
        .eq("organization_id", orgId)
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(10),
      resolvedBranchId,
    ),

    // Total customers
    withBranchFilter(
      supabase
        .from("customers")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", orgId)
        .is("deleted_at", null),
      resolvedBranchId,
    ),

    // Total vehicles
    withBranchFilter(
      supabase
        .from("vehicles")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", orgId)
        .is("deleted_at", null),
      resolvedBranchId,
    ),

    // All completed WOs ever (for tech perf and categories)
    withBranchFilter(
      supabase
        .from("work_orders")
        .select("id")
        .eq("organization_id", orgId)
        .eq("status", "Completed")
        .is("deleted_at", null),
      resolvedBranchId,
    ),
  ]);

  // ── Batch 2: Services + Parts for revenue ──────────────
  const completedWoIds = (completedWos.data ?? []).map(
    (w: { id: string }) => w.id,
  );
  const allCompletedIds = (allCompletedWos.data ?? []).map(
    (w: { id: string }) => w.id,
  );
  const recentWoIds = (recentIds.data ?? []).map((w: { id: string }) => w.id);

  const [servicesData, partsData] = await Promise.all([
    completedWoIds.length > 0
      ? supabase
          .from("work_order_services")
          .select(
            "final_price, discount_amount, service_name, work_order_id, unit_cost, quantity",
          )
          .in("work_order_id", completedWoIds)
      : {
          data: [] as {
            final_price: number;
            unit_cost: number | null;
            quantity: number;
            work_order_id: string;
          }[],
        },

    completedWoIds.length > 0
      ? supabase
          .from("work_order_parts")
          .select(
            "final_price, discount_amount, part_name, work_order_id, unit_cost, quantity",
          )
          .in("work_order_id", completedWoIds)
      : {
          data: [] as {
            final_price: number;
            unit_cost: number | null;
            quantity: number;
            work_order_id: string;
          }[],
        },
  ]);

  const allServices = servicesData.data ?? [];
  const allParts = partsData.data ?? [];

  const serviceRevenue = allServices.reduce(
    (sum, s) => sum + Number((s as Record<string, unknown>).final_price),
    0,
  );
  const serviceCost = allServices.reduce(
    (sum, s) =>
      sum +
      Number((s as Record<string, unknown>).unit_cost ?? 0) *
        Number((s as Record<string, unknown>).quantity),
    0,
  );
  const partsRevenue = allParts.reduce(
    (sum, p) => sum + Number((p as Record<string, unknown>).final_price),
    0,
  );
  const partsCost = allParts.reduce(
    (sum, p) =>
      sum +
      Number((p as Record<string, unknown>).unit_cost ?? 0) *
        Number((p as Record<string, unknown>).quantity),
    0,
  );
  const totalRevenue = serviceRevenue + partsRevenue;
  const totalCost = serviceCost + partsCost;
  const grossProfit = totalRevenue - totalCost;
  const marginPercent =
    totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

  // ── Summary ───────────────────────────────────────────
  const summary = {
    totalRevenue,
    activeWorkOrders: activeWos.data?.length ?? 0,
    completedToday: 0, // computed below
    newCustomersToday: 0,
    avgRepairOrderValue:
      (completedWos.data?.length ?? 0) > 0
        ? Math.round((totalRevenue / (completedWos.data?.length ?? 1)) * 100) /
          100
        : 0,
    partsRevenue,
    serviceRevenue,
    grossProfit,
    marginPercent,
    totalCustomers: summaryCust.count ?? 0,
    totalVehicles: summaryVehicles.count ?? 0,
  };

  // ── Status Distribution ───────────────────────────────
  const statusMap = new Map<string, number>();
  for (const wo of statusData.data ?? []) {
    statusMap.set(wo.status, (statusMap.get(wo.status) ?? 0) + 1);
  }
  const workOrderStatusDistribution: WorkOrderStatusDistribution[] = Array.from(
    statusMap.entries(),
  ).map(([status, count]) => ({
    status,
    count,
  }));

  // ── Parallel: Revenue Trend, Top Services, Tech Perf, Recent WOs, Categories, Acquisition, Prev Period ──
  const [
    revenueTrend,
    topServices,
    technicianPerformance,
    recentWorkOrders,
    serviceCategoryBreakdown,
    customerAcquisitionTrend,
    prevSummary,
  ] = await Promise.all([
    getRevenueTrendBatched(supabase, orgId, dayCount, resolvedBranchId),
    getTopServicesBatched(supabase, completedWoIds),
    getTechnicianPerformanceBatched(
      supabase,
      orgId,
      allCompletedIds,
      resolvedBranchId,
    ),
    getRecentWorkOrdersBatched(supabase, recentWoIds),
    getServiceCategoryBreakdownBatched(supabase, orgId, allCompletedIds),
    getCustomerAcquisitionTrendBatched(supabase, orgId, resolvedBranchId),
    getPreviousPeriodSummary(supabase, orgId, resolvedPeriod, resolvedBranchId),
  ]);

  // Combine into a DashboardSummary shape for comparison
  const summaryComparison: DashboardSummary | null = prevSummary
    ? {
        ...prevSummary,
        activeWorkOrders: 0,
        totalCustomers: 0,
        totalVehicles: 0,
        grossProfit: 0,
        marginPercent: 0,
      }
    : null;

  // ── Insights ────────────────────────────────────────────
  const insights = generateInsights(
    summary,
    summaryComparison,
    workOrderStatusDistribution,
  );

  const dashboardData: DashboardData = {
    summary,
    summaryComparison,
    insights,
    workOrderStatusDistribution,
    revenueTrend,
    topServices,
    technicianPerformance,
    recentWorkOrders,
    serviceCategoryBreakdown,
    customerAcquisitionTrend,
  };

  return dashboardData;
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
