import type { ColumnDef } from "@tanstack/react-table";
import type React from "react";
import { formatCurrency, formatDate } from "@/lib/format";

/**
 * Column factory functions for DataTable.
 *
 * Reduces boilerplate for the most common column patterns.
 * Each returns a standard TanStack ColumnDef ready for <DataTable>.
 *
 * Usage:
 * ```tsx
 * import { dateColumn, currencyColumn, textColumn, actionsColumn } from "@/lib/table-columns";
 *
 * const columns: ColumnDef<MyRow>[] = [
 *   dateColumn("created_at", "Огноо"),
 *   currencyColumn("amount", "Дүн"),
 *   textColumn("description", "Тайлбар"),
 *   actionsColumn("Үйлдэл", (row) => <EditDrawer data={row} />),
 * ];
 * ```
 */

/** Date column — formats value with formatDate, renders "-" for null. */
export function dateColumn<T>(
  key: keyof T & string,
  header: string,
): ColumnDef<T> {
  return {
    accessorKey: key,
    header,
    cell: ({ row }) => {
      const v = row.getValue(key) as string | null;
      return v ? formatDate(v) : "-";
    },
  };
}

/** Currency column — formats value with formatCurrency, defaults to 0. */
export function currencyColumn<T>(
  key: keyof T & string,
  header: string,
): ColumnDef<T> {
  return {
    accessorKey: key,
    header,
    cell: ({ row }) => formatCurrency(Number(row.getValue(key) ?? 0)),
  };
}

/** Text column — renders value with configurable null fallback (default "-"). */
export function textColumn<T>(
  key: keyof T & string,
  header: string,
  fallback = "-",
): ColumnDef<T> {
  return {
    accessorKey: key,
    header,
    cell: ({ row }) => (row.getValue(key) as React.ReactNode) ?? fallback,
  };
}

/**
 * Actions column — renders a cell with stopPropagation wrapper.
 * The render callback receives the original row data.
 */
export function actionsColumn<T>(
  header: string,
  render: (row: T) => React.ReactNode,
): ColumnDef<T> {
  return {
    id: "actions",
    header,
    enableSorting: false,
    enableHiding: false,
    cell: ({ row }) => (
      <div onClick={(e) => e.stopPropagation()} role="none">
        {render(row.original)}
      </div>
    ),
  };
}
