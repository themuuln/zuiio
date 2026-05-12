import type { ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export interface DataTableColumn<T> {
  key: string;
  header: string;
  cell: (item: T) => ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  keyExtractor: (item: T) => string;
  onRowClick?: (item: T) => void;
  loading?: boolean;
  emptyState?: ReactNode;
  className?: string;
}

/**
 * Simple, tablet-friendly data table with large rows.
 * Supports loading skeleton, empty state, and row click.
 */
export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  onRowClick,
  loading = false,
  emptyState,
  className,
}: DataTableProps<T>) {
  if (loading) {
    return (
      <div className={cn("flex flex-col gap-2", className)}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={`skeleton-${i}`}
            className="flex items-center gap-4 rounded-xl border border-border p-4"
          >
            {columns.map((col) => (
              <div key={col.key} className={cn("flex-1", col.className)}>
                <Skeleton className="h-5 w-full" />
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center py-12 text-muted-foreground",
          className,
        )}
      >
        {emptyState ?? (
          <div className="text-center">
            <p className="text-base font-medium">No data found</p>
            <p className="text-sm">Try adjusting your search or filters.</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col", className)}>
      {/* Header - hidden on mobile, visible on tablet+ */}
      <div className="hidden md:flex items-center gap-4 px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        {columns.map((col) => (
          <div key={col.key} className={cn("flex-1", col.className)}>
            {col.header}
          </div>
        ))}
      </div>

      {/* Rows */}
      <div className="flex flex-col gap-1">
        {data.map((item) => (
          <button
            key={keyExtractor(item)}
            type="button"
            onClick={() => onRowClick?.(item)}
            className={cn(
              "flex flex-col md:flex-row md:items-center gap-1 md:gap-4",
              "rounded-xl border border-border bg-card px-4 py-3 text-left",
              "transition-colors",
              onRowClick &&
                "cursor-pointer hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            )}
          >
            {columns.map((col, _idx) => (
              <div
                key={col.key}
                className={cn(
                  "flex-1 min-w-0",
                  col.className,
                  // Show header as label on mobile
                  "flex md:block items-baseline gap-2",
                )}
              >
                <span className="md:hidden text-xs font-medium text-muted-foreground shrink-0">
                  {col.header}
                </span>
                <span className="truncate text-sm">{col.cell(item)}</span>
              </div>
            ))}
          </button>
        ))}
      </div>
    </div>
  );
}
