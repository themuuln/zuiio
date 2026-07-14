import type { ColumnDef } from "@tanstack/react-table";
import * as React from "react";
import { ErpEmptyState } from "@/components/erp/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export interface Column<T> {
  header: string;
  /** Accessor key on the item, or a render function */
  accessor: keyof T | ((item: T) => React.ReactNode);
  className?: string;
  cellClassName?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (item: T) => void;
  loading?: boolean;
  keyExtractor: (item: T) => string | number;
  /** Optional Card wrapper title */
  title?: string;
  emptyState: {
    icon?: React.ReactNode;
    title: string;
    description: string;
    action?: React.ReactNode;
  };
  /** Rows per page (default: 10). Pass data.length to show all rows without pagination. */
  pageSize?: number;
}

/** Inline skeleton rows rendered inside the table when loading is true */
function SkeletonRows({ columns }: { columns: Column<unknown>[] }) {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <TableRow key={i}>
          {columns.map((col) => (
            <TableCell key={String(col.header)}>
              <Skeleton className="h-4 w-full" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}

export function ErpDataTable<T extends Record<string, unknown>>({
  columns,
  data,
  onRowClick,
  loading,
  keyExtractor,
  title,
  emptyState,
  pageSize: propPageSize,
}: DataTableProps<T>) {
  // Convert simple Column<T> config to TanStack ColumnDef
  const tanstackColumns: ColumnDef<T>[] = React.useMemo(
    () =>
      columns.map((col) => ({
        id: String(col.header),
        header: col.header,
        accessorFn: (row: T) => {
          if (typeof col.accessor === "function") {
            return col.accessor(row);
          }
          return row[col.accessor];
        },
        cell: ({ getValue }) => {
          const value = getValue();
          if (value === null || value === undefined) {
            return <span className="text-muted-foreground">-</span>;
          }
          if (React.isValidElement(value)) return value;
          return String(value);
        },
        enableSorting: false,
        enableHiding: false,
        meta: col.cellClassName
          ? ({ cellClassName: col.cellClassName } as Record<string, unknown>)
          : undefined,
      })),
    [columns],
  );

  // ── Loading: render table structure with inline skeleton rows ──
  if (loading) {
    const loadingTable = (
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((col) => (
              <TableHead key={String(col.header)} className={col.className}>
                {col.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          <SkeletonRows columns={columns as Column<unknown>[]} />
        </TableBody>
      </Table>
    );

    if (title) {
      return (
        <Card>
          <CardHeader>
            <CardTitle>{title}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">{loadingTable}</CardContent>
        </Card>
      );
    }

    return loadingTable;
  }

  // ── Empty state (only when data is loaded and truly empty) ──
  if (data.length === 0) {
    return (
      <ErpEmptyState
        icon={emptyState.icon}
        title={emptyState.title}
        description={emptyState.description}
        action={emptyState.action}
      />
    );
  }

  // ── Data ──
  const table = (
    <DataTable
      columns={tanstackColumns}
      data={data}
      onRowClick={onRowClick}
      pageSize={propPageSize ?? 10}
      enableSorting={false}
      enableColumnVisibility={false}
    />
  );

  if (title) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">{table}</CardContent>
      </Card>
    );
  }

  return table;
}
