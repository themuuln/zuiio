"use client";

import {
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  ChevronUp,
  SlidersHorizontal,
} from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  /** Column ID to use for search filtering */
  searchColumn?: string;
  searchPlaceholder?: string;
  pageSize?: number;
  totalLabel?: string;
  /** Enable column sorting by clicking headers */
  enableSorting?: boolean;
  /** Enable column visibility toggle in toolbar */
  enableColumnVisibility?: boolean;
  /** Enable row selection with checkboxes */
  enableRowSelection?: boolean;
  /** Callback when a row is clicked. When provided, rows get a cursor-pointer style. */
  onRowClick?: (row: TData) => void;
  /** Extra toolbar content rendered after search, before column toggle */
  toolbar?: React.ReactNode;
}

function getHeaderLabel(header: unknown): string {
  if (typeof header === "string") return header;
  return "";
}

function getPageNumbers(
  currentPage: number,
  totalPages: number,
): (number | "ellipsis")[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  const pages: (number | "ellipsis")[] = [1];
  if (currentPage > 3) pages.push("ellipsis");
  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);
  for (let i = start; i <= end; i++) pages.push(i);
  if (currentPage < totalPages - 2) pages.push("ellipsis");
  pages.push(totalPages);
  return pages;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchColumn,
  searchPlaceholder = "Хайх...",
  pageSize: initialPageSize = 10,
  totalLabel = "мөр",
  enableSorting = false,
  enableColumnVisibility = false,
  enableRowSelection = false,
  onRowClick,
  toolbar,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [pageSize, setPageSize] = React.useState(initialPageSize);

  const selectionColumn = React.useMemo(
    () =>
      enableRowSelection
        ? ({
            id: "select",
            header: ({ table }: { table: unknown }) => {
              const t = table as {
                getIsAllPageRowsSelected: () => boolean;
                getIsSomePageRowsSelected: () => boolean;
                toggleAllPageRowsSelected: (value: boolean) => void;
              };
              return (
                <Checkbox
                  checked={
                    t.getIsAllPageRowsSelected() ||
                    (t.getIsSomePageRowsSelected() && "indeterminate")
                  }
                  onCheckedChange={(value) =>
                    t.toggleAllPageRowsSelected(!!value)
                  }
                  aria-label="Бүгдийг сонгох"
                />
              );
            },
            cell: ({ row }: { row: unknown }) => {
              const r = row as {
                getIsSelected: () => boolean;
                toggleSelected: (value: boolean) => void;
              };
              return (
                <Checkbox
                  checked={r.getIsSelected()}
                  onCheckedChange={(value) => r.toggleSelected(!!value)}
                  onClick={(e) => e.stopPropagation()}
                  aria-label="Мөрийг сонгох"
                />
              );
            },
            enableSorting: false,
            enableHiding: false,
            meta: { sticky: true },
          } as ColumnDef<TData, TValue>)
        : null,
    [enableRowSelection],
  );

  const tableColumns = React.useMemo(() => {
    if (selectionColumn) return [selectionColumn, ...columns];
    return columns;
  }, [selectionColumn, columns]);

  const table = useReactTable({
    data,
    columns: tableColumns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    enableRowSelection,
    state: { sorting, columnFilters, columnVisibility, rowSelection },
    initialState: { pagination: { pageSize } },
  });

  React.useEffect(() => {
    table.setPageSize(pageSize);
  }, [pageSize, table]);

  const pageIndex = table.getState().pagination.pageIndex;
  const pageCount = table.getPageCount();
  const filteredCount = table.getFilteredRowModel().rows.length;
  const hasRows = table.getRowModel().rows.length > 0;

  return (
    <div className="flex flex-col gap-3">
      {/* ── Toolbar ── */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
        {searchColumn && (
          <Input
            placeholder={searchPlaceholder}
            value={
              (table.getColumn(searchColumn)?.getFilterValue() as string) ?? ""
            }
            onChange={(event) =>
              table.getColumn(searchColumn)?.setFilterValue(event.target.value)
            }
            className="w-full sm:max-w-xs"
          />
        )}
        <div className="flex items-center gap-2 sm:ml-auto">
          {toolbar}
          {enableColumnVisibility && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-xs sm:text-sm"
                >
                  <SlidersHorizontal className="size-3.5 sm:size-4" />
                  <span className="hidden sm:inline">Баганууд</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {table
                  .getAllColumns()
                  .filter((col) => col.getCanHide())
                  .map((col) => {
                    const label =
                      getHeaderLabel(col.columnDef.header) || col.id;
                    return (
                      <DropdownMenuCheckboxItem
                        key={col.id}
                        checked={col.getIsVisible()}
                        onCheckedChange={(value) =>
                          col.toggleVisibility(!!value)
                        }
                      >
                        {label}
                      </DropdownMenuCheckboxItem>
                    );
                  })}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* ── Table ── */}
      <div className="relative overflow-x-auto rounded-lg border">
        {/* Scroll hint gradient */}
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-background/80 to-transparent" />

        <Table>
          <TableHeader className="sticky top-0 z-10 bg-muted/50">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="border-b border-border/50">
                {headerGroup.headers.map((header) => {
                  const canSort = enableSorting && header.column.getCanSort();
                  return (
                    <TableHead
                      key={header.id}
                      className={cn(
                        "h-9 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:h-10 sm:px-3 sm:text-xs",
                        canSort && "select-none",
                      )}
                    >
                      {header.isPlaceholder ? null : (
                        <div
                          className={cn(
                            "flex items-center gap-1",
                            canSort && "cursor-pointer hover:text-foreground",
                          )}
                          onClick={
                            canSort
                              ? header.column.getToggleSortingHandler()
                              : undefined
                          }
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                          {canSort && (
                            <span className="inline-flex shrink-0">
                              {header.column.getIsSorted() === "asc" ? (
                                <ChevronUp className="size-3" />
                              ) : header.column.getIsSorted() === "desc" ? (
                                <ChevronDown className="size-3" />
                              ) : (
                                <ChevronsUpDown className="size-3 text-muted-foreground/30" />
                              )}
                            </span>
                          )}
                        </div>
                      )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {hasRows ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className={cn(
                    "border-b border-border/30 transition-colors even:bg-muted/15",
                    onRowClick && "cursor-pointer",
                    row.getIsSelected() && "bg-muted/40 even:bg-muted/40",
                  )}
                  onClick={
                    onRowClick ? () => onRowClick(row.original) : undefined
                  }
                >
                  {row.getVisibleCells().map((cell) => {
                    const isSelectCell = cell.column.id === "select";
                    return (
                      <TableCell
                        key={cell.id}
                        className={cn(
                          "px-2 py-2.5 text-xs sm:px-3 sm:py-3 sm:text-sm",
                          isSelectCell && "w-10",
                        )}
                        onClick={
                          isSelectCell
                            ? (e) => e.stopPropagation()
                            : undefined
                        }
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={table.getAllColumns().length}
                  className="h-40 text-center"
                >
                  <div className="flex flex-col items-center gap-1.5">
                    <p className="text-sm text-muted-foreground">
                      No results.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* ── Pagination ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left: total counts + page-size selector */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground sm:text-sm">
          <span>
            Нийт {filteredCount} {totalLabel}
          </span>
          {filteredCount > initialPageSize && (
            <div className="hidden items-center gap-1.5 sm:flex">
              <span>Мөр/хуудас:</span>
              <Select
                value={String(pageSize)}
                onValueChange={(v) => setPageSize(Number(v))}
              >
                <SelectTrigger className="h-7 w-14 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[5, 10, 20, 50].map((size) => (
                    <SelectItem key={size} value={String(size)}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Right: page navigation */}
        {pageCount > 1 && (
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="xs"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="gap-1"
            >
              <ChevronLeft className="size-3.5" />
              <span className="hidden sm:inline">Өмнөх</span>
            </Button>

            {/* Page numbers: hidden on mobile */}
            <div className="hidden items-center gap-1 sm:flex">
              {getPageNumbers(pageIndex + 1, pageCount).map(
                (page, idx) =>
                  page === "ellipsis" ? (
                    <span
                      key={`ellipsis-${idx}`}
                      className="flex size-7 items-center justify-center text-xs text-muted-foreground"
                    >
                      ...
                    </span>
                  ) : (
                    <Button
                      key={page}
                      variant={
                        page === pageIndex + 1 ? "default" : "outline"
                      }
                      size="xs"
                      onClick={() => table.setPageIndex(page - 1)}
                      className="min-w-7"
                    >
                      {page}
                    </Button>
                  ),
              )}
            </div>

            {/* Mobile-only compact page indicator */}
            <span className="text-xs text-muted-foreground sm:hidden">
              {pageIndex + 1}/{pageCount}
            </span>

            <Button
              variant="outline"
              size="xs"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="gap-1"
            >
              <span className="hidden sm:inline">Дараах</span>
              <ChevronRight className="size-3.5" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
