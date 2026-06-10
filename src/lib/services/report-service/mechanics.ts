// ── Mechanic KPIs, list, and performance trend ──────────────

import { cacheDurations, cacheTags } from "@/lib/cache/keys";
import { withCache } from "@/lib/cache/with-cache";
import { createClient } from "@/lib/supabase/server";
import { withBranchFilter } from "@/lib/supabase/with-branch";

import type { ReportMechanicKpi, TechnicianPerformance } from "@/lib/types";
import { getWeekKey } from "./utils";

/** Extract per-mechanic KPI rows from work order data */
export async function getMechanicKpis(
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

  // Get all services/parts for these WOs + satisfaction data + WO customer info
  const [servicesData, partsData, completionData, woCustomers] =
    await Promise.all([
      supabase
        .from("work_order_services")
        .select("final_price, work_order_id")
        .in("work_order_id", woIds),
      supabase
        .from("work_order_parts")
        .select("final_price, work_order_id")
        .in("work_order_id", woIds),
      woIds.length > 0
        ? supabase
            .from("service_completion_data")
            .select(
              "work_order_id, customer_satisfaction, customer_feedback, created_at",
            )
            .in("work_order_id", woIds)
        : { data: [] as any[] },
      woIds.length > 0
        ? supabase
            .from("work_orders")
            .select("id, customer_id")
            .in("id", woIds)
            .not("customer_id", "is", null)
        : { data: [] as any[] },
    ]);

  // Build satisfaction map per WO (work_order_id → satisfaction score)
  const woSatisfactionMap = new Map<string, number>();
  for (const c of completionData.data ?? []) {
    if (c.customer_satisfaction != null) {
      woSatisfactionMap.set(c.work_order_id, c.customer_satisfaction);
    }
  }

  // Build WO → customer_id map and fetch customer names
  const woCustomerMap = new Map<string, string>();
  const customerIds = [
    ...new Set(
      (woCustomers.data ?? []).map((w) => w.customer_id).filter(Boolean),
    ),
  ] as string[];
  if (customerIds.length > 0) {
    const { data: customers } = await supabase
      .from("customers")
      .select("id, first_name, last_name")
      .in("id", customerIds);
    const custNameMap = new Map<string, string>();
    for (const c of customers ?? []) {
      custNameMap.set(
        c.id,
        [c.first_name, c.last_name].filter(Boolean).join(" ") || "Customer",
      );
    }
    for (const wo of woCustomers.data ?? []) {
      if (wo.customer_id) {
        woCustomerMap.set(wo.id, custNameMap.get(wo.customer_id) ?? "Customer");
      }
    }
  }

  // Build recent reviews per WO for feedback display
  const woReviewMap = new Map<
    string,
    { satisfaction: number; feedback: string | null; date: string }
  >();
  for (const c of completionData.data ?? []) {
    if (c.customer_satisfaction != null) {
      woReviewMap.set(c.work_order_id, {
        satisfaction: c.customer_satisfaction,
        feedback: c.customer_feedback ?? null,
        date: c.created_at ?? "",
      });
    }
  }

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
    let satisfactionSum = 0;
    let reviewCount = 0;
    for (const wid of mWoIds) {
      totalRevenue += woRevenueMap.get(wid) ?? 0;
      servicesCount += woServiceCountMap.get(wid) ?? 0;
      partsCount += woPartCountMap.get(wid) ?? 0;
      const sat = woSatisfactionMap.get(wid);
      if (sat != null) {
        satisfactionSum += sat;
        reviewCount++;
      }
    }
    // Build recent reviews for this mechanic (last 10, most recent first)
    const recentReviews = mWoIds
      .map((wid) => {
        const review = woReviewMap.get(wid);
        if (!review) return null;
        return {
          rating: review.satisfaction,
          feedback: review.feedback,
          customer_name: woCustomerMap.get(wid) ?? null,
          date: review.date,
        };
      })
      .filter(Boolean)
      .sort((a, b) => new Date(b!.date).getTime() - new Date(a!.date).getTime())
      .slice(0, 10) as ReportMechanicKpi["recent_reviews"];

    kpis.push({
      mechanic_id: mid,
      mechanic_name: profileMap.get(mid) ?? "Unknown",
      work_orders_completed: mWoIds.length,
      services_count: servicesCount,
      parts_count: partsCount,
      total_revenue: totalRevenue,
      avg_revenue_per_wo:
        mWoIds.length > 0 ? Math.round(totalRevenue / mWoIds.length) : 0,
      avg_satisfaction:
        reviewCount > 0
          ? Math.round((satisfactionSum / reviewCount) * 10) / 10
          : null,
      total_reviews: reviewCount,
      recent_reviews: recentReviews,
    });
  }

  return kpis.sort((a, b) => b.total_revenue - a.total_revenue);
}

export async function getMechanicsList(
  orgId: string,
  branchId: string | null = null,
): Promise<
  { id: string; full_name: string | null; avatar_url: string | null }[]
> {
  const supabase = await createClient();

  return withCache(
    ["getMechanicsList", orgId, branchId ?? "all"],
    async () => {
      const { data: mechanics } = await supabase
        .from("organization_users")
        .select("user_id, roles!inner(name), branch_id")
        .eq("organization_id", orgId)
        .eq("roles.name", "Mechanic")
        .is("removed_at", null);

      const filteredMechanics = branchId
        ? (mechanics ?? []).filter((m) => m.branch_id === branchId)
        : (mechanics ?? []);

      if (!filteredMechanics.length) return [];

      const userIds = filteredMechanics.map((m) => m.user_id);

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .in("id", userIds);

      return (profiles ?? []).map((p) => ({
        id: p.id,
        full_name: p.full_name,
        avatar_url: p.avatar_url,
      }));
    },
    {
      tags: [cacheTags.reports(orgId)],
      revalidate: cacheDurations.reports,
    },
  );
}

export async function getMechanicPerformanceTrend(
  orgId: string,
  mechanicId: string,
  period: "weekly" | "monthly" = "weekly",
  startDate: string,
  endDate: string,
  branchId: string | null = null,
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
      branchId ?? "all",
    ],
    async () => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", mechanicId)
        .single();
      const mechanicName = profile?.full_name ?? "Unknown";

      const { data: workOrders } = await withBranchFilter(
        supabase
          .from("work_orders")
          .select("id, created_at")
          .eq("organization_id", orgId)
          .eq("mechanic_id", mechanicId)
          .eq("status", "Completed")
          .gte("created_at", `${startDate}T00:00:00`)
          .lte("created_at", `${endDate}T23:59:59`)
          .is("deleted_at", null),
        branchId,
      );

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
      const weeklyTrend = sortedKeys.map((week) => {
        const entry = trendMap.get(week);
        return {
          week,
          orders: entry?.orders ?? 0,
          revenue: Math.round((entry?.revenue ?? 0) * 100) / 100,
        };
      });

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
