import type { ReactNode } from "react";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { Button } from "@/components/ui/button";
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
            data-slot="data-table-row"
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
    <div className={cn("flex flex-col", className)}>
      {/* Header - hidden on tablet/mobile, visible on desktop+ */}
      <div className="hidden lg:flex items-center gap-4 px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        {columns.map((col) => (
          <div key={col.key} className={cn("flex-1", col.className)}>
            {col.header}
          </div>
        ))}
      </div>

      {/* Rows */}
      <div className="flex flex-col gap-1">
        {data.map((item) => (
          <Button
            key={keyExtractor(item)}
            variant="ghost"
            data-slot="data-table-row"
            onClick={() => onRowClick?.(item)}
            className={cn(
              "flex flex-col lg:flex-row lg:items-center gap-1 lg:gap-4",
              "rounded-xl border border-border bg-card px-4 py-3 text-left",
              "h-auto w-full",
              onRowClick && "hover:bg-muted/50",
            )}
          >
            {columns.map((col, _idx) => (
              <div
                key={col.key}
                className={cn(
                  "flex-1 min-w-0",
                  col.className,
                  // Show header as label on mobile
                  "flex lg:block items-baseline gap-2",
                )}
              >
                <span className="lg:hidden text-xs font-medium text-muted-foreground shrink-0">
                  {col.header}
                </span>
                <span className="truncate text-sm">{col.cell(item)}</span>
              </div>
            ))}
          </Button>
        ))}
      </div>
    </div>
  );
}
