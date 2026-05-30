"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { AlertCircle, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DataTableColumnHeader } from "@/components/ui/data-table";
import type { ExpenseWithCategory } from "@/lib/types";
import { formatMNT } from "@/lib/utils";
import { Typography } from "@/components/ui/typography";

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
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Date" />
    ),
    cell: ({ row }) => (
      <span className="text-sm tabular-nums">
        {formatDate(row.original.expense_date)}
      </span>
    ),
  },
  {
    id: "description",
    accessorKey: "description",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Description" />
    ),
    cell: ({ row }) => {
      const expense = row.original;
      return (
        <div className="min-w-0 max-w-64">
          <Typography.Text className="truncate text-sm font-medium">
            {expense.description}
          </Typography.Text>
          {expense.reference_number && (
            <Typography.Muted className="truncate text-xs text-muted-foreground">
              Ref: {expense.reference_number}
            </Typography.Muted>
          )}
        </div>
      );
    },
  },
  {
    id: "category",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Category" />
    ),
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
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Vendor" />
    ),
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
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Due" />
    ),
    cell: ({ row }) => {
      const expense = row.original;
      if (!expense.due_date) {
        return (
          <span className="text-sm text-muted-foreground/50">&mdash;</span>
        );
      }
      const overdue = isOverdue(expense);
      return (
        <span
          className={`text-sm tabular-nums ${
            overdue ? "font-medium text-destructive" : ""
          }`}
        >
          {formatDate(expense.due_date)}
          {overdue && (
            <AlertCircle className="ml-1 inline size-3.5 text-destructive" />
          )}
        </span>
      );
    },
  },
  {
    accessorKey: "amount",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Amount" />
    ),
    cell: ({ row }) => (
      <span className="text-sm font-medium tabular-nums">
        {formatMNT(row.original.amount)}
      </span>
    ),
  },
  {
    accessorKey: "paid_at",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => {
      const expense = row.original;
      if (expense.paid_at) {
        return <Badge variant="outline">Paid</Badge>;
      }
      const overdue = isOverdue(expense);
      if (overdue) {
        return (
          <Badge
            variant="outline"
            className="border-red-300 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400 gap-1"
          >
            <AlertCircle className="size-3" />
            Overdue
          </Badge>
        );
      }
      return <Badge variant="outline">Unpaid</Badge>;
    },
  },
  {
    id: "chevron",
    header: "",
    enableSorting: false,
    cell: () => <ArrowRight className="size-4 text-muted-foreground/40" />,
  },
];
