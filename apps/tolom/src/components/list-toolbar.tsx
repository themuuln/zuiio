"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { SearchInput } from "./search-input";

interface ListToolbarProps {
  /** Search config — omit to hide search */
  search?: {
    placeholder?: string;
    value: string;
    onChange: (value: string) => void;
    onValueChange?: (value: string) => void;
    loading?: boolean;
    resultLabel?: string;
    emptyLabel?: string;
    focusShortcut?: string | false;
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
    <div
      className={cn(
        "sticky top-0 z-30 flex flex-col gap-3 bg-background/95 px-1 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80",
        className,
      )}
    >
      {/* Search + Actions row */}
      {(search || actions) && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {search && (
            <div className="flex-1">
              <SearchInput
                placeholder={search.placeholder}
                value={search.value}
                onSearch={search.onChange}
                onValueChange={search.onValueChange}
                loading={search.loading}
                debounceMs={400}
                focusShortcut={search.focusShortcut ?? false}
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
          <div className="flex flex-wrap items-center gap-3">
            {filters}
            {search?.value && (search.resultLabel || search.emptyLabel) && (
              <span className="text-sm text-muted-foreground">
                {stats ? "· " : ""}
                {search.resultLabel ?? search.emptyLabel}
              </span>
            )}
          </div>
          {stats && (
            <div className="text-sm text-muted-foreground">{stats}</div>
          )}
        </div>
      )}
    </div>
  );
}
