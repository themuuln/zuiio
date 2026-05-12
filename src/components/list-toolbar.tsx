"use client";

import type { ReactNode } from "react";
import { SearchInput } from "./search-input";
import { cn } from "@/lib/utils";

interface ListToolbarProps {
  /** Search config — omit to hide search */
  search?: {
    placeholder?: string;
    value: string;
    onChange: (value: string) => void;
    loading?: boolean;
  };
  /** Filter chips or any filter UI slot */
  filters?: ReactNode;
  /** Action buttons (Add, etc.) */
  actions?: ReactNode;
  /** Stats / count text */
  stats?: ReactNode;
  className?: string;
}

/**
 * Standardized list toolbar: search + filters + actions + stats.
 * All list pages use this for consistent layout.
 *
 * Responsive: stacks vertically on mobile, row on tablet+.
 */
export function ListToolbar({
  search,
  filters,
  actions,
  stats,
  className,
}: ListToolbarProps) {
  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {/* Search + Actions row */}
      {(search || actions) && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {search && (
            <div className="flex-1">
              <SearchInput
                placeholder={search.placeholder}
                onSearch={search.onChange}
                loading={search.loading}
                debounceMs={400}
              />
            </div>
          )}
          {actions && (
            <div className="flex items-center gap-2 shrink-0">{actions}</div>
          )}
        </div>
      )}

      {/* Filters + Stats row */}
      {(filters || stats) && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          {filters}
          {stats && (
            <div className="text-sm text-muted-foreground">{stats}</div>
          )}
        </div>
      )}
    </div>
  );
}
