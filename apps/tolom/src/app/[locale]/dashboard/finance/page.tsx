"use client";

import { subMonths } from "date-fns";
import {
  AlertCircle,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  ClipboardList,
  Clock,
  DollarSign,
  Loader2,
  Mail,
  RotateCcw,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { DateRange } from "react-day-picker";
import { toast } from "sonner";
import { BranchSelect } from "@/components/branch-select";
import { ExportButton } from "@/components/export-button";
import { ListToolbar } from "@/components/list-toolbar";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import {
  Empty,
  EmptyContent,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Typography } from "@/components/ui/typography";
import { useClientNow } from "@/hooks/use-client-now";

// ── Shared helpers (module scope to avoid per-render rebuild) ──

function formatInvoiceDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  } catch (error) {
    reportServerError("Unexpected error", error);
    return iso;
  }
}

import { useFuzzySearch } from "@zuiio/hooks";
import type { ExportColumn } from "@/lib/export";
import { useTableFilters } from "@/lib/hooks/use-table-filters";
import { Link } from "@/lib/i18n/navigation";
import { useBranches } from "@/lib/queries/use-branches";
import { useDashboard } from "@/lib/queries/use-dashboard";
import { useExpenseStats, useExpenses } from "@/lib/queries/use-expenses";
import {
  useInvoiceStats,
  useInvoices,
  useSendInvoiceEmail,
} from "@/lib/queries/use-invoices";
import { useOrgSettings } from "@/lib/queries/use-org-settings";
import { useCurrentOrg } from "@/lib/queries/use-organization";
import { reportServerError } from "@/lib/sentry-report-server";
import { useSelectedBranchId, useSetSelectedBranchId } from "@/lib/stores";
import type { DashboardData } from "@/lib/types";
import { formatCurrency, formatMNT, hasMultipleBranches } from "@/lib/utils";
import { HighlightText } from "@/lib/utils/search-utils";
import { KpiCard } from "./_kpi-card";
import { OverviewTab } from "./_overview-tab";
import { RefundsTab } from "./_refunds-tab";
import { TransactionsTab } from "./_transactions-tab";

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

const invoiceStatusConfig: Record<
  string,
  { labelKey: string; className: string }
> = {
  draft: {
    labelKey: "statusDraft",
    className:
      "bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-800 dark:text-gray-400",
  },
  sent: {
    labelKey: "statusSent",
    className:
      "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/30 dark:text-blue-400",
  },
  paid: {
    labelKey: "statusPaid",
    className:
      "bg-green-100 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-400",
  },
  partial: {
    labelKey: "statusPartial",
    className:
      "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/30 dark:text-blue-400",
  },
  overdue: {
    labelKey: "statusOverdue",
    className:
      "bg-red-100 text-red-700 border-red-300 dark:bg-red-900/30 dark:text-red-400 animate-pulse",
  },
  unpaid: {
    labelKey: "statusUnpaid",
    className:
      "bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400",
  },
  cancelled: {
    labelKey: "statusCancelled",
    className:
      "bg-gray-100 text-gray-500 border-gray-200 dark:bg-gray-800 dark:text-gray-500",
  },
};

function InvoiceStatusBadge({ status }: { status: string }) {
  const t = useTranslations("finance") as (
    key: string,
    values?: Record<string, string | number>,
  ) => string;
  const cfg = invoiceStatusConfig[status] ?? invoiceStatusConfig.draft;
  return (
    <Badge variant="outline" className={cfg.className}>
      {t(cfg.labelKey)}
    </Badge>
  );
}

interface InvoiceListItem {
  id: string;
  invoice_number: string;
  status: string;
  total: number;
  balance_due: number;
  amount_paid: number;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  vehicle_plate: string | null;
  public_token: string;
  email_sent_at: string | null;
  issued_at: string;
  due_at: string | null;
}

interface InvoiceStats {
  total: number;
  draft: number;
  sent: number;
  paid: number;
  overdue: number;
  totalRevenue: number;
  outstanding: number;
}

