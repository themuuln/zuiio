"use client";

import { BAY_STATUS_META, BAY_STATUSES, type BayFilter } from "./types";

// ─── Filter Bar ───────────────────────────────────────────
// Status filter pills + view toggle.
// Uses layout-builder: Cluster primitive (inline flex-wrap gap).

interface FilterBarProps {
  activeFilter: BayFilter;
  onFilterChange: (filter: BayFilter) => void;
  bayCounts: Record<BayFilter, number>;
}

export function FilterBar({
  activeFilter,
  onFilterChange,
  bayCounts,
}: FilterBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Status filter pills */}
      <FilterPill
        label="Бүгд"
        count={bayCounts.all}
        isActive={activeFilter === "all"}
        onClick={() => onFilterChange("all")}
      />
      {BAY_STATUSES.map((status) => (
        <FilterPill
          key={status}
          label={BAY_STATUS_META[status].label}
          count={bayCounts[status]}
          isActive={activeFilter === status}
          color={BAY_STATUS_META[status].color}
          icon={BAY_STATUS_META[status].icon}
          onClick={() => onFilterChange(status)}
        />
      ))}
    </div>
  );
}

// ─── FilterPill ───────────────────────────────────────────

function FilterPill({
  label,
  count,
  isActive,
  color,
  icon,
  onClick,
}: {
  label: string;
  count: number;
  isActive: boolean;
  color?: string;
  icon?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5
        text-xs font-medium transition-colors
        ${
          isActive
            ? "border-primary bg-primary text-primary-foreground"
            : "border-border bg-background text-muted-foreground hover:bg-muted"
        }
      `}
    >
      {icon && (
        <span className={isActive ? "" : color} aria-hidden="true">
          {icon}
        </span>
      )}
      {label}
      <span
        className={`ml-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
          isActive
            ? "bg-primary-foreground/20 text-primary-foreground"
            : "bg-muted text-muted-foreground"
        }`}
      >
        {count}
      </span>
    </button>
  );
}
