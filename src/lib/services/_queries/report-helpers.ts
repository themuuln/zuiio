/**
 * Shared query helpers for report-service.ts
 *
 * Eliminates 15+ duplicate patterns of:
 * 1. Fetching completed WOs for a date range
 * 2. Fetching services + parts revenue/cost data for a set of WO IDs
 * 3. Enriching reports with comparison, profitability, and mechanic KPIs
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  ReportComparison,
  ReportMechanicKpi,
  ReportProfitability,
} from "@/lib/types";

// ── Types ──────────────────────────────────────────────────

export interface WoDateRangeQuery {
  orgId: string;
  dateFrom: string;
  dateTo: string;
  mechanicId?: string | null;
  select?: string;
}

export interface WoRevenueData {
  serviceRevenue: number;
  serviceCost: number;
  partsRevenue: number;
  partsCost: number;
  totalRevenue: number;
  totalCost: number;
  grossProfit: number;
  serviceCount: number;
  partsCount: number;
  totalDiscounts: number;
}

export interface ReportEnrichment {
  comparison: ReportComparison | null;
  profitability: ReportProfitability | null;
  mechanicKpis: ReportMechanicKpi[];
}

// ── 1. Fetch Completed WO IDs for a Date Range ───────────

/**
 * Fetches IDs of completed work orders in a date range.
 * Replaces the 15+ identical supabase query blocks across report functions.
 *
 * @param select - Fields to select. Defaults to "id".
 *   Use "id, mechanic_id" or "id, mechanic_id, created_at" when needed.
 */
export async function fetchCompletedWoIds(
  supabase: SupabaseClient,
  query: WoDateRangeQuery,
): Promise<string[]> {
  const { orgId, dateFrom, dateTo, mechanicId, select = "id" } = query;

  let q = supabase
    .from("work_orders")
    .select(select)
    .eq("organization_id", orgId)
    .eq("status", "Completed")
    .gte("created_at", `${dateFrom}T00:00:00`)
    .lte("created_at", `${dateTo}T23:59:59`)
    .is("deleted_at", null);

  if (mechanicId) {
    q = q.eq("mechanic_id", mechanicId);
  }

  const { data } = await q;
  if (!data) return [];
  return (data as unknown as Array<{ id: string }>).map((w) => w.id);
}

// ── 2. Fetch Revenue Data for WO IDs ─────────────────────

/**
 * Fetches services + parts for a set of WO IDs and computes revenue/cost totals.
 * Returns a typed object with all financial metrics.
 *
 * This replaces 15+ identical "fetch services → reduce → fetch parts → reduce" blocks.
 */
export async function fetchWoRevenue(
  supabase: SupabaseClient,
  woIds: string[],
): Promise<WoRevenueData> {
  if (woIds.length === 0) {
    return {
      serviceRevenue: 0,
      serviceCost: 0,
      partsRevenue: 0,
      partsCost: 0,
      totalRevenue: 0,
      totalCost: 0,
      grossProfit: 0,
      serviceCount: 0,
      partsCount: 0,
      totalDiscounts: 0,
    };
  }

  const [svcs, parts] = await Promise.all([
    supabase
      .from("work_order_services")
      .select(
        "final_price, unit_cost, quantity, discount_amount, service_name, work_order_id",
      )
      .in("work_order_id", woIds),
    supabase
      .from("work_order_parts")
      .select(
        "final_price, unit_cost, quantity, discount_amount, work_order_id",
      )
      .in("work_order_id", woIds),
  ]);

  let serviceRevenue = 0;
  let serviceCost = 0;
  let partsRevenue = 0;
  let partsCost = 0;
  let totalDiscounts = 0;
  let serviceCount = 0;
  let partsCount = 0;

  for (const s of svcs.data ?? []) {
    serviceRevenue += Number(s.final_price);
    serviceCost += Number(s.unit_cost ?? 0) * (s.quantity ?? 1);
    totalDiscounts += Number(s.discount_amount ?? 0);
    serviceCount++;
  }
  for (const p of parts.data ?? []) {
    partsRevenue += Number(p.final_price);
    partsCost += Number(p.unit_cost ?? 0) * (p.quantity ?? 1);
    totalDiscounts += Number(p.discount_amount ?? 0);
    partsCount++;
  }

  const totalRevenue = serviceRevenue + partsRevenue;
  const totalCost = serviceCost + partsCost;

  return {
    serviceRevenue,
    serviceCost,
    partsRevenue,
    partsCost,
    totalRevenue,
    totalCost,
    grossProfit: totalRevenue - totalCost,
    serviceCount,
    partsCount,
    totalDiscounts,
  };
}

// ── 3. Enrich Report with Comparison + Profit + Mechanics ─

/**
 * Standard enrichment block used by getDailyReport, getWeeklyReport, getMonthlyReport.
 * Fetches comparison data, profitability metrics, and per-mechanic KPIs in parallel.
 *
 * Replaces the 3× duplicated `Promise.all([calculateProfitability, getComparisonData, getMechanicKpis])` blocks.
 */
export async function enrichReport(
  supabase: SupabaseClient,
  orgId: string,
  woIds: string[],
  dateFrom: string,
  dateTo: string,
  mechanicId: string | null,
  currentRevenue: number,
): Promise<ReportEnrichment> {
  const [profitability, comparison, mechanicKpis] = await Promise.all([
    calculateProfitability(supabase, woIds),
    fetchComparisonData(
      supabase,
      orgId,
      dateFrom,
      dateTo,
      mechanicId,
      currentRevenue,
    ),
    !mechanicId
      ? fetchMechanicKpis(supabase, woIds)
      : Promise.resolve([] as ReportMechanicKpi[]),
  ]);

  return { comparison, profitability, mechanicKpis };
}

