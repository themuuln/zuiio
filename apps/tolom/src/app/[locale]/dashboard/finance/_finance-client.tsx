"use client";

import { subMonths } from "date-fns";
import {
  AlertCircle,
  BarChart3,
  ClipboardList,
  DollarSign,
  RotateCcw,
  TrendingUp,
} from "lucide-react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import type { DateRange } from "react-day-picker";
import { BranchSelect } from "@/components/branch-select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Typography } from "@/components/ui/typography";
import { useBranches } from "@/lib/queries/use-branches";
import { useDashboard } from "@/lib/queries/use-dashboard";
import { useOrgSettings } from "@/lib/queries/use-org-settings";
import { useCurrentOrg } from "@/lib/queries/use-organization";
import { useSelectedBranchId, useSetSelectedBranchId } from "@/lib/stores";
import type { DashboardData } from "@/lib/types";
import { formatCurrency, hasMultipleBranches } from "@/lib/utils";

const OverviewTab = dynamic(() =>
  import("./_overview-tab").then((m) => ({ default: m.OverviewTab })),
);
const TransactionsTab = dynamic(() =>
  import("./_transactions-tab").then((m) => ({ default: m.TransactionsTab })),
);
const RefundsTab = dynamic(() =>
  import("./_refunds-tab").then((m) => ({ default: m.RefundsTab })),
);
const InvoicesTab = dynamic(() =>
  import("./_invoices-tab").then((m) => ({ default: m.InvoicesTab })),
);
const ExpensesTab = dynamic(() =>
  import("./_expenses-tab").then((m) => ({ default: m.ExpensesTab })),
);

type Tab = "overview" | "transactions" | "invoices" | "expenses" | "refunds";

function TabBar({
  value,
  onChange,
}: {
  value: Tab;
  onChange: (t: Tab) => void;
}) {
  const t = useTranslations("finance") as (
    key: string,
    values?: Record<string, string | number>,
  ) => string;
  const tabs: { key: Tab; labelKey: string; icon: typeof DollarSign }[] = [
    { key: "overview", labelKey: "tabOverview", icon: BarChart3 },
    { key: "transactions", labelKey: "tabTransactions", icon: ClipboardList },
    { key: "invoices", labelKey: "tabInvoices", icon: DollarSign },
    { key: "expenses", labelKey: "tabExpenses", icon: TrendingUp },
    { key: "refunds", labelKey: "tabRefunds", icon: RotateCcw },
  ];

  return (
    <div
      role="tablist"
      aria-label={t("title")}
      className="flex gap-1 rounded-xl border border-border bg-card p-1 w-fit"
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = value === tab.key;
        return (
          <Button
            key={tab.key}
            id={`finance-tab-${tab.key}`}
            role="tab"
            type="button"
            variant={isActive ? "default" : "ghost"}
            aria-selected={isActive}
            aria-controls={`finance-panel-${tab.key}`}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onChange(tab.key)}
            className="gap-2"
          >
            <Icon className="size-4" aria-hidden="true" />
            {t(tab.labelKey)}
          </Button>
        );
      })}
    </div>
  );
}

