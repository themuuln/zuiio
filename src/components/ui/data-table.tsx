"use client";

import {
  type ColumnDef,
  type ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type SortingState,
  type Table as TanStackTable,
  useReactTable,
  type VisibilityState,
} from "@tanstack/react-table";
import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Columns3,
  Search,
  SortAsc,
  SortDesc,
} from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

// ─── Types ─────────────────────────────────────────────────────

export interface DataTableProps<TData, TValue> {
  /** Column definitions (from @tanstack/react-table) */
  columns: ColumnDef<TData, TValue>[];
  /** Row data */
  data: TData[];
  /** Unique row identifier for key extraction (default: row.index) */
  getRowId?: (row: TData) => string;
  /** Number of rows per page (default: 10, set to -1 to disable pagination) */
  pageSize?: number;
  /** Show loading skeleton instead of content */
  loading?: boolean;
  /** Called when a row is clicked */
  onRowClick?: (row: TData) => void;
  /** Custom empty state (default: generic "No data found") */
  emptyState?: React.ReactNode;
  /** Toolbar content rendered above the table */
  toolbar?: React.ReactNode;
  /** Show column visibility toggle in toolbar (default: false) */
  showColumnVisibility?: boolean;
  /** Enable row selection (default: false) */
  enableRowSelection?: boolean;
  /** Enable global search filter */
  search?: {
    /** Column key to filter by */
    column?: string;
    /** Filter function or "generic" for global search */
    type?: "column" | "global";
    /** Placeholder text */
    placeholder?: string;
  };
  /** Additional class name */
  className?: string;
  /**
   * Render each row as a mobile-friendly card instead of a table row
   * on small screens (<768px). When provided, the table is hidden on
   * mobile and replaced with card-based layout.
   */
  renderMobileCard?: (row: TData) => React.ReactNode;
}

// ─── DataTable (self-contained) ────────────────────────────────

export function DataTable<TData, TValue>({
  columns,
  data,
  getRowId,
  pageSize = 10,
  loading = false,
  onRowClick,
  emptyState,
  toolbar,
  showColumnVisibility = false,
  enableRowSelection = false,
  search,
  className,
  renderMobileCard,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [globalFilter, setGlobalFilter] = React.useState("");

  const paginationEnabled = pageSize > 0;

  const table = useReactTable({
    data,
    columns,
    getRowId,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      ...(search?.type === "global" ? { globalFilter } : {}),
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    ...(enableRowSelection
      ? {
          onRowSelectionChange: setRowSelection,
          enableRowSelection: true,
        }
      : {}),
    ...(search?.type === "global"
      ? {
          onGlobalFilterChange: setGlobalFilter,
          globalFilterFn: "includesString",
        }
      : {}),
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    ...(paginationEnabled
      ? {
          getPaginationRowModel: getPaginationRowModel(),
        }
      : {}),
  });

  // ── Loading skeleton ──────────────────────────────────────

  if (loading) {
    return (
      <div className={cn("space-y-3", className)}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={`skel-${i}`}
            className="flex items-center gap-4 rounded-none border border-border p-4"
          >
            {columns
              .filter((_, ci) => {
                // Skip hidden columns in skeleton
                const col = table.getColumn(
                  (columns[ci] as { id?: string; accessorKey?: string }).id ??
                    (columns[ci] as { accessorKey?: string }).accessorKey ??
                    `col-${ci}`,
                );
                return col?.getIsVisible() ?? true;
              })
              .map((_col, ci) => (
                <div key={`skel-cell-${ci}`} className="flex-1">
                  <Skeleton className="h-5 w-full" />
                </div>
              ))}
          </div>
        ))}
      </div>
    );
  }

  // ── Empty state ───────────────────────────────────────────

  if (data.length === 0) {
    return (
      <div className={cn(className)}>
        {emptyState ?? (
          <Empty>
            <EmptyHeader>
              <EmptyTitle>No data found</EmptyTitle>
              <EmptyDescription>
                Try adjusting your search or filters.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* ── Toolbar ────────────────────────────────────────── */}
      {(toolbar || search || showColumnVisibility) && (
        <div className="flex items-center gap-3">
          {search && (
            <div className="relative max-w-sm flex-1">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={search.placeholder ?? "Search..."}
                value={
                  search.type === "global"
                    ? globalFilter
                    : ((table
                        .getColumn(search.column ?? "")
                        ?.getFilterValue() as string) ?? "")
                }
                onChange={(event) => {
                  if (search.type === "global") {
                    setGlobalFilter(event.target.value);
                  } else {
                    table
                      .getColumn(search.column ?? "")
                      ?.setFilterValue(event.target.value);
                  }
                }}
                className="h-8 pl-9"
              />
            </div>
          )}
          {toolbar}
          {showColumnVisibility && <DataTableViewOptions table={table} />}
        </div>
      )}

      {/* ── Mobile Card View ──────────────────────────────── */}
      {renderMobileCard && (
        <div className="grid gap-3 sm:gap-4 md:hidden">
          {table.getRowModel().rows.length > 0 ? (
            table.getRowModel().rows.map((row) => (
              <div
                key={row.id}
                onClick={() => onRowClick?.(row.original)}
                className={cn(
                  "rounded-lg border border-border bg-card p-4 transition-colors",
                  onRowClick && "cursor-pointer active:bg-muted/50",
                )}
              >
                {renderMobileCard(row.original)}
              </div>
            ))
          ) : (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No results.
            </div>
          )}
        </div>
      )}

      {/* ── Table ──────────────────────────────────────────── */}
      <div
        className={cn(
          "overflow-x-auto rounded-none border",
          renderMobileCard && "hidden md:block",
        )}
      >
        <Table>
          <TableHeader className="bg-muted/50">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} colSpan={header.colSpan}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  onClick={() => onRowClick?.(row.original)}
                  className={cn(
                    "border-b border-border transition-colors",
                    onRowClick && "cursor-pointer hover:bg-muted/30",
                  )}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* ── Pagination ─────────────────────────────────────── */}
      {paginationEnabled && <DataTablePagination table={table} />}
    </div>
  );
}

