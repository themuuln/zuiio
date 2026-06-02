"use client";

import {
  AlertCircle,
  Clock,
  DollarSign,
  Plus,
  Tag,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo } from "react";
import type { DateRange } from "react-day-picker";
import { ExportButton } from "@/components/export-button";
import { ListToolbar } from "@/components/list-toolbar";
import { RecentList } from "@/components/sidebar-tabs/recent-list";
import { StatusSummary } from "@/components/sidebar-tabs/status-summary";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import {
  Empty,
  EmptyContent,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Typography } from "@/components/ui/typography";
import { useClientNow } from "@/hooks/use-client-now";
import { usePageHeader } from "@/hooks/use-page-header";
import { useRightSidebar } from "@/hooks/use-right-sidebar";
import type { ExportColumn } from "@/lib/export";
import { useTableFilters } from "@/lib/hooks/use-url-filters";
import {
  useExpenseCategories,
  useExpenseStats,
  useExpenses,
} from "@/lib/queries/use-expenses";
import { useCurrentOrg } from "@/lib/queries/use-organization";
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
        <Typography.Muted className="text-xs font-medium text-muted-foreground">
          {label}
        </Typography.Muted>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2">
          {loading ? (
            <Skeleton className="h-8 w-24" />
          ) : (
            <Typography.Text className="text-2xl font-semibold tabular-nums">
              {value}
            </Typography.Text>
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

type PaidFilter = "all" | "paid" | "unpaid" | "overdue";

const PAID_FILTER_OPTIONS: { key: PaidFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "unpaid", label: "Unpaid" },
  { key: "overdue", label: "Overdue" },
  { key: "paid", label: "Paid" },
];

export default function ExpensesPage() {
  const t = useTranslations();
  const now = useClientNow();

  const {
    search,
    setSearch,
    category,
    setCategory,
    status,
    setStatus,
    dateFrom,
    setDateFrom,
    dateTo,
    setDateTo,
    activeCount,
    resetAll,
  } = useTableFilters("expenses");
  const { setNewExpenseSheetOpen, setDetailExpenseId } = usePageHeader();
  const paidFilter = (status as PaidFilter) || "all";
  const categoryId = category;
  const startDate = dateFrom;
  const endDate = dateTo;

  const rangeValue = useMemo<DateRange | undefined>(() => {
    return {
      from: startDate ? new Date(startDate) : undefined,
      to: endDate ? new Date(endDate) : undefined,
    };
  }, [startDate, endDate]);

  const handleRangeChange = (range: DateRange | undefined) => {
    if (range?.from) {
      const y = range.from.getFullYear();
      const m = String(range.from.getMonth() + 1).padStart(2, "0");
      const d = String(range.from.getDate()).padStart(2, "0");
      setDateFrom(`${y}-${m}-${d}`);
    } else {
      setDateFrom("");
    }

    if (range?.to) {
      const y = range.to.getFullYear();
      const m = String(range.to.getMonth() + 1).padStart(2, "0");
      const d = String(range.to.getDate()).padStart(2, "0");
      setDateTo(`${y}-${m}-${d}`);
    } else {
      setDateTo("");
    }
  };

  const { data: org, isLoading: orgLoading } = useCurrentOrg();
  const orgId = org?.orgId;

  const paidParam = paidFilter === "all" ? undefined : paidFilter === "paid";
  const overdueParam = paidFilter === "overdue";

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
    overdue: overdueParam || undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  });

  const { data: stats, isLoading: statsLoading } = useExpenseStats(orgId);

  const { data: categories } = useExpenseCategories(orgId);

  const sidebar = useRightSidebar();

  useEffect(() => {
    if (!stats || !categories) return;

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
    };
  }, [
    categories,
    sidebar.registerTab,
    sidebar.setActiveTab,
    sidebar.unregisterTab,
    stats,
  ]);

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
          <Typography.H1 className="text-2xl font-semibold tracking-tight">
            {t("nav.expenses")}
          </Typography.H1>
        </div>
        <Typography.Text className="text-destructive">
          {error?.message ?? "No organization found"}
        </Typography.Text>
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
          <Typography.H1 className="text-2xl font-semibold tracking-tight">
            {t("nav.expenses")}
          </Typography.H1>
          <Typography.Muted className="text-muted-foreground">
            {expenses?.length ?? 0}{" "}
            {(expenses?.length ?? 0) === 1 ? "expense" : "expenses"}
          </Typography.Muted>
        </div>
        <Button onClick={() => setNewExpenseSheetOpen(true)} size="default">
          <Plus className="size-4" />
          Add Expense
        </Button>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
        <KpiCard
          label={t("expenses.totalExpenses")}
          value={stats ? String(stats.totalExpenses) : "\u2014"}
          icon={Wallet}
          loading={statsLoading}
        />
        <KpiCard
          label={t("expenses.totalAmount")}
          value={stats ? formatMNT(stats.totalAmount) : "\u2014"}
          icon={DollarSign}
          loading={statsLoading}
        />
        <KpiCard
          label={t("expenses.thisMonth")}
          value={stats ? formatMNT(stats.thisMonth) : "\u2014"}
          icon={TrendingUp}
          loading={statsLoading}
        />
        <KpiCard
          label={t("sidebar.overdue")}
          value={stats ? String(stats.overdueCount) : "\u2014"}
          icon={AlertCircle}
          loading={statsLoading}
        />
        <KpiCard
          label={t("expenses.unpaid")}
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
          resultLabel: expenses?.length
            ? `${expenses.length} result${expenses.length === 1 ? "" : "s"}`
            : undefined,
          emptyLabel: search ? `No matches for "${search}"` : undefined,
        }}
        filters={
          <div className="flex flex-wrap items-center gap-3">
            <Select
              value={categoryId || "all"}
              onValueChange={(value) =>
                setCategory(value === "all" ? "" : value)
              }
            >
              <SelectTrigger size="sm" className="min-w-44">
                <SelectValue placeholder={t("inventory.allCategories")} />
              </SelectTrigger>
              <SelectContent align="start">
                <SelectItem value="all">
                  {t("inventory.allCategories")}
                </SelectItem>
                {categories?.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <DateRangePicker
              value={rangeValue}
              onChange={handleRangeChange}
              className="w-[240px]"
            />
            {activeCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-9 px-2 text-muted-foreground hover:text-foreground text-xs"
                onClick={resetAll}
              >
                Clear filters
              </Button>
            )}

            <ToggleGroup
              multiple={false}
              value={[paidFilter]}
              onValueChange={(value) => {
                if (value.length > 0) setStatus(value[0]);
              }}
              spacing={1}
            >
              {PAID_FILTER_OPTIONS.map((opt) => (
                <ToggleGroupItem key={opt.key} value={opt.key}>
                  {opt.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
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
                  onClick={() => setNewExpenseSheetOpen(true)}
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
              onRowClick={(row) => setDetailExpenseId(row.id)}
              renderMobileCard={(expense) => {
                const dateStr = (() => {
                  try {
                    return new Date(expense.expense_date).toLocaleDateString(
                      "en-US",
                      { month: "short", day: "numeric" },
                    );
                  } catch {
                    return expense.expense_date;
                  }
                })();
                return (
                  <div className="flex flex-col gap-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {dateStr}
                      </span>
                      <Badge
                        variant="outline"
                        className="text-[10px] px-1.5 py-0"
                      >
                        {expense.paid_at ? "Paid" : "Unpaid"}
                      </Badge>
                    </div>
                    <span className="font-medium truncate">
                      {expense.description}
                    </span>
                    <div className="flex items-center justify-between border-t border-border/50 pt-2 text-xs text-muted-foreground">
                      <span>
                        {expense.vendor_name || expense.category?.name || "—"}
                      </span>
                      <span className="text-sm font-semibold tabular-nums">
                        {formatMNT(expense.amount)}
                      </span>
                    </div>
                  </div>
                );
              }}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
