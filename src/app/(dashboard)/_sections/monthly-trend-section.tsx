import { addDays, startOfDay, subDays } from "date-fns";
import { withBranchFilter } from "@/lib/branches";
import { createClient } from "@/lib/supabase/server";
import { MonthlyTrendChart } from "@/components/dashboard/monthly-trend-chart-dynamic";
import type { DashboardData } from "../dashboard-client";

export async function MonthlyTrendSection({
  orgId,
  branchId,
  isBranchScoped,
}: {
  orgId: string;
  branchId: string | null;
  isBranchScoped: boolean;
}) {
  const supabase = await createClient();
  const today = startOfDay(new Date());
  const tomorrow = addDays(today, 1);
  const thirtyDaysAgo = subDays(today, 30);

  const { data: monthlySales } = await withBranchFilter(
    supabase
      .from("sales")
      .select("total_amount, sale_date")
      .eq("organization_id", orgId)
      .gte("sale_date", thirtyDaysAgo.toISOString())
      .lt("sale_date", tomorrow.toISOString()),
    branchId,
    isBranchScoped,
  );

  const trendMap = new Map<string, number>();
  for (const sale of monthlySales ?? []) {
    const day = sale.sale_date.slice(0, 10);
    trendMap.set(day, (trendMap.get(day) ?? 0) + (sale.total_amount ?? 0));
  }

  const monthlyTrend: DashboardData["monthlyTrend"] = [];
  for (let i = 29; i >= 0; i--) {
    const date = subDays(today, i);
    const key = date.toISOString().slice(0, 10);
    monthlyTrend.push({
      date: key,
      total: trendMap.get(key) ?? 0,
    });
  }

  return <MonthlyTrendChart data={monthlyTrend} />;
}
