"use client";

import {
  ArrowDown,
  ArrowUp,
  Calendar,
  Car,
  Check,
  ClipboardList,
  Clock,
  DollarSign,
  Lightbulb,
  Pencil,
  Percent,
  Plus,
  Target,
  TrendingUp,
  Users,
  Wrench,
  X,
} from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCallback, useMemo, useState } from "react";
import { ExportButton } from "@/components/export-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Typography } from "@/components/ui/typography";
import type { ExportColumn } from "@/lib/export";
import { useDashboard } from "@/lib/queries/use-dashboard";
import {
  useOrgSettings,
  useUpdateOrgSettings,
} from "@/lib/queries/use-org-settings";
import { useCurrentOrg } from "@/lib/queries/use-organization";
import type { DashboardData, WorkOrderDetail } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { DailyTimeline } from "./_daily-timeline";

type Period = "today" | "week" | "month" | "all";

const ChartsSection = dynamic(() => import("./_charts"), {
  ssr: false,
  loading: () => (
    <div className="grid gap-6 lg:grid-cols-2">
      {[1, 2].map((n) => (
        <Card key={n}>
          <CardHeader>
            <Skeleton className="h-5 w-44" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-72 w-full rounded-lg" />
          </CardContent>
        </Card>
      ))}
    </div>
  ),
});

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ── KPI Card ─────────────────────────────────────────────

const KPI_ACCENTS: Record<string, { bar: string; icon: string; bg: string }> = {
  totalRevenue: { bar: "bg-emerald-500", icon: "text-emerald-600", bg: "bg-emerald-50" },
  activeWorkOrders: { bar: "bg-amber-500", icon: "text-amber-600", bg: "bg-amber-50" },
  avgRepairOrder: { bar: "bg-blue-500", icon: "text-blue-600", bg: "bg-blue-50" },
  totalCustomers: { bar: "bg-violet-500", icon: "text-violet-600", bg: "bg-violet-50" },
  serviceRevenue: { bar: "bg-sky-500", icon: "text-sky-600", bg: "bg-sky-50" },
  partsRevenue: { bar: "bg-orange-500", icon: "text-orange-600", bg: "bg-orange-50" },
  totalVehicles: { bar: "bg-rose-500", icon: "text-rose-600", bg: "bg-rose-50" },
  serviceMix: { bar: "bg-teal-500", icon: "text-teal-600", bg: "bg-teal-50" },
};

