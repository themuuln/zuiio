"use client";

import { useTableFilters } from "@zuiio/hooks";
import {
  AlertCircle,
  Clock,
  DollarSign,
  Plus,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import type { DateRange } from "react-day-picker";
import { ExportButton } from "@/components/export-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { DataTablePage } from "@/components/ui/data-table-page";
import { DateRangePicker } from "@/components/ui/date-range-picker";
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
import type { ExportColumn } from "@/lib/export";
import {
  useExpenseCategories,
  useExpenseStats,
  useExpenses,
} from "@/lib/queries/use-expenses";
import { useCurrentOrg } from "@/lib/queries/use-organization";
import { useSelectedBranchId } from "@/lib/stores";
import type { ExpenseWithCategory } from "@/lib/types";
import { cn, formatMNT } from "@/lib/utils";
import { columns } from "./_columns";

// ── Inline KPI Card ──

function KpiCard({
  label,
  value,
  icon: Icon,
  loading,
  tone = "default",
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  loading?: boolean;
  tone?: "default" | "success" | "warning" | "danger";
}) {
  const toneClasses = {
    default: "bg-muted/60 text-muted-foreground",
    success:
      "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400",
    warning:
      "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400",
    danger: "bg-destructive/10 text-destructive",
  } as const;

  return (
    <Card className="border-border/70 shadow-xs">
      <CardHeader className="flex flex-row items-start justify-between pb-2">
        <Typography.Muted className="text-xs font-medium text-muted-foreground">
          {label}
        </Typography.Muted>
        <span
          className={cn(
            "inline-flex size-8 items-center justify-center rounded-lg",
            toneClasses[tone],
          )}
        >
          <Icon className="size-4" />
        </span>
      </CardHeader>
      <CardContent>
        <div className="flex items-end gap-2">
          {loading ? (
            <Skeleton className="h-8 w-24" />
          ) : (
            <Typography.Text className="text-2xl font-semibold tabular-nums">
              {value}
            </Typography.Text>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ── Page Component ──

type PaidFilter = "all" | "paid" | "unpaid" | "overdue";

export default function ExpensesPage() {
  const t = useTranslations();
  const now = useClientNow();

  const PAID_FILTER_OPTIONS: { key: PaidFilter; label: string }[] = [
    { key: "all", label: t("expenses.allStatus") },
    { key: "unpaid", label: t("expenses.unpaid") },
    { key: "overdue", label: t("expenses.overdue") },
    { key: "paid", label: t("expenses.paid") },
  ];

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

  const selectedBranchId = useSelectedBranchId();
  const branchFilter = selectedBranchId === "all" ? null : selectedBranchId;

  const paidParam = paidFilter === "all" ? undefined : paidFilter === "paid";
  const overdueParam = paidFilter === "overdue";

  const {
    data: expenses,
    isLoading: expensesLoading,
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
    branchId: branchFilter ?? undefined,
  });

  const { data: stats, isLoading: statsLoading } = useExpenseStats(
    orgId,
    branchFilter,
  );

  const { data: categories } = useExpenseCategories(orgId);

  const displayError =
    isError || (!orgId && !orgLoading)
      ? (error?.message ?? t("common.noOrganization"))
      : null;

  // ── Export columns ──

  const exportColumns: ExportColumn<ExpenseWithCategory>[] = useMemo(
    () => [
      { key: "expense_date", label: t("expenses.date"), format: "date" },
      { key: "description", label: t("expenses.description") },
      { key: "vendor_name", label: t("expenses.vendor") },
      {
        key: "category_id",
        label: t("expenses.category"),
        value: (e) => e.category?.name ?? "\u2014",
      },
      { key: "amount", label: t("expenses.amount"), format: "number" },
      { key: "reference_number", label: t("expenses.reference") },
      {
        key: "paid_at",
        label: t("expenses.status"),
        value: (e) => (e.paid_at ? t("expenses.paid") : t("expenses.unpaid")),
      },
    ],
    [t],
  );

  const resultCount = expenses?.length ?? 0;
  const categoryCount = categories?.length ?? 0;
  const hasFilters = activeCount > 0;

  // ── KPI cards ──

  const kpiCards = (
    <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
      <KpiCard
        label={t("expenses.totalExpenses")}
        value={stats ? String(stats.totalExpenses) : "\u2014"}
        icon={Wallet}
        loading={statsLoading}
        tone="default"
      />
      <KpiCard
        label={t("expenses.totalAmount")}
        value={stats ? formatMNT(stats.totalAmount) : "\u2014"}
        icon={DollarSign}
        loading={statsLoading}
        tone="success"
      />
      <KpiCard
        label={t("expenses.thisMonth")}
        value={stats ? formatMNT(stats.thisMonth) : "\u2014"}
        icon={TrendingUp}
        loading={statsLoading}
        tone="warning"
      />
      <KpiCard
        label={t("sidebar.overdue")}
        value={stats ? String(stats.overdueCount) : "\u2014"}
        icon={AlertCircle}
        loading={statsLoading}
        tone="danger"
      />
      <KpiCard
        label={t("expenses.unpaid")}
        value={stats ? formatMNT(stats.unpaidAmount) : "\u2014"}
        icon={Clock}
        loading={statsLoading}
        tone="warning"
      />
    </div>
  );

  // ── Badge bar ──

  const badgeBar = (
    <Card className="border-border/70 bg-muted/20 shadow-xs">
      <CardContent className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="bg-background">
            {t("expenses.resultCount", { count: resultCount })}
          </Badge>
          <Badge variant="outline" className="bg-background">
            {t("expenses.categories")}: {categoryCount}
          </Badge>
          {stats && stats.overdueCount > 0 && (
            <Badge
              variant="outline"
              className="border-destructive/25 bg-destructive/5 text-destructive"
            >
              {t("expenses.overdue")}: {stats.overdueCount}
            </Badge>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          {branchFilter && (
            <Badge variant="secondary" className="font-normal">
              {t("expenses.branchFiltered")}
            </Badge>
          )}
          {hasFilters && (
            <Badge variant="secondary" className="font-normal">
              {t("expenses.filterCount", { count: activeCount })}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );

  // ── Filter controls ──

  const filterControls = (
    <div className="flex flex-wrap items-center gap-3">
      <Select
        value={categoryId || "all"}
        onValueChange={(value) => setCategory(value === "all" ? "" : value)}
      >
        <SelectTrigger size="sm" className="min-w-44">
          <SelectValue placeholder={t("expenses.category")} />
        </SelectTrigger>
        <SelectContent align="start">
          <SelectItem value="all">{t("expenses.allStatus")}</SelectItem>
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
          {t("expenses.clearFilters")}
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
  );

  return (
    <DataTablePage
      title={t("nav.expenses")}
      description={
        resultCount
          ? t("expenses.resultCount", { count: resultCount })
          : undefined
      }
      loading={orgLoading || expensesLoading}
      error={displayError}
      onRetry={refetch}
      headerAction={
        <Button onClick={() => setNewExpenseSheetOpen(true)} size="default">
          <Plus className="size-4" />
          {t("expenses.addExpenseButton")}
        </Button>
      }
      columns={columns}
      data={expenses ?? []}
      getRowId={(row) => row.id}
      pageSize={20}
      search={{
        placeholder: t("expenses.searchPlaceholder"),
        value: search,
        onChange: setSearch,
        loading: expensesFetching,
        resultLabel: expenses?.length
          ? t("expenses.resultCount", { count: expenses.length })
          : undefined,
        emptyLabel: search
          ? t("expenses.noMatches", { query: search })
          : undefined,
      }}
      filters={filterControls}
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
          {t("expenses.resultCount", { count: expenses?.length ?? 0 })}
        </span>
      }
      beforeTable={
        <>
          {kpiCards}
          {badgeBar}
        </>
      }
      onRowClick={(row) => setDetailExpenseId(row.id)}
      emptyTitle={t("expenses.noExpenses")}
      emptyIcon={Wallet}
      emptyAction={
        <Button onClick={() => setNewExpenseSheetOpen(true)} variant="outline">
          {t("expenses.addFirstExpense")}
        </Button>
      }
      renderMobileCard={(expense) => {
        const overdue =
          !expense.paid_at &&
          !!expense.due_date &&
          new Date(expense.due_date) < now;
        const dateStr = (() => {
          try {
            return new Date(expense.expense_date).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            });
          } catch {
            return expense.expense_date;
          }
        })();
        return (
          <div className="flex flex-col gap-3 text-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 space-y-1">
                <span className="block truncate font-medium">
                  {expense.description}
                </span>
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span>{dateStr}</span>
                  {expense.category?.name && (
                    <span className="rounded-full bg-muted px-2 py-0.5 text-foreground/80">
                      {expense.category.name}
                    </span>
                  )}
                </div>
              </div>
              <Badge
                variant="outline"
                className={cn(
                  "shrink-0 text-[10px] px-1.5 py-0",
                  expense.paid_at &&
                    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-400",
                  overdue &&
                    "border-destructive/25 bg-destructive/5 text-destructive",
                )}
              >
                {expense.paid_at
                  ? t("expenses.paid")
                  : overdue
                    ? t("expenses.overdue")
                    : t("expenses.unpaid")}
              </Badge>
            </div>
            <div className="flex items-center justify-between border-t border-border/50 pt-2 text-xs text-muted-foreground">
              <div className="min-w-0 space-y-1">
                <span className="block truncate">
                  {expense.vendor_name || expense.category?.name || "\u2014"}
                </span>
                {expense.due_date && (
                  <span
                    className={cn(
                      "block",
                      overdue && "font-medium text-destructive",
                    )}
                  >
                    {t("expenses.due")}: {expense.due_date}
                  </span>
                )}
              </div>
              <span className="text-sm font-semibold tabular-nums">
                {formatMNT(expense.amount)}
              </span>
            </div>
          </div>
        );
      }}
    />
  );
}
