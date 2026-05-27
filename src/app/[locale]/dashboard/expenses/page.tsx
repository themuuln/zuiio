"use client";

import { Clock, DollarSign, Plus, Tag, TrendingUp, Wallet } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { useClientNow } from "@/hooks/use-client-now";
import { ExportButton } from "@/components/export-button";
import { ListToolbar } from "@/components/list-toolbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DataTable } from "@/components/ui/data-table";
import {
  Empty,
  EmptyContent,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import type { ExportColumn } from "@/lib/export";
import { Link, useRouter } from "@/lib/i18n/navigation";
import {
  useExpenseCategories,
  useExpenseStats,
  useExpenses,
} from "@/lib/queries/use-expenses";
import { useCurrentOrg } from "@/lib/queries/use-organization";
import { useRightSidebar } from "@/hooks/use-right-sidebar";
import { StatusSummary } from "@/components/sidebar-tabs/status-summary";
import { RecentList } from "@/components/sidebar-tabs/recent-list";
import type { ExpenseWithCategory } from "@/lib/types";
import { formatMNT } from "@/lib/utils";
import { columns } from "./_columns";

// ── Inline KPI Card ──

function KpiCard({
  label,
  value,
  icon: Icon,
  loading,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  loading?: boolean;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2">
          {loading ? (
            <Skeleton className="h-8 w-24" />
          ) : (
            <p className="text-2xl font-semibold tabular-nums">{value}</p>
          )}
          <Icon className="ml-auto size-5 text-muted-foreground/40" />
        </div>
      </CardContent>
    </Card>
  );
}

function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-2 p-4">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          {Array.from({ length: 6 }).map((_, j) => (
            <Skeleton key={j} className="h-5 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

// ── Page Component ──

type PaidFilter = "all" | "paid" | "unpaid";

const PAID_FILTER_OPTIONS: { key: PaidFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "paid", label: "Paid" },
  { key: "unpaid", label: "Unpaid" },
];

