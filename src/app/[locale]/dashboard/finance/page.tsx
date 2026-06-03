"use client";

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
  TrendingUp,
  Wallet,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useReducer, useState } from "react";
import type { DateRange } from "react-day-picker";
import { toast } from "sonner";
import { ExportButton } from "@/components/export-button";
import { ListToolbar } from "@/components/list-toolbar";
import { RecentList } from "@/components/sidebar-tabs/recent-list";
import { StatusSummary } from "@/components/sidebar-tabs/status-summary";
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
import { useRightSidebar } from "@/hooks/use-right-sidebar";
import type { ExportColumn } from "@/lib/export";
import { useFuzzySearch } from "@/lib/hooks/use-fuzzy-search";
import { useTableFilters } from "@/lib/hooks/use-url-filters";
import { Link } from "@/lib/i18n/navigation";
import { useExpenseStats, useExpenses } from "@/lib/queries/use-expenses";
import { useCurrentOrg } from "@/lib/queries/use-organization";
import { useDashboard } from "@/lib/queries/use-dashboard";
import { useOrgSettings } from "@/lib/queries/use-org-settings";
import { useSelectedBranchId, useSetSelectedBranchId } from "@/lib/stores";
import { BranchSelect } from "@/components/branch-select";
import { useBranches } from "@/lib/queries/use-branches";
import type { DashboardData } from "@/lib/types";
import { formatCurrency, formatMNT } from "@/lib/utils";
import { HighlightText } from "@/lib/utils/search-utils";
import { KpiCard } from "./_kpi-card";
import { OverviewTab } from "./_overview-tab";
import { TransactionsTab } from "./_transactions-tab";

type Tab = "overview" | "transactions" | "invoices" | "expenses";

function TabBar({
  value,
  onChange,
}: {
  value: Tab;
  onChange: (t: Tab) => void;
}) {
  const tabs: { key: Tab; label: string; icon: typeof DollarSign }[] = [
    { key: "overview", label: "Overview", icon: BarChart3 },
    { key: "transactions", label: "Transactions", icon: ClipboardList },
    { key: "invoices", label: "Invoices", icon: DollarSign },
    { key: "expenses", label: "Expenses", icon: TrendingUp },
  ];

  return (
    <div className="flex gap-1 rounded-xl border border-border bg-card p-1 w-fit">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        return (
          <Button
            key={tab.key}
            variant={value === tab.key ? "default" : "ghost"}
            onClick={() => onChange(tab.key)}
            className="gap-2"
          >
            <Icon className="size-4" />
            {tab.label}
          </Button>
        );
      })}
    </div>
  );
}

const invoiceStatusConfig: Record<
  string,
  { label: string; className: string }
> = {
  draft: {
    label: "Draft",
    className:
      "bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-800 dark:text-gray-400",
  },
  sent: {
    label: "Sent",
    className:
      "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/30 dark:text-blue-400",
  },
  paid: {
    label: "Paid",
    className:
      "bg-green-100 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-400",
  },
  partial: {
    label: "Partial",
    className:
      "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/30 dark:text-blue-400",
  },
  overdue: {
    label: "Overdue",
    className:
      "bg-red-100 text-red-700 border-red-300 dark:bg-red-900/30 dark:text-red-400 animate-pulse",
  },
  unpaid: {
    label: "Unpaid",
    className:
      "bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400",
  },
  cancelled: {
    label: "Cancelled",
    className:
      "bg-gray-100 text-gray-500 border-gray-200 dark:bg-gray-800 dark:text-gray-500",
  },
};

