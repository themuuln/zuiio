"use client";

import {
  ArrowUpRight,
  BarChart3,
  ClipboardList,
  Clock,
  DollarSign,
  Download,
  Percent,
  TrendingUp,
  Users,
  Wrench,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ListToolbar } from "@/components/list-toolbar";
import { SearchInput } from "@/components/search-input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { DashboardData } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

type Period = "today" | "week" | "month" | "all";
type Tab = "overview" | "transactions" | "invoices";

// ── Period Pills ─────────────────────────────────────────

type PeriodOption = { key: Period; label: string };

const PERIOD_OPTIONS: PeriodOption[] = [
  { key: "today", label: "Today" },
  { key: "week", label: "This Week" },
  { key: "month", label: "This Month" },
  { key: "all", label: "All Time" },
];

function PeriodBar({
  value,
  onChange,
}: {
  value: Period;
  onChange: (p: Period) => void;
}) {
  return (
    <div className="flex gap-1.5">
      {PERIOD_OPTIONS.map((opt) => (
        <button
          key={opt.key}
          type="button"
          onClick={() => onChange(opt.key)}
          className={`rounded-lg px-3.5 py-1.5 text-xs font-medium transition-colors ${
            value === opt.key
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

// ── Tab Bar ──────────────────────────────────────────────

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
  ];

  return (
    <div className="flex gap-1 rounded-xl border border-border bg-card p-1 w-fit">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => onChange(tab.key)}
            className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
              value === tab.key
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            <Icon className="size-4" />
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

// ── KPI Card ─────────────────────────────────────────────

function KpiCard({
  label,
  value,
  icon: Icon,
  subtitle,
  loading,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  subtitle?: string;
  loading?: boolean;
}) {
  return (
    <Card className="transition-shadow hover:shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {label}
        </CardTitle>
        <Icon className="size-4 text-muted-foreground" aria-hidden="true" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-9 w-28" />
        ) : (
          <>
            <div className="text-3xl font-bold tracking-tight tabular-nums">
              {value}
            </div>
            {subtitle && (
              <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ── Revenue Breakup Bar ───────────────────────────────────

function RevenueSplitBar({
  total,
  service,
  parts,
  loading,
}: {
  total: number;
  service: number;
  parts: number;
  loading?: boolean;
}) {
  if (loading) return <Skeleton className="h-16 w-full rounded-xl" />;
  if (total === 0) return null;

  const svcPct = Math.round((service / total) * 100);
  const prtPct = Math.round((parts / total) * 100);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold">
          Revenue Breakdown
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="bg-blue-500 transition-all"
            style={{ width: `${svcPct}%` }}
            title={`Services: ${svcPct}%`}
          />
          <div
            className="bg-amber-500 transition-all"
            style={{ width: `${prtPct}%` }}
            title={`Parts: ${prtPct}%`}
          />
        </div>
        <div className="flex justify-between text-sm">
          <div className="flex items-center gap-2">
            <span className="size-2.5 rounded-full bg-blue-500" />
            <span className="text-muted-foreground">Services</span>
            <span className="font-semibold tabular-nums">
              {formatCurrency(service)}
            </span>
            <span className="text-xs text-muted-foreground">({svcPct}%)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="size-2.5 rounded-full bg-amber-500" />
            <span className="text-muted-foreground">Parts</span>
            <span className="font-semibold tabular-nums">
              {formatCurrency(parts)}
            </span>
            <span className="text-xs text-muted-foreground">({prtPct}%)</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Empty / No-Revenue States ────────────────────────────

function EmptyFinanceState() {
  return (
    <Card className="py-16">
      <CardContent className="flex flex-col items-center gap-5">
        <div className="flex size-16 items-center justify-center rounded-full bg-muted">
          <DollarSign className="size-8 text-muted-foreground" />
        </div>
        <div className="max-w-md text-center">
          <h3 className="text-lg font-semibold">No financial data yet</h3>
          <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
            Complete work orders with services and parts to see your revenue
            breakdown, financial KPIs, and transaction history.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function NoRevenueBanner({ activeWorkOrders }: { activeWorkOrders: number }) {
  return (
    <Card className="border-amber-200/50 bg-amber-50/30 dark:border-amber-800/30 dark:bg-amber-950/10">
      <CardContent className="flex items-start gap-3 py-4">
        <TrendingUp className="mt-0.5 size-5 shrink-0 text-amber-500" />
        <div className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">{activeWorkOrders} work order{activeWorkOrders === 1 ? "" : "s"} in progress.</span>
          {" "}Revenue appears here once work orders are marked <strong>Completed</strong> —
          close out jobs to see financial metrics, service mix, and breakdown.
        </div>
      </CardContent>
    </Card>
  );
}

// ── Invoice Status Badge ──────────────────────────────────

const invoiceStatusConfig: Record<string, { label: string; className: string }> = {
  draft: { label: "Draft", className: "bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-800 dark:text-gray-400" },
  sent: { label: "Sent", className: "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/30 dark:text-blue-400" },
  paid: { label: "Paid", className: "bg-green-100 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-400" },
  partial: { label: "Partial", className: "bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-900/30 dark:text-orange-400" },
  overdue: { label: "Overdue", className: "bg-red-100 text-red-700 border-red-300 dark:bg-red-900/30 dark:text-red-400" },
  cancelled: { label: "Cancelled", className: "bg-gray-100 text-gray-500 border-gray-200 dark:bg-gray-800 dark:text-gray-500" },
};

function InvoiceStatusBadge({ status }: { status: string }) {
  const cfg = invoiceStatusConfig[status] ?? invoiceStatusConfig.draft;
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${cfg.className}`}>
      {cfg.label}
    </span>
  );
}

// ── Invoices Tab ─────────────────────────────────────────

interface InvoiceListItem {
  id: string;
  invoice_number: string;
  status: string;
  total: number;
  balance_due: number;
  amount_paid: number;
  customer_name: string | null;
  customer_phone: string | null;
  vehicle_plate: string | null;
  public_token: string;
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

function InvoicesTab({
  orgId,
}: {
  orgId: string | null;
}) {
  const t = useTranslations();
  const [stats, setStats] = useState<InvoiceStats | null>(null);
  const [invoices, setInvoices] = useState<InvoiceListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("");
  const [search, setSearch] = useState("");

  const fetchInvoices = useCallback(async (oid: string, statusFilter: string) => {
    setLoading(true);
    try {
      const [statsRes, listRes] = await Promise.all([
        fetch(`/api/organizations/${oid}/invoices?type=stats`),
        fetch(`/api/organizations/${oid}/invoices${statusFilter ? `?status=${statusFilter}` : ""}`),
      ]);
      const statsJson = await statsRes.json();
      const listJson = await listRes.json();
      if (statsJson.data) setStats(statsJson.data);
      if (listJson.data) setInvoices(listJson.data);
    } catch {
      toast.error("Failed to load invoices");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (orgId) fetchInvoices(orgId, filter);
  }, [orgId, filter, fetchInvoices]);

  // Filter by search
  const filtered = useMemo(() => {
    if (!search) return invoices;
    const q = search.toLowerCase();
    return invoices.filter(
      (inv) =>
        inv.invoice_number.toLowerCase().includes(q) ||
        (inv.customer_name ?? "").toLowerCase().includes(q) ||
        (inv.vehicle_plate ?? "").toLowerCase().includes(q),
    );
  }, [invoices, search]);

  const handleCopyLink = (token: string) => {
    const url = `${window.location.origin}/invoice/${token}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard");
  };

  const handleExportCsv = () => {
    const headers = ["Invoice #","Customer","Vehicle","Status","Total","Paid","Balance","Date"];
    const rows = invoices.map((inv) => [
      inv.invoice_number,
      inv.customer_name ?? "",
      inv.vehicle_plate ?? "",
      inv.status,
      inv.total,
      inv.amount_paid,
      inv.balance_due,
      new Date(inv.issued_at).toLocaleDateString(),
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `invoices-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const isLoading = loading && !stats;

  return (
    <div className="flex flex-col gap-6">
      {/* Invoice Stats */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
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
          subtitle={stats?.totalRevenue ? formatCurrency(stats.totalRevenue) : undefined}
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

      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2 flex-wrap">
          {["", "draft", "sent", "paid", "overdue", "partial", "cancelled"].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setFilter(s)}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-medium transition-colors ${
                filter === s
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              {s ? s.charAt(0).toUpperCase() + s.slice(1) : "All"}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExportCsv}>
            <Download className="size-3.5" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Search */}
      <SearchInput
        placeholder="Search by invoice #, customer, or plate..."
        onSearch={setSearch}
        debounceMs={300}
      />

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-5 py-3.5 text-left font-medium text-muted-foreground">{t("common.invoiceNumber") ?? "Invoice #"}</th>
                  <th className="px-5 py-3.5 text-left font-medium text-muted-foreground">Customer</th>
                  <th className="px-5 py-3.5 text-left font-medium text-muted-foreground">Vehicle</th>
                  <th className="px-5 py-3.5 text-left font-medium text-muted-foreground">Status</th>
                  <th className="px-5 py-3.5 text-right font-medium text-muted-foreground">Total</th>
                  <th className="px-5 py-3.5 text-right font-medium text-muted-foreground">Date</th>
                  <th className="px-5 py-3.5 text-right font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-16">
                      <Skeleton className="h-8 w-full" />
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-16 text-center text-muted-foreground">
                      No invoices found
                    </td>
                  </tr>
                ) : (
                  filtered.map((inv) => (
                    <tr
                      key={inv.id}
                      className="border-b border-border transition-colors hover:bg-muted/30"
                    >
                      <td className="px-5 py-3.5 font-mono text-xs font-medium">
                        {inv.invoice_number}
                      </td>
                      <td className="px-5 py-3.5">
                        {inv.customer_name ?? "\u2014"}
                      </td>
                      <td className="px-5 py-3.5 text-muted-foreground">
                        {inv.vehicle_plate ?? "\u2014"}
                      </td>
                      <td className="px-5 py-3.5">
                        <InvoiceStatusBadge status={inv.status} />
                      </td>
                      <td className="px-5 py-3.5 text-right font-medium tabular-nums">
                        {formatCurrency(inv.total)}
                      </td>
                      <td className="px-5 py-3.5 text-right text-muted-foreground">
                        {formatDate(inv.issued_at)}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopyLink(inv.public_token)}
                            title="Copy public link"
                          >
                            <ArrowUpRight className="size-3.5" />
                            Share
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Format date helper ───────────────────────────────────

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

// ── Main Finance Page ────────────────────────────────────

export default function FinancePage() {
  const t = useTranslations();
  const [orgId, setOrgId] = useState<string | null>(null);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<Period>("all");
  const [tab, setTab] = useState<Tab>("overview");
  const [search, setSearch] = useState("");

  // ── Fetch org ID ─────────────────────────────────────
  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((d) => {
        const id = d?.organizationId ?? d?.data?.organizationId;
        if (id) setOrgId(id);
        else setError("No organization found");
      })
      .catch(() => setError("Failed to load profile"))
      .finally(() => setLoading(false));
  }, []);

  // ── Fetch dashboard data ─────────────────────────────
  const fetchData = useCallback(
    async (oid: string, p: Period) => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/organizations/${oid}/reports?type=dashboard&period=${p}`,
        );
        const json = await res.json();
        if (json.error) {
          setError(json.error.message);
        } else {
          setData(json.data);
        }
      } catch {
        toast.error("Failed to load finance data");
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (orgId) fetchData(orgId, period);
  }, [orgId, period, fetchData]);

  const handlePeriodChange = useCallback(
    (p: Period) => {
      setPeriod(p);
      if (orgId) fetchData(orgId, p);
    },
    [orgId, fetchData],
  );

  // ── Derived summary ──────────────────────────────────
  const summary = data?.summary;
  const hasRevenue = (summary?.totalRevenue ?? 0) > 0;
  const hasActiveWos = (summary?.activeWorkOrders ?? 0) > 0;
  const hasTransactions = (data?.recentWorkOrders?.length ?? 0) > 0;
  // Show the page content if there's anything to show
  const hasAnyData = hasRevenue || hasActiveWos || hasTransactions;

  // ── Insight text ─────────────────────────────────────
  const insightLine = useMemo(() => {
    if (!summary || loading || !hasRevenue) return null;
    const rev = summary.totalRevenue;
    const wo = summary.activeWorkOrders;
    const avg = summary.avgRepairOrderValue;
    return `${formatCurrency(rev)} revenue · ${summary.completedToday} completed today · ${wo} active · avg ${formatCurrency(avg)}/WO`;
  }, [summary, loading, hasRevenue]);

  // ── Filtered transactions ───────────────────────────
  const filteredWorkOrders = useMemo(() => {
    if (!data?.recentWorkOrders) return [];
    if (!search) return data.recentWorkOrders;
    const q = search.toLowerCase();
    return data.recentWorkOrders.filter((wo) => {
      const customerName =
        `${wo.customer?.first_name ?? ""} ${wo.customer?.last_name ?? ""}`.toLowerCase();
      return (
        wo.id.toLowerCase().includes(q) ||
        customerName.includes(q) ||
        (wo.vehicle?.plate_number ?? "").toLowerCase().includes(q) ||
        wo.status.toLowerCase().includes(q)
      );
    });
  }, [data?.recentWorkOrders, search]);

  // ── Loading state ────────────────────────────────────
  if (loading && !data) {
    return (
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Skeleton className="h-9 w-40" />
            <Skeleton className="mt-1.5 h-5 w-56" />
          </div>
          <Skeleton className="h-9 w-72 rounded-lg" />
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
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
          <CardContent className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-24 shrink-0" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Error state ──────────────────────────────────────
  if (error && !data) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {t("nav.finance")}
          </h1>
          <p className="mt-1 text-muted-foreground">
            {t("finance.subtitle")}
          </p>
        </div>
        <Card className="py-12">
          <CardContent className="flex flex-col items-center gap-4">
            <p className="text-muted-foreground">{error}</p>
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Render ───────────────────────────────────────────
  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {t("nav.finance")}
          </h1>
          <p className="mt-1 text-muted-foreground">
            {t("finance.subtitle")}
          </p>
        </div>
        <div className="flex flex-col items-end gap-3">
          <PeriodBar value={period} onChange={handlePeriodChange} />
          <TabBar value={tab} onChange={setTab} />
        </div>
      </div>

      {/* ── TAB: Overview ────────────────────────────── */}
      {tab === "overview" && (
        <>
          {!hasAnyData ? (
            <EmptyFinanceState />
          ) : hasRevenue ? (
            <>
              {/* Insight line */}
              {insightLine && (
                <Card className="border-amber-200/50 bg-amber-50/30 dark:border-amber-800/30 dark:bg-amber-950/10">
                  <CardContent className="flex items-start gap-2 py-3">
                    <TrendingUp className="mt-0.5 size-4 shrink-0 text-amber-500" />
                    <p className="text-sm text-muted-foreground">
                      {insightLine}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* KPI Cards */}
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                <KpiCard
                  label="Total Revenue"
                  value={formatCurrency(summary!.totalRevenue)}
                  icon={DollarSign}
                  subtitle={`${summary!.completedToday} completed today`}
                  loading={loading}
                />
                <KpiCard
                  label="Active Work Orders"
                  value={String(summary!.activeWorkOrders)}
                  icon={Clock}
                  subtitle="Currently in progress"
                  loading={loading}
                />
                <KpiCard
                  label="Avg Repair Order"
                  value={formatCurrency(summary!.avgRepairOrderValue)}
                  icon={TrendingUp}
                  loading={loading}
                />
                <KpiCard
                  label="Total Customers"
                  value={String(summary!.totalCustomers)}
                  icon={Users}
                  loading={loading}
                />
              </div>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                <KpiCard
                  label="Service Revenue"
                  value={formatCurrency(summary!.serviceRevenue)}
                  icon={Wrench}
                  subtitle="Labor & services"
                  loading={loading}
                />
                <KpiCard
                  label="Parts Revenue"
                  value={formatCurrency(summary!.partsRevenue)}
                  icon={ClipboardList}
                  subtitle="Parts & materials"
                  loading={loading}
                />
                <KpiCard
                  label="Total Vehicles"
                  value={String(summary!.totalVehicles)}
                  icon={TrendingUp}
                  loading={loading}
                />
                <KpiCard
                  label="Service Mix"
                  value={`${summary!.totalRevenue > 0 ? Math.round((summary!.serviceRevenue / summary!.totalRevenue) * 100) : "—"}%`}
                  icon={Percent}
                  subtitle="Service vs Parts"
                  loading={loading}
                />
              </div>

              {/* Revenue Breakdown */}
              <RevenueSplitBar
                total={summary!.totalRevenue}
                service={summary!.serviceRevenue}
                parts={summary!.partsRevenue}
                loading={loading}
              />

              {/* Top Services */}
              {data?.topServices && data.topServices.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold">
                      Top Services
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border bg-muted/50">
                            <th className="px-5 py-3.5 text-left font-medium text-muted-foreground">
                              Service
                            </th>
                            <th className="px-5 py-3.5 text-right font-medium text-muted-foreground">
                              Count
                            </th>
                            <th className="px-5 py-3.5 text-right font-medium text-muted-foreground">
                              Revenue
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.topServices.slice(0, 8).map((svc, i) => (
                            <tr
                              key={i}
                              className="border-b border-border transition-colors hover:bg-muted/30"
                            >
                              <td className="px-5 py-3.5">{svc.name}</td>
                              <td className="px-5 py-3.5 text-right tabular-nums">
                                {svc.count}
                              </td>
                              <td className="px-5 py-3.5 text-right font-medium tabular-nums">
                                {formatCurrency(svc.revenue)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <>
              <NoRevenueBanner activeWorkOrders={summary!.activeWorkOrders} />
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-2">
                <KpiCard
                  label="Active Work Orders"
                  value={String(summary!.activeWorkOrders)}
                  icon={Clock}
                  subtitle="Currently in progress"
                  loading={loading}
                />
                <KpiCard
                  label="Total Customers"
                  value={String(summary!.totalCustomers)}
                  icon={Users}
                  loading={loading}
                />
              </div>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-2">
                <KpiCard
                  label="Total Vehicles"
                  value={String(summary!.totalVehicles)}
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
          )}
        </>
      )}

      {/* ── TAB: Transactions ────────────────────────── */}
      {tab === "transactions" && (
        <>
          {!hasAnyData ? (
            <EmptyFinanceState />
          ) : (
            <>
              <ListToolbar
                search={{
                  placeholder: "Search by customer, plate, or ID...",
                  value: search,
                  onChange: setSearch,
                }}
                stats={
                  <span>
                    {filteredWorkOrders.length} work order{filteredWorkOrders.length !== 1 ? "s" : ""}
                  </span>
                }
                actions={
                  <Button variant="outline" size="lg">
                    <Download className="size-4" />
                    Export
                  </Button>
                }
              />
              <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">
                  Recent Work Orders
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/50">
                        <th className="px-5 py-3.5 text-left font-medium text-muted-foreground">
                          #
                        </th>
                        <th className="px-5 py-3.5 text-left font-medium text-muted-foreground">
                          Customer
                        </th>
                        <th className="px-5 py-3.5 text-left font-medium text-muted-foreground">
                          Vehicle
                        </th>
                        <th className="px-5 py-3.5 text-left font-medium text-muted-foreground">
                          Status
                        </th>
                        <th className="px-5 py-3.5 text-right font-medium text-muted-foreground">
                          Services
                        </th>
                        <th className="px-5 py-3.5 text-right font-medium text-muted-foreground">
                          Parts
                        </th>
                        <th className="px-5 py-3.5 text-right font-medium text-muted-foreground">
                          Total
                        </th>
                        <th className="px-5 py-3.5 text-right font-medium text-muted-foreground">
                          Date
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                    {filteredWorkOrders.length === 0 && search ? (
                        <tr>
                          <td
                            colSpan={8}
                            className="px-5 py-16 text-center text-muted-foreground"
                          >
                            No work orders match your search
                          </td>
                        </tr>
                      ) : (!data?.recentWorkOrders ||
                        data.recentWorkOrders.length === 0) && (
                        <tr>
                          <td
                            colSpan={8}
                            className="px-5 py-16 text-center text-muted-foreground"
                          >
                            No work orders in this period
                          </td>
                        </tr>
                      )}
                      {filteredWorkOrders.map((wo) => {
                        const svcTotal = (
                          wo.services as Array<{ final_price: number }>
                        ).reduce(
                          (sum: number, s: { final_price: number }) =>
                            sum + Number(s.final_price),
                          0,
                        );
                        const prtTotal = (
                          wo.parts as Array<{ final_price: number }>
                        ).reduce(
                          (sum: number, p: { final_price: number }) =>
                            sum + Number(p.final_price),
                          0,
                        );
                        const grandTotal = svcTotal + prtTotal;

                        return (
                          <tr
                            key={wo.id}
                            className="border-b border-border transition-colors hover:bg-muted/30"
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
                                className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
                                style={{
                                  backgroundColor: `${
                                    wo.status === "Completed"
                                      ? "#22c55e"
                                      : wo.status === "Cancelled"
                                        ? "#ef4444"
                                        : wo.status === "In Progress"
                                          ? "#f97316"
                                          : wo.status === "Diagnosing"
                                            ? "#eab308"
                                            : wo.status === "New"
                                              ? "#3b82f6"
                                              : "#6b7280"
                                  }20`,
                                  color:
                                    wo.status === "Completed"
                                      ? "#22c55e"
                                      : wo.status === "Cancelled"
                                        ? "#ef4444"
                                        : wo.status === "In Progress"
                                          ? "#f97316"
                                          : wo.status === "Diagnosing"
                                            ? "#eab308"
                                            : wo.status === "New"
                                              ? "#3b82f6"
                                              : "#6b7280",
                                }}
                              >
                                {wo.status}
                              </span>
                            </td>
                            <td className="px-5 py-3.5 text-right tabular-nums">
                              {formatCurrency(svcTotal)}
                            </td>
                            <td className="px-5 py-3.5 text-right tabular-nums">
                              {formatCurrency(prtTotal)}
                            </td>
                            <td className="px-5 py-3.5 text-right font-semibold tabular-nums">
                              {formatCurrency(grandTotal)}
                            </td>
                            <td className="px-5 py-3.5 text-right text-muted-foreground">
                              {formatDate(wo.created_at)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
            </>
          )}
        </>
      )}

      {/* ── TAB: Invoices ────────────────────────────── */}
      {tab === "invoices" && <InvoicesTab orgId={orgId} />}
    </div>
  );
}
