"use client";

import type { BayKPI } from "./types";

// ─── KPI Strip ────────────────────────────────────────────
// Horizontal row of summary metrics.
// Uses layout-builder: Switcher primitive (row on wide, wrap on narrow).

interface KPIStripProps {
  kpis: BayKPI[];
}

export function KPIStrip({ kpis }: KPIStripProps) {
  return (
    <div className="flex flex-wrap gap-3">
      {kpis.map((kpi) => (
        <div
          key={kpi.label}
          className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3"
        >
          <span className="text-lg" aria-hidden="true">
            {kpi.icon}
          </span>
          <div className="min-w-0">
            <p className="truncate text-xs text-muted-foreground">
              {kpi.label}
            </p>
            <p className="text-lg font-bold tabular-nums leading-tight">
              {kpi.value}
            </p>
          </div>
          {kpi.trend && (
            <span
              className={`text-xs font-medium ${
                kpi.trend.direction === "up"
                  ? "text-emerald-600"
                  : kpi.trend.direction === "down"
                    ? "text-red-500"
                    : "text-muted-foreground"
              }`}
            >
              {kpi.trend.direction === "up"
                ? "↑"
                : kpi.trend.direction === "down"
                  ? "↓"
                  : "→"}
              {kpi.trend.value}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
