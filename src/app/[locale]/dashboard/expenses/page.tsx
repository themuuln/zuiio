"use client";

import {
  ArrowRight,
  Clock,
  DollarSign,
  Plus,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { ExportButton } from "@/components/export-button";
import { ListToolbar } from "@/components/list-toolbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ExportColumn } from "@/lib/export";
import { Link, useRouter } from "@/lib/i18n/navigation";
import {
  useExpenseCategories,
  useExpenseStats,
  useExpenses,
} from "@/lib/queries/use-expenses";
import { useCurrentOrg } from "@/lib/queries/use-organization";
import type { ExpenseWithCategory } from "@/lib/types";
import { formatMNT } from "@/lib/utils";

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
            <p className="text-2xl font-bold tabular-nums">{value}</p>
          )}
          <Icon className="ml-auto size-5 text-muted-foreground/40" />
        </div>
      </CardContent>
    </Card>
  );
}

// ── Category Badge ──

function CategoryBadge({ name, color }: { name: string; color: string }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium"
      style={{ backgroundColor: `${color}20`, color }}
    >
      <span
        className="size-1.5 rounded-full"
        style={{ backgroundColor: color }}
      />
      {name}
    </span>
  );
}

// ── Table Skeleton ──

function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Description</TableHead>
          <TableHead className="hidden sm:table-cell">Category</TableHead>
          <TableHead className="hidden md:table-cell">Vendor</TableHead>
          <TableHead className="text-right">Amount</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="w-10" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: rows }).map((_, i) => (
          <TableRow key={i}>
            <TableCell>
              <Skeleton className="h-4 w-24" />
            </TableCell>
            <TableCell>
              <div className="space-y-1">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-24" />
              </div>
            </TableCell>
            <TableCell className="hidden sm:table-cell">
              <Skeleton className="h-5 w-20 rounded-full" />
            </TableCell>
            <TableCell className="hidden md:table-cell">
              <Skeleton className="h-4 w-28" />
            </TableCell>
            <TableCell className="text-right">
              <Skeleton className="ml-auto h-4 w-20" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-5 w-14 rounded-full" />
            </TableCell>
            <TableCell>
              <Skeleton className="size-4" />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
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
  const router = useRouter();

  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [paidFilter, setPaidFilter] = useState<PaidFilter>("all");

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
  });

  const { data: stats, isLoading: statsLoading } = useExpenseStats(orgId);

  const { data: categories } = useExpenseCategories(orgId);

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

  // ── Date formatter ──

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return iso;
    }
  };

  // ── Render: Loading ──

  if (showLoadingScreen) {
    return (
      <div className="flex flex-col gap-6 tablet:gap-8 tablet:px-2">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-10 w-36" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
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
          <h1 className="text-2xl font-bold tracking-tight">
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
    <div className="flex flex-col gap-6 tablet:gap-8 tablet:px-2">
      {/* ── Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {t("nav.expenses")}
          </h1>
          <p className="text-muted-foreground">
            {expenses?.length ?? 0}{" "}
            {(expenses?.length ?? 0) === 1 ? "expense" : "expenses"}
          </p>
        </div>
        <Button render={<Link href="/dashboard/expenses/new" />} size="lg">
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

            {/* Paid / Unpaid toggle */}
            <div className="flex gap-1">
              {PAID_FILTER_OPTIONS.map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setPaidFilter(opt.key)}
                  className={`rounded-lg px-3.5 py-1.5 text-xs font-medium transition-colors ${
                    paidFilter === opt.key
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        }
        actions={
          <ExportButton
            data={expenses ?? []}
            columns={exportColumns}
            filename={`expenses-${new Date().toISOString().split("T")[0]}.xlsx`}
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
            <div className="flex flex-col items-center gap-3 px-4 py-16">
              <Wallet className="size-12 text-muted-foreground/40" />
              <p className="text-muted-foreground">No expenses found</p>
              <Button
                render={<Link href="/dashboard/expenses/new" />}
                variant="outline"
              >
                Record Your First Expense
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="hidden sm:table-cell">
                    Category
                  </TableHead>
                  <TableHead className="hidden md:table-cell">Vendor</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.map((expense) => (
                  <TableRow
                    key={expense.id}
                    className="h-16 cursor-pointer"
                    onClick={() =>
                      router.push(`/dashboard/expenses/${expense.id}`)
                    }
                  >
                    <TableCell>
                      <span className="text-sm tabular-nums">
                        {formatDate(expense.expense_date)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="min-w-0 max-w-64">
                        <p className="truncate text-sm font-medium">
                          {expense.description}
                        </p>
                        {expense.reference_number && (
                          <p className="truncate text-xs text-muted-foreground">
                            {expense.reference_number}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {expense.category ? (
                        <CategoryBadge
                          name={expense.category.name}
                          color={expense.category.color}
                        />
                      ) : (
                        <span className="text-sm text-muted-foreground/50">
                          &mdash;
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {expense.vendor_name ? (
                        <span className="text-sm">{expense.vendor_name}</span>
                      ) : (
                        <span className="text-sm text-muted-foreground/50">
                          &mdash;
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="text-sm font-medium tabular-nums">
                        {formatMNT(expense.amount)}
                      </span>
                    </TableCell>
                    <TableCell>
                      {expense.paid_at ? (
                        <Badge
                          variant="secondary"
                          className="border-green-200 bg-green-100 text-green-700 dark:border-green-800 dark:bg-green-900/30 dark:text-green-400"
                        >
                          Paid
                        </Badge>
                      ) : (
                        <Badge
                          variant="secondary"
                          className="border-orange-200 bg-orange-100 text-orange-700 dark:border-orange-800 dark:bg-orange-900/30 dark:text-orange-400"
                        >
                          Unpaid
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <ArrowRight className="size-4 text-muted-foreground/40" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
