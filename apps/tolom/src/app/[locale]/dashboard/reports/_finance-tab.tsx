import { DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Typography } from "@/components/ui/typography";
import { cn, formatCurrency } from "@/lib/utils";

export interface FinanceSummary {
  revenue: { total: number; by_method: Record<string, number> };
  expenses: { total: number; by_category: Record<string, number> };
  refunds: { total: number };
  net_profit: number;
}

interface FinanceTabProps {
  financePeriod: "day" | "week" | "month" | "year";
  onPeriodChange: (period: "day" | "week" | "month" | "year") => void;
  financeQ: { data: FinanceSummary | undefined; isPending: boolean };
  t: (key: string) => string;
}
export function FinanceTab({
  financePeriod,
  onPeriodChange,
  financeQ,
  t: _t,
}: FinanceTabProps) {
  const financeSummary = financeQ.data;

  return (
    <div
      id="reports-panel-finance"
      role="tabpanel"
      aria-labelledby="reports-tab-finance"
      className="flex flex-col gap-6"
    >
      {/* Period Selector */}
      <div
        className="flex items-center gap-2"
        role="tablist"
        aria-label="Finance period"
      >
        {(["day", "week", "month", "year"] as const).map((p) => (
          <Button
            key={p}
            variant={financePeriod === p ? "default" : "ghost"}
            size="sm"
            role="tab"
            aria-selected={financePeriod === p}
            onClick={() => onPeriodChange(p)}
          >
            {p.charAt(0).toUpperCase() + p.slice(1)}
          </Button>
        ))}
      </div>

      {financeQ.isPending ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-lg" />
          ))}
        </div>
      ) : !financeSummary ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-16">
            <div className="flex size-14 items-center justify-center rounded-full bg-muted">
              <DollarSign className="size-7 text-muted-foreground" />
            </div>
            <Typography.Muted className="text-sm text-muted-foreground">
              No finance data available
            </Typography.Muted>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-muted-foreground">
                  Revenue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <span className="text-2xl font-bold tabular-nums">
                  {formatCurrency(financeSummary.revenue.total)}
                </span>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-muted-foreground">
                  Expenses
                </CardTitle>
              </CardHeader>
              <CardContent>
                <span className="text-2xl font-bold tabular-nums text-red-500">
                  {formatCurrency(financeSummary.expenses.total)}
                </span>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-muted-foreground">
                  Refunds
                </CardTitle>
              </CardHeader>
              <CardContent>
                <span className="text-2xl font-bold tabular-nums">
                  {formatCurrency(financeSummary.refunds.total)}
                </span>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-muted-foreground">
                  Net Profit
                </CardTitle>
              </CardHeader>
              <CardContent>
                <span
                  className={cn(
                    "text-2xl font-bold tabular-nums",
                    financeSummary.net_profit >= 0
                      ? "text-green-600 dark:text-green-400"
                      : "text-red-500",
                  )}
                >
                  {formatCurrency(financeSummary.net_profit)}
                </span>
              </CardContent>
            </Card>
          </div>

          {/* Payment Methods & Expense Categories */}
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">
                  Payment Methods
                </CardTitle>
              </CardHeader>
              <CardContent>
                {Object.keys(financeSummary.revenue.by_method).length === 0 ? (
                  <Typography.Muted className="text-sm">
                    No data
                  </Typography.Muted>
                ) : (
                  <table
                    className="w-full text-sm"
                    aria-label="Payment methods breakdown"
                  >
                    <thead>
                      <tr className="border-b border-border/60">
                        <th className="px-2 py-1.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                          Method
                        </th>
                        <th className="px-2 py-1.5 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                          Amount
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(financeSummary.revenue.by_method).map(
                        ([method, amount]) => (
                          <tr
                            key={method}
                            className="border-b border-border/30"
                          >
                            <td className="px-2 py-2 font-medium">{method}</td>
                            <td className="px-2 py-2 text-right tabular-nums">
                              {formatCurrency(amount)}
                            </td>
                          </tr>
                        ),
                      )}
                    </tbody>
                  </table>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">
                  Expense Categories
                </CardTitle>
              </CardHeader>
              <CardContent>
                {Object.keys(financeSummary.expenses.by_category).length ===
                0 ? (
                  <Typography.Muted className="text-sm">
                    No data
                  </Typography.Muted>
                ) : (
                  <table
                    className="w-full text-sm"
                    aria-label="Expense categories breakdown"
                  >
                    <thead>
                      <tr className="border-b border-border/60">
                        <th className="px-2 py-1.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                          Category
                        </th>
                        <th className="px-2 py-1.5 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                          Amount
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(financeSummary.expenses.by_category).map(
                        ([cat, amount]) => (
                          <tr key={cat} className="border-b border-border/30">
                            <td className="px-2 py-2 font-medium">{cat}</td>
                            <td className="px-2 py-2 text-right tabular-nums">
                              {formatCurrency(amount)}
                            </td>
                          </tr>
                        ),
                      )}
                    </tbody>
                  </table>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