function KpiCard({
  label,
  value,
  icon: Icon,
  loading,
  accentKey,
  trend,
  comparisonLabel,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  loading?: boolean;
  accentKey?: string;
  trend?: { direction: "up" | "down" | "neutral"; value: string } | null;
  comparisonLabel?: string;
}) {
  const accent = accentKey ? KPI_ACCENTS[accentKey] : undefined;

  return (
    <Card className="group relative overflow-hidden transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
      {accent && (
        <div
          className={`absolute left-0 top-0 h-full w-1 ${accent.bar} rounded-l-lg`}
        />
      )}
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {label}
        </CardTitle>
        <div
          className={`flex size-8 items-center justify-center rounded-lg transition-colors ${
            accent?.bg ?? "bg-muted"
          }`}
        >
          <Icon
            className={`size-4 ${accent?.icon ?? "text-muted-foreground"}`}
            aria-hidden="true"
          />
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-9 w-28" />
        ) : (
          <div className="flex items-end gap-2">
            <div className="text-3xl font-bold tracking-tight tabular-nums">
              {value}
            </div>
            {trend && (
              <div
                className={`flex items-center gap-0.5 text-xs font-medium mb-1 ${
                  trend.direction === "up"
                    ? "text-emerald-600"
                    : trend.direction === "down"
                      ? "text-red-600"
                      : "text-muted-foreground"
                }`}
              >
                {trend.direction === "up" ? (
                  <ArrowUp className="size-3" />
                ) : trend.direction === "down" ? (
                  <ArrowDown className="size-3" />
                ) : null}
                {trend.value}
              </div>
            )}
          </div>
        )}
        {comparisonLabel && (
          <p className="mt-0.5 text-xs text-muted-foreground">
            {comparisonLabel}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function SectionHeader({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-5">
      <Typography.H3 className="m-0">{title}</Typography.H3>
      {description && (
        <Typography.Muted className="mt-1">{description}</Typography.Muted>
      )}
    </div>
  );
}

// ── Period Pills ─────────────────────────────────────────

type PeriodOption = { key: Period; label: string; icon: React.ComponentType<{ className?: string }> };

function PeriodBar({
  value,
  onChange,
}: {
  value: Period;
  onChange: (p: Period) => void;
}) {
  const options: PeriodOption[] = [
    { key: "today", label: "Today", icon: Clock },
    { key: "week", label: "This Week", icon: Calendar },
    { key: "month", label: "This Month", icon: Calendar },
    { key: "all", label: "All Time", icon: TrendingUp },
  ];

  return (
    <div className="inline-flex rounded-xl bg-muted/60 p-1" role="tablist">
      {options.map((opt) => {
        const Icon = opt.icon;
        const active = value === opt.key;
        return (
          <button
            key={opt.key}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.key)}
            className={`inline-flex min-h-[40px] items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-medium transition-all duration-150 ${
              active
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className={`size-3.5 ${active ? "text-primary" : ""}`} />
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

// ── Empty State ──────────────────────────────────────────

function EmptyDashboardState({ onRetry }: { onRetry: () => void }) {
  const _t = useTranslations();
  return (
    <Card className="border-dashed border-2 py-16">
      <CardContent className="flex flex-col items-center gap-6">
        <div className="flex size-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5">
          <Wrench className="size-10 text-primary/60" />
        </div>
        <div className="max-w-md text-center">
          <Typography.H4 className="m-0">Welcome to TOLOM</Typography.H4>
          <Typography.P className="mt-2 text-sm text-muted-foreground leading-relaxed">
            Your garage&apos;s command center. Start by creating your first
            work order — revenue, customer stats, and trends will appear here
            automatically as you complete jobs.
          </Typography.P>
        </div>
        <div className="flex gap-3">
          <Link
            href="/dashboard/work-orders/new"
            className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition-all duration-150 hover:bg-primary/90 hover:shadow-md active:scale-[0.98]"
          >
            <Plus className="size-4" />
            Create Your First Work Order
          </Link>
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex min-h-[48px] items-center justify-center rounded-xl border border-border bg-background px-5 py-2.5 text-sm font-medium text-muted-foreground transition-all duration-150 hover:bg-muted hover:text-foreground"
          >
            Refresh
          </button>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Work Order Status Styles ────────────────────────────

const WO_STATUS_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
  Completed: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
  Cancelled: { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500" },
  "In Progress": { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
  Diagnosing: { bg: "bg-yellow-50", text: "text-yellow-700", dot: "bg-yellow-500" },
  New: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" },
  "Ready for Pickup": { bg: "bg-green-50", text: "text-green-700", dot: "bg-green-500" },
};

// ── Recent Work Orders Table ────────────────────────────

function RecentWorkOrdersTable({
  workOrders,
  router,
  t,
  workOrdersForExport,
}: {
  workOrders: DashboardData["recentWorkOrders"];
  router: ReturnType<typeof useRouter>;
  t: ReturnType<typeof useTranslations>;
  workOrdersForExport: ExportColumn<WorkOrderDetail>[];
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-0">
        <div />
        <ExportButton
          data={workOrders}
          columns={workOrdersForExport}
          filename={`dashboard-recent-${new Date().toISOString().split("T")[0]}.xlsx`}
          sheetName="Recent Work Orders"
          title={t("dashboard.recentWorkOrders")}
        />
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-5 py-3.5 text-left font-medium text-muted-foreground">
                  {t("workOrders.id")}
                </th>
                <th className="px-5 py-3.5 text-left font-medium text-muted-foreground">
                  {t("workOrders.customer")}
                </th>
                <th className="px-5 py-3.5 text-left font-medium text-muted-foreground">
                  {t("workOrders.vehicle")}
                </th>
                <th className="px-5 py-3.5 text-left font-medium text-muted-foreground">
                  {t("workOrders.status")}
                </th>
                <th className="px-5 py-3.5 text-right font-medium text-muted-foreground">
                  {t("workOrders.total")}
                </th>
                <th className="px-5 py-3.5 text-right font-medium text-muted-foreground">
                  {t("workOrders.date")}
                </th>
              </tr>
            </thead>
            <tbody>
              {workOrders.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-16 text-center text-muted-foreground"
                  >
                    {t("dashboard.noWorkOrders")}
                  </td>
                </tr>
              ) : (
                workOrders.map((wo) => {
                  const grandTotal =
                    (wo.services ?? []).reduce(
                      (sum: number, s: { final_price: number }) =>
                        sum + Number(s.final_price),
                      0,
                    ) +
                    (wo.parts ?? []).reduce(
                      (sum: number, p: { final_price: number }) =>
                        sum + Number(p.final_price),
                      0,
                    );

                  return (
                    <tr
                      key={wo.id}
                      className="border-b border-border transition-colors hover:bg-muted/30 cursor-pointer"
                      onClick={() =>
                        router.push(`/dashboard/work-orders/${wo.id}`)
                      }
                    >
                      <td className="px-5 py-3.5 font-mono text-xs">
                        {wo.id.slice(0, 8)}...
                      </td>
                      <td className="px-5 py-3.5">
                        {wo.customer
                          ? `${wo.customer.first_name} ${wo.customer.last_name ?? ""}`.trim()
                          : "\u2014"}
                      </td>
                      <td className="px-5 py-3.5 text-muted-foreground">
                        {wo.vehicle?.plate_number ?? "\u2014"}
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            WO_STATUS_STYLES[wo.status]?.bg ?? "bg-muted"
                          } ${WO_STATUS_STYLES[wo.status]?.text ?? "text-muted-foreground"}`}
                        >
                          <span
                            className={`size-1.5 rounded-full ${
                              WO_STATUS_STYLES[wo.status]?.dot ?? "bg-muted-foreground"
                            }`}
                          />
                          {wo.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right font-medium tabular-nums">
                        {formatCurrency(grandTotal)}
                      </td>
                      <td className="px-5 py-3.5 text-right text-muted-foreground">
                        {formatDate(wo.created_at)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Quick Actions ───────────────────────────────────────

const QUICK_ACTIONS_CONFIG = [
  {
    href: "/dashboard/work-orders/new",
    icon: Plus,
    label: "New Work Order",
    desc: "Create a repair job for a customer",
    accent: "from-blue-500/20 to-blue-500/5 border-blue-200/30 hover:border-blue-300/50",
    iconBg: "bg-blue-100 text-blue-600",
  },
  {
    href: "/dashboard/customers/new",
    icon: Users,
    label: "New Customer",
    desc: "Add a customer to your roster",
    accent: "from-violet-500/20 to-violet-500/5 border-violet-200/30 hover:border-violet-300/50",
    iconBg: "bg-violet-100 text-violet-600",
  },
  {
    href: "/dashboard/vehicles/new",
    icon: Car,
    label: "New Vehicle",
    desc: "Register a vehicle in the system",
    accent: "from-amber-500/20 to-amber-500/5 border-amber-200/30 hover:border-amber-300/50",
    iconBg: "bg-amber-100 text-amber-600",
  },
  {
    href: "/dashboard/reports",
    icon: TrendingUp,
    label: "View Reports",
    desc: "Analytics and business performance",
    accent: "from-emerald-500/20 to-emerald-500/5 border-emerald-200/30 hover:border-emerald-300/50",
    iconBg: "bg-emerald-100 text-emerald-600",
  },
];

function QuickActions({ t }: { t: ReturnType<typeof useTranslations> }) {
  return (
    <div>
      <SectionHeader title={t("dashboard.quickActions")} />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {QUICK_ACTIONS_CONFIG.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.href}
              href={action.href}
              className={`group relative overflow-hidden rounded-xl border bg-gradient-to-br p-5 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${action.accent}`}
            >
              <div
                className={`mb-3 flex size-10 items-center justify-center rounded-lg transition-transform duration-200 group-hover:scale-110 ${action.iconBg}`}
              >
                <Icon className="size-5" />
              </div>
              <p className="font-semibold text-sm">{action.label}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {action.desc}
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

// ── Main Dashboard Page ──────────────────────────────────

export default function DashboardPage() {
  const t = useTranslations();
  const router = useRouter();
  const [period, setPeriod] = useState<Period>("all");
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState("");

  // ── React Query hooks ───────────────────────────────
  const { data: org, isPending: orgLoading, error: orgError } = useCurrentOrg();
  const orgId = org?.orgId;

  const {
    data,
    isPending: dashboardLoading,
    error: dashboardError,
    refetch: refetchDashboard,
  } = useDashboard(orgId, period);

  // Derived error messages for UI
  const errorMessage = orgError
    ? "Failed to load organization"
    : dashboardError
      ? dashboardError.message
      : null;

  // ── Org Settings (daily revenue goal) ──────────────
  const { settings, isLoading: settingsLoading } = useOrgSettings(orgId);
  const updateSettings = useUpdateOrgSettings(orgId);

  const dailyGoal = settings?.daily_revenue_goal ?? 0;

  const handleSetGoal = useCallback(() => {
    const val = parseInt(goalInput, 10);
    if (Number.isNaN(val) || val < 0) return;
    updateSettings.mutate({ daily_revenue_goal: val });
    setEditingGoal(false);
  }, [goalInput, updateSettings]);

  const handleEditGoal = useCallback(() => {
    setGoalInput(String(dailyGoal || ""));
    setEditingGoal(true);
  }, [dailyGoal]);

  const handlePeriodChange = useCallback((p: Period) => {
    setPeriod(p);
  }, []);

  const dashboardExportColumns: ExportColumn<WorkOrderDetail>[] = useMemo(
    () => [
      { key: "id", label: "WO #", value: (wo) => wo.id.slice(0, 8) },
      {
        key: "customer",
        label: "Customer",
        value: (wo) =>
          wo.customer
            ? `${wo.customer.first_name ?? ""} ${wo.customer.last_name ?? ""}`.trim()
            : "—",
      },
      {
        key: "vehicle",
        label: "Vehicle",
        value: (wo) => wo.vehicle?.plate_number ?? "—",
      },
      { key: "status", label: "Status" },
      {
        key: "grand_total",
        label: "Total",
        format: "currency" as const,
        value: (wo) =>
          (wo.services ?? []).reduce(
            (s: number, x: { final_price: number }) =>
              s + Number(x.final_price),
            0,
          ) +
          (wo.parts ?? []).reduce(
            (s: number, x: { final_price: number }) =>
              s + Number(x.final_price),
            0,
          ),
      },
      { key: "created_at", label: "Date", format: "date" as const },
    ],
    [],
  );

  // ── Org Loading State ───────────────────────────────
  if (orgLoading) {
    return (
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Skeleton className="h-9 w-56" />
            <Skeleton className="mt-1.5 h-5 w-72" />
          </div>
          <Skeleton className="h-9 w-72 rounded-lg" />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
          {[1, 2, 3, 4].map((key) => (
            <Card key={key}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-28" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-9 w-28" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          {[1, 2].map((n) => (
            <Card key={n}>
              <CardHeader>
                <Skeleton className="h-5 w-44" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-72 w-full rounded-lg" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // ── Org Error State (redirect to org selection) ──────
  if (orgError || (!orgId && !orgLoading)) {
    const needsRedirect =
      !orgId && !orgLoading && !dashboardLoading && !dashboardError;
    if (needsRedirect) {
      router.replace("/auth/select-organization?returnUrl=/dashboard");
    }

    return (
      <div className="flex flex-col gap-6">
        <div>
          <Typography.H2 className="m-0">
            {t("dashboard.welcome")}
          </Typography.H2>
          <Typography.Muted className="mt-1">
            {t("dashboard.subtitle")}
          </Typography.Muted>
        </div>
        <Card className="py-12">
          <CardContent className="flex flex-col items-center gap-4">
            <Typography.Muted>{t("common.noData")}</Typography.Muted>
            <Button onClick={() => window.location.reload()}>
              {t("common.retry")}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Dashboard Loading State (first load, no data yet) ──
  if (dashboardLoading && !data) {
    return (
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Skeleton className="h-9 w-56" />
            <Skeleton className="mt-1.5 h-5 w-72" />
          </div>
          <Skeleton className="h-9 w-72 rounded-lg" />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
          {[1, 2, 3, 4].map((key) => (
            <Card key={key}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-28" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-9 w-28" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          {[1, 2].map((n) => (
            <Card key={n}>
              <CardHeader>
                <Skeleton className="h-5 w-44" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-72 w-full rounded-lg" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // ── Dashboard Error State ────────────────────────────
  if (dashboardError && !data) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <Typography.H2 className="m-0">
            {t("dashboard.welcome")}
          </Typography.H2>
          <Typography.Muted className="mt-1">
            {t("dashboard.subtitle")}
          </Typography.Muted>
        </div>
        <Card className="py-12">
          <CardContent className="flex flex-col items-center gap-4">
            <Typography.Muted>
              {errorMessage ?? t("common.noData")}
            </Typography.Muted>
            <Button onClick={() => refetchDashboard()}>
              {t("common.retry")}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) return null;

  const { summary, summaryComparison, insights, recentWorkOrders } = data;

  const hasRevenue = summary.totalRevenue > 0;
  const hasActiveWos = summary.activeWorkOrders > 0;

  if (!hasRevenue && !hasActiveWos) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <Typography.H2 className="m-0">
            {t("dashboard.welcome")}
          </Typography.H2>
          <Typography.Muted className="mt-1">
            {t("dashboard.subtitle")}
          </Typography.Muted>
        </div>
        <EmptyDashboardState onRetry={() => refetchDashboard()} />
      </div>
    );
  }

  // ── Header (shared across partial and full states) ──
  const header = (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <Typography.H2 className="m-0">{t("dashboard.welcome")}</Typography.H2>
        <Typography.Muted className="mt-1">
          {t("dashboard.subtitle")}
        </Typography.Muted>
      </div>
      <PeriodBar value={period} onChange={handlePeriodChange} />
    </div>
  );

  // ── Daily Revenue Goal Card ──
  const goalCard = (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        {editingGoal ? (
          <div className="flex items-center gap-2 p-4">
            <Target className="size-4 shrink-0 text-muted-foreground" />
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                ₮
              </span>
              <input
                type="number"
                value={goalInput}
                onChange={(e) => setGoalInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSetGoal()}
                className="flex h-10 w-full rounded-md border border-input bg-background pl-7 pr-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                placeholder="Enter daily revenue goal"
                min={0}
              />
            </div>
            <Button
              size="sm"
              onClick={handleSetGoal}
              disabled={updateSettings.isPending}
              aria-label="Save goal"
            >
              <Check className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setEditingGoal(false)}
              aria-label="Cancel"
            >
              <X className="size-4" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-4 p-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                <Target className="size-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Daily Goal</p>
                {settingsLoading ? (
                  <Skeleton className="mt-1 h-6 w-24" />
                ) : (
                  <p className="text-lg font-bold tabular-nums">
                    {dailyGoal > 0
                      ? formatCurrency(dailyGoal)
                      : "Not set"}
                  </p>
                )}
              </div>
            </div>
            {dailyGoal > 0 && summary.totalRevenue > 0 && (
              <div className="flex flex-col items-end gap-1">
                <div className="flex h-7 items-center gap-2 rounded-lg bg-muted px-3 text-sm font-semibold tabular-nums">
                  <span className="text-emerald-600">
                    {formatCurrency(summary.totalRevenue)}
                  </span>
                  <span className="text-muted-foreground">/</span>
                  <span>{formatCurrency(dailyGoal)}</span>
                </div>
                <div className="flex h-1.5 w-32 overflow-hidden rounded-full bg-muted">
                  <div
                    className="rounded-full bg-primary transition-all duration-500"
                    style={{
                      width: `${Math.min(100, Math.round((summary.totalRevenue / dailyGoal) * 100))}%`,
                    }}
                  />
                </div>
              </div>
            )}
            <button
              type="button"
              onClick={handleEditGoal}
              className="flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              aria-label="Set daily goal"
            >
              <Pencil className="size-3.5" />
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );

  // ── Active WOs exist but none completed ──
  if (!hasRevenue && hasActiveWos) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
        <div className="flex flex-col gap-8">
          {header}

          <Card className="border-amber-200/50 bg-amber-50/30 dark:border-amber-800/30 dark:bg-amber-950/10">
            <CardContent className="flex items-start gap-3 py-4">
              <TrendingUp className="mt-0.5 size-5 shrink-0 text-amber-500" />
              <Typography.Muted>
                <span className="font-semibold text-foreground">
                  {summary.activeWorkOrders} work order
                  {summary.activeWorkOrders === 1 ? "" : "s"} in progress.
                </span>{" "}
                Revenue and metrics appear here once work orders are marked{" "}
                <strong>Completed</strong>.
              </Typography.Muted>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-2 lg:gap-5">
            <KpiCard
              label={t("dashboard.activeWorkOrders")}
              value={String(summary.activeWorkOrders)}
              icon={Clock}
              loading={dashboardLoading}
              accentKey="activeWorkOrders"
            />
            <KpiCard
              label={t("dashboard.totalCustomers")}
              value={String(summary.totalCustomers)}
              icon={Users}
              loading={dashboardLoading}
              accentKey="totalCustomers"
            />
          </div>

          {insights.length > 0 && (
            <div className="flex flex-wrap gap-3">
              {insights.slice(0, 2).map((insight, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2.5 rounded-xl border border-border/60 bg-gradient-to-r from-primary/5 to-transparent px-4 py-2.5 text-sm"
                >
                  <Lightbulb className="size-4 shrink-0 text-amber-500" />
                  <span className="text-muted-foreground">{insight}</span>
                </div>
              ))}
            </div>
          )}

          <ChartsSection data={data} />

          <div>
            <SectionHeader
              title={t("dashboard.recentWorkOrders")}
              description={t("dashboard.recentWorkOrdersDesc")}
            />
            <RecentWorkOrdersTable
              workOrders={recentWorkOrders}
              router={router}
              t={t}
              workOrdersForExport={dashboardExportColumns}
            />
          </div>

          <DailyTimeline orgId={orgId ?? ""} />
          <QuickActions t={t} />
        </div>

        <aside className="hidden lg:block">
          <div className="sticky top-8">
            {goalCard}
          </div>
        </aside>
      </div>
    );
  }

  // ── Full dashboard state (has revenue) ──
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
      <div className="flex flex-col gap-8">
        {header}

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
          <KpiCard
            label={t("dashboard.totalRevenue")}
            value={formatCurrency(summary.totalRevenue)}
            icon={DollarSign}
            loading={dashboardLoading}
            accentKey="totalRevenue"
            trend={
              summaryComparison
                ? {
                    direction:
                      summary.totalRevenue > summaryComparison.totalRevenue
                        ? "up"
                        : summary.totalRevenue < summaryComparison.totalRevenue
                          ? "down"
                          : "neutral",
                    value: formatCurrency(
                      Math.abs(
                        summary.totalRevenue - summaryComparison.totalRevenue,
                      ),
                    ),
                  }
                : null
            }
          />
          <KpiCard
            label={t("dashboard.activeWorkOrders")}
            value={String(summary.activeWorkOrders)}
            icon={Clock}
            loading={dashboardLoading}
            accentKey="activeWorkOrders"
          />
          <KpiCard
            label={t("dashboard.avgRepairOrder")}
            value={formatCurrency(summary.avgRepairOrderValue)}
            icon={TrendingUp}
            loading={dashboardLoading}
            accentKey="avgRepairOrder"
          />
          <KpiCard
            label={t("dashboard.totalCustomers")}
            value={String(summary.totalCustomers)}
            icon={Users}
            loading={dashboardLoading}
            accentKey="totalCustomers"
          />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
          <KpiCard
            label={t("dashboard.serviceRevenue")}
            value={formatCurrency(summary.serviceRevenue)}
            icon={Wrench}
            loading={dashboardLoading}
            accentKey="serviceRevenue"
          />
          <KpiCard
            label={t("dashboard.partsRevenue")}
            value={formatCurrency(summary.partsRevenue)}
            icon={ClipboardList}
            loading={dashboardLoading}
            accentKey="partsRevenue"
          />
          <KpiCard
            label={t("dashboard.totalVehicles")}
            value={String(summary.totalVehicles)}
            icon={Car}
            loading={dashboardLoading}
            accentKey="totalVehicles"
          />
          <KpiCard
            label="Service Mix"
            value={`${summary.totalRevenue > 0 ? Math.round((summary.serviceRevenue / summary.totalRevenue) * 100) : 0}%`}
            icon={Percent}
            loading={dashboardLoading}
            accentKey="serviceMix"
          />
        </div>
        {insights.length > 0 && (
          <div className="flex flex-wrap gap-3">
            {insights.slice(0, 3).map((insight, i) => (
              <div
                key={i}
                className="flex items-center gap-2.5 rounded-xl border border-border/60 bg-gradient-to-r from-primary/5 to-transparent px-4 py-2.5 text-sm"
              >
                <Lightbulb className="size-4 shrink-0 text-amber-500" />
                <span className="text-muted-foreground">{insight}</span>
              </div>
            ))}
          </div>
        )}

        <ChartsSection data={data} />

        <div>
          <SectionHeader
            title={t("dashboard.recentWorkOrders")}
            description={t("dashboard.recentWorkOrdersDesc")}
          />
          <RecentWorkOrdersTable
            workOrders={recentWorkOrders}
            router={router}
            t={t}
            workOrdersForExport={dashboardExportColumns}
          />
        </div>

        <DailyTimeline orgId={orgId ?? ""} />
        <QuickActions t={t} />
      </div>
    </div>
  );
}