export default function FinancePage() {
  const t = useTranslations() as (
    key: string,
    values?: Record<string, string | number>,
  ) => string;
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => ({
    from: subMonths(new Date(), 3),
    to: new Date(),
  }));
  const [tab, setTab] = useState<Tab>("overview");
  const [search, setSearch] = useState("");

  const { data: org, isPending: orgLoading, error: orgError } = useCurrentOrg();
  const orgId = org?.orgId ?? null;

  // ── Branch filter gated by finance_separate_per_branch toggle ──
  const selectedBranchId = useSelectedBranchId();
  const setSelectedBranchId = useSetSelectedBranchId();
  const { settings: orgSettings } = useOrgSettings(orgId ?? undefined);
  const financeSeparate =
    (orgSettings as Record<string, unknown>)?.finance_separate_per_branch ===
    true;
  const branchFilter =
    financeSeparate && selectedBranchId !== "all" ? selectedBranchId : null;
  const { data: branches = [] } = useBranches(orgId ?? undefined);

  const dateFrom = dateRange?.from?.toISOString().split("T")[0];
  const dateTo = dateRange?.to?.toISOString().split("T")[0];

  const {
    data,
    isPending: dataLoading,
    error: dataError,
  } = useDashboard(orgId ?? undefined, {
    dateFrom,
    dateTo,
    branchId: branchFilter,
  });

  const loading = orgLoading || (!!orgId && dataLoading);
  const error = orgError
    ? t("finance.failedToLoadOrg")
    : !orgId && !orgLoading
      ? t("finance.noOrgFound")
      : dataError
        ? dataError.message
        : null;

  const summary = data?.summary;
  const hasRevenue = (summary?.totalRevenue ?? 0) > 0;
  const hasActiveWos = (summary?.activeWorkOrders ?? 0) > 0;
  const hasTransactions = (data?.recentWorkOrders?.length ?? 0) > 0;
  const hasAnyData = hasRevenue || hasActiveWos || hasTransactions;

  const insightLine = useMemo(() => {
    if (!summary || loading || !hasRevenue) return null;
    const rev = summary.totalRevenue;
    const wo = summary.activeWorkOrders;
    const avg = summary.avgRepairOrderValue;
    const profit = summary.grossProfit;
    const margin = summary.marginPercent;
    const profitPart =
      profit >= 0
        ? `${formatCurrency(profit)} ${t("finance.profit")}`
        : `-${formatCurrency(Math.abs(profit))} ${t("finance.loss")}`;
    return `${formatCurrency(rev)} ${t("finance.revenueWord")} · ${profitPart} (${margin.toFixed(1)}%) · ${summary.completedToday} ${t("finance.completedWord")} · ${wo} ${t("finance.activeWord")} · ${t("finance.avgPerWo")} ${formatCurrency(avg)}/WO`;
  }, [summary, loading, hasRevenue, t]);

  const filteredWorkOrders = useMemo<DashboardData["recentWorkOrders"]>(() => {
    if (!data?.recentWorkOrders) return [];
    if (!search) return data.recentWorkOrders;
    const q = search.toLowerCase();
    return data.recentWorkOrders.filter((wo) => {
      const woAny = wo as {
        customer?: { first_name?: string | null; last_name?: string | null };
      };
      const customerName =
        `${woAny.customer?.first_name ?? ""} ${woAny.customer?.last_name ?? ""}`.toLowerCase();
      return (
        wo.id.toLowerCase().includes(q) ||
        customerName.includes(q) ||
        (wo.vehicle?.plate_number ?? "").toLowerCase().includes(q) ||
        wo.status.toLowerCase().includes(q)
      );
    });
  }, [data?.recentWorkOrders, search]);

  if (error && !data) {
    return (
      <div className="flex flex-col gap-6 px-4 pt-4 pb-6 md:px-6">
        <div>
          <Typography.H1 className="text-2xl font-semibold tracking-tight">
            {t("nav.finance")}
          </Typography.H1>
          <Typography.Muted className="mt-1 text-muted-foreground">
            {t("finance.subtitle")}
          </Typography.Muted>
        </div>
        <Card className="py-12">
          <CardContent className="flex flex-col items-center gap-4">
            <Typography.Muted className="text-muted-foreground">
              {error}
            </Typography.Muted>
            <Button onClick={() => window.location.reload()}>
              {t("finance.retry")}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 px-4 pt-4 pb-6 md:px-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Typography.H1 className="text-2xl font-semibold tracking-tight">
            {t("nav.finance")}
          </Typography.H1>
          <Typography.Muted className="mt-1 text-muted-foreground">
            {t("finance.subtitle")}
          </Typography.Muted>
        </div>
        <div className="flex flex-col items-end gap-3">
          {financeSeparate && hasMultipleBranches(branches) && (
            <BranchSelect
              value={selectedBranchId}
              onChange={setSelectedBranchId}
              branches={branches}
              placeholder={t("dashboard.branch")}
              allLabel={t("dashboard.allBranches")}
              className="min-w-44"
            />
          )}
          <DateRangePicker
            value={dateRange}
            onChange={setDateRange}
            className="w-full sm:w-[260px]"
            align="end"
          />
          <TabBar value={tab} onChange={setTab} />
        </div>
      </div>

      {!dateRange?.from && !dateRange?.to && (
        <Alert>
          <AlertCircle className="size-4" />
          <AlertTitle>{t("finance.largeDataset")}</AlertTitle>
          <AlertDescription>{t("finance.largeDatasetDesc")}</AlertDescription>
        </Alert>
      )}

      {tab === "overview" && (
        <div
          id="finance-panel-overview"
          role="tabpanel"
          aria-labelledby="finance-tab-overview"
        >
          <OverviewTab
            hasAnyData={hasAnyData}
            hasRevenue={hasRevenue}
            summary={summary ?? null}
            insightLine={insightLine}
            loading={loading}
            topServices={data?.topServices}
            revenueTrend={data?.revenueTrend ?? []}
          />
        </div>
      )}

      {tab === "transactions" && (
        <div
          id="finance-panel-transactions"
          role="tabpanel"
          aria-labelledby="finance-tab-transactions"
        >
          <TransactionsTab
            hasAnyData={hasAnyData}
            search={search}
            onSearchChange={setSearch}
            filteredWorkOrders={filteredWorkOrders}
            data={data ?? null}
          />
        </div>
      )}

      {tab === "invoices" && (
        <div
          id="finance-panel-invoices"
          role="tabpanel"
          aria-labelledby="finance-tab-invoices"
        >
          <InvoicesTab orgId={orgId} />
        </div>
      )}

      {tab === "expenses" && (
        <div
          id="finance-panel-expenses"
          role="tabpanel"
          aria-labelledby="finance-tab-expenses"
        >
          <ExpensesTab orgId={orgId} />
        </div>
      )}

      {tab === "refunds" && orgId && (
        <div
          id="finance-panel-refunds"
          role="tabpanel"
          aria-labelledby="finance-tab-refunds"
        >
          <RefundsTab orgId={orgId} />
        </div>
      )}
    </div>
  );
}
