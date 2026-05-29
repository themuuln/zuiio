import { cacheTags, cacheDurations } from "@/lib/cache/keys";
import { withCache } from "@/lib/cache/with-cache";
import { createClient } from "@/lib/supabase/server";

import type {
  CustomerAcquisitionPoint,
  CustomerRetentionData,
  DailyReport,
  DashboardData,
  DashboardSummary,
  EndOfDaySummary,
  MonthlyReport,
  PnLSummary,
  ReportComparison,
  ReportForecast,
  ReportInsight,
  ReportMechanicKpi,
  ReportProfitability,
  ReportTarget,
  RevenueTrendPoint,
  ServiceBreakdown,
  ServiceCategoryBreakdown,
  TechnicianPerformance,
  TopService,
  WeeklyReport,
  WorkOrderDetail,
  WorkOrderProfit,
  WorkOrderStatusDistribution,
} from "@/lib/types";

// ── Helpers ──────────────────────────────────────────────────

/**
 * Calculate profitability metrics from work order service/part data.
 * Reuses the same logic as getWorkOrderProfit but batched for many WOs.
 */
async function calculateProfitability(
  supabase: Awaited<ReturnType<typeof createClient>>,
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
async function getComparisonData(
  supabase: Awaited<ReturnType<typeof createClient>>,
  orgId: string,
  currentStart: string,
  currentEnd: string,
  mechanicId: string | null,
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

/** Extract per-mechanic KPI rows from work order data */
async function getMechanicKpis(
  supabase: Awaited<ReturnType<typeof createClient>>,
  _orgId: string,
  woIds: string[],
): Promise<ReportMechanicKpi[]> {
  if (woIds.length === 0) return [];

  // Get mechanic_id for each WO
  const { data: woMechanics } = await supabase
    .from("work_orders")
    .select("id, mechanic_id")
    .in("id", woIds)
    .not("mechanic_id", "is", null);

  if (!woMechanics?.length) return [];

  // Build per-mechanic WO lists
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

  // Get all services/parts for these WOs
  const [servicesData, partsData] = await Promise.all([
    supabase
      .from("work_order_services")
      .select("final_price, work_order_id")
      .in("work_order_id", woIds),
    supabase
      .from("work_order_parts")
      .select("final_price, work_order_id")
      .in("work_order_id", woIds),
  ]);

  // Build revenue map per WO
  const woRevenueMap = new Map<string, number>();
  const woServiceCountMap = new Map<string, number>();
  const woPartCountMap = new Map<string, number>();
  for (const s of servicesData.data ?? []) {
    woRevenueMap.set(
      s.work_order_id,
      (woRevenueMap.get(s.work_order_id) ?? 0) + Number(s.final_price),
    );
    woServiceCountMap.set(
      s.work_order_id,
      (woServiceCountMap.get(s.work_order_id) ?? 0) + 1,
    );
  }
  for (const p of partsData.data ?? []) {
    woRevenueMap.set(
      p.work_order_id,
      (woRevenueMap.get(p.work_order_id) ?? 0) + Number(p.final_price),
    );
    woPartCountMap.set(
      p.work_order_id,
      (woPartCountMap.get(p.work_order_id) ?? 0) + 1,
    );
  }

  const kpis: ReportMechanicKpi[] = [];
  for (const [mid, mWoIds] of mechanicWoMap) {
    let totalRevenue = 0;
    let servicesCount = 0;
    let partsCount = 0;
    for (const wid of mWoIds) {
      totalRevenue += woRevenueMap.get(wid) ?? 0;
      servicesCount += woServiceCountMap.get(wid) ?? 0;
      partsCount += woPartCountMap.get(wid) ?? 0;
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

export async function getMechanicsList(
  orgId: string,
): Promise<{ id: string; full_name: string | null }[]> {
  const supabase = await createClient();

  return withCache(
    ["getMechanicsList", orgId],
    async () => {
      const { data: mechanics } = await supabase
        .from("organization_users")
        .select("user_id, roles!inner(name)")
        .eq("organization_id", orgId)
        .eq("roles.name", "mechanic");

      if (!mechanics?.length) return [];

      const userIds = mechanics.map((m) => m.user_id);

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", userIds);

      return (profiles ?? []).map((p) => ({
        id: p.id,
        full_name: p.full_name,
      }));
    },
    {
      tags: [cacheTags.reports(orgId)],
      revalidate: cacheDurations.reports,
    },
  );
}

export async function getDailyReport(
  orgId: string,
  mechanicId: string | null,
  date: string,
): Promise<DailyReport> {
  const supabase = await createClient();

  return withCache(
    ["getDailyReport", orgId, mechanicId ?? "all", date],
    async () => {
      let mechanicName = "All Mechanics";
      if (mechanicId) {
        const { data: mechanic } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", mechanicId)
          .single();
        mechanicName = mechanic?.full_name ?? "Unknown";
      }

      let query = supabase
        .from("work_orders")
        .select("id")
        .eq("organization_id", orgId)
        .gte("created_at", `${date}T00:00:00`)
        .lte("created_at", `${date}T23:59:59`)
        .eq("status", "Completed")
        .is("deleted_at", null);

      if (mechanicId) {
        query = query.eq("mechanic_id", mechanicId);
      }

      const { data: workOrders } = await query;

      const woIds = (workOrders ?? []).map((w) => w.id);

      const [servicesData, partsData] = await Promise.all([
        woIds.length > 0
          ? supabase
              .from("work_order_services")
              .select(
                "final_price, discount_amount, service_name, work_order_id",
              )
              .in("work_order_id", woIds)
          : { data: [] as any[] },
        woIds.length > 0
          ? supabase
              .from("work_order_parts")
              .select("final_price, discount_amount, part_name, work_order_id")
              .in("work_order_id", woIds)
          : { data: [] as any[] },
      ]);

      const woDataMap = new Map<string, { services: any[]; parts: any[] }>();
      for (const s of servicesData.data ?? []) {
        const entry = woDataMap.get(s.work_order_id) ?? {
          services: [],
          parts: [],
        };
        entry.services.push(s);
        woDataMap.set(s.work_order_id, entry);
      }
      for (const p of partsData.data ?? []) {
        const entry = woDataMap.get(p.work_order_id) ?? {
          services: [],
          parts: [],
        };
        entry.parts.push(p);
        woDataMap.set(p.work_order_id, entry);
      }

      let servicesCount = 0;
      let partsCount = 0;
      let totalRevenue = 0;
      let totalDiscounts = 0;

      for (const [_woId, data] of woDataMap) {
        servicesCount += data.services.length;
        partsCount += data.parts.length;
        for (const s of data.services) {
          totalRevenue += Number(s.final_price);
          totalDiscounts += Number(s.discount_amount ?? 0);
        }
        for (const p of data.parts) {
          totalRevenue += Number(p.final_price);
          totalDiscounts += Number(p.discount_amount ?? 0);
        }
      }

      const details =
        woIds.length > 0
          ? await getRecentWorkOrdersBatched(supabase, woIds)
          : [];

      // ── ERP-grade enrichments ──────────────────────────────
      const [profitability, comparison, mechanicKpis] = await Promise.all([
        calculateProfitability(supabase, woIds),
        getComparisonData(supabase, orgId, date, date, mechanicId),
        !mechanicId
          ? getMechanicKpis(supabase, orgId, woIds)
          : Promise.resolve([]),
      ]);

      // Patch comparison with current data for % calc
      if (comparison) {
        comparison.revenue_change_pct =
          comparison.total_revenue > 0
            ? Math.round(
                ((totalRevenue - comparison.total_revenue) /
                  comparison.total_revenue) *
                  1000,
              ) / 10
            : null;
        comparison.work_orders_change_pct =
          comparison.work_orders_completed > 0
            ? Math.round(
                ((woIds.length - comparison.work_orders_completed) /
                  comparison.work_orders_completed) *
                  1000,
              ) / 10
            : null;
      }

      return {
        date,
        mechanic_id: mechanicId ?? "",
        mechanic_name: mechanicName,
        work_orders_completed: woIds.length,
        services_count: servicesCount,
        parts_count: partsCount,
        total_revenue: totalRevenue,
        total_discounts: totalDiscounts,
        work_orders: details,
        comparison,
        profitability,
        mechanic_kpis: mechanicKpis,
      };
    },
    {
      tags: [cacheTags.reports(orgId)],
      revalidate: cacheDurations.reports,
    },
  );
}

export async function getWeeklyReport(
  orgId: string,
  mechanicId: string | null,
  weekStart: string,
): Promise<WeeklyReport> {
  const weekStartDate = new Date(weekStart);
  const weekEndDate = new Date(weekStartDate);
  weekEndDate.setDate(weekEndDate.getDate() + 6);

  const weekEnd = weekEndDate.toISOString().split("T")[0];

  const supabase = await createClient();
  let mechanicName = "All Mechanics";
  if (mechanicId) {
    const { data: mechanic } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", mechanicId)
      .single();
    mechanicName = mechanic?.full_name ?? "Unknown";
  }

  const dailyBreakdown: DailyReport[] = [];
  let totalWos = 0;
  let totalServices = 0;
  let totalParts = 0;
  let totalRevenue = 0;
  let totalDiscounts = 0;

  const dailyResults = await Promise.all(
    Array.from({ length: 7 }, async (_, i) => {
      const d = new Date(weekStartDate);
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().split("T")[0];
      return getDailyReport(orgId, mechanicId, dateStr);
    }),
  );
  for (const daily of dailyResults) {
    dailyBreakdown.push(daily);
    totalWos += daily.work_orders_completed;
    totalServices += daily.services_count;
    totalParts += daily.parts_count;
    totalRevenue += daily.total_revenue;
    totalDiscounts += daily.total_discounts;
  }

  // ── ERP-grade enrichments ──────────────────────────────
  const allWoIds = dailyBreakdown.flatMap((d) =>
    d.work_orders.map((w) => w.id),
  );
  const [profitability, comparison, mechanicKpis] = await Promise.all([
    calculateProfitability(supabase, allWoIds),
    getComparisonData(supabase, orgId, weekStart, weekEnd, mechanicId),
    !mechanicId
      ? getMechanicKpis(supabase, orgId, allWoIds)
      : Promise.resolve([]),
  ]);

  if (comparison) {
    comparison.revenue_change_pct =
      comparison.total_revenue > 0
        ? Math.round(
            ((totalRevenue - comparison.total_revenue) /
              comparison.total_revenue) *
              1000,
          ) / 10
        : null;
    comparison.work_orders_change_pct =
      comparison.work_orders_completed > 0
        ? Math.round(
            ((totalWos - comparison.work_orders_completed) /
              comparison.work_orders_completed) *
              1000,
          ) / 10
        : null;
  }

  return {
    week_start: weekStart,
    week_end: weekEnd,
    mechanic_id: mechanicId ?? "",
    mechanic_name: mechanicName,
    work_orders_completed: totalWos,
    services_count: totalServices,
    parts_count: totalParts,
    total_revenue: totalRevenue,
    total_discounts: totalDiscounts,
    daily_breakdown: dailyBreakdown,
    comparison,
    profitability,
    mechanic_kpis: mechanicKpis,
  };
}

export async function getMonthlyReport(
  orgId: string,
  mechanicId: string | null,
  year: number,
  month: number,
): Promise<MonthlyReport> {
  const supabase = await createClient();
  let mechanicName = "All Mechanics";
  if (mechanicId) {
    const { data: mechanic } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", mechanicId)
      .single();
    mechanicName = mechanic?.full_name ?? "Unknown";
  }

  const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const endDate = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

  let query = supabase
    .from("work_orders")
    .select("id")
    .eq("organization_id", orgId)
    .gte("created_at", `${startDate}T00:00:00`)
    .lte("created_at", `${endDate}T23:59:59`)
    .eq("status", "Completed")
    .is("deleted_at", null);

  if (mechanicId) {
    query = query.eq("mechanic_id", mechanicId);
  }

  const { data: workOrders } = await query;

  const woIds = (workOrders ?? []).map((w) => w.id);

  const [servicesData, partsData] = await Promise.all([
    woIds.length > 0
      ? supabase
          .from("work_order_services")
          .select("final_price, discount_amount, work_order_id")
          .in("work_order_id", woIds)
      : { data: [] as any[] },
    woIds.length > 0
      ? supabase
          .from("work_order_parts")
          .select("final_price, discount_amount, work_order_id")
          .in("work_order_id", woIds)
      : { data: [] as any[] },
  ]);

  const woDataMap = new Map<string, { services: any[]; parts: any[] }>();
  for (const s of servicesData.data ?? []) {
    const entry = woDataMap.get(s.work_order_id) ?? { services: [], parts: [] };
    entry.services.push(s);
    woDataMap.set(s.work_order_id, entry);
  }
  for (const p of partsData.data ?? []) {
    const entry = woDataMap.get(p.work_order_id) ?? { services: [], parts: [] };
    entry.parts.push(p);
    woDataMap.set(p.work_order_id, entry);
  }

  let servicesCount = 0;
  let partsCount = 0;
  let totalRevenue = 0;
  let totalDiscounts = 0;

  for (const [_woId, data] of woDataMap) {
    servicesCount += data.services.length;
    partsCount += data.parts.length;
    for (const s of data.services) {
      totalRevenue += Number(s.final_price);
      totalDiscounts += Number(s.discount_amount ?? 0);
    }
    for (const p of data.parts) {
      totalRevenue += Number(p.final_price);
      totalDiscounts += Number(p.discount_amount ?? 0);
    }
  }

  // ── Weekly breakdown ─────────────────────────────────────
  const weeklyBreakdown: WeeklyReport[] = [];
  const firstDay = new Date(year, month - 1, 1);
  const lastDayDate = new Date(year, month, 0);
  const weekStart = new Date(firstDay);
  // Align to Monday
  const dayOfWeek = weekStart.getDay();
  const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  weekStart.setDate(weekStart.getDate() + daysToMonday);

  while (weekStart <= lastDayDate) {
    const ws = weekStart.toISOString().split("T")[0];
    const weeklyReport = await getWeeklyReport(orgId, mechanicId, ws);
    // Only include weeks that overlap with the target month
    const weekEndDate = new Date(weekStart);
    weekEndDate.setDate(weekEndDate.getDate() + 6);
    if (
      weekEndDate.getMonth() === month - 1 ||
      weekStart.getMonth() === month - 1
    ) {
      weeklyBreakdown.push(weeklyReport);
    }
    weekStart.setDate(weekStart.getDate() + 7);
  }

  // ── ERP-grade enrichments ──────────────────────────────
  const [profitability, comparison, mechanicKpis] = await Promise.all([
    calculateProfitability(supabase, woIds),
    getComparisonData(supabase, orgId, startDate, endDate, mechanicId),
    !mechanicId ? getMechanicKpis(supabase, orgId, woIds) : Promise.resolve([]),
  ]);

  if (comparison) {
    comparison.revenue_change_pct =
      comparison.total_revenue > 0
        ? Math.round(
            ((totalRevenue - comparison.total_revenue) /
              comparison.total_revenue) *
              1000,
          ) / 10
        : null;
    comparison.work_orders_change_pct =
      comparison.work_orders_completed > 0
        ? Math.round(
            ((woIds.length - comparison.work_orders_completed) /
              comparison.work_orders_completed) *
              1000,
          ) / 10
        : null;
  }

  return {
    year,
    month,
    mechanic_id: mechanicId ?? "",
    mechanic_name: mechanicName,
    work_orders_completed: woIds.length,
    services_count: servicesCount,
    parts_count: partsCount,
    total_revenue: totalRevenue,
    total_discounts: totalDiscounts,
    weekly_breakdown: weeklyBreakdown,
    comparison,
    profitability,
    mechanic_kpis: mechanicKpis,
  };
}

export async function getEndOfDaySummary(
  orgId: string,
  date: string,
): Promise<EndOfDaySummary> {
  const supabase = await createClient();

  const { data: workOrders } = await supabase
    .from("work_orders")
    .select("id, mechanic_id")
    .eq("organization_id", orgId)
    .gte("created_at", `${date}T00:00:00`)
    .lte("created_at", `${date}T23:59:59`)
    .eq("status", "Completed")
    .is("deleted_at", null);

  if (!workOrders?.length) {
    return {
      date,
      mechanics: [],
      total_work_orders: 0,
      total_revenue: 0,
      total_commission: 0,
    };
  }

  const mechanicMap = new Map<
    string,
    {
      mechanic_id: string;
      mechanic_name: string;
      work_orders_completed: number;
      services_count: number;
      parts_count: number;
      total_revenue: number;
      total_commission: number;
    }
  >();

  const mechanicIds = [
    ...new Set(
      workOrders.flatMap((w) =>
        w.mechanic_id ? [w.mechanic_id] : [],
      ) as string[],
    ),
  ];

  const { data: profilesData } =
    mechanicIds.length > 0
      ? await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", mechanicIds)
      : { data: [] as any[] };

  const profileMap = new Map<string, string>();
  for (const p of profilesData ?? []) {
    profileMap.set(p.id, p.full_name ?? "Unknown");
  }

  const woIds = workOrders.map((w) => w.id);
  const [servicesData, partsData, commissionsData] = await Promise.all([
    woIds.length > 0
      ? supabase
          .from("work_order_services")
          .select("final_price, work_order_id")
          .in("work_order_id", woIds)
      : { data: [] as any[] },
    woIds.length > 0
      ? supabase
          .from("work_order_parts")
          .select("final_price, work_order_id")
          .in("work_order_id", woIds)
      : { data: [] as any[] },
    woIds.length > 0
      ? supabase
          .from("work_order_commissions")
          .select("mechanic_id, commission_amount")
          .in("work_order_id", woIds)
      : { data: [] as any[] },
  ]);

  const woDataMap = new Map<string, { services: any[]; parts: any[] }>();
  for (const s of servicesData.data ?? []) {
    const entry = woDataMap.get(s.work_order_id) ?? { services: [], parts: [] };
    entry.services.push(s);
    woDataMap.set(s.work_order_id, entry);
  }
  for (const p of partsData.data ?? []) {
    const entry = woDataMap.get(p.work_order_id) ?? { services: [], parts: [] };
    entry.parts.push(p);
    woDataMap.set(p.work_order_id, entry);
  }

  // Aggregate commissions per mechanic
  const commissionMap = new Map<string, number>();
  for (const c of commissionsData.data ?? []) {
    const mid = c.mechanic_id;
    const current = commissionMap.get(mid) ?? 0;
    commissionMap.set(mid, current + Number(c.commission_amount));
  }

  for (const wo of workOrders) {
    const mid = wo.mechanic_id;
    if (!mid) continue;

    if (!mechanicMap.has(mid)) {
      mechanicMap.set(mid, {
        mechanic_id: mid,
        mechanic_name: profileMap.get(mid) ?? "Unknown",
        work_orders_completed: 0,
        services_count: 0,
        parts_count: 0,
        total_revenue: 0,
        total_commission: 0,
      });
    }

    const entry = mechanicMap.get(mid);
    if (!entry) continue;

    entry.work_orders_completed++;

    const data = woDataMap.get(wo.id);
    if (!data) continue;

    entry.services_count += data.services.length;
    entry.parts_count += data.parts.length;

    for (const s of data.services) entry.total_revenue += Number(s.final_price);
    for (const p of data.parts) entry.total_revenue += Number(p.final_price);
  }

  // Add commission totals to mechanic entries
  for (const [mid, amount] of commissionMap) {
    const entry = mechanicMap.get(mid);
    if (entry) {
      entry.total_commission = amount;
    }
  }

  const mechanics = Array.from(mechanicMap.values());
  const totalWorkOrders = mechanics.reduce(
    (sum, m) => sum + m.work_orders_completed,
    0,
  );
  const totalRevenue = mechanics.reduce((sum, m) => sum + m.total_revenue, 0);
  const totalCommission = mechanics.reduce(
    (sum, m) => sum + (m.total_commission ?? 0),
    0,
  );

  return {
    date,
    mechanics,
    total_work_orders: totalWorkOrders,
    total_revenue: totalRevenue,
    total_commission: totalCommission,
  };
}

// ── Mechanic Performance Trend ─────────────────────────────

function getWeekKey(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(
    ((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7,
  );
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

export async function getMechanicPerformanceTrend(
  orgId: string,
  mechanicId: string,
  period: "weekly" | "monthly" = "weekly",
  startDate: string,
  endDate: string,
): Promise<TechnicianPerformance> {
  const supabase = await createClient();

  return withCache(
    [
      "getMechanicPerformanceTrend",
      orgId,
      mechanicId,
      period,
      startDate,
      endDate,
    ],
    async () => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", mechanicId)
        .single();
      const mechanicName = profile?.full_name ?? "Unknown";

      const { data: workOrders } = await supabase
        .from("work_orders")
        .select("id, created_at")
        .eq("organization_id", orgId)
        .eq("mechanic_id", mechanicId)
        .eq("status", "Completed")
        .gte("created_at", `${startDate}T00:00:00`)
        .lte("created_at", `${endDate}T23:59:59`)
        .is("deleted_at", null);

      const woIds = (workOrders ?? []).map((w) => w.id);

      const [svcs, prts] = await Promise.all([
        woIds.length > 0
          ? supabase
              .from("work_order_services")
              .select("final_price, work_order_id")
              .in("work_order_id", woIds)
          : { data: [] as any[] },
        woIds.length > 0
          ? supabase
              .from("work_order_parts")
              .select("final_price, work_order_id")
              .in("work_order_id", woIds)
          : { data: [] as any[] },
      ]);

      const woRevenue = new Map<string, number>();
      for (const s of svcs.data ?? []) {
        woRevenue.set(
          s.work_order_id,
          (woRevenue.get(s.work_order_id) ?? 0) + Number(s.final_price),
        );
      }
      for (const p of prts.data ?? []) {
        woRevenue.set(
          p.work_order_id,
          (woRevenue.get(p.work_order_id) ?? 0) + Number(p.final_price),
        );
      }

      const trendMap = new Map<string, { orders: number; revenue: number }>();
      for (const wo of workOrders ?? []) {
        const dateStr = (wo.created_at ?? "").slice(0, 10);
        const key =
          period === "monthly" ? dateStr.slice(0, 7) : getWeekKey(dateStr);
        const entry = trendMap.get(key) ?? { orders: 0, revenue: 0 };
        entry.orders++;
        entry.revenue += woRevenue.get(wo.id) ?? 0;
        trendMap.set(key, entry);
      }

      const totalOrders = (workOrders ?? []).length;
      const totalRevenue = Array.from(trendMap.values()).reduce(
        (sum, e) => sum + e.revenue,
        0,
      );

      const sortedKeys = Array.from(trendMap.keys()).sort();
      const weeklyTrend = sortedKeys.map((week) => ({
        week,
        orders: trendMap.get(week)!.orders,
        revenue: Math.round(trendMap.get(week)!.revenue * 100) / 100,
      }));

      const start = new Date(startDate);
      const end = new Date(endDate);
      const daysDiff = Math.max(
        1,
        Math.ceil((end.getTime() - start.getTime()) / 86400000),
      );

      return {
        id: mechanicId,
        name: mechanicName,
        completedOrders: totalOrders,
        revenue: Math.round(totalRevenue * 100) / 100,
        avgJobValue:
          totalOrders > 0
            ? Math.round((totalRevenue / totalOrders) * 100) / 100
            : 0,
        jobsPerDay: Math.round((totalOrders / daysDiff) * 100) / 100,
        weeklyTrend,
      };
    },
    {
      tags: [cacheTags.reports(orgId)],
      revalidate: cacheDurations.reports,
    },
  );
}

// ── Dashboard (optimized: ~10 queries instead of ~236) ──────

export async function getDashboardData(
  orgId: string,
  period: "today" | "week" | "month" | "all" = "all",
): Promise<DashboardData> {
  const supabase = await createClient();

  return withCache(
    ["getDashboardData", orgId, period],
    async () => {
      const today = new Date().toISOString().split("T")[0];
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0];
      const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0];
      const dayCount = period === "today" ? 1 : period === "week" ? 7 : 30;

      const dateFrom =
        period === "today"
          ? today
          : period === "week"
            ? weekAgo
            : period === "month"
              ? monthAgo
              : "2000-01-01";

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
        supabase
          .from("work_orders")
          .select("id")
          .eq("organization_id", orgId)
          .eq("status", "Completed")
          .gte("updated_at", `${dateFrom}T00:00:00`)
          .is("deleted_at", null),

        // Active WOs
        supabase
          .from("work_orders")
          .select("id")
          .eq("organization_id", orgId)
          .not("status", "in", '("Completed","Cancelled")')
          .is("deleted_at", null),

        // All WO statuses for distribution
        supabase
          .from("work_orders")
          .select("status")
          .eq("organization_id", orgId)
          .is("deleted_at", null),

        // Recent 10 WO ids (we'll batch-fetch details)
        supabase
          .from("work_orders")
          .select("id")
          .eq("organization_id", orgId)
          .is("deleted_at", null)
          .order("created_at", { ascending: false })
          .limit(10),

        // Total customers
        supabase
          .from("customers")
          .select("id", { count: "exact", head: true })
          .eq("organization_id", orgId)
          .is("deleted_at", null),

        // Total vehicles
        supabase
          .from("vehicles")
          .select("id", { count: "exact", head: true })
          .eq("organization_id", orgId)
          .is("deleted_at", null),

        // All completed WOs ever (for tech perf and categories)
        supabase
          .from("work_orders")
          .select("id")
          .eq("organization_id", orgId)
          .eq("status", "Completed")
          .is("deleted_at", null),
      ]);

      // ── Batch 2: Services + Parts for revenue ──────────────
      const completedWoIds = (completedWos.data ?? []).map(
        (w: { id: string }) => w.id,
      );
      const allCompletedIds = (allCompletedWos.data ?? []).map(
        (w: { id: string }) => w.id,
      );
      const recentWoIds = (recentIds.data ?? []).map(
        (w: { id: string }) => w.id,
      );

      const [servicesData, partsData] = await Promise.all([
        completedWoIds.length > 0
          ? supabase
              .from("work_order_services")
              .select(
                "final_price, discount_amount, service_name, work_order_id, unit_cost, quantity",
              )
              .in("work_order_id", completedWoIds)
          : { data: [] as any[] },

        completedWoIds.length > 0
          ? supabase
              .from("work_order_parts")
              .select(
                "final_price, discount_amount, part_name, work_order_id, unit_cost, quantity",
              )
              .in("work_order_id", completedWoIds)
          : { data: [] as any[] },
      ]);

      const allServices = servicesData.data ?? [];
      const allParts = partsData.data ?? [];

      const serviceRevenue = allServices.reduce(
        (sum: number, s: { final_price: number }) =>
          sum + Number(s.final_price),
        0,
      );
      const serviceCost = allServices.reduce(
        (sum: number, s: { unit_cost?: number; quantity: number }) =>
          sum + Number(s.unit_cost ?? 0) * s.quantity,
        0,
      );
      const partsRevenue = allParts.reduce(
        (sum: number, p: { final_price: number }) =>
          sum + Number(p.final_price),
        0,
      );
      const partsCost = allParts.reduce(
        (sum: number, p: { unit_cost?: number; quantity: number }) =>
          sum + Number(p.unit_cost ?? 0) * p.quantity,
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
            ? Math.round(
                (totalRevenue / (completedWos.data?.length ?? 1)) * 100,
              ) / 100
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
      const workOrderStatusDistribution: WorkOrderStatusDistribution[] =
        Array.from(statusMap.entries()).map(([status, count]) => ({
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
        getRevenueTrendBatched(supabase, orgId, dayCount),
        getTopServicesBatched(supabase, completedWoIds),
        getTechnicianPerformanceBatched(supabase, orgId, allCompletedIds),
        getRecentWorkOrdersBatched(supabase, recentWoIds),
        getServiceCategoryBreakdownBatched(supabase, orgId, allCompletedIds),
        getCustomerAcquisitionTrendBatched(supabase, orgId),
        getPreviousPeriodSummary(supabase, orgId, period),
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
    },
    {
      tags: [cacheTags.dashboardMetrics(orgId)],
      revalidate: cacheDurations.dashboardMetrics,
    },
  );
}

// ── Profit Functions ─────────────────────────────────────────

export async function getWorkOrderProfit(
  workOrderId: string,
  orgId: string,
): Promise<WorkOrderProfit> {
  const supabase = await createClient();

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

export async function getDashboardProfitSummary(orgId: string): Promise<{
  todayProfit: WorkOrderProfit;
  weekProfit: WorkOrderProfit;
  monthProfit: WorkOrderProfit;
}> {
  const supabase = await createClient();
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
  ): Promise<WorkOrderProfit> {
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

// ── Previous Period Comparison ──────────────────────────────

/**
 * Returns a lightweight summary for a previous period of the same length.
 * Only computes revenue + count — not full detail.
 */
async function getPreviousPeriodSummary(
  supabase: Awaited<ReturnType<typeof createClient>>,
  orgId: string,
  period: "today" | "week" | "month" | "all",
): Promise<Omit<
  DashboardSummary,
  | "activeWorkOrders"
  | "totalCustomers"
  | "totalVehicles"
  | "grossProfit"
  | "marginPercent"
> | null> {
  if (period === "all") return null; // no previous period for "all time"

  const now = new Date();
  const currentStart = new Date(now);
  const currentEnd = new Date(now);
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
  const { data: prevWos } = await supabase
    .from("work_orders")
    .select("id")
    .eq("organization_id", orgId)
    .eq("status", "Completed")
    .gte("updated_at", `${prevFrom}T00:00:00`)
    .lte("updated_at", `${prevTo}T23:59:59`)
    .is("deleted_at", null);

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

// ── Insight Generation ──────────────────────────────────────

/**
 * Generates human-readable smart insights from dashboard data deltas.
 */
function generateInsights(
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

function formatNum(n: number): string {
  if (Math.abs(n) >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (Math.abs(n) >= 1_000) return (n / 1_000).toFixed(1) + "k";
  return String(n);
}

// ── Optimized helpers ────────────────────────────────────────

/**
 * Revenue trend using batched queries instead of 3 per day.
 * Fetches daily services + parts in bulk, groups in-memory.
 */
async function getRevenueTrendBatched(
  supabase: Awaited<ReturnType<typeof createClient>>,
  orgId: string,
  dayCount: number,
): Promise<RevenueTrendPoint[]> {
  const dateStrings: string[] = [];
  for (let i = dayCount - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    dateStrings.push(d.toISOString().split("T")[0]);
  }

  const startDate = dateStrings[0];
  const endDate = dateStrings[dateStrings.length - 1];

  // 1 query: get all completed WO ids in date range
  const { data: dayWos } = await supabase
    .from("work_orders")
    .select("id, updated_at")
    .eq("organization_id", orgId)
    .eq("status", "Completed")
    .gte("updated_at", `${startDate}T00:00:00`)
    .lte("updated_at", `${endDate}T23:59:59`)
    .is("deleted_at", null);

  const woMap = new Map<string, string>(); // id → date
  for (const wo of dayWos ?? []) {
    const d = (wo.updated_at ?? "").slice(0, 10);
    woMap.set(wo.id, d);
  }

  const allIds = Array.from(woMap.keys());

  // 2 queries: get all services + parts for those WOs in batch
  const [svcs, prts] = await Promise.all([
    allIds.length > 0
      ? supabase
          .from("work_order_services")
          .select("final_price, work_order_id")
          .in("work_order_id", allIds)
      : { data: [] as any[] },
    allIds.length > 0
      ? supabase
          .from("work_order_parts")
          .select("final_price, work_order_id")
          .in("work_order_id", allIds)
      : { data: [] as any[] },
  ]);

  // Group revenue by date
  const dailyRev = new Map<string, number>();
  const dailyCount = new Map<string, number>();

  for (const s of svcs.data ?? []) {
    const d = woMap.get(s.work_order_id);
    if (d) {
      dailyRev.set(d, (dailyRev.get(d) ?? 0) + Number(s.final_price));
    }
  }
  for (const p of prts.data ?? []) {
    const d = woMap.get(p.work_order_id);
    if (d) {
      dailyRev.set(d, (dailyRev.get(d) ?? 0) + Number(p.final_price));
    }
  }

  // Count WOs per date
  for (const id of allIds) {
    const d = woMap.get(id);
    if (d) dailyCount.set(d, (dailyCount.get(d) ?? 0) + 1);
  }

  return dateStrings.map((date) => ({
    date,
    revenue: dailyRev.get(date) ?? 0,
    workOrders: dailyCount.get(date) ?? 0,
  }));
}

async function getTopServicesBatched(
  supabase: Awaited<ReturnType<typeof createClient>>,
  completedWoIds: string[],
): Promise<TopService[]> {
  if (completedWoIds.length === 0) return [];

  const { data: svcs } = await supabase
    .from("work_order_services")
    .select("service_name, final_price")
    .in("work_order_id", completedWoIds);

  const map = new Map<string, { revenue: number; count: number }>();
  for (const s of svcs ?? []) {
    const e = map.get(s.service_name) ?? { revenue: 0, count: 0 };
    e.revenue += Number(s.final_price);
    e.count++;
    map.set(s.service_name, e);
  }

  return Array.from(map.entries())
    .map(([name, d]) => ({ name, ...d }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);
}

/** Batches mechanic data: 2 queries total regardless of mechanic count */
async function getTechnicianPerformanceBatched(
  supabase: Awaited<ReturnType<typeof createClient>>,
  orgId: string,
  allCompletedIds: string[],
): Promise<TechnicianPerformance[]> {
  // 1 query: get mechanics
  const { data: mechanics } = await supabase
    .from("organization_users")
    .select("user_id, roles!inner(name)")
    .eq("organization_id", orgId)
    .eq("roles.name", "mechanic");

  if (!mechanics?.length) return [];
  const mechanicIds = mechanics.map((m: { user_id: string }) => m.user_id);

  // 1 query: get profiles for all mechanics
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name")
    .in("id", mechanicIds);

  const nameMap = new Map<string, string>();
  for (const p of profiles ?? []) {
    nameMap.set(p.id, p.full_name ?? "Unknown");
  }

  // 1 query: get all completed WOs grouped by mechanic
  const { data: woByMechanic } = await supabase
    .from("work_orders")
    .select("id, mechanic_id")
    .eq("organization_id", orgId)
    .eq("status", "Completed")
    .in("mechanic_id", mechanicIds)
    .is("deleted_at", null);

  // Group WO ids by mechanic
  const woPerMechanic = new Map<string, string[]>();
  for (const wo of woByMechanic ?? []) {
    const mid = wo.mechanic_id;
    if (!mid) continue;
    const list = woPerMechanic.get(mid) ?? [];
    list.push(wo.id);
    woPerMechanic.set(mid, list);
  }

  // 2 queries: get all services + parts for all completed WOs
  const [allS, allP] = await Promise.all([
    allCompletedIds.length > 0
      ? supabase
          .from("work_order_services")
          .select("final_price, work_order_id")
          .in("work_order_id", allCompletedIds)
      : { data: [] as any[] },
    allCompletedIds.length > 0
      ? supabase
          .from("work_order_parts")
          .select("final_price, work_order_id")
          .in("work_order_id", allCompletedIds)
      : { data: [] as any[] },
  ]);

  // Build revenue lookup per WO
  const woRevenue = new Map<string, number>();
  for (const s of allS.data ?? []) {
    woRevenue.set(
      s.work_order_id,
      (woRevenue.get(s.work_order_id) ?? 0) + Number(s.final_price),
    );
  }
  for (const p of allP.data ?? []) {
    woRevenue.set(
      p.work_order_id,
      (woRevenue.get(p.work_order_id) ?? 0) + Number(p.final_price),
    );
  }

  return mechanicIds
    .map((id: string) => {
      const woIds = woPerMechanic.get(id) ?? [];
      return {
        id,
        name: nameMap.get(id) ?? "Unknown",
        completedOrders: woIds.length,
        revenue: woIds.reduce((sum, wid) => sum + (woRevenue.get(wid) ?? 0), 0),
      };
    })
    .sort(
      (a: TechnicianPerformance, b: TechnicianPerformance) =>
        b.revenue - a.revenue,
    );
}

/** Batch-fetches work order details instead of N+1 */
async function getRecentWorkOrdersBatched(
  supabase: Awaited<ReturnType<typeof createClient>>,
  woIds: string[],
): Promise<WorkOrderDetail[]> {
  if (woIds.length === 0) return [];

  const [wos, services, parts, statusHistory] = await Promise.all([
    supabase
      .from("work_orders")
      .select(
        "id, organization_id, branch_id, customer_id, vehicle_id, mechanic_id, status, complaint, diagnosis, description, notes, mechanic_notes, diagnosis_label_id, bay_number, queue_order, odometer_at_service, discount_amount, discount_percentage, discount_total, subtotal, total, completed_at, started_at, created_at, updated_at, created_by, updated_by",
      )
      .in("id", woIds)
      .is("deleted_at", null),
    supabase
      .from("work_order_services")
      .select(
        "id, work_order_id, organization_id, service_catalog_id, service_name, description, quantity, unit_price, unit_cost, discount_amount, discount_percentage, final_price, notes, created_at, created_by",
      )
      .in("work_order_id", woIds)
      .order("created_at"),
    supabase
      .from("work_order_parts")
      .select(
        "id, work_order_id, organization_id, part_id, part_name, part_number, quantity, unit_price, unit_cost, discount_amount, discount_percentage, final_price, notes, created_at, created_by",
      )
      .in("work_order_id", woIds)
      .order("created_at"),
    supabase
      .from("work_order_status_history")
      .select(
        "id, work_order_id, organization_id, status, previous_status, notes, created_by, created_at",
      )
      .in("work_order_id", woIds)
      .order("created_at", { ascending: false }),
  ]);

  // Fetch customers + vehicles in batch too
  const customerIds = [
    ...new Set(
      (wos.data ?? []).flatMap((w: { customer_id: string | null }) =>
        w.customer_id ? [w.customer_id] : [],
      ),
    ),
  ] as string[];
  const vehicleIds = [
    ...new Set(
      (wos.data ?? []).flatMap((w: { vehicle_id: string | null }) =>
        w.vehicle_id ? [w.vehicle_id] : [],
      ),
    ),
  ] as string[];

  const [customers, vehicles] = await Promise.all([
    customerIds.length > 0
      ? supabase
          .from("customers")
          .select(
            "id, organization_id, first_name, last_name, full_name, phone, email, type, company_name, contact_person, address, notes, source, tags, total_visits, last_visit_at, created_at",
          )
          .in("id", customerIds)
      : { data: [] as any[] },
    vehicleIds.length > 0
      ? supabase
          .from("vehicles")
          .select(
            "id, customer_id, plate_number, vin, make, model, year, color, engine, fuel_type, transmission, odometer, notes",
          )
          .in("id", vehicleIds)
      : { data: [] as any[] },
  ]);

  const customerMap = new Map<string, any>();
  for (const c of customers.data ?? []) customerMap.set(c.id, c);
  const vehicleMap = new Map<string, any>();
  for (const v of vehicles.data ?? []) vehicleMap.set(v.id, v);

  // Group services and parts by work_order_id
  const servicesByWo = new Map<string, any[]>();
  for (const s of services.data ?? []) {
    const list = servicesByWo.get(s.work_order_id) ?? [];
    list.push(s);
    servicesByWo.set(s.work_order_id, list);
  }
  const partsByWo = new Map<string, any[]>();
  for (const p of parts.data ?? []) {
    const list = partsByWo.get(p.work_order_id) ?? [];
    list.push(p);
    partsByWo.set(p.work_order_id, list);
  }
  const historyByWo = new Map<string, any[]>();
  for (const h of statusHistory.data ?? []) {
    const list = historyByWo.get(h.work_order_id) ?? [];
    list.push(h);
    historyByWo.set(h.work_order_id, list);
  }

  const mechanicIds = [
    ...new Set(
      (wos.data ?? []).flatMap((w: { mechanic_id: string | null }) =>
        w.mechanic_id ? [w.mechanic_id] : [],
      ),
    ),
  ] as string[];

  const mechanicMapData: Map<string, any> = new Map();
  if (mechanicIds.length > 0) {
    const { data: mechs } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", mechanicIds);
    for (const m of mechs ?? []) mechanicMapData.set(m.id, m);
  }

  return (wos.data ?? []).map((wo: any) => ({
    ...wo,
    services: servicesByWo.get(wo.id) ?? [],
    parts: partsByWo.get(wo.id) ?? [],
    status_history: historyByWo.get(wo.id) ?? [],
    customer: wo.customer_id ? (customerMap.get(wo.customer_id) ?? null) : null,
    vehicle: wo.vehicle_id ? (vehicleMap.get(wo.vehicle_id) ?? null) : null,
    mechanic: wo.mechanic_id
      ? (mechanicMapData.get(wo.mechanic_id) ?? null)
      : null,
  }));
}

async function getServiceCategoryBreakdownBatched(
  supabase: Awaited<ReturnType<typeof createClient>>,
  orgId: string,
  allCompletedIds: string[],
): Promise<ServiceCategoryBreakdown[]> {
  if (allCompletedIds.length === 0) return [];

  // 1 query: get all service catalog items
  const { data: catalog } = await supabase
    .from("service_catalog")
    .select("id, category")
    .eq("organization_id", orgId)
    .is("deleted_at", null);

  // Group catalog IDs by category
  const catMap = new Map<string, string[]>();
  for (const item of catalog ?? []) {
    if (!item.category) continue;
    const list = catMap.get(item.category) ?? [];
    list.push(item.id);
    catMap.set(item.category, list);
  }

  // 1 query: get all WO services for completed orders
  const { data: woSvcs } = await supabase
    .from("work_order_services")
    .select("service_catalog_id, final_price")
    .in("work_order_id", allCompletedIds);

  // Group revenue by catalog_id
  const catRev = new Map<string, number>();
  const catCount = new Map<string, number>();
  for (const s of woSvcs ?? []) {
    if (!s.service_catalog_id) continue;
    catRev.set(
      s.service_catalog_id,
      (catRev.get(s.service_catalog_id) ?? 0) + Number(s.final_price),
    );
    catCount.set(
      s.service_catalog_id,
      (catCount.get(s.service_catalog_id) ?? 0) + 1,
    );
  }

  // Roll up by category
  const result: ServiceCategoryBreakdown[] = [];
  for (const [cat, ids] of catMap) {
    let revenue = 0;
    let count = 0;
    for (const id of ids) {
      revenue += catRev.get(id) ?? 0;
      count += catCount.get(id) ?? 0;
    }
    if (revenue > 0) result.push({ category: cat, revenue, count });
  }

  return result.sort((a, b) => b.revenue - a.revenue);
}

async function getCustomerAcquisitionTrendBatched(
  supabase: Awaited<ReturnType<typeof createClient>>,
  orgId: string,
): Promise<CustomerAcquisitionPoint[]> {
  // 1 query: get all customers with created_at
  const { data: customers } = await supabase
    .from("customers")
    .select("created_at")
    .eq("organization_id", orgId)
    .is("deleted_at", null);

  // Group by month in-memory
  const monthCount = new Map<string, number>();
  for (const c of customers ?? []) {
    const month = (c.created_at ?? "").slice(0, 7); // "YYYY-MM"
    if (month) monthCount.set(month, (monthCount.get(month) ?? 0) + 1);
  }

  const trend: CustomerAcquisitionPoint[] = [];
  const today = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const label = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    trend.push({ month: label, newCustomers: monthCount.get(label) ?? 0 });
  }

  return trend;
}

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
  orgId: string,
): Promise<TimelineEvent[]> {
  const supabase = await createClient();
  const today = new Date().toISOString().split("T")[0];

  const { data: wos, error: woError } = await supabase
    .from("work_orders")
    .select(
      "id, customer:customers(first_name, last_name), vehicle:vehicles(plate_number), bay_number",
    )
    .eq("organization_id", orgId)
    .gte("updated_at", `${today}T00:00:00`)
    .order("updated_at", { ascending: false })
    .limit(40);

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

// ══════════════════════════════════════════════════════════════
// ── ERP-GRADE REPORT FUNCTIONS ─────────────────────────────
// ══════════════════════════════════════════════════════════════

/**
 * Generate automated insights and alerts from report data.
 * Analyzes trends, margins, and comparisons to surface actionable intelligence.
 */
export async function generateReportInsights(
  orgId: string,
  dateFrom: string,
  dateTo: string,
): Promise<ReportInsight[]> {
  const supabase = await createClient();
  const insights: ReportInsight[] = [];
  let insightId = 0;

  // Fetch current period data
  const { data: currentWOs } = await supabase
    .from("work_orders")
    .select("id, mechanic_id, created_at")
    .eq("organization_id", orgId)
    .eq("status", "Completed")
    .gte("created_at", `${dateFrom}T00:00:00`)
    .lte("created_at", `${dateTo}T23:59:59`)
    .is("deleted_at", null);

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

  const { data: prevWOs } = await supabase
    .from("work_orders")
    .select("id")
    .eq("organization_id", orgId)
    .eq("status", "Completed")
    .gte("created_at", `${prevFrom}T00:00:00`)
    .lte("created_at", `${prevTo}T23:59:59`)
    .is("deleted_at", null);

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

function formatCurrencyHelper(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Revenue forecast — projects end-of-period revenue based on current pace.
 */
export async function getRevenueForecast(
  orgId: string,
  periodType: "daily" | "weekly" | "monthly",
  date: string,
): Promise<ReportForecast> {
  const supabase = await createClient();

  // Determine period boundaries
  let periodStart: string;
  let periodEnd: string;
  let totalDays: number;
  let daysElapsed: number;

  const now = new Date();
  const today = now.toISOString().split("T")[0];

  if (periodType === "daily") {
    periodStart = date;
    periodEnd = date;
    totalDays = 1;
    daysElapsed = date === today ? now.getHours() / 24 : 1;
  } else if (periodType === "weekly") {
    const ws = new Date(date);
    const we = new Date(ws);
    we.setDate(we.getDate() + 6);
    periodStart = ws.toISOString().split("T")[0];
    periodEnd = we.toISOString().split("T")[0];
    totalDays = 7;
    const wsTime = ws.getTime();
    daysElapsed = Math.min(
      totalDays,
      Math.max(1, Math.ceil((now.getTime() - wsTime) / 86400000)),
    );
  } else {
    // monthly
    const [y, m] = date.split("-").map(Number);
    periodStart = `${y}-${String(m).padStart(2, "0")}-01`;
    const lastDay = new Date(y, m, 0).getDate();
    periodEnd = `${y}-${String(m).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
    totalDays = lastDay;
    daysElapsed = Math.min(totalDays, Math.max(1, now.getDate()));
  }

  // Fetch revenue to date
  const { data: wos } = await supabase
    .from("work_orders")
    .select("id")
    .eq("organization_id", orgId)
    .eq("status", "Completed")
    .gte("created_at", `${periodStart}T00:00:00`)
    .lte("created_at", `${periodEnd}T23:59:59`)
    .is("deleted_at", null);

  const woIds = (wos ?? []).map((w) => w.id);
  let currentRevenue = 0;

  if (woIds.length > 0) {
    const [svcs, parts] = await Promise.all([
      supabase
        .from("work_order_services")
        .select("final_price")
        .in("work_order_id", woIds),
      supabase
        .from("work_order_parts")
        .select("final_price")
        .in("work_order_id", woIds),
    ]);
    currentRevenue =
      (svcs.data ?? []).reduce((s, r) => s + Number(r.final_price), 0) +
      (parts.data ?? []).reduce((s, r) => s + Number(r.final_price), 0);
  }

  const dailyRunRate = daysElapsed > 0 ? currentRevenue / daysElapsed : 0;
  const projectedRevenue =
    totalDays > 0 ? dailyRunRate * totalDays : currentRevenue;

  // Fetch previous period revenue for comparison
  const prevDuration =
    new Date(periodEnd).getTime() - new Date(periodStart).getTime();
  const prevEndMs = new Date(periodStart).getTime() - 86400000;
  const prevStartMs = prevEndMs - prevDuration;
  const prevStart = new Date(prevStartMs).toISOString().split("T")[0];
  const prevEnd = new Date(prevEndMs).toISOString().split("T")[0];

  const { data: prevWOs } = await supabase
    .from("work_orders")
    .select("id")
    .eq("organization_id", orgId)
    .eq("status", "Completed")
    .gte("created_at", `${prevStart}T00:00:00`)
    .lte("created_at", `${prevEnd}T23:59:59`)
    .is("deleted_at", null);

  const prevWoIds = (prevWOs ?? []).map((w) => w.id);
  let prevRevenue = 0;
  if (prevWoIds.length > 0) {
    const [svcs, parts] = await Promise.all([
      supabase
        .from("work_order_services")
        .select("final_price")
        .in("work_order_id", prevWoIds),
      supabase
        .from("work_order_parts")
        .select("final_price")
        .in("work_order_id", prevWoIds),
    ]);
    prevRevenue =
      (svcs.data ?? []).reduce((s, r) => s + Number(r.final_price), 0) +
      (parts.data ?? []).reduce((s, r) => s + Number(r.final_price), 0);
  }

  const projectedChangePct =
    prevRevenue > 0
      ? Math.round(((projectedRevenue - prevRevenue) / prevRevenue) * 1000) / 10
      : null;

  const onTrack = prevRevenue > 0 ? projectedRevenue >= prevRevenue : true;

  return {
    current_revenue: currentRevenue,
    days_elapsed: Math.round(daysElapsed),
    total_days: totalDays,
    projected_revenue: Math.round(projectedRevenue),
    previous_period_revenue: prevRevenue > 0 ? prevRevenue : null,
    projected_change_pct: projectedChangePct,
    daily_run_rate: Math.round(dailyRunRate),
    on_track: onTrack,
    target_revenue: null,
    target_progress_pct: null,
  };
}

/**
 * Revenue target management — get or set targets.
 * Stored in organization settings JSONB to avoid new tables.
 */
export async function getRevenueTargets(
  orgId: string,
  periodType: "daily" | "weekly" | "monthly",
  _date: string,
): Promise<ReportTarget[]> {
  const supabase = await createClient();

  const { data: org } = await supabase
    .from("organizations")
    .select("settings")
    .eq("id", orgId)
    .single();

  const settings = (org?.settings as Record<string, unknown>) ?? {};
  const targets = (
    (settings.report_targets as Array<Record<string, unknown>>) ?? []
  ).filter((t) => t.period_type === periodType);

  if (targets.length === 0) return [];

  // For each target, calculate progress
  const results: ReportTarget[] = [];
  for (const t of targets) {
    const targetRevenue = Number(t.target_revenue ?? 0);
    const periodStart = String(t.period_start ?? "");
    const periodEnd = String(t.period_end ?? "");

    if (!periodStart || !periodEnd) continue;

    // Fetch actual revenue for this period
    const { data: wos } = await supabase
      .from("work_orders")
      .select("id")
      .eq("organization_id", orgId)
      .eq("status", "Completed")
      .gte("created_at", `${periodStart}T00:00:00`)
      .lte("created_at", `${periodEnd}T23:59:59`)
      .is("deleted_at", null);

    const woIds = (wos ?? []).map((w) => w.id);
    let actualRevenue = 0;
    if (woIds.length > 0) {
      const [svcs, parts] = await Promise.all([
        supabase
          .from("work_order_services")
          .select("final_price")
          .in("work_order_id", woIds),
        supabase
          .from("work_order_parts")
          .select("final_price")
          .in("work_order_id", woIds),
      ]);
      actualRevenue =
        (svcs.data ?? []).reduce((s, r) => s + Number(r.final_price), 0) +
        (parts.data ?? []).reduce((s, r) => s + Number(r.final_price), 0);
    }

    results.push({
      id: String(t.id ?? ""),
      organization_id: orgId,
      period_type: periodType,
      target_revenue: targetRevenue,
      actual_revenue: actualRevenue,
      progress_pct:
        targetRevenue > 0
          ? Math.round((actualRevenue / targetRevenue) * 1000) / 10
          : 0,
      achieved: actualRevenue >= targetRevenue,
      period_start: periodStart,
      period_end: periodEnd,
    });
  }

  return results;
}

/** Set or update a revenue target */
export async function setRevenueTarget(
  orgId: string,
  periodType: "daily" | "weekly" | "monthly",
  periodStart: string,
  periodEnd: string,
  targetRevenue: number,
): Promise<ReportTarget> {
  const supabase = await createClient();

  const { data: org } = await supabase
    .from("organizations")
    .select("settings")
    .eq("id", orgId)
    .single();

  const settings = (org?.settings as Record<string, unknown>) ?? {};
  const existingTargets = (
    (settings.report_targets as Array<Record<string, unknown>>) ?? []
  ).filter(
    (t) => !(t.period_type === periodType && t.period_start === periodStart),
  );

  const newTarget = {
    id: `target-${Date.now()}`,
    period_type: periodType,
    period_start: periodStart,
    period_end: periodEnd,
    target_revenue: targetRevenue,
  };

  existingTargets.push(newTarget);

  await supabase
    .from("organizations")
    .update({ settings: { ...settings, report_targets: existingTargets } })
    .eq("id", orgId);

  return {
    id: newTarget.id,
    organization_id: orgId,
    period_type: periodType,
    target_revenue: targetRevenue,
    actual_revenue: 0,
    progress_pct: 0,
    achieved: false,
    period_start: periodStart,
    period_end: periodEnd,
  };
}

/**
 * Customer retention analytics.
 * Computes returning vs new customers, retention rate, and top customers.
 */
export async function getCustomerRetention(
  orgId: string,
  dateFrom: string,
  dateTo: string,
): Promise<CustomerRetentionData> {
  const supabase = await createClient();

  // Get all WOs in period with customer info
  const { data: wos } = await supabase
    .from("work_orders")
    .select("id, customer_id, created_at")
    .eq("organization_id", orgId)
    .eq("status", "Completed")
    .gte("created_at", `${dateFrom}T00:00:00`)
    .lte("created_at", `${dateTo}T23:59:59`)
    .is("deleted_at", null);

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
      ? supabase
          .from("work_orders")
          .select("customer_id, total_amount")
          .eq("organization_id", orgId)
          .eq("status", "Completed")
          .in("customer_id", customerIds)
          .is("deleted_at", null)
      : { data: [] as any[] },
    customerIds.length > 0
      ? supabase
          .from("work_orders")
          .select("customer_id")
          .eq("organization_id", orgId)
          .eq("status", "Completed")
          .lt("created_at", `${dateFrom}T00:00:00`)
          .in("customer_id", customerIds)
          .is("deleted_at", null)
      : { data: [] as any[] },
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
      : { data: [] as any[] };

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
 * Simplified P&L (Profit & Loss) statement.
 */
export async function getPnLSummary(
  orgId: string,
  dateFrom: string,
  dateTo: string,
): Promise<PnLSummary> {
  const supabase = await createClient();

  // Fetch completed WOs in period
  const { data: wos } = await supabase
    .from("work_orders")
    .select("id")
    .eq("organization_id", orgId)
    .eq("status", "Completed")
    .gte("created_at", `${dateFrom}T00:00:00`)
    .lte("created_at", `${dateTo}T23:59:59`)
    .is("deleted_at", null);

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
    supabase
      .from("expenses")
      .select("amount, category")
      .eq("organization_id", orgId)
      .gte("expense_date", dateFrom)
      .lte("expense_date", dateTo)
      .is("deleted_at", null),
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

/**
 * Revenue breakdown by service type.
 */
export async function getServiceBreakdown(
  orgId: string,
  dateFrom: string,
  dateTo: string,
): Promise<ServiceBreakdown[]> {
  const supabase = await createClient();

  const { data: wos } = await supabase
    .from("work_orders")
    .select("id")
    .eq("organization_id", orgId)
    .eq("status", "Completed")
    .gte("created_at", `${dateFrom}T00:00:00`)
    .lte("created_at", `${dateTo}T23:59:59`)
    .is("deleted_at", null);

  const woIds = (wos ?? []).map((w) => w.id);
  if (woIds.length === 0) return [];

  const { data: services } = await supabase
    .from("work_order_services")
    .select("service_name, final_price")
    .in("work_order_id", woIds);

  const svcMap = new Map<string, { count: number; revenue: number }>();
  for (const s of services ?? []) {
    const name = (s.service_name as string) ?? "Other";
    const existing = svcMap.get(name) ?? { count: 0, revenue: 0 };
    existing.count++;
    existing.revenue += Number(s.final_price);
    svcMap.set(name, existing);
  }

  const totalRevenue = [...svcMap.values()].reduce((s, v) => s + v.revenue, 0);

  return [...svcMap.entries()]
    .map(([name, data]) => ({
      service_name: name,
      service_count: data.count,
      total_revenue: data.revenue,
      avg_price: data.count > 0 ? Math.round(data.revenue / data.count) : 0,
      percentage_of_revenue:
        totalRevenue > 0
          ? Math.round((data.revenue / totalRevenue) * 1000) / 10
          : 0,
    }))
    .sort((a, b) => b.total_revenue - a.total_revenue);
}
