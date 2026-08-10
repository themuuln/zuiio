"use client";

import {
  type ColumnDef,
  type ColumnFiltersState,
  flexRender,
  getCoreRowModel,
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
  SortAsc,
  SortDesc,
} from "lucide-react";
import { useTranslations } from "next-intl";
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
  /** Map of column id → display name for the column visibility toggle */
  columnLabels?: Record<string, string>;
  /** Initial column visibility state (e.g. `{ id: false }` to hide ID by default) */
  defaultColumnVisibility?: VisibilityState;
  /** Initial sort state (e.g. `[{ id: "shortage", desc: true }]`) */
  defaultSorting?: SortingState;
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
  renderMobileCard?: (
    row: TData,
    table: TanStackTable<TData>,
  ) => React.ReactNode;
  /**
   * When true, the table container omits its own border and border-radius,
   * relying on the parent Card to provide those. Use inside DataTablePage
   * to prevent double borders.
   */
  insideCard?: boolean;
  /**
   * When true, the pagination footer is not rendered inside the table.
   * Use with `onTableReady` to render pagination externally.
   */
  noPagination?: boolean;
  /**
   * Called with the TanStack Table instance when it's created.
   * Use to render pagination controls outside the DataTable component.
   */
  onTableReady?: (table: TanStackTable<TData>) => void;
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
  insideCard = false,
  noPagination = false,
  columnLabels,
  defaultColumnVisibility,
  defaultSorting,
  onTableReady,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>(
    defaultSorting ?? [],
  );
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>(defaultColumnVisibility ?? {});
  const [rowSelection, setRowSelection] = React.useState({});
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const paginationEnabled = pageSize > 0 && !noPagination;

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
    ...(paginationEnabled
      ? {
          getPaginationRowModel: getPaginationRowModel(),
        }
      : {}),
  });

  // Notify caller when table instance is ready (for external pagination)
  const tableRef = React.useRef(table);
  tableRef.current = table;
  React.useEffect(() => {
    onTableReady?.(table);
  }, [table, onTableReady]);

  const t = useTranslations("common");

  // ── Loading skeleton ──────────────────────────────────────

  if (loading) {
    return (
      <div className={cn("flex flex-col gap-3", className)}>
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

  if (!data || data.length === 0) {
    return (
      <div className={cn(className)}>
        {emptyState ?? (
          <Empty>
            <EmptyHeader>
              <EmptyTitle>{t("noDataFound")}</EmptyTitle>
              <EmptyDescription>{t("tryAdjustingFilters")}</EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {/* ── Toolbar ────────────────────────────────────────── */}
      {(toolbar || search) && (
        <div className="flex items-center justify-between py-4">
          <div className="flex items-center gap-4">
            {search && (
              <Input
                placeholder={search.placeholder ?? t("searchDots")}
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
                className="max-w-sm"
              />
            )}
            {toolbar}
          </div>
        </div>
      )}

      {/* ── Mobile Card View ──────────────────────────────── */}
      {renderMobileCard && mounted && (
        <div className="grid gap-3 sm:gap-4 md:hidden">
          {table.getRowModel().rows.length > 0 ? (
            table.getRowModel().rows.map((row) => (
              // biome-ignore lint/a11y/useSemanticElements: mobile card wrapper with click handler, needs div for grid layout
              <div
                key={row.id}
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  // The card wrapper itself is a [role="button"] container, so
                  // a plain closest() match would always swallow the click.
                  // Only bail out when the click landed on a NESTED interactive
                  // element (a real control inside the card), not on the row.
                  const interactive = (e.target as HTMLElement).closest(
                    'button, a, input, select, textarea, [role="button"], [role="menuitem"], [data-slot$="trigger"]',
                  );
                  if (interactive && interactive !== e.currentTarget) return;
                  onRowClick?.(row.original);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    onRowClick?.(row.original);
                  }
                }}
                className={cn(
                  "rounded-md border border-border/80 bg-card p-4 ring-1 ring-foreground/10 transition-colors",
                  onRowClick &&
                    "cursor-pointer hover:border-border active:bg-muted/50",
                )}
              >
                {renderMobileCard(row.original, table)}
              </div>
            ))
          ) : (
            <div className="py-8 text-center text-sm text-muted-foreground">
              {t("noResultsDot")}
            </div>
          )}
        </div>
      )}

      {/* ── Table ──────────────────────────────────────────── */}
      <div
        className={cn(
          insideCard ? "overflow-clip" : "overflow-clip rounded-sm border",
          renderMobileCard && "hidden md:block",
        )}
      >
        <Table className="[&_thead_tr]:bg-muted/30 [&_thead]:sticky [&_thead]:top-0 [&_thead]:z-10 [&_thead]:bg-background">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead
                      key={header.id}
                      colSpan={header.colSpan}
                      aria-sort={
                        header.column.getIsSorted() === "asc"
                          ? "ascending"
                          : header.column.getIsSorted() === "desc"
                            ? "descending"
                            : header.column.getCanSort()
                              ? "none"
                              : undefined
                      }
                      className={cn(
                        header.column.columnDef.meta?.align === "right" &&
                          "text-right",
                      )}
                    >
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
                  onClick={(e) => {
                    if (
                      (e.target as HTMLElement).closest(
                        'button, a, input, select, textarea, [role="button"], [role="menuitem"], [data-slot$="trigger"]',
                      )
                    )
                      return;
                    onRowClick?.(row.original);
                  }}
                  className={cn(
                    "transition-colors even:bg-muted/[.04] hover:bg-muted/50",
                    onRowClick && "cursor-pointer",
                  )}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={cn(
                        cell.column.columnDef.meta?.align === "right" &&
                          "text-right",
                      )}
                    >
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
                  {t("noResultsDot")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* ── Pagination ─────────────────────────────────────── */}
      {paginationEnabled && (
        <DataTablePagination
          table={table}
          showColumnVisibility={showColumnVisibility}
          columnLabels={columnLabels}
        />
      )}
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
    <div className={cn("flex items-center gap-2", className)}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="-ml-2 border-0 px-2 text-sm font-medium text-muted-foreground hover:text-foreground data-[state=open]:text-foreground focus-visible:ring-0"
      >
        <span>{title}</span>
        {column.getIsSorted() === "asc" ? (
          <SortAsc className="ml-1 size-3.5" />
        ) : column.getIsSorted() === "desc" ? (
          <SortDesc className="ml-1 size-3.5" />
        ) : (
          <ArrowUpDown className="ml-1 size-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover/button:opacity-100" />
        )}
      </Button>
    </div>
  );
}

// ─── DataTablePagination ───────────────────────────────────────

interface DataTablePaginationProps<TData> {
  table: TanStackTable<TData>;
  showColumnVisibility?: boolean;
  columnLabels?: Record<string, string>;
}

export function DataTablePagination<TData>({
  table,
  showColumnVisibility = false,
  columnLabels,
}: DataTablePaginationProps<TData>) {
  const t = useTranslations("common");
  const pageSizes = [10, 20, 30, 40, 50];

  return (
    <div className="flex items-center justify-between border-t border-border/50 px-2 py-3">
      {/* Left: selected count + column visibility */}
      <div className="flex flex-1 items-center gap-4">
        <div className="hidden text-sm text-muted-foreground sm:block">
          {table.getFilteredSelectedRowModel().rows.length > 0 &&
            t("rowsSelected", {
              selected: String(table.getFilteredSelectedRowModel().rows.length),
              total: String(table.getFilteredRowModel().rows.length),
            })}
        </div>
        {showColumnVisibility && (
          <DataTableViewOptions table={table} columnLabels={columnLabels} />
        )}
      </div>

      {/* Right: page info */}
      <div className="flex items-center gap-6 sm:gap-8">
        {/* Page size */}
        <div className="hidden items-center gap-2 md:flex">
          <Label
            htmlFor="rows-per-page"
            className="text-sm font-medium text-muted-foreground"
          >
            {t("rowsPerPage")}
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
          {t("pageOf", {
            current: String(table.getState().pagination.pageIndex + 1),
            total: String(table.getPageCount()),
          })}
        </div>

        {/* Navigation buttons */}
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            className="hidden size-8 p-0 lg:flex"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          >
            <span className="sr-only">{t("goToFirstPage")}</span>
            <ChevronsLeft />
          </Button>
          <Button
            variant="outline"
            className="size-8 p-0"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <span className="sr-only">{t("goToPreviousPage")}</span>
            <ChevronLeft />
          </Button>
          <Button
            variant="outline"
            className="size-8 p-0"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <span className="sr-only">{t("goToNextPage")}</span>
            <ChevronRight />
          </Button>
          <Button
            variant="outline"
            className="hidden size-8 p-0 lg:flex"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
          >
            <span className="sr-only">{t("goToLastPage")}</span>
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
  columnLabels?: Record<string, string>;
}

export function DataTableViewOptions<TData>({
  table,
  columnLabels,
}: DataTableViewOptionsProps<TData>) {
  const t = useTranslations("common");
  const columns = table
    .getAllColumns()
    .filter(
      (column) =>
        typeof column.accessorFn !== "undefined" && column.getCanHide(),
    );

  function formatColumnLabel(id: string): string {
    if (columnLabels?.[id]) return columnLabels[id];
    return id.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  }

  function toggleAll(show: boolean) {
    for (const column of columns) {
      column.toggleVisibility(show);
    }
  }

  const allVisible = columns.every((c) => c.getIsVisible());

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            className="h-9 gap-1.5"
            aria-label={t("toggleColumns")}
          >
            <Columns3 className="size-4" />
            <span className="hidden lg:inline">{t("columns")}</span>
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex items-center justify-between">
            <span>{t("toggleColumns")}</span>
            <button
              type="button"
              onClick={() => toggleAll(!allVisible)}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {allVisible ? t("hideAll") : t("showAll")}
            </button>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {columns.map((column) => (
            <DropdownMenuCheckboxItem
              key={column.id}
              checked={column.getIsVisible()}
              onCheckedChange={(value) => column.toggleVisibility(!!value)}
            >
              {formatColumnLabel(column.id)}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
