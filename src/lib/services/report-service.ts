import { cacheTags, cacheDurations } from "@/lib/cache/keys";
import { withCache } from "@/lib/cache/with-cache";
import type { WorkOrderDetail } from "@/lib/database.types";
import { createClient } from "@/lib/supabase/server";

import type {
  CustomerAcquisitionPoint,
  DailyReport,
  DashboardData,
  DashboardSummary,
  EndOfDaySummary,
  MonthlyReport,
  RevenueTrendPoint,
  ServiceCategoryBreakdown,
  TechnicianPerformance,
  TopService,
  WeeklyReport,
  WorkOrderProfit,
  WorkOrderStatusDistribution,
} from "@/lib/types";

// ── Helpers ──────────────────────────────────────────────────

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

      return (profiles ?? []).map((p) => ({ id: p.id, full_name: p.full_name }));
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
              .select("final_price, discount_amount, service_name, work_order_id")
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

      const details =
        woIds.length > 0
          ? await getRecentWorkOrdersBatched(supabase, woIds)
          : [];

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
    weekly_breakdown: [],
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
    return { date, mechanics: [], total_work_orders: 0, total_revenue: 0, total_commission: 0 };
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
      workOrders
        .flatMap((w) => w.mechanic_id ? [w.mechanic_id] : []) as string[],
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

    for (const s of data.services)
      entry.total_revenue += Number(s.final_price);
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
  const totalCommission = mechanics.reduce((sum, m) => sum + (m.total_commission ?? 0), 0);

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
    ["getMechanicPerformanceTrend", orgId, mechanicId, period, startDate, endDate],
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
        const key = period === "monthly" ? dateStr.slice(0, 7) : getWeekKey(dateStr);
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
      const daysDiff = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / 86400000));

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
  const recentWoIds = (recentIds.data ?? []).map((w: { id: string }) => w.id);

  const [servicesData, partsData] = await Promise.all([
    completedWoIds.length > 0
      ? supabase
          .from("work_order_services")
      .select("final_price, discount_amount, service_name, work_order_id, unit_cost, quantity")
      .in("work_order_id", completedWoIds)
  : { data: [] as any[] },

    completedWoIds.length > 0
      ? supabase
          .from("work_order_parts")
          .select("final_price, discount_amount, part_name, work_order_id, unit_cost, quantity")
          .in("work_order_id", completedWoIds)
  : { data: [] as any[] },
  ]);

  const allServices = servicesData.data ?? [];
  const allParts = partsData.data ?? [];

  const serviceRevenue = allServices.reduce(
    (sum: number, s: { final_price: number }) => sum + Number(s.final_price),
    0,
  );
  const serviceCost = allServices.reduce(
    (sum: number, s: { unit_cost?: number; quantity: number }) => sum + Number(s.unit_cost ?? 0) * s.quantity,
    0,
  );
  const partsRevenue = allParts.reduce(
    (sum: number, p: { final_price: number }) => sum + Number(p.final_price),
    0,
  );
  const partsCost = allParts.reduce(
    (sum: number, p: { unit_cost?: number; quantity: number }) => sum + Number(p.unit_cost ?? 0) * p.quantity,
    0,
  );
  const totalRevenue = serviceRevenue + partsRevenue;
  const totalCost = serviceCost + partsCost;
  const grossProfit = totalRevenue - totalCost;
  const marginPercent = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

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
  ).map(([status, count]) => ({ status, count }));

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
        activeWorkOrders: 0, // not comparable across periods meaningfully
        totalCustomers: 0,
        totalVehicles: 0,
      }
    : null;

  // ── Insights ────────────────────────────────────────────
  const insights = generateInsights(summary, summaryComparison, workOrderStatusDistribution);

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
    (sum, s) => sum + Number(s.final_price), 0);
  const serviceCost = (servicesResult.data ?? []).reduce(
    (sum, s) => sum + Number(s.unit_cost ?? 0) * s.quantity, 0);
  const partsRevenue = (partsResult.data ?? []).reduce(
    (sum, p) => sum + Number(p.final_price), 0);
  const partsCost = (partsResult.data ?? []).reduce(
    (sum, p) => sum + Number(p.unit_cost ?? 0) * p.quantity, 0);

  const totalRevenue = serviceRevenue + partsRevenue;
  const totalCost = serviceCost + partsCost;
  const grossProfit = totalRevenue - totalCost;
  const marginPercent = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

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
  orgId: string,
): Promise<{ todayProfit: WorkOrderProfit; weekProfit: WorkOrderProfit; monthProfit: WorkOrderProfit }> {
  const supabase = await createClient();
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  async function getProfitForRange(startDate: string): Promise<WorkOrderProfit> {
    const { data: wos } = await supabase
      .from("work_orders")
      .select("id")
      .eq("organization_id", orgId)
      .eq("status", "Completed")
      .gte("updated_at", startDate)
      .is("deleted_at", null);

    const woIds = (wos ?? []).map(w => w.id);
    if (woIds.length === 0) return { totalRevenue: 0, totalCost: 0, grossProfit: 0, marginPercent: 0, serviceRevenue: 0, serviceCost: 0, partsRevenue: 0, partsCost: 0 };

    const [svcs, parts] = await Promise.all([
      supabase.from("work_order_services").select("final_price, unit_cost, quantity").in("work_order_id", woIds),
      supabase.from("work_order_parts").select("final_price, unit_cost, quantity").in("work_order_id", woIds),
    ]);

    const serviceRevenue = (svcs.data ?? []).reduce((s, r) => s + Number(r.final_price), 0);
    const serviceCost = (svcs.data ?? []).reduce((s, r) => s + Number(r.unit_cost ?? 0) * r.quantity, 0);
    const partsRevenue = (parts.data ?? []).reduce((s, r) => s + Number(r.final_price), 0);
    const partsCost = (parts.data ?? []).reduce((s, r) => s + Number(r.unit_cost ?? 0) * r.quantity, 0);
    const totalRevenue = serviceRevenue + partsRevenue;
    const totalCost = serviceCost + partsCost;
    const grossProfit = totalRevenue - totalCost;
    return { totalRevenue, totalCost, grossProfit, marginPercent: totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0, serviceRevenue, serviceCost, partsRevenue, partsCost };
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
): Promise<Omit<DashboardSummary, "activeWorkOrders" | "totalCustomers" | "totalVehicles" | "grossProfit" | "marginPercent"> | null> {
  if (period === "all") return null; // no previous period for "all time"

  const now = new Date();
  const currentStart = new Date(now);
  const currentEnd = new Date(now);
  const durationMs = period === "today"
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
    (sum: number, s: { final_price: number }) => sum + Number(s.final_price), 0);
  const prevPartsRev = (prevParts.data ?? []).reduce(
    (sum: number, p: { final_price: number }) => sum + Number(p.final_price), 0);
  const prevTotalRev = prevServiceRev + prevPartsRev;

  return {
    totalRevenue: prevTotalRev,
    completedToday: prevIds.length,
    newCustomersToday: 0,
    avgRepairOrderValue: prevIds.length > 0
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
    const revPct = prevSummary.totalRevenue > 0
      ? Math.round((revChange / prevSummary.totalRevenue) * 100)
      : 100;
    if (revChange > 0) {
      insights.push(`Revenue is ₮${formatNum(revChange)} (▲${revPct}%) above the previous ${prevSummary.totalRevenue > 0 ? "period" : "period — great start!"}`);
    } else {
      insights.push(`Revenue is ₮${formatNum(Math.abs(revChange))} (▼${Math.abs(revPct)}%) below the previous period`);
    }
  }

  // Active WOs
  if (summary.activeWorkOrders > 5) {
    insights.push(`You have ${summary.activeWorkOrders} active work orders — ${summary.activeWorkOrders > 10 ? "consider assigning more mechanics" : "keep up the momentum"}`);
  }

  // Avg repair order comparison
  if (prevSummary.avgRepairOrderValue > 0 && summary.avgRepairOrderValue > 0) {
    const aroChange = summary.avgRepairOrderValue - prevSummary.avgRepairOrderValue;
    const aroPct = Math.round((aroChange / prevSummary.avgRepairOrderValue) * 100);
    if (Math.abs(aroPct) >= 5) {
      if (aroChange > 0) {
        insights.push(`Average repair order value is ▲${aroPct}% higher — customers are spending more per visit`);
      } else {
        insights.push(`Average repair order value is ▼${Math.abs(aroPct)}% lower — consider reviewing service pricing`);
      }
    }
  }

  // Service vs parts mix
  if (summary.totalRevenue > 0) {
    const servicePct = Math.round((summary.serviceRevenue / summary.totalRevenue) * 100);
    const partsPct = Math.round((summary.partsRevenue / summary.totalRevenue) * 100);
    if (servicePct > 70) {
      insights.push(`Services make up ${servicePct}% of revenue — high margin work is driving your business`);
    } else if (partsPct > 60) {
      insights.push(`Parts make up ${partsPct}% of revenue — watch parts margins to maintain profitability`);
    }
  }

  // Status distribution insights
  const diagnosingCount = statusDist.find(s => s.status === "Diagnosing")?.count ?? 0;
  const inProgressCount = statusDist.find(s => s.status === "In Progress")?.count ?? 0;
  const readyCount = statusDist.find(s => s.status === "Ready for Pickup")?.count ?? 0;

  if (readyCount > 3) {
    insights.push(`${readyCount} vehicles ready for pickup — send reminders to free up space`);
  }
  if (diagnosingCount > inProgressCount && diagnosingCount > 3) {
    insights.push(`More vehicles in diagnosis than in progress — consider streamlining the diagnosis process`);
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
      .select("*")
      .in("id", woIds)
      .is("deleted_at", null),
    supabase
      .from("work_order_services")
      .select("*")
      .in("work_order_id", woIds)
      .order("created_at"),
    supabase
      .from("work_order_parts")
      .select("*")
      .in("work_order_id", woIds)
      .order("created_at"),
    supabase
      .from("work_order_status_history")
      .select("*")
      .in("work_order_id", woIds)
      .order("created_at", { ascending: false }),
  ]);

  // Fetch customers + vehicles in batch too
  const customerIds = [
    ...new Set(
      (wos.data ?? [])
        .flatMap((w: { customer_id: string | null }) => w.customer_id ? [w.customer_id] : []),
    ),
  ] as string[];
  const vehicleIds = [
    ...new Set(
      (wos.data ?? [])
        .flatMap((w: { vehicle_id: string | null }) => w.vehicle_id ? [w.vehicle_id] : []),
    ),
  ] as string[];

  const [customers, vehicles] = await Promise.all([
    customerIds.length > 0
      ? supabase.from("customers").select("*").in("id", customerIds)
      : { data: [] as any[] },
    vehicleIds.length > 0
      ? supabase.from("vehicles").select("*").in("id", vehicleIds)
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
      (wos.data ?? [])
        .flatMap((w: { mechanic_id: string | null }) => w.mechanic_id ? [w.mechanic_id] : []),
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

export async function getDailyTimeline(orgId: string): Promise<TimelineEvent[]> {
  const supabase = await createClient();
  const today = new Date().toISOString().split("T")[0];

  const { data: wos, error: woError } = await supabase
    .from("work_orders")
    .select("id, customer:customers(first_name, last_name), vehicle:vehicles(plate_number), bay_number")
    .eq("organization_id", orgId)
    .gte("updated_at", `${today}T00:00:00`)
    .order("updated_at", { ascending: false })
    .limit(40);

  if (woError || !wos?.length) return [];

  const woIds = wos.map((w) => w.id);

  const { data: history, error: histError } = await supabase
    .from("work_order_status_history")
    .select("id, work_order_id, previous_status, status, notes, changed_by, created_at")
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
      history.flatMap((h) => h.changed_by ? [h.changed_by] : []) as string[],
    );

  const profileMap = new Map<string, string>();
  for (const p of profiles ?? []) {
    if (p.full_name) profileMap.set(p.id as string, p.full_name as string);
  }

  const woMap = new Map<
    string,
    { customerName: string | null; vehiclePlate: string | null; bayNumber: number | null }
  >();
  for (const wo of wos) {
    const customer = Array.isArray(wo.customer) ? wo.customer[0] : (wo.customer as Record<string, string> | null);
    const vehicle = Array.isArray(wo.vehicle) ? wo.vehicle[0] : (wo.vehicle as Record<string, string> | null);
    woMap.set(wo.id as string, {
      customerName: customer ? `${(customer as Record<string, string>).first_name ?? ""} ${(customer as Record<string, string>).last_name ?? ""}`.trim() || null : null,
      vehiclePlate: vehicle ? ((vehicle as Record<string, string>).plate_number ?? null) : null,
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
