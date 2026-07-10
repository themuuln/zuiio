"use client";

import type {
  ColumnDef,
  Table as TanStackTable,
  VisibilityState,
} from "@tanstack/react-table";
import type { ReactNode } from "react";
import { useRef } from "react";
import { ListPageShell } from "@/components/list-page-shell";
import { ListToolbar } from "@/components/list-toolbar";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable, DataTablePagination } from "@/components/ui/data-table";
import {
  Empty,
  EmptyContent,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { cn } from "@/lib/utils";

// ─── Types ─────────────────────────────────────────────────────

export interface DataTablePageProps<TData, TValue> {
  /** Page title */
  title: ReactNode;
  /** Optional subtitle / description */
  description?: ReactNode;
  /** Action button(s) in the header (e.g. "Add Customer") */
  headerAction?: ReactNode;

  // ── DataTable essentials ──
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  getRowId: (row: TData) => string;
  /** Number of rows per page (default: 20, set to -1 to disable pagination) */
  pageSize?: number;

  // ── States ──
  /** True while initial data is loading (shows page skeleton) */
  loading?: boolean;
  /** Error message to show instead of content */
  error?: string | null;
  /** Called when user clicks retry after an error */
  onRetry?: () => void;

  // ── Search ──
  search?: {
    placeholder?: string;
    value: string;
    onChange: (value: string) => void;
    onValueChange?: (value: string) => void;
    loading?: boolean;
    resultLabel?: string;
    emptyLabel?: string;
  };

  // ── Toolbar slots ──
  /** Filter chips, selects, toggle groups */
  filters?: ReactNode;
  /** Export buttons, secondary actions */
  actions?: ReactNode;
  /** Stats / count text */
  stats?: ReactNode;

  // ── Table features ──
  onRowClick?: (row: TData) => void;
  renderMobileCard?: (row: TData, table: TanStackTable<TData>) => ReactNode;
  showColumnVisibility?: boolean;
  columnLabels?: Record<string, string>;
  defaultColumnVisibility?: VisibilityState;
  enableRowSelection?: boolean;

  // ── Empty state ──
  /** Fully custom empty state node */
  emptyState?: ReactNode;
  /** Shortcut: empty state title (with default icon) */
  emptyTitle?: string;
  /** Shortcut: empty state icon */
  emptyIcon?: React.ComponentType<{ className?: string }>;
  /** Shortcut: empty state action (e.g. CTA button) */
  emptyAction?: ReactNode;

  // ── Extra content ──
  /** Rendered between toolbar and table (KPI cards, inline forms, badges) */
  beforeTable?: ReactNode;

  // ── Card styling ──
  cardClassName?: string;
  className?: string;
}

// ─── Component ─────────────────────────────────────────────────

/**
 * Standardized list page with consistent layout.
 *
 * Combines `ListPageShell` + `ListToolbar` + `DataTable` in a Card,
 * with consistent loading, empty, and error states.
 *
 * - Initial load (`loading && no data`) → page-level skeleton via ListPageShell
 * - Refetch (`loading && existing data`) → inline skeleton via DataTable
 * - Empty (`!loading && no data`) → custom or default empty state
 * - Error → centered error card with retry button
 *
 * @example
 * ```tsx
 * <DataTablePage
 *   title="Vehicles"
 *   columns={columns}
 *   data={vehicles}
 *   getRowId={(r) => r.id}
 *   loading={isLoading}
 *   search={{ value: search, onChange: setSearch }}
 *   onRowClick={(r) => setDetailVehicleId(r.id)}
 * />
 * ```
 */
export function DataTablePage<TData, TValue>({
  title,
  description,
  headerAction,
  columns,
  data,
  getRowId,
  pageSize = 20,
  loading = false,
  error = null,
  onRetry,
  search,
  filters,
  actions,
  stats,
  onRowClick,
  renderMobileCard,
  showColumnVisibility = false,
  defaultColumnVisibility,
  columnLabels,
  emptyState,
  emptyTitle,
  emptyIcon: EmptyIcon,
  emptyAction,
  beforeTable,
  cardClassName,
  className,
}: DataTablePageProps<TData, TValue>) {
  const isFirstLoad = loading && data.length === 0;
  const tableRef = useRef<TanStackTable<TData> | null>(null);
  const paginationEnabled = pageSize === undefined || pageSize > 0;

  const resolvedEmptyState: ReactNode =
    emptyState ??
    (emptyTitle || EmptyIcon || emptyAction ? (
      <Empty>
        <EmptyHeader>
          {EmptyIcon && (
            <EmptyMedia variant="icon">
              <EmptyIcon className="size-6" />
            </EmptyMedia>
          )}
          {emptyTitle && <EmptyTitle>{emptyTitle}</EmptyTitle>}
        </EmptyHeader>
        {emptyAction && <EmptyContent>{emptyAction}</EmptyContent>}
      </Empty>
    ) : undefined);

  return (
    <ListPageShell
      title={title}
      description={description}
      headerAction={headerAction}
      loading={isFirstLoad}
      error={error}
      onRetry={onRetry}
      className={className}
    >
      {(search || filters || actions || stats) && (
        <ListToolbar
          search={search}
          filters={filters}
          actions={actions}
          stats={stats}
        />
      )}

      {beforeTable}

      <Card className={cn(cardClassName)}>
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={data}
            getRowId={getRowId}
            pageSize={pageSize}
            loading={loading}
            onRowClick={onRowClick}
            renderMobileCard={renderMobileCard}
            showColumnVisibility={showColumnVisibility}
            columnLabels={columnLabels}
            defaultColumnVisibility={defaultColumnVisibility}
            emptyState={resolvedEmptyState}
            insideCard
            noPagination={paginationEnabled}
            onTableReady={(t) => {
              tableRef.current = t;
            }}
          />
        </CardContent>
      </Card>

      {tableRef.current && paginationEnabled && (
        <DataTablePagination
          table={tableRef.current}
          showColumnVisibility={showColumnVisibility}
          columnLabels={columnLabels}
        />
      )}
    </ListPageShell>
  );
}