export default function ExpensesPage() {
  const t = useTranslations();
  const now = useClientNow();
  const { push } = useRouter();

  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [paidFilter, setPaidFilter] = useState<PaidFilter>("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const { data: org, isLoading: orgLoading } = useCurrentOrg();
  const orgId = org?.orgId;

  const paidParam = paidFilter === "all" ? undefined : paidFilter === "paid";

  const {
    data: expenses,
    isFetching: expensesFetching,
    isError,
    error,
    refetch,
  } = useExpenses(orgId, {
    q: search || undefined,
    categoryId: categoryId || undefined,
    paid: paidParam,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  });

  const { data: stats, isLoading: statsLoading } = useExpenseStats(orgId);

  const { data: categories } = useExpenseCategories(orgId);

  const sidebar = useRightSidebar();

  useEffect(() => {
    if (!stats || !categories) return;

    sidebar.setOpen(true);
    sidebar.setActiveTab("summary");

    sidebar.registerTab(
      "summary",
      "Summary",
      <StatusSummary
        title="This Month"
        items={[
          { label: "Total", count: stats.thisMonth },
          { label: "Unpaid", count: stats.unpaidAmount, color: "destructive" },
        ]}
      />,
      <DollarSign className="size-4" />,
    );

    sidebar.registerTab(
      "categories",
      "Categories",
      <RecentList
        items={categories.map((cat) => ({
          id: cat.id,
          primary: cat.name,
        }))}
        emptyMessage="No categories"
      />,
      <Tag className="size-4" />,
    );

    return () => {
      sidebar.unregisterTab("summary");
      sidebar.unregisterTab("categories");
      sidebar.setOpen(false);
    };
  }, [stats, categories]);

  const isFirstLoad =
    !expenses && !search && !categoryId && paidFilter === "all";
  const showLoadingScreen = orgLoading || (statsLoading && isFirstLoad);

  // ── Export columns ──

  const exportColumns: ExportColumn<ExpenseWithCategory>[] = useMemo(
    () => [
      { key: "expense_date", label: "Date", format: "date" },
      { key: "description", label: "Description" },
      { key: "vendor_name", label: "Vendor" },
      {
        key: "category_id",
        label: "Category",
        value: (e) => e.category?.name ?? "\u2014",
      },
      { key: "amount", label: "Amount", format: "number" },
      { key: "reference_number", label: "Reference" },
      {
        key: "paid_at",
        label: "Status",
        value: (e) => (e.paid_at ? "Paid" : "Unpaid"),
      },
    ],
    [],
  );

  // ── Render: Loading ──

  if (showLoadingScreen) {
    return (
      <div className="flex flex-col gap-6 tablet:gap-6 tablet:px-2">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-10 w-36" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={`skeleton-${i}`}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-28" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardContent className="p-0">
            <TableSkeleton />
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Render: Error ──

  if (isError || (!orgId && !orgLoading)) {
    return (
      <div className="flex flex-col gap-6 tablet:px-2">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {t("nav.expenses")}
          </h1>
        </div>
        <p className="text-destructive">
          {error?.message ?? "No organization found"}
        </p>
        <Button onClick={() => refetch()} variant="outline" className="w-fit">
          Retry
        </Button>
      </div>
    );
  }

  // ── Render: Normal ──

  return (
    <div className="flex flex-col gap-6 tablet:gap-6 tablet:px-2">
      {/* ── Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {t("nav.expenses")}
          </h1>
          <p className="text-muted-foreground">
            {expenses?.length ?? 0}{" "}
            {(expenses?.length ?? 0) === 1 ? "expense" : "expenses"}
          </p>
        </div>
        <Button render={<Link href="/dashboard/expenses/new" />} size="default">
          <Plus className="size-4" />
          Add Expense
        </Button>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Total Expenses"
          value={stats ? String(stats.totalExpenses) : "\u2014"}
          icon={Wallet}
          loading={statsLoading}
        />
        <KpiCard
          label="Total Amount"
          value={stats ? formatMNT(stats.totalAmount) : "\u2014"}
          icon={DollarSign}
          loading={statsLoading}
        />
        <KpiCard
          label="This Month"
          value={stats ? formatMNT(stats.thisMonth) : "\u2014"}
          icon={TrendingUp}
          loading={statsLoading}
        />
        <KpiCard
          label="Unpaid"
          value={stats ? formatMNT(stats.unpaidAmount) : "\u2014"}
          icon={Clock}
          loading={statsLoading}
        />
      </div>

      {/* ── Filter Bar ── */}
      <ListToolbar
        search={{
          placeholder: "Search by description, vendor, or reference...",
          value: search,
          onChange: setSearch,
          loading: expensesFetching,
        }}
        filters={
          <div className="flex flex-wrap items-center gap-3">
            {/* Category select */}
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="h-9 rounded-lg border border-input bg-background px-3 text-xs font-medium text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">All Categories</option>
              {categories?.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>

            {/* Date range */}
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="h-9 rounded-lg border border-input bg-background px-3 text-xs font-medium text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Start date"
              title="Start date"
            />
            <span className="text-xs text-muted-foreground">&ndash;</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="h-9 rounded-lg border border-input bg-background px-3 text-xs font-medium text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="End date"
              title="End date"
            />

            {/* Paid / Unpaid toggle */}
            <div className="flex gap-1">
              {PAID_FILTER_OPTIONS.map((opt) => (
                <Button
                  key={opt.key}
                  onClick={() => setPaidFilter(opt.key)}
                  variant={paidFilter === opt.key ? "default" : "ghost"}
                  size="sm"
                >
                  {opt.label}
                </Button>
              ))}
            </div>
          </div>
        }
        actions={
          <ExportButton
            data={expenses ?? []}
            columns={exportColumns}
            filename={`expenses-${now.toISOString().split("T")[0]}.xlsx`}
            sheetName="Expenses"
          />
        }
        stats={
          <span className="text-sm text-muted-foreground">
            {expenses?.length ?? 0}{" "}
            {(expenses?.length ?? 0) === 1 ? "expense" : "expenses"}
          </span>
        }
      />

      {/* ── Table / Empty State ── */}
      <Card className="py-0">
        <CardContent className="p-0">
          {!expenses || expenses.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Wallet />
                </EmptyMedia>
                <EmptyTitle>No expenses found</EmptyTitle>
              </EmptyHeader>
              <EmptyContent>
                <Button
                  render={<Link href="/dashboard/expenses/new" />}
                  variant="outline"
                >
                  Record Your First Expense
                </Button>
              </EmptyContent>
            </Empty>
          ) : (
            <DataTable
              columns={columns}
              data={expenses}
              getRowId={(row) => row.id}
              pageSize={20}
              onRowClick={(row) => push(`/dashboard/expenses/${row.id}`)}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
