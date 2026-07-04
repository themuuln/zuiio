import {
  ChartLineUp,
  ClockCountdown,
  TrendDown,
  TrendUp,
} from "@phosphor-icons/react/dist/ssr";
import { withDbCapture } from "@zuiio/capture";
import { addDays, startOfDay } from "date-fns";
import { PulseCard } from "@/components/dashboard/dashboard-cards";
import { withBranchFilter } from "@/lib/branches";
import { formatCurrency } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

export async function TodayPulse({
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

  const [salesResult, expensesResult, pendingResult] = await Promise.all([
    withBranchFilter(
      withDbCapture(
        "dashboard_today_sales",
        supabase
          .from("sales")
          .select("total_amount")
          .eq("organization_id", orgId)
          .gte("sale_date", today.toISOString())
          .lt("sale_date", tomorrow.toISOString()),
      ),
      branchId,
      isBranchScoped,
    ),
    withBranchFilter(
      withDbCapture(
        "dashboard_today_expenses",
        supabase
          .from("expenses")
          .select("amount")
          .eq("organization_id", orgId)
          .gte("expense_date", today.toISOString())
          .lt("expense_date", tomorrow.toISOString()),
      ),
      branchId,
      isBranchScoped,
    ),
    (async () => {
      const result = await withDbCapture(
        "dashboard_today_pending",
        supabase
          .from("sales")
          .select("id", { count: "exact", head: true })
          .eq("organization_id", orgId)
          .eq("status", "pending"),
      );
      // withDbCapture returns { data, error } but supabase count queries
      // also return count at runtime — preserve it through the cast.
      return result as unknown as {
        data: Array<{ id: string }> | null;
        count: number | null;
        error: unknown;
      };
    })(),
  ]);

  const todaySalesTotal = (salesResult.data ?? []).reduce(
    (s, r) => s + (r.total_amount ?? 0),
    0,
  );
  const todayExpensesTotal = (expensesResult.data ?? []).reduce(
    (s, r) => s + (r.amount ?? 0),
    0,
  );
  const netProfit = todaySalesTotal - todayExpensesTotal;
  const pendingSalesCount = pendingResult.count ?? 0;

  return (
    <div>
      <h2 className="mb-3 text-sm font-medium text-muted-foreground">
        Өнөөдрийн байдал
      </h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <PulseCard
          icon={<TrendUp className="size-5" />}
          label="Өнөөдрийн борлуулалт"
          value={formatCurrency(todaySalesTotal)}
          color="emerald"
        />
        <PulseCard
          icon={<TrendDown className="size-5" />}
          label="Өнөөдрийн зарлага"
          value={formatCurrency(todayExpensesTotal)}
          color="red"
        />
        <PulseCard
          icon={<ChartLineUp className="size-5" />}
          label="Цэвэр ашиг"
          value={formatCurrency(netProfit)}
          color="blue"
        />
        <PulseCard
          icon={<ClockCountdown className="size-5" />}
          label="Хүлээгдэж буй"
          value={pendingSalesCount.toLocaleString()}
          color="amber"
        />
      </div>
    </div>
  );
}
