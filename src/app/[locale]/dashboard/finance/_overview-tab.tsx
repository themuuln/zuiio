"use client";

import {
  ClipboardList,
  Clock,
  DollarSign,
  Percent,
  TrendingUp,
  Users,
  Wrench,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ChartConfig } from "@/components/ui/chart";
import { AreaChart } from "@/components/charts/area-chart";
import { DataTable, DataTableColumnHeader } from "@/components/ui/data-table";
import { useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { formatCurrency } from "@/lib/utils";
import type { RevenueTrendPoint } from "@/lib/types";
import { EmptyFinanceState } from "./_empty-finance-state";
import { KpiCard } from "./_kpi-card";
import { NoRevenueBanner } from "./_no-revenue-banner";
import { RevenueSplitBar } from "./_revenue-split-bar";

interface TopService {
  name: string;
  count: number;
  revenue: number;
}

interface Summary {
  totalRevenue: number;
  activeWorkOrders: number;
  avgRepairOrderValue: number;
  totalCustomers: number;
  serviceRevenue: number;
  partsRevenue: number;
  totalVehicles: number;
  completedToday: number;
  grossProfit: number;
  marginPercent: number;
}

interface OverviewTabProps {
  hasAnyData: boolean;
  hasRevenue: boolean;
  summary: Summary | null;
  insightLine: string | null;
  loading: boolean;
  topServices?: TopService[];
  revenueTrend?: RevenueTrendPoint[];
}

export function OverviewTab({
  hasAnyData,
  hasRevenue,
  summary,
  insightLine,
  loading,
  topServices,
  revenueTrend = [],
}: OverviewTabProps) {
  const t = useTranslations();

  if (!hasAnyData) {
    return <EmptyFinanceState />;
  }

  const safeSummary: Summary = summary ?? {
    totalRevenue: 0,
    activeWorkOrders: 0,
    avgRepairOrderValue: 0,
    totalCustomers: 0,
    serviceRevenue: 0,
    partsRevenue: 0,
    totalVehicles: 0,
    completedToday: 0,
    grossProfit: 0,
    marginPercent: 0,
  };

  if (!hasRevenue) {
    return (
      <>
        <NoRevenueBanner activeWorkOrders={safeSummary.activeWorkOrders} />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
          <KpiCard
            label="Active Work Orders"
            value={String(safeSummary.activeWorkOrders)}
            icon={Clock}
            subtitle="Currently in progress"
            loading={loading}
          />
          <KpiCard
            label="Total Customers"
            value={String(safeSummary.totalCustomers)}
            icon={Users}
            loading={loading}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
          <KpiCard
            label="Total Vehicles"
            value={String(safeSummary.totalVehicles)}
            icon={TrendingUp}
            loading={loading}
          />
          <KpiCard
            label="Service Revenue"
            value={formatCurrency(0)}
            icon={Wrench}
            subtitle="Complete WOs to populate"
            loading={loading}
          />
        </div>
      </>
    );
  }

  return (
    <>
      {insightLine && (
        <Card className="border-amber-200/50 bg-amber-50/30 dark:border-amber-800/30 dark:bg-amber-950/10">
          <CardContent className="flex items-start gap-2 py-3">
            <TrendingUp className="mt-0.5 size-4 shrink-0 text-amber-500" />
            <p className="text-sm text-muted-foreground">{insightLine}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Total Revenue"
          value={formatCurrency(safeSummary.totalRevenue)}
          icon={DollarSign}
          subtitle={`${safeSummary.completedToday} completed today`}
          loading={loading}
        />
        <KpiCard
          label="Active Work Orders"
          value={String(safeSummary.activeWorkOrders)}
          icon={Clock}
          subtitle="Currently in progress"
          loading={loading}
        />
        <KpiCard
          label="Avg Repair Order"
          value={formatCurrency(safeSummary.avgRepairOrderValue)}
          icon={TrendingUp}
          loading={loading}
        />
        <KpiCard
          label="Total Customers"
          value={String(safeSummary.totalCustomers)}
          icon={Users}
          loading={loading}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Gross Profit"
          value={formatCurrency(safeSummary.grossProfit)}
          icon={TrendingUp}
          subtitle={
            safeSummary.marginPercent > 0
              ? `${safeSummary.marginPercent.toFixed(1)}% margin`
              : undefined
          }
          loading={loading}
        />
        <KpiCard
          label="Service Revenue"
          value={formatCurrency(safeSummary.serviceRevenue)}
          icon={Wrench}
          subtitle="Labor & services"
          loading={loading}
        />
        <KpiCard
          label="Parts Revenue"
          value={formatCurrency(safeSummary.partsRevenue)}
          icon={ClipboardList}
          subtitle="Parts & materials"
          loading={loading}
        />
        <KpiCard
          label="Total Vehicles"
          value={String(safeSummary.totalVehicles)}
          icon={TrendingUp}
          loading={loading}
        />
        <KpiCard
          label="Service Mix"
          value={`${safeSummary.totalRevenue > 0 ? Math.round((safeSummary.serviceRevenue / safeSummary.totalRevenue) * 100) : "—"}%`}
          icon={Percent}
          subtitle="Service vs Parts"
          loading={loading}
        />
      </div>

      {/* Revenue Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {t("dashboard.revenueTrend")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {revenueTrend.length > 0 ? (
            <AreaChart
              data={revenueTrend as unknown as Record<string, unknown>[]}
              config={
                {
                  revenue: { label: "Revenue", color: "#3b82f6" },
                  workOrders: { label: "Work Orders", color: "#22c55e" },
                } satisfies ChartConfig
              }
              xKey="date"
              series={[
                { key: "revenue", color: "#3b82f6" },
                { key: "workOrders", color: "#22c55e" },
              ]}
              height={280}
              showGrid
              showYAxis
            />
          ) : (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No revenue data yet
            </p>
          )}
        </CardContent>
      </Card>

      <RevenueSplitBar
        total={safeSummary.totalRevenue}
        service={safeSummary.serviceRevenue}
        parts={safeSummary.partsRevenue}
        loading={loading}
      />

      {topServices && topServices.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">
              Top Services
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <TopServicesTable services={topServices} />
          </CardContent>
        </Card>
      )}
    </>
  );
}

function TopServicesTable({ services }: { services: TopService[] }) {
  const columns: ColumnDef<TopService>[] = useMemo(
    () => [
      {
        accessorKey: "name",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Service" />
        ),
      },
      {
        accessorKey: "count",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Count" />
        ),
        cell: ({ row }) => (
          <span className="tabular-nums">{row.original.count}</span>
        ),
      },
      {
        accessorKey: "revenue",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Revenue" />
        ),
        cell: ({ row }) => (
          <span className="font-medium tabular-nums">
            {formatCurrency(row.original.revenue)}
          </span>
        ),
      },
    ],
    [],
  );

  return (
    <DataTable
      columns={columns}
      data={services.slice(0, 8)}
      getRowId={(row) => row.name}
      pageSize={8}
    />
  );
}
