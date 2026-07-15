import { BarChart3, ClipboardList, TrendingUp, Wallet } from "lucide-react";
import { Cell, Pie, PieChart as RechartsPieChart } from "recharts";
import {
  DailyRevenueChart,
  ForecastCard,
  InsightAlerts,
  MechanicBarChart,
  MechanicTable,
  PnLCard,
  ReportKpiCard,
  RetentionCard,
  ServiceBreakdownChart,
  TargetCard,
} from "@/components/reports";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import type { ExportColumn } from "@/lib/export";
import type { ReportMechanicKpi } from "@/lib/types";
import type {
  CustomerRetentionData,
  PnLSummary,
  ReportForecast,
  ReportInsight,
  ReportTarget,
  ServiceBreakdown,
} from "@/lib/types/service-params";
import { formatCurrency } from "@/lib/utils";
import type { ReportData, ReportType } from "./_helpers";

export interface DailyBreakdownPoint {
  date: string;
  revenue: number;
  label: string;
}

interface OverviewTabProps {
  reportType: ReportType;
  report: ReportData | null;
  loading: boolean;
  insights: ReportInsight[];
  forecast: ReportForecast | null;
  targets: ReportTarget[];
  retention: CustomerRetentionData | null;
  pnl: PnLSummary | null;
  serviceBreakdown: ServiceBreakdown[];
  dailyBreakdown: DailyBreakdownPoint[];
  monthlyBreakdown: DailyBreakdownPoint[];
  mechExportCols: ExportColumn<ReportMechanicKpi>[];
  dateParam: string;
  mechanicFilter: string;
  t: (key: string) => string;
}

