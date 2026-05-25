"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DataTableColumnHeader } from "@/components/ui/data-table";
import type { ExpenseWithCategory } from "@/lib/types";
import { formatMNT } from "@/lib/utils";

// ── Category Badge ──

function CategoryBadge({ name, color }: { name: string; color: string }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium"
      style={{ backgroundColor: `${color}20`, color }}
    >
      <span className="size-1.5 rounded-full" style={{ backgroundColor: color }} />
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
          <p className="truncate text-sm font-medium">{expense.description}</p>
          {expense.reference_number && (
            <p className="truncate text-xs text-muted-foreground">
              {expense.reference_number}
            </p>
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
    cell: ({ row }) =>
      row.original.paid_at ? (
        <Badge variant="outline">Paid</Badge>
      ) : (
        <Badge variant="outline">Unpaid</Badge>
      ),
  },
  {
    id: "chevron",
    header: "",
    enableSorting: false,
    cell: () => <ArrowRight className="size-4 text-muted-foreground/40" />,
  },
];
