"use client";

import { ArrowDown, ArrowUp, ArrowUpDown, type Star } from "lucide-react";
import { Button } from "@/components/ui/button";
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
    <Button
      variant="ghost"
      size="sm"
      onClick={() => onSort(sortKey)}
      className="w-full justify-start gap-1 font-medium"
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
    </Button>
  );
}