function InvoiceStatusBadge({ status }: { status: string }) {
  const cfg = invoiceStatusConfig[status] ?? invoiceStatusConfig.draft;
  return (
    <Badge variant="outline" className={cfg.className}>
      {cfg.label}
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

interface InvoiceDataState {
  loading: boolean;
  stats: InvoiceStats | null;
  invoices: InvoiceListItem[];
}

type InvoiceDataAction =
  | { type: "FETCH_START" }
  | {
      type: "FETCH_SUCCESS";
      stats: InvoiceStats | null;
      invoices: InvoiceListItem[];
    }
  | { type: "FETCH_DONE" };

function invoiceDataReducer(
  state: InvoiceDataState,
  action: InvoiceDataAction,
): InvoiceDataState {
  switch (action.type) {
    case "FETCH_START":
      return { ...state, loading: true };
    case "FETCH_SUCCESS":
      return {
        ...state,
        loading: false,
        stats: action.stats,
        invoices: action.invoices,
      };
    case "FETCH_DONE":
      return { ...state, loading: false };
  }
}

function InvoicesTab({ orgId }: { orgId: string | null }) {
  const t = useTranslations();
  const now = useClientNow();
  const {
    search,
    setSearch,
    status: filter,
    setStatus: setFilter,
  } = useTableFilters("finance-invoices");
  const [invoiceData, dispatchInvoice] = useReducer(invoiceDataReducer, {
    loading: true,
    stats: null,
    invoices: [],
  } satisfies InvoiceDataState);
  const { loading, stats, invoices } = invoiceData;
  const [sendingId, setSendingId] = useState<string | null>(null);

  const fetchInvoices = useCallback(
    async (oid: string, statusFilter: string) => {
      dispatchInvoice({ type: "FETCH_START" });
      try {
        const [statsJson, listJson] = await Promise.all([
          fetch(`/api/organizations/${oid}/invoices?type=stats`).then((r) =>
            r.json(),
          ),
          fetch(
            `/api/organizations/${oid}/invoices${statusFilter ? `?status=${statusFilter}` : ""}`,
          ).then((r) => r.json()),
        ]);
        dispatchInvoice({
          type: "FETCH_SUCCESS",
          stats: statsJson.data ?? null,
          invoices: listJson.data ?? [],
        });
      } catch {
        toast.error("Failed to load invoices");
        dispatchInvoice({ type: "FETCH_DONE" });
      }
    },
    [],
  );

  useEffect(() => {
    if (orgId) fetchInvoices(orgId, filter);
  }, [orgId, filter, fetchInvoices]);

  const handleSendEmail = useCallback(
    async (invoiceId: string, invoiceNumber: string) => {
      if (!orgId) return;
      setSendingId(invoiceId);
      try {
        const res = await fetch(
          `/api/organizations/${orgId}/invoices/${invoiceId}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "send_email" }),
          },
        );
        const json = await res.json();
        if (json.error) {
          toast.error(json.error.message ?? "Failed to send email");
        } else {
          toast.success(`Invoice #${invoiceNumber} sent via email`);
          if (orgId) fetchInvoices(orgId, filter);
        }
      } catch {
        toast.error("Failed to send invoice email");
      } finally {
        setSendingId(null);
      }
    },
    [orgId, fetchInvoices, filter],
  );

  const filtered = useFuzzySearch(invoices, search, {
    keys: ["invoice_number", "customer_name", "vehicle_plate"],
    threshold: 0.4,
    minQueryLength: 1,
  });

  const handleCopyLink = (token: string) => {
    const url = `${window.location.origin}/invoice/${token}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard");
  };

  const invoiceExportColumns: ExportColumn<InvoiceListItem>[] = [
    { key: "invoice_number", label: "Invoice #" },
    { key: "customer_name", label: "Customer" },
    { key: "vehicle_plate", label: "Vehicle" },
    { key: "status", label: "Status" },
    { key: "total", label: "Total", format: "currency" },
    { key: "amount_paid", label: "Paid", format: "currency" },
    { key: "balance_due", label: "Balance", format: "currency" },
    { key: "issued_at", label: "Date", format: "date" },
  ];

  const isLoading = loading && !stats;
  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    } catch {
      return iso;
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Total Invoices"
          value={isLoading ? "—" : String(stats?.total ?? 0)}
          icon={DollarSign}
          loading={isLoading}
        />
        <KpiCard
          label="Sent"
          value={isLoading ? "—" : String(stats?.sent ?? 0)}
          icon={ArrowUpRight}
          loading={isLoading}
        />
        <KpiCard
          label="Paid"
          value={isLoading ? "—" : String(stats?.paid ?? 0)}
          icon={TrendingUp}
          subtitle={
            stats?.totalRevenue ? formatCurrency(stats.totalRevenue) : undefined
          }
          loading={isLoading}
        />
        <KpiCard
          label="Outstanding"
          value={isLoading ? "—" : formatCurrency(stats?.outstanding ?? 0)}
          icon={Clock}
          subtitle={`${stats?.overdue ?? 0} overdue`}
          loading={isLoading}
        />
      </div>
      <ListToolbar
        search={{
          placeholder: "Search by invoice #, customer, or plate...",
          value: search,
          onChange: setSearch,
          resultLabel: filtered.length
            ? `${filtered.length} result${filtered.length === 1 ? "" : "s"}`
            : undefined,
          emptyLabel: search ? `No matches for "${search}"` : undefined,
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
                {s ? s.charAt(0).toUpperCase() + s.slice(1) : "All"}
              </Button>
            ))}
          </div>
        }
        actions={
          <div className="flex gap-2">
            <ExportButton
              data={invoices}
              columns={invoiceExportColumns}
              filename={`invoices-${now.toISOString().split("T")[0]}.xlsx`}
              sheetName="Invoices"
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
                    {t("common.invoiceNumber") ?? "Invoice #"}
                  </TableHead>
                  <TableHead className="px-5 py-3.5 text-left font-medium text-muted-foreground">
                    Customer
                  </TableHead>
                  <TableHead className="px-5 py-3.5 text-left font-medium text-muted-foreground">
                    Vehicle
                  </TableHead>
                  <TableHead className="px-5 py-3.5 text-left font-medium text-muted-foreground">
                    Status
                  </TableHead>
                  <TableHead className="px-5 py-3.5 text-right font-medium text-muted-foreground">
                    Total
                  </TableHead>
                  <TableHead className="px-5 py-3.5 text-right font-medium text-muted-foreground">
                    Date
                  </TableHead>
                  <TableHead className="px-5 py-3.5 text-right font-medium text-muted-foreground">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
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
                        {formatDate(inv.issued_at)}
                      </TableCell>
                      <TableCell className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {inv.email_sent_at && (
                            <Badge
                              variant="outline"
                              className="gap-1 text-[11px]"
                              title={`Sent ${new Date(inv.email_sent_at).toLocaleDateString()}`}
                            >
                              <Mail className="size-3" />
                              Sent
                            </Badge>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCopyLink(inv.public_token)}
                            title="Copy public link"
                          >
                            <ArrowUpRight className="size-3.5" />
                            Share
                          </Button>
                          {!inv.email_sent_at && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handleSendEmail(inv.id, inv.invoice_number)
                              }
                              disabled={sendingId === inv.id}
                              title={
                                inv.customer_email
                                  ? `Send invoice to ${inv.customer_email}`
                                  : "No customer email on this invoice"
                              }
                            >
                              {sendingId === inv.id ? (
                                <Loader2 className="size-3.5 animate-spin" />
                              ) : (
                                <Mail className="size-3.5" />
                              )}
                              Email
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
  const t = useTranslations();
  const { data: expenses, isLoading: expLoading } = useExpenses(
    orgId ?? undefined,
  );
  const { data: stats, isLoading: statsLoading } = useExpenseStats(
    orgId ?? undefined,
  );
  const isLoading = statsLoading || (expLoading && !expenses);
  const loading = isLoading && !stats;

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
              ? `${stats.unpaidAmount > 0 ? `${((stats.unpaidAmount / stats.totalAmount) * 100).toFixed(0)}% of total` : "All paid"}`
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
  const t = useTranslations();
  const { registerTab } = useRightSidebar();
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [tab, setTab] = useState<Tab>("overview");
  const [search, setSearch] = useState("");

  const { data: org, isPending: orgLoading, error: orgError } = useCurrentOrg();
  const orgId = org?.orgId ?? null;

  // ── Branch filter gated by finance_separate_per_branch toggle ──
  const selectedBranchId = useSelectedBranchId();
  const { settings: orgSettings } = useOrgSettings(orgId ?? undefined);
  const financeSeparate =
    (orgSettings as Record<string, unknown>)?.[
      "finance_separate_per_branch"
    ] === true;
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
    ? "Failed to load organization"
    : !orgId && !orgLoading
      ? "No organization found"
      : dataError
        ? dataError.message
        : null;

  useEffect(() => {
    if (!data) return;
    const s = data.summary;
    registerTab(
      "summary",
      "Summary",
      <StatusSummary
        title="Period Summary"
        items={[
          { label: "Total Revenue", count: s.totalRevenue },
          { label: "Service Revenue", count: s.serviceRevenue },
          { label: "Parts Revenue", count: s.partsRevenue },
          { label: "Active Orders", count: s.activeWorkOrders },
          { label: "Completed Today", count: s.completedToday },
          { label: "Gross Profit", count: s.grossProfit },
        ]}
      />,
    );
    registerTab(
      "recent",
      "Recent",
      <RecentList
        title="Recent Transactions"
        items={(data.recentWorkOrders ?? []).map((wo) => ({
          id: wo.id,
          primary:
            (wo.customer?.full_name ??
              `${wo.customer?.first_name ?? ""} ${wo.customer?.last_name ?? ""}`.trim()) ||
            t("common.unknown"),
          secondary: `${wo.vehicle?.plate_number ?? "—"} · ${formatCurrency(wo.total)}`,
          timestamp: new Date(wo.created_at).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          }),
          href: `/dashboard/work-orders/${wo.id}`,
        }))}
      />,
    );
  }, [data, registerTab]);

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
        ? `${formatCurrency(profit)} profit`
        : `-${formatCurrency(Math.abs(profit))} loss`;
    return `${formatCurrency(rev)} revenue · ${profitPart} (${margin.toFixed(1)}%) · ${summary.completedToday} completed · ${wo} active · avg ${formatCurrency(avg)}/WO`;
  }, [summary, loading, hasRevenue]);

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
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Skeleton className="h-9 w-40" />
            <Skeleton className="mt-1.5 size-56" />
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
      <div className="flex flex-col gap-6">
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
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
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
          {financeSeparate && (
            <BranchSelect
              value={selectedBranchId}
              onChange={useSetSelectedBranchId()}
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
          <AlertDescription>
            Showing all data — may be slow for large datasets.
          </AlertDescription>
        </Alert>
      )}

      {tab === "overview" && (
        <OverviewTab
          hasAnyData={hasAnyData}
          hasRevenue={hasRevenue}
          summary={summary ?? null}
          insightLine={insightLine}
          loading={loading}
          topServices={data?.topServices}
          revenueTrend={data?.revenueTrend ?? []}
        />
      )}

      {tab === "transactions" && (
        <TransactionsTab
          hasAnyData={hasAnyData}
          search={search}
          onSearchChange={setSearch}
          filteredWorkOrders={filteredWorkOrders}
          data={data ?? null}
        />
      )}

      {tab === "invoices" && <InvoicesTab orgId={orgId} />}

      {tab === "expenses" && <ExpensesTab orgId={orgId} />}
    </div>
  );
}
