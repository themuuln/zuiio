"use client";

import dynamic from "next/dynamic";

export const MonthlyTrendChart = dynamic(
  () =>
    import("@/components/dashboard/monthly-trend-chart").then(
      (m) => m.MonthlyTrendChart,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="rounded-xl border bg-card text-card-foreground shadow-xs">
        <div className="px-6 py-4">
          <div className="h-5 w-48 animate-pulse rounded bg-muted" />
        </div>
        <div className="px-6 pb-6">
          <div className="h-60 w-full animate-pulse rounded-lg bg-muted md:h-72" />
        </div>
      </div>
    ),
  },
);
