import { addDays, startOfDay, subDays } from "date-fns";
import dynamic from "next/dynamic";
import { withBranchFilter } from "@/lib/branches";
import { createClient } from "@/lib/supabase/server";
import type { DashboardData } from "../dashboard-client";

const MonthlyTrendChart = dynamic(
  () =>
    import("@/components/dashboard/monthly-trend-chart").then(
      (m) => m.MonthlyTrendChart,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="rounded-xl border bg-card text-card-foreground shadow-xs">
        <div className="px-6 py-4">
          <div className="h-5 w-48 animate-pulse rounded bg-muted" />
        </div>
        <div className="px-6 pb-6">
          <div className="h-60 w-full animate-pulse rounded-lg bg-muted md:h-72" />
        </div>
      </div>
    ),
  },
);

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