// ── Internal Helpers ──────────────────────────────────────

async function calculateProfitability(
  supabase: SupabaseClient,
  woIds: string[],
): Promise<ReportProfitability | null> {
  if (woIds.length === 0) return null;
  const rev = await fetchWoRevenue(supabase, woIds);

  return {
    gross_profit: rev.grossProfit,
    margin_percent:
      rev.totalRevenue > 0
        ? Math.round((rev.grossProfit / rev.totalRevenue) * 1000) / 10
        : 0,
    service_revenue: rev.serviceRevenue,
    service_cost: rev.serviceCost,
    parts_revenue: rev.partsRevenue,
    parts_cost: rev.partsCost,
    total_cost: rev.totalCost,
    effective_labor_rate:
      rev.serviceRevenue > 0 && woIds.length > 0
        ? Math.round(rev.serviceRevenue / woIds.length)
        : 0,
    avg_repair_order:
      rev.totalRevenue > 0 && woIds.length > 0
        ? Math.round(rev.totalRevenue / woIds.length)
        : 0,
    parts_to_labor_ratio:
      rev.serviceRevenue > 0
        ? Math.round((rev.partsRevenue / rev.serviceRevenue) * 100) / 100
        : 0,
  };
}

async function fetchComparisonData(
  supabase: SupabaseClient,
  orgId: string,
  currentStart: string,
  currentEnd: string,
  mechanicId: string | null,
  currentRevenue: number,
): Promise<ReportComparison | null> {
  const durationMs =
    new Date(currentEnd).getTime() - new Date(currentStart).getTime();
  const prevEndMs = new Date(currentStart).getTime() - 1;
  const prevStartMs = prevEndMs - durationMs;
  const prevFrom = new Date(prevStartMs).toISOString().split("T")[0];
  const prevTo = new Date(prevEndMs).toISOString().split("T")[0];

  const prevWoIds = await fetchCompletedWoIds(supabase, {
    orgId,
    dateFrom: prevFrom,
    dateTo: prevTo,
    mechanicId,
  });

  if (prevWoIds.length === 0) return null;

  const prevRev = await fetchWoRevenue(supabase, prevWoIds);

  return {
    work_orders_completed: prevWoIds.length,
    total_revenue: prevRev.totalRevenue,
    services_count: prevRev.serviceCount,
    parts_count: prevRev.partsCount,
    revenue_change_pct:
      prevRev.totalRevenue > 0
        ? Math.round(
            ((currentRevenue - prevRev.totalRevenue) / prevRev.totalRevenue) *
              1000,
          ) / 10
        : null,
    work_orders_change_pct: null,
  };
}

async function fetchMechanicKpis(
  supabase: SupabaseClient,
  woIds: string[],
): Promise<ReportMechanicKpi[]> {
  if (woIds.length === 0) return [];

  const { data: woMechanics } = await supabase
    .from("work_orders")
    .select("id, mechanic_id")
    .in("id", woIds)
    .not("mechanic_id", "is", null);

  if (!woMechanics?.length) return [];

  const mechanicWoMap = new Map<string, string[]>();
  for (const wo of woMechanics) {
    if (!wo.mechanic_id) continue;
    const list = mechanicWoMap.get(wo.mechanic_id) ?? [];
    list.push(wo.id);
    mechanicWoMap.set(wo.mechanic_id, list);
  }

  const mechanicIds = [...mechanicWoMap.keys()];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name")
    .in("id", mechanicIds);

  const profileMap = new Map<string, string>();
  for (const p of profiles ?? [])
    profileMap.set(p.id, p.full_name ?? "Unknown");

  // Fetch all revenue data at once
  // Build per-WO revenue map from services+parts
  const { data: svcs } = await supabase
    .from("work_order_services")
    .select("final_price, work_order_id")
    .in("work_order_id", woIds);
  const { data: parts } = await supabase
    .from("work_order_parts")
    .select("final_price, work_order_id")
    .in("work_order_id", woIds);

  const woRevMap = new Map<string, number>();
  const woSvcCount = new Map<string, number>();
  const woPartCount = new Map<string, number>();
  for (const s of svcs ?? []) {
    woRevMap.set(
      s.work_order_id,
      (woRevMap.get(s.work_order_id) ?? 0) + Number(s.final_price),
    );
    woSvcCount.set(s.work_order_id, (woSvcCount.get(s.work_order_id) ?? 0) + 1);
  }
  for (const p of parts ?? []) {
    woRevMap.set(
      p.work_order_id,
      (woRevMap.get(p.work_order_id) ?? 0) + Number(p.final_price),
    );
    woPartCount.set(
      p.work_order_id,
      (woPartCount.get(p.work_order_id) ?? 0) + 1,
    );
  }

  const kpis: ReportMechanicKpi[] = [];
  for (const [mid, mWoIds] of mechanicWoMap) {
    let totalRevenue = 0;
    let servicesCount = 0;
    let partsCount = 0;
    for (const wid of mWoIds) {
      totalRevenue += woRevMap.get(wid) ?? 0;
      servicesCount += woSvcCount.get(wid) ?? 0;
      partsCount += woPartCount.get(wid) ?? 0;
    }
    kpis.push({
      mechanic_id: mid,
      mechanic_name: profileMap.get(mid) ?? "Unknown",
      work_orders_completed: mWoIds.length,
      services_count: servicesCount,
      parts_count: partsCount,
      total_revenue: totalRevenue,
      avg_revenue_per_wo:
        mWoIds.length > 0 ? Math.round(totalRevenue / mWoIds.length) : 0,
    });
  }

  return kpis.sort((a, b) => b.total_revenue - a.total_revenue);
}