// ─── DataTableColumnHeader ─────────────────────────────────────

interface DataTableColumnHeaderProps<TData>
  extends React.HTMLAttributes<HTMLDivElement> {
  table?: TanStackTable<TData>;
  column: {
    id: string;
    getIsSorted: () => false | "asc" | "desc";
    toggleSorting: (desc?: boolean) => void;
    getCanSort: () => boolean;
  };
  title: string;
}

export function DataTableColumnHeader<TData>({
  column,
  title,
  className,
}: DataTableColumnHeaderProps<TData>) {
  if (!column.getCanSort()) {
    return <div className={cn(className)}>{title}</div>;
  }

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="h-8 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground"
      >
        {title}
        {column.getIsSorted() === "asc" ? (
          <SortAsc className="ml-1 size-3.5" />
        ) : column.getIsSorted() === "desc" ? (
          <SortDesc className="ml-1 size-3.5" />
        ) : (
          <ArrowUpDown className="ml-1 size-3.5 opacity-40" />
        )}
      </Button>
    </div>
  );
}

// ─── DataTablePagination ───────────────────────────────────────

interface DataTablePaginationProps<TData> {
  table: TanStackTable<TData>;
}

export function DataTablePagination<TData>({
  table,
}: DataTablePaginationProps<TData>) {
  const pageSizes = [10, 20, 30, 40, 50];

  return (
    <div className="flex items-center justify-between px-2">
      {/* Selected row count */}
      <div className="hidden flex-1 text-sm text-muted-foreground sm:block">
        {table.getFilteredSelectedRowModel().rows.length > 0 && (
          <>
            {table.getFilteredSelectedRowModel().rows.length} of{" "}
            {table.getFilteredRowModel().rows.length} row(s) selected.
          </>
        )}
      </div>

      {/* Page info */}
      <div className="flex items-center gap-6 sm:gap-8">
        {/* Page size */}
        <div className="hidden items-center gap-2 md:flex">
          <Label htmlFor="rows-per-page" className="text-sm font-medium">
            Rows per page
          </Label>
          <Select
            value={`${table.getState().pagination.pageSize}`}
            onValueChange={(value) => {
              table.setPageSize(Number(value));
            }}
          >
            <SelectTrigger size="sm" className="h-8 w-16" id="rows-per-page">
              <SelectValue placeholder={table.getState().pagination.pageSize} />
            </SelectTrigger>
            <SelectContent side="top">
              {pageSizes.map((size) => (
                <SelectItem key={size} value={`${size}`}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Page indicator */}
        <div className="flex w-[100px] items-center justify-center text-sm font-medium">
          Page {table.getState().pagination.pageIndex + 1} of{" "}
          {table.getPageCount()}
        </div>

        {/* Navigation buttons */}
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            className="hidden size-8 p-0 lg:flex"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          >
            <span className="sr-only">Go to first page</span>
            <ChevronsLeft />
          </Button>
          <Button
            variant="outline"
            className="size-8 p-0"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <span className="sr-only">Go to previous page</span>
            <ChevronLeft />
          </Button>
          <Button
            variant="outline"
            className="size-8 p-0"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <span className="sr-only">Go to next page</span>
            <ChevronRight />
          </Button>
          <Button
            variant="outline"
            className="hidden size-8 p-0 lg:flex"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
          >
            <span className="sr-only">Go to last page</span>
            <ChevronsRight />
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── DataTableViewOptions ──────────────────────────────────────

interface DataTableViewOptionsProps<TData> {
  table: TanStackTable<TData>;
}

export function DataTableViewOptions<TData>({
  table,
}: DataTableViewOptionsProps<TData>) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="outline" size="sm" className="h-9 gap-1.5">
            <Columns3 className="size-4" />
            <span className="hidden lg:inline">Columns</span>
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {table
            .getAllColumns()
            .filter(
              (column) =>
                typeof column.accessorFn !== "undefined" && column.getCanHide(),
            )
            .map((column) => {
              return (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  className="capitalize"
                  checked={column.getIsVisible()}
                  onCheckedChange={(value) => column.toggleVisibility(!!value)}
                >
                  {column.id}
                </DropdownMenuCheckboxItem>
              );
            })}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
