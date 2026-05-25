"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
        <Button
          key={chip.key}
          variant={chip.active ? "default" : "outline"}
          data-slot="filter-chip"
          onClick={chip.onClick}
          className={cn(
            "rounded-full px-4 py-2.5 text-sm font-medium",
            "min-h-[var(--ui-touch-target)]",
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
            <Badge variant={chip.active ? "secondary" : "outline"} className="tabular-nums ml-0.5">
              {chip.count}
            </Badge>
          )}
        </Button>
      ))}
    </div>
  );
}
