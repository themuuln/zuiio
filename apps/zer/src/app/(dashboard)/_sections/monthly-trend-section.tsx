import { withDbCapture } from "@zuiio/capture";
import { addDays, startOfDay, subDays } from "date-fns";
import { cacheLife, cacheTag } from "next/cache";
import { MonthlyTrendChart } from "@/components/dashboard/monthly-trend-chart-dynamic";
import { withBranchFilter } from "@/lib/branches";
import { createServiceClient } from "@/lib/supabase/server-service";
import type { DashboardData } from "../dashboard-client";

type SalesRow = { total_amount: number | null; sale_date: string };

async function getMonthlyTrendData(
  organizationId: string,
  branchId: string | null,
  isBranchScoped: boolean,
): Promise<SalesRow[]> {
  "use cache";
  cacheLife("standard");
  cacheTag(`sales:${organizationId}`);

  // ⚠️ SERVICE ROLE — no RLS. Every query MUST filter by organizationId.
  const supabase = createServiceClient();
  const today = startOfDay(new Date());
  const tomorrow = addDays(today, 1);
  const thirtyDaysAgo = subDays(today, 30);

  const { data } = await withBranchFilter(
    withDbCapture(
      "dashboard_monthly_sales",
      supabase
        .from("sales")
        .select("total_amount, sale_date")
        .eq("organization_id", organizationId)
        .gte("sale_date", thirtyDaysAgo.toISOString())
        .lt("sale_date", tomorrow.toISOString()),
    ),
    branchId,
    isBranchScoped,
  );

  return data ?? [];
}

export async function MonthlyTrendSection({
  orgId,
  branchId,
  isBranchScoped,
}: {
  orgId: string;
  branchId: string | null;
  isBranchScoped: boolean;
}) {
  const monthlySales = await getMonthlyTrendData(
    orgId,
    branchId,
    isBranchScoped,
  );
  const today = startOfDay(new Date());

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
