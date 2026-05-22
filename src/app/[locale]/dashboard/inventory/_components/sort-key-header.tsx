"use client";

import { ArrowDown, ArrowUp, ArrowUpDown, Star } from "lucide-react";
import type { SortKey } from "./constants";

export function SortKeyHeader({
  label,
  sortKey,
  currentSortKey,
  sortDir,
  onSort,
  icon,
}: {
  label: string;
  sortKey: SortKey;
  currentSortKey: SortKey;
  sortDir: "asc" | "desc";
  onSort: (key: SortKey) => void;
  icon?: typeof Star;
}) {
  const isActive = currentSortKey === sortKey;
  const IconEl = icon;
  return (
    <button
      type="button"
      onClick={() => onSort(sortKey)}
      className="flex items-center gap-1 text-left font-medium text-muted-foreground hover:text-foreground transition-colors"
    >
      {IconEl && <IconEl className="size-3.5" />}
      {label}
      <span className="ml-auto">
        {isActive ? (
          sortDir === "desc" ? (
            <ArrowDown className="size-3.5" />
          ) : (
            <ArrowUp className="size-3.5" />
          )
        ) : (
          <ArrowUpDown className="size-3.5" />
        )}
      </span>
    </button>
  );
}
