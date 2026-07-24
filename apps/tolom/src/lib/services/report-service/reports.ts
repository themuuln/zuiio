// ── Daily, weekly, monthly, and custom report functions ──────

import type { SupabaseClient } from "@supabase/supabase-js";

import { withDbCapture } from "@/lib/supabase/query";
import { withBranchFilter } from "@/lib/supabase/with-branch";

import type {
  DailyReport,
  MonthlyReport,
  ServiceBreakdown,
  WeeklyReport,
} from "@/lib/types";
import { getMechanicKpis } from "./mechanics";
import { calculateProfitability, getComparisonData } from "./profitability";
import { getRecentWorkOrdersBatched } from "./queries";

export async function getDailyReport(
  db: SupabaseClient,
  orgId: string,
  mechanicId: string | null,
  date: string,
  branchId: string | null = null,
): Promise<DailyReport> {
  const supabase = db;

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
  if (branchId) {
    query = query.eq("branch_id", branchId);
  }

  const { data: workOrders } = await query;

  const woIds = (workOrders ?? []).map((w) => w.id);

  const [servicesData, partsData] = await Promise.all([
    woIds.length > 0
      ? supabase
          .from("work_order_services")
          .select("final_price, discount_amount, service_name, work_order_id")
          .in("work_order_id", woIds)
      : {
          data: [] as {
            final_price: number;
            discount_amount: number | null;
            service_name: string;
            work_order_id: string;
          }[],
        },
    woIds.length > 0
      ? supabase
          .from("work_order_parts")
          .select("final_price, discount_amount, part_name, work_order_id")
          .in("work_order_id", woIds)
      : {
          data: [] as {
            final_price: number;
            discount_amount: number | null;
            service_name: string;
            work_order_id: string;
          }[],
        },
  ]);

  const woDataMap = new Map<
    string,
    { services: unknown[]; parts: unknown[] }
  >();
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
      totalRevenue += Number((s as Record<string, unknown>).final_price);
      totalDiscounts += Number(
        (s as Record<string, unknown>).discount_amount ?? 0,
      );
    }
    for (const p of data.parts) {
      totalRevenue += Number((p as Record<string, unknown>).final_price);
      totalDiscounts += Number(
        (p as Record<string, unknown>).discount_amount ?? 0,
      );
    }
  }

  const details =
    woIds.length > 0 ? await getRecentWorkOrdersBatched(supabase, woIds) : [];

  // ── ERP-grade enrichments ──────────────────────────────
  const [profitability, comparison, mechanicKpis] = await Promise.all([
    calculateProfitability(supabase, woIds),
    getComparisonData(supabase, orgId, date, date, mechanicId, branchId),
    !mechanicId ? getMechanicKpis(supabase, orgId, woIds) : Promise.resolve([]),
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
}

export async function getCustomReport(
  db: SupabaseClient,
  orgId: string,
  mechanicId: string | null,
  dateFrom: string,
  dateTo: string,
  branchId: string | null = null,
): Promise<DailyReport> {
  const supabase = db;

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
    .gte("created_at", `${dateFrom}T00:00:00`)
    .lte("created_at", `${dateTo}T23:59:59`)
    .eq("status", "Completed")
    .is("deleted_at", null);

  if (mechanicId) {
    query = query.eq("mechanic_id", mechanicId);
  }
  if (branchId) {
    query = query.eq("branch_id", branchId);
  }

  const { data: workOrders } = await query;

  const woIds = (workOrders ?? []).map((w) => w.id);

  const [servicesData, partsData] = await Promise.all([
    woIds.length > 0
      ? supabase
          .from("work_order_services")
          .select("final_price, discount_amount, service_name, work_order_id")
          .in("work_order_id", woIds)
      : {
          data: [] as {
            final_price: number;
            discount_amount: number | null;
            service_name: string;
            work_order_id: string;
          }[],
        },
    woIds.length > 0
      ? supabase
          .from("work_order_parts")
          .select("final_price, discount_amount, part_name, work_order_id")
          .in("work_order_id", woIds)
      : {
          data: [] as {
            final_price: number;
            discount_amount: number | null;
            service_name: string;
            work_order_id: string;
          }[],
        },
  ]);

  const woDataMap = new Map<
    string,
    { services: unknown[]; parts: unknown[] }
  >();
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
      totalRevenue += Number((s as Record<string, unknown>).final_price);
      totalDiscounts += Number(
        (s as Record<string, unknown>).discount_amount ?? 0,
      );
    }
    for (const p of data.parts) {
      totalRevenue += Number((p as Record<string, unknown>).final_price);
      totalDiscounts += Number(
        (p as Record<string, unknown>).discount_amount ?? 0,
      );
    }
  }

  const details =
    woIds.length > 0 ? await getRecentWorkOrdersBatched(supabase, woIds) : [];

  const [profitability, comparison, mechanicKpis] = await Promise.all([
    calculateProfitability(supabase, woIds),
    getComparisonData(supabase, orgId, dateFrom, dateTo, mechanicId, branchId),
    getMechanicKpis(supabase, orgId, woIds),
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
    date: `${dateFrom}_${dateTo}`,
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
}

export async function getWeeklyReport(
  db: SupabaseClient,
  orgId: string,
  mechanicId: string | null,
  weekStart: string,
  branchId: string | null = null,
): Promise<WeeklyReport> {
  const supabase = db;

  const weekStartDate = new Date(weekStart);
  const weekEndDate = new Date(weekStartDate);
  weekEndDate.setDate(weekEndDate.getDate() + 6);

  const weekEnd = weekEndDate.toISOString().split("T")[0];

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
      return getDailyReport(db, orgId, mechanicId, dateStr, branchId);
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

  const allWoIds = dailyBreakdown.flatMap((d) =>
    d.work_orders.map((w) => w.id),
  );
  const [profitability, comparison, mechanicKpis] = await Promise.all([
    calculateProfitability(supabase, allWoIds),
    getComparisonData(
      supabase,
      orgId,
      weekStart,
      weekEnd,
      mechanicId,
      branchId,
    ),
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
  db: SupabaseClient,
  orgId: string,
  mechanicId: string | null,
  year: number,
  month: number,
  branchId: string | null = null,
): Promise<MonthlyReport> {
  const supabase = db;

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
    .select("id, created_at")
    .eq("organization_id", orgId)
    .gte("created_at", `${startDate}T00:00:00`)
    .lte("created_at", `${endDate}T23:59:59`)
    .eq("status", "Completed")
    .is("deleted_at", null);

  if (mechanicId) {
    query = query.eq("mechanic_id", mechanicId);
  }
  if (branchId) {
    query = query.eq("branch_id", branchId);
  }

  const { data: workOrders } = await query;
  const woIds: string[] = [];
  const woDateMap = new Map<string, string[]>(); // date → woIds
  for (const w of workOrders ?? []) {
    woIds.push(w.id);
    const dateStr = (w.created_at as string).slice(0, 10);
    const arr = woDateMap.get(dateStr) ?? [];
    arr.push(w.id);
    woDateMap.set(dateStr, arr);
  }

  const [servicesData, partsData] = await Promise.all([
    woIds.length > 0
      ? supabase
          .from("work_order_services")
          .select("final_price, discount_amount, work_order_id")
          .in("work_order_id", woIds)
      : {
          data: [] as {
            final_price: number;
            discount_amount: number | null;
            service_name: string;
            work_order_id: string;
          }[],
        },
    woIds.length > 0
      ? supabase
          .from("work_order_parts")
          .select("final_price, discount_amount, work_order_id")
          .in("work_order_id", woIds)
      : {
          data: [] as {
            final_price: number;
            discount_amount: number | null;
            service_name: string;
            work_order_id: string;
          }[],
        },
  ]);

  const woDataMap = new Map<
    string,
    { services: unknown[]; parts: unknown[] }
  >();
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
      totalRevenue += Number((s as Record<string, unknown>).final_price);
      totalDiscounts += Number(
        (s as Record<string, unknown>).discount_amount ?? 0,
      );
    }
    for (const p of data.parts) {
      totalRevenue += Number((p as Record<string, unknown>).final_price);
      totalDiscounts += Number(
        (p as Record<string, unknown>).discount_amount ?? 0,
      );
    }
  }

  // Build weekly breakdown locally from already-fetched data (~175 fewer DB queries)
  const weeklyBreakdown: WeeklyReport[] = [];
  const monthStart = new Date(year, month - 1, 1);
  const monthEndDate = new Date(year, month, 0);
  // Align to Monday
  const alignedStart = new Date(monthStart);
  const dow = alignedStart.getDay();
  alignedStart.setDate(alignedStart.getDate() - (dow === 0 ? 6 : dow - 1));

  for (
    let ws = new Date(alignedStart);
    ws <= monthEndDate;
    ws.setDate(ws.getDate() + 7)
  ) {
    const weekEndDate = new Date(ws);
    weekEndDate.setDate(weekEndDate.getDate() + 6);
    // Skip weeks outside the target month
    if (weekEndDate.getMonth() !== month - 1 && ws.getMonth() !== month - 1) {
      continue;
    }
    const wsStr = ws.toISOString().slice(0, 10);
    const weStr = weekEndDate.toISOString().slice(0, 10);
    const dailyBreakdown: DailyReport[] = [];
    let wTotalRevenue = 0;
    let wTotalDiscounts = 0;
    let wServicesCount = 0;
    let wPartsCount = 0;
    let wWoCount = 0;
    for (
      let d = new Date(ws);
      d <= weekEndDate && d <= monthEndDate;
      d.setDate(d.getDate() + 1)
    ) {
      const dateStr = d.toISOString().slice(0, 10);
      const dayWoIds = woDateMap.get(dateStr) ?? [];
      let dayRevenue = 0;
      let dayDiscounts = 0;
      let dayServices = 0;
      let dayParts = 0;
      for (const woId of dayWoIds) {
        const data = woDataMap.get(woId);
        if (!data) continue;
        dayServices += data.services.length;
        dayParts += data.parts.length;
        for (const s of data.services) {
          dayRevenue += Number((s as Record<string, unknown>).final_price);
          dayDiscounts += Number(
            (s as Record<string, unknown>).discount_amount ?? 0,
          );
        }
        for (const p of data.parts) {
          dayRevenue += Number((p as Record<string, unknown>).final_price);
          dayDiscounts += Number(
            (p as Record<string, unknown>).discount_amount ?? 0,
          );
        }
      }
      wTotalRevenue += dayRevenue;
      wTotalDiscounts += dayDiscounts;
      wServicesCount += dayServices;
      wPartsCount += dayParts;
      wWoCount += dayWoIds.length;
      dailyBreakdown.push({
        date: dateStr,
        mechanic_id: mechanicId ?? "",
        mechanic_name: mechanicName,
        work_orders_completed: dayWoIds.length,
        services_count: dayServices,
        parts_count: dayParts,
        total_revenue: dayRevenue,
        total_discounts: dayDiscounts,
        work_orders: [],
        comparison: null,
        profitability: null,
        mechanic_kpis: [],
      });
    }
    weeklyBreakdown.push({
      week_start: wsStr,
      week_end: weStr,
      mechanic_id: mechanicId ?? "",
      mechanic_name: mechanicName,
      work_orders_completed: wWoCount,
      services_count: wServicesCount,
      parts_count: wPartsCount,
      total_revenue: wTotalRevenue,
      total_discounts: wTotalDiscounts,
      daily_breakdown: dailyBreakdown,
      comparison: null,
      profitability: null,
      mechanic_kpis: [],
    });
  }

  const [profitability, comparison, mechanicKpis] = await Promise.all([
    calculateProfitability(supabase, woIds),
    getComparisonData(
      supabase,
      orgId,
      startDate,
      endDate,
      mechanicId,
      branchId,
    ),
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

/**
 * Revenue breakdown by service type.
 */
export async function getServiceBreakdown(
  db: SupabaseClient,
  orgId: string,
  dateFrom: string,
  dateTo: string,
  branchId: string | null = null,
): Promise<ServiceBreakdown[]> {
  const supabase = db;

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

/**
 * Fast finance summary using the get_finance_summary RPC.
 */
export async function getFinanceSummaryFast(
  db: SupabaseClient,
  orgId: string,
  period: "day" | "week" | "month" | "year" = "month",
): Promise<Record<string, unknown>> {
  const { data, error } = await withDbCapture(
    "getFinanceSummaryFast",
    db.rpc("get_finance_summary", {
      p_org_id: orgId,
      p_period: period,
    }),
  );
  if (error) throw new Error(error.message);
  return (data as Record<string, unknown>) ?? {};
}

/**
 * Fast mechanic leaderboard using the get_mechanic_leaderboard RPC.
 */
export async function getMechanicLeaderboardFast(
  db: SupabaseClient,
  orgId: string,
  period: "week" | "month" | "year" = "month",
): Promise<Array<Record<string, unknown>>> {
  const { data, error } = await withDbCapture(
    "getMechanicLeaderboardFast",
    db.rpc("get_mechanic_leaderboard", {
      p_org_id: orgId,
      p_period: period,
    }),
  );
  if (error) throw new Error(error.message);
  return (data as Array<Record<string, unknown>>) ?? [];
}
