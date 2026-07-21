"use client";

import type { Column, ColumnDef } from "@tanstack/react-table";
import { AlertCircle, ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { DataTableColumnHeader } from "@/components/ui/data-table";
import { Typography } from "@/components/ui/typography";
import type { ExpenseWithCategory } from "@/lib/types";
import { cn, formatMNT } from "@/lib/utils";

// ── Header Components (hooks must be in components, not in column defs) ──

function ExpenseDateHeader({
  column,
}: {
  column: Column<ExpenseWithCategory>;
}) {
  const t = useTranslations("expenses") as (key: string, values?: Record<string, string | number>) => string;
  return <DataTableColumnHeader column={column} title={t("date")} />;
}

function ExpenseDescriptionHeader({
  column,
}: {
  column: Column<ExpenseWithCategory>;
}) {
  const t = useTranslations("expenses") as (key: string, values?: Record<string, string | number>) => string;
  return <DataTableColumnHeader column={column} title={t("description")} />;
}

function ExpenseCategoryHeader({
  column,
}: {
  column: Column<ExpenseWithCategory>;
}) {
  const t = useTranslations("expenses") as (key: string, values?: Record<string, string | number>) => string;
  return <DataTableColumnHeader column={column} title={t("category")} />;
}

function ExpenseVendorHeader({
  column,
}: {
  column: Column<ExpenseWithCategory>;
}) {
  const t = useTranslations("expenses") as (key: string, values?: Record<string, string | number>) => string;
  return <DataTableColumnHeader column={column} title={t("vendor")} />;
}

function ExpenseDueHeader({ column }: { column: Column<ExpenseWithCategory> }) {
  const t = useTranslations("expenses") as (key: string, values?: Record<string, string | number>) => string;
  return <DataTableColumnHeader column={column} title={t("due")} />;
}

function ExpenseAmountHeader({
  column,
}: {
  column: Column<ExpenseWithCategory>;
}) {
  const t = useTranslations("expenses") as (key: string, values?: Record<string, string | number>) => string;
  return <DataTableColumnHeader column={column} title={t("amount")} />;
}

function ExpenseStatusHeader({
  column,
}: {
  column: Column<ExpenseWithCategory>;
}) {
  const t = useTranslations("expenses") as (key: string, values?: Record<string, string | number>) => string;
  return <DataTableColumnHeader column={column} title={t("status")} />;
}

// ── Cell Components ──

function DescriptionCell({ expense }: { expense: ExpenseWithCategory }) {
  const t = useTranslations("expenses") as (key: string, values?: Record<string, string | number>) => string;
  return (
    <div className="min-w-0 max-w-64">
      <Typography.Text className="truncate text-sm font-medium">
        {expense.description}
      </Typography.Text>
      {expense.reference_number && (
        <Typography.Muted className="truncate text-xs text-muted-foreground">
          {t("reference")}: {expense.reference_number}
        </Typography.Muted>
      )}
    </div>
  );
}

function StatusCell({ expense }: { expense: ExpenseWithCategory }) {
  const t = useTranslations("expenses") as (key: string, values?: Record<string, string | number>) => string;
  if (expense.paid_at) {
    return (
      <Badge
        variant="outline"
        className="border-green-200 bg-green-50 text-green-700 dark:border-green-900 dark:bg-green-950/30 dark:text-green-400"
      >
        {t("paid")}
      </Badge>
    );
  }
  const overdue = isOverdue(expense);
  if (overdue) {
    return (
      <Badge
        variant="outline"
        className="border-red-300 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400 gap-1"
      >
        <AlertCircle className="size-3" />
        {t("overdue")}
      </Badge>
    );
  }
  return (
    <Badge
      variant="outline"
      className="border-border bg-muted/40 text-muted-foreground"
    >
      {t("unpaid")}
    </Badge>
  );
}

// ── Category Badge ──

function CategoryBadge({ name, color }: { name: string; color: string }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium"
      style={{
        backgroundColor: `${color}14`,
        borderColor: `${color}26`,
        color,
      }}
    >
      <span
        className="size-1.5 rounded-full"
        style={{ backgroundColor: color }}
      />
      {name}
    </span>
  );
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function isOverdue(expense: ExpenseWithCategory): boolean {
  if (expense.paid_at) return false;
  if (!expense.due_date) return false;
  const due = new Date(expense.due_date);
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  return due < today;
}

export const columns: ColumnDef<ExpenseWithCategory>[] = [
  {
    accessorKey: "expense_date",
    header: ({ column }) => <ExpenseDateHeader column={column} />,
    cell: ({ row }) => (
      <span className="text-sm tabular-nums">
        {formatDate(row.original.expense_date)}
      </span>
    ),
  },
  {
    id: "description",
    accessorKey: "description",
    header: ({ column }) => <ExpenseDescriptionHeader column={column} />,
    cell: ({ row }) => <DescriptionCell expense={row.original} />,
  },
  {
    id: "category",
    header: ({ column }) => <ExpenseCategoryHeader column={column} />,
    cell: ({ row }) => {
      const cat = row.original.category;
      return cat ? (
        <CategoryBadge name={cat.name} color={cat.color} />
      ) : (
        <span className="text-sm text-muted-foreground/50">&mdash;</span>
      );
    },
  },
  {
    accessorKey: "vendor_name",
    header: ({ column }) => <ExpenseVendorHeader column={column} />,
    cell: ({ row }) => {
      const vendor = row.original.vendor_name;
      return vendor ? (
        <span className="text-sm">{vendor}</span>
      ) : (
        <span className="text-sm text-muted-foreground/50">&mdash;</span>
      );
    },
  },
  {
    accessorKey: "due_date",
    header: ({ column }) => <ExpenseDueHeader column={column} />,
    cell: ({ row }) => {
      const expense = row.original;
      if (!expense.due_date) {
        return (
          <span className="text-sm text-muted-foreground/50">&mdash;</span>
        );
      }
      const overdue = isOverdue(expense);
      return (
        <div
          className={cn(
            "inline-flex items-center gap-1 text-sm tabular-nums",
            overdue && "font-medium text-destructive",
          )}
        >
          <span>{formatDate(expense.due_date)}</span>
          {overdue && <AlertCircle className="size-3.5 text-destructive" />}
        </div>
      );
    },
  },
  {
    accessorKey: "amount",
    meta: { align: "right" } as const,
    header: ({ column }) => <ExpenseAmountHeader column={column} />,
    cell: ({ row }) => (
      <span className="text-sm font-semibold tabular-nums">
        {formatMNT(row.original.amount)}
      </span>
    ),
  },
  {
    accessorKey: "paid_at",
    header: ({ column }) => <ExpenseStatusHeader column={column} />,
    cell: ({ row }) => <StatusCell expense={row.original} />,
  },
  {
    id: "chevron",
    header: "",
    enableSorting: false,
    cell: () => <ArrowRight className="size-4 text-muted-foreground/60" />,
  },
];