export function OverviewTab({
  reportType,
  report: r,
  loading,
  insights,
  forecast,
  targets,
  retention,
  pnl,
  serviceBreakdown,
  dailyBreakdown,
  monthlyBreakdown,
  mechExportCols,
  dateParam,
  mechanicFilter,
  t,
}: OverviewTabProps) {
  return (
    <div
      id={`reports-panel-${reportType}`}
      role="tabpanel"
      aria-labelledby={`reports-tab-${reportType}`}
      className="flex flex-col gap-6"
    >
      <InsightAlerts insights={insights} loading={loading} />

      {/* ── KPI Cards ── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <ReportKpiCard
          label={t("workOrders")}
          value={String(r?.work_orders_completed ?? 0)}
          icon={ClipboardList}
          delta={r?.comparison?.work_orders_change_pct}
          subtitle={
            r?.work_orders_completed
              ? t("averagePerWorkOrder", {
                  value: formatCurrency(
                    Math.round(
                      (r?.total_revenue ?? 0) / r.work_orders_completed,
                    ),
                  ),
                })
              : undefined
          }
        />
        <ReportKpiCard
          label={t("servicesSold")}
          value={String(r?.services_count ?? 0)}
          icon={Wallet}
          subtitle={
            r?.services_count && r?.work_orders_completed
              ? t("servicesPerWorkOrder", {
                  value:
                    Math.round(
                      (r.services_count / r.work_orders_completed) * 10,
                    ) / 10,
                })
              : undefined
          }
          delta={
            r?.comparison?.services_count != null &&
            (r?.services_count ?? 0) > 0 &&
            r.comparison.services_count > 0
              ? Math.round(
                  (((r?.services_count ?? 0) - r.comparison.services_count) /
                    r.comparison.services_count) *
                    1000,
                ) / 10
              : null
          }
        />
        <ReportKpiCard
          label={t("revenue")}
          value={formatCurrency(r?.total_revenue ?? 0)}
          icon={Wallet}
          delta={r?.comparison?.revenue_change_pct}
          subtitle={
            r?.comparison?.total_revenue != null
              ? t("previousRevenue", {
                  value: formatCurrency(r.comparison.total_revenue),
                })
              : undefined
          }
        />
        <ReportKpiCard
          label={t("expenses")}
          value={formatCurrency(0)}
          icon={Wallet}
          subtitle={t("connectExpenseData")}
        />
      </div>

      {r?.profitability && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <ReportKpiCard
            label={t("grossProfit")}
            value={formatCurrency(r.profitability.gross_profit)}
            icon={TrendingUp}
            cls={
              r.profitability.gross_profit >= 0
                ? "text-green-600 dark:text-green-400"
                : "text-red-500"
            }
          />
          <ReportKpiCard
            label={t("margin")}
            value={`${r.profitability.margin_percent}%`}
            icon={BarChart3}
            cls={
              r.profitability.margin_percent >= 0
                ? "text-green-600 dark:text-green-400"
                : "text-red-500"
            }
          />
          <ReportKpiCard
            label={t("effLaborRate")}
            value={formatCurrency(r.profitability.effective_labor_rate)}
            icon={Wallet}
            subtitle={t("perWorkOrder")}
          />
          <ReportKpiCard
            label={t("partsToLabor")}
            value={`${Math.round(r.profitability.parts_to_labor_ratio * 100)}%`}
            icon={BarChart3}
            subtitle={t("partsOverLabor")}
          />
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <ForecastCard forecast={forecast} loading={loading} />
        <TargetCard targets={targets} loading={loading} />
      </div>

      {r?.profitability && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">
                {t("revenueSplit")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6">
                <ChartContainer
                  config={{
                    services: {
                      label: t("services"),
                      color: "var(--chart-1)",
                    },
                    parts: { label: t("parts"), color: "var(--chart-2)" },
                  }}
                  className="h-[140px] w-[140px]"
                >
                  <RechartsPieChart>
                    <Pie
                      data={[
                        {
                          name: t("services"),
                          value: r.profitability.service_revenue,
                        },
                        {
                          name: t("parts"),
                          value: r.profitability.parts_revenue,
                        },
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={60}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      <Cell fill="var(--chart-1)" />
                      <Cell fill="var(--chart-2)" />
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </RechartsPieChart>
                </ChartContainer>
                <div className="flex flex-col gap-2">
                  {[
                    {
                      name: t("services"),
                      value: r.profitability.service_revenue,
                      color: "var(--chart-1)",
                    },
                    {
                      name: t("parts"),
                      value: r.profitability.parts_revenue,
                      color: "var(--chart-2)",
                    },
                  ].map((item) => {
                    const total =
                      (r?.profitability?.service_revenue ?? 0) +
                      (r?.profitability?.parts_revenue ?? 0);
                    return (
                      <div key={item.name} className="flex items-center gap-2">
                        <div
                          className="size-2.5 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-xs text-muted-foreground">
                          {item.name}
                        </span>
                        <span className="text-xs font-medium tabular-nums">
                          {formatCurrency(item.value)}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          ({Math.round((item.value / total) * 100)}%)
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">
                {t("profitBreakdown")}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">
                  {t("serviceRevenue")}
                </span>
                <span className="font-medium tabular-nums">
                  {formatCurrency(r.profitability.service_revenue)}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">
                  {t("serviceCost")}
                </span>
                <span className="tabular-nums text-red-500/80">
                  -{formatCurrency(r.profitability.service_cost)}
                </span>
              </div>
              <div className="flex justify-between text-xs border-t border-border pt-1.5">
                <span className="text-muted-foreground">
                  {t("partsRevenue")}
                </span>
                <span className="font-medium tabular-nums">
                  {formatCurrency(r.profitability.parts_revenue)}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">{t("partsCost")}</span>
                <span className="tabular-nums text-red-500/80">
                  -{formatCurrency(r.profitability.parts_cost)}
                </span>
              </div>
              <div className="flex justify-between text-xs font-semibold border-t border-border pt-1.5">
                <span>{t("grossProfit")}</span>
                <span
                  className={`tabular-nums ${r.profitability.gross_profit >= 0 ? "text-green-600 dark:text-green-400" : "text-red-500"}`}
                >
                  {formatCurrency(r.profitability.gross_profit)}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {reportType === "weekly" && <DailyRevenueChart data={dailyBreakdown} />}
      {reportType === "monthly" && (
        <DailyRevenueChart data={monthlyBreakdown} />
      )}
      {!mechanicFilter && <MechanicBarChart kpis={r?.mechanic_kpis ?? []} />}
      <ServiceBreakdownChart data={serviceBreakdown} loading={loading} />

      <div className="grid gap-4 lg:grid-cols-2">
        <RetentionCard data={retention} loading={loading} />
        <PnLCard data={pnl} loading={loading} />
      </div>

      {!mechanicFilter && (
        <MechanicTable
          kpis={r?.mechanic_kpis ?? []}
          exportCols={mechExportCols}
          exportFile={`mechanics-${reportType}-${dateParam}.xlsx`}
          comparison={r?.comparison}
        />
      )}
    </div>
  );
}