function InvoicesTab({ orgId }: { orgId: string | null }) {
  const t = useTranslations("finance") as (
    key: string,
    values?: Record<string, string | number>,
  ) => string;
  const now = useClientNow();
  const {
    search,
    setSearch,
    status: filter,
    setStatus: setFilter,
  } = useTableFilters("finance-invoices");
  const { data: statsData, isPending: statsLoading } = useInvoiceStats(
    orgId ?? undefined,
  );
  const stats = statsData as InvoiceStats | undefined;
  const { data: invoices, isPending: invoicesLoading } = useInvoices(
    orgId ?? undefined,
    filter,
  );
  const invoiceListItems = (invoices ?? []) as unknown as InvoiceListItem[];
  const sendEmail = useSendInvoiceEmail(orgId ?? undefined);

  const isPending = statsLoading || (invoicesLoading && !invoices);

  const handleSendEmail = useCallback(
    async (invoiceId: string, _invoiceNumber: string) => {
      if (!orgId) return;
      try {
        await sendEmail.mutateAsync({ invoiceId });
      } catch (error) {
        reportServerError("Unexpected error", error);
        // Toast handled by useOrgMutation via successMessage/error handling
      }
    },
    [orgId, sendEmail],
  );

  const filtered = useFuzzySearch(invoiceListItems, search, {
    keys: ["invoice_number", "customer_name", "vehicle_plate"],
    threshold: 0.4,
    minQueryLength: 1,
  });

  const handleCopyLink = (token: string) => {
    const url = `${window.location.origin}/invoice/${token}`;
    navigator.clipboard.writeText(url);
    toast.success(t("linkCopied"));
  };

  const invoiceExportColumns: ExportColumn<InvoiceListItem>[] = [
    { key: "invoice_number", label: t("invoiceNumber") },
    { key: "customer_name", label: t("customer") },
    { key: "vehicle_plate", label: t("vehicle") },
    { key: "status", label: t("status") },
    { key: "total", label: t("total"), format: "currency" },
    { key: "amount_paid", label: t("paid"), format: "currency" },
    { key: "balance_due", label: t("balance"), format: "currency" },
    { key: "issued_at", label: t("date"), format: "date" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label={t("totalInvoices")}
          value={isPending ? "—" : String(stats?.total ?? 0)}
          icon={DollarSign}
          loading={isPending}
        />
        <KpiCard
          label={t("sent")}
          value={isPending ? "—" : String(stats?.sent ?? 0)}
          icon={ArrowUpRight}
          loading={isPending}
        />
        <KpiCard
          label={t("paid")}
          value={isPending ? "—" : String(stats?.paid ?? 0)}
          icon={TrendingUp}
          subtitle={
            stats?.totalRevenue ? formatCurrency(stats.totalRevenue) : undefined
          }
          loading={isPending}
        />
        <KpiCard
          label={t("outstanding")}
          value={isPending ? "—" : formatCurrency(stats?.outstanding ?? 0)}
          icon={Clock}
          subtitle={`${stats?.overdue ?? 0} ${t("overdueCount")}`}
          loading={isPending}
        />
      </div>
      <ListToolbar
        search={{
          placeholder: t("searchInvoices"),
          value: search,
          onChange: setSearch,
          resultLabel: filtered.length
            ? t("resultsCount", { count: filtered.length })
            : undefined,
          emptyLabel: search ? t("noMatches", { query: search }) : undefined,
        }}
        filters={
          <div className="flex gap-2 flex-wrap">
            {[
              "",
              "draft",
              "sent",
              "paid",
              "overdue",
              "partial",
              "cancelled",
            ].map((s) => (
              <Button
                key={s}
                variant={filter === s ? "default" : "ghost"}
                size="sm"
                onClick={() => setFilter(s)}
              >
                {(
                  {
                    "": t("filterAll"),
                    draft: t("statusDraft"),
                    sent: t("statusSent"),
                    paid: t("statusPaid"),
                    overdue: t("statusOverdue"),
                    partial: t("statusPartial"),
                    cancelled: t("statusCancelled"),
                  } as Record<string, string>
                )[s] ?? s}
              </Button>
            ))}
          </div>
        }
        actions={
          <div className="flex gap-2">
            <ExportButton
              data={invoiceListItems}
              columns={invoiceExportColumns}
              filename={`invoices-${now.toISOString().split("T")[0]}.xlsx`}
              sheetName={t("invoicesSheet")}
            />
          </div>
        }
      />
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="px-5 py-3.5 text-left font-medium text-muted-foreground">
                    {t("invoiceNumber")}
                  </TableHead>
                  <TableHead className="px-5 py-3.5 text-left font-medium text-muted-foreground">
                    {t("customer")}
                  </TableHead>
                  <TableHead className="px-5 py-3.5 text-left font-medium text-muted-foreground">
                    {t("vehicle")}
                  </TableHead>
                  <TableHead className="px-5 py-3.5 text-left font-medium text-muted-foreground">
                    {t("status")}
                  </TableHead>
                  <TableHead className="px-5 py-3.5 text-right font-medium text-muted-foreground">
                    {t("total")}
                  </TableHead>
                  <TableHead className="px-5 py-3.5 text-right font-medium text-muted-foreground">
                    {t("date")}
                  </TableHead>
                  <TableHead className="px-5 py-3.5 text-right font-medium text-muted-foreground">
                    {t("actions")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isPending ? (
                  <TableRow>
                    <TableCell colSpan={7} className="px-5 py-16">
                      <Skeleton className="h-8 w-full" />
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="px-5 py-16 text-center text-muted-foreground"
                    >
                      No invoices found
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((inv) => (
                    <TableRow
                      key={inv.id}
                      className="border-b border-border transition-colors hover:bg-muted/30"
                    >
                      <TableCell className="px-5 py-3.5 font-mono text-xs font-medium">
                        <HighlightText
                          text={inv.invoice_number}
                          query={search}
                        />
                      </TableCell>
                      <TableCell className="px-5 py-3.5">
                        {inv.customer_name ? (
                          <HighlightText
                            text={inv.customer_name}
                            query={search}
                          />
                        ) : (
                          "\u2014"
                        )}
                      </TableCell>
                      <TableCell className="px-5 py-3.5 text-muted-foreground">
                        {inv.vehicle_plate ? (
                          <HighlightText
                            text={inv.vehicle_plate}
                            query={search}
                          />
                        ) : (
                          "\u2014"
                        )}
                      </TableCell>
                      <TableCell className="px-5 py-3.5">
                        <InvoiceStatusBadge status={inv.status} />
                      </TableCell>
                      <TableCell className="px-5 py-3.5 text-right font-medium tabular-nums">
                        {formatCurrency(inv.total)}
                      </TableCell>
                      <TableCell className="px-5 py-3.5 text-right text-muted-foreground">
                        {formatInvoiceDate(inv.issued_at)}
                      </TableCell>
                      <TableCell className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {inv.email_sent_at && (
                            <Badge
                              variant="outline"
                              className="gap-1 text-[11px]"
                              title={t("sentOn", {
                                date: new Date(
                                  inv.email_sent_at,
                                ).toLocaleDateString(),
                              })}
                            >
                              <Mail className="size-3" />
                              {t("sentBadge")}
                            </Badge>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCopyLink(inv.public_token)}
                            title={t("copyPublicLink")}
                          >
                            <ArrowUpRight className="size-3.5" />
                            {t("share")}
                          </Button>
                          {!inv.email_sent_at && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handleSendEmail(inv.id, inv.invoice_number)
                              }
                              disabled={sendEmail.isPending}
                              title={
                                inv.customer_email
                                  ? t("sendInvoiceTo", {
                                      email: inv.customer_email,
                                    })
                                  : t("noCustomerEmail")
                              }
                            >
                              {sendEmail.isPending ? (
                                <Loader2 className="size-3.5 animate-spin" />
                              ) : (
                                <Mail className="size-3.5" />
                              )}
                              {t("email")}
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Expenses Tab ──────────────────────────────────
function ExpensesTab({ orgId }: { orgId: string | null }) {
  const t = useTranslations() as (
    key: string,
    values?: Record<string, string | number>,
  ) => string;
  const { data: expenses, isPending: expLoading } = useExpenses(
    orgId ?? undefined,
  );
  const { data: stats, isPending: statsLoading } = useExpenseStats(
    orgId ?? undefined,
  );
  const isPending = statsLoading || (expLoading && !expenses);
  const loading = isPending && !stats;

  const recentExpenses = (expenses ?? []).slice(0, 10);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label={t("expenses.totalExpenses")}
          value={loading ? "\u2014" : String(stats?.totalExpenses ?? 0)}
          icon={Wallet}
          loading={loading}
        />
        <KpiCard
          label={t("expenses.totalAmount")}
          value={loading ? "\u2014" : formatMNT(stats?.totalAmount ?? 0)}
          icon={DollarSign}
          loading={loading}
        />
        <KpiCard
          label={t("expenses.thisMonth")}
          value={loading ? "\u2014" : formatMNT(stats?.thisMonth ?? 0)}
          icon={TrendingUp}
          loading={loading}
        />
        <KpiCard
          label={t("expenses.unpaid")}
          value={loading ? "\u2014" : formatMNT(stats?.unpaidAmount ?? 0)}
          icon={Clock}
          subtitle={
            stats
              ? `${stats.unpaidAmount > 0 ? t("finance.percentOfTotal", { percent: ((stats.unpaidAmount / stats.totalAmount) * 100).toFixed(0) }) : t("finance.allPaid")}`
              : undefined
          }
          loading={loading}
        />
      </div>

      <div className="flex items-center justify-between">
        <Typography.Muted className="text-sm font-medium text-muted-foreground">
          {t("expenses.title")}
        </Typography.Muted>
        <Button
          render={<Link href="/dashboard/expenses" />}
          variant="outline"
          size="sm"
        >
          <ArrowRight className="size-4" />
          {t("common.viewAll")}
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-5">
              <Skeleton className="h-8 w-full" />
            </div>
          ) : recentExpenses.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Wallet />
                </EmptyMedia>
                <EmptyTitle>{t("expenses.noExpenses")}</EmptyTitle>
              </EmptyHeader>
              <EmptyContent>
                <Button
                  render={<Link href="/dashboard/expenses/new" />}
                  variant="outline"
                  size="sm"
                >
                  {t("expenses.addExpense")}
                </Button>
              </EmptyContent>
            </Empty>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="px-5 py-3.5 text-left font-medium text-muted-foreground">
                      {t("common.date")}
                    </TableHead>
                    <TableHead className="px-5 py-3.5 text-left font-medium text-muted-foreground">
                      {t("common.description")}
                    </TableHead>
                    <TableHead className="px-5 py-3.5 text-left font-medium text-muted-foreground">
                      {t("expenses.category")}
                    </TableHead>
                    <TableHead className="px-5 py-3.5 text-right font-medium text-muted-foreground">
                      {t("common.amount")}
                    </TableHead>
                    <TableHead className="px-5 py-3.5 text-center font-medium text-muted-foreground">
                      {t("common.status")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentExpenses.map((exp) => (
                    <TableRow
                      key={exp.id}
                      className="border-b border-border transition-colors hover:bg-muted/30"
                    >
                      <TableCell className="px-5 py-3.5 text-muted-foreground">
                        {new Date(exp.expense_date).toLocaleDateString(
                          "en-US",
                          { month: "short", day: "numeric" },
                        )}
                      </TableCell>
                      <TableCell className="px-5 py-3.5 font-medium">
                        {exp.description}
                      </TableCell>
                      <TableCell className="px-5 py-3.5">
                        {exp.category ? (
                          <span
                            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium"
                            style={{
                              backgroundColor: `${exp.category.color}20`,
                              color: exp.category.color,
                            }}
                          >
                            <span
                              className="size-1.5 rounded-full"
                              style={{ backgroundColor: exp.category.color }}
                            />
                            {exp.category.name}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">&mdash;</span>
                        )}
                      </TableCell>
                      <TableCell className="px-5 py-3.5 text-right font-medium tabular-nums">
                        {formatMNT(exp.amount)}
                      </TableCell>
                      <TableCell className="px-5 py-3.5 text-center">
                        {exp.paid_at ? (
                          <Badge variant="outline">{t("expenses.paid")}</Badge>
                        ) : (
                          <Badge variant="outline">
                            {t("expenses.unpaid")}
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
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

  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  useEffect(() => {
    if (data) setHasLoadedOnce(true);
  }, [data]);

  const loading = orgLoading || (!!orgId && dataLoading && !hasLoadedOnce);
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

  if (loading && !hasLoadedOnce) {
    return (
      <div className="flex flex-col gap-6 px-4 pt-4 pb-6 md:px-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Typography.H1 className="text-2xl font-semibold tracking-tight">
              {t("nav.finance")}
            </Typography.H1>
            <Typography.Muted className="mt-1 text-muted-foreground">
              {t("finance.subtitle")}
            </Typography.Muted>
          </div>
          <Skeleton className="h-9 w-72 rounded-lg" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={`skeleton-${i}`}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-28" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-9 w-28" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Skeleton className="h-20 w-full rounded-xl" />
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-36" />
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={`skeleton-${i}`} className="flex items-center gap-4">
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-24 shrink-0" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

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
