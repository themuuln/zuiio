"use client";

import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export interface FilterChip {
  key: string;
  label: string;
  active: boolean;
  onClick: () => void;
  icon?: ReactNode;
  colorDot?: string; // tailwind bg class, e.g. "bg-blue-500"
  count?: number;
}

interface FilterChipsProps {
  items: FilterChip[];
  className?: string;
}

/**
 * Horizontal row of filter chips/pills.
 * Used for status filters, type filters, tab-like selections.
 * Tablet-friendly with large touch targets (var(--ui-touch-target)).
 */
export function FilterChips({ items, className }: FilterChipsProps) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {items.map((chip) => (
        <button
          key={chip.key}
          type="button"
          data-slot="filter-chip"
          onClick={chip.onClick}
          className={cn(
            "inline-flex items-center gap-2 rounded-full border px-4 py-2.5",
            "text-sm font-medium transition-colors",
            "min-h-[var(--ui-touch-target)]",
            chip.active
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-background border-border text-muted-foreground hover:bg-muted",
          )}
        >
          {chip.colorDot && (
            <span
              className={cn("size-2.5 rounded-full", chip.colorDot)}
              aria-hidden="true"
            />
          )}
          {chip.icon}
          {chip.label}
          {chip.count !== undefined && (
            <span
              className={cn(
                "ml-0.5 rounded-full px-1.5 py-0.5 text-xs tabular-nums",
                chip.active
                  ? "bg-primary-foreground/20"
                  : "bg-muted-foreground/10",
              )}
            >
              {chip.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
