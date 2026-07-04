"use client";

import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type Period = "7d" | "30d" | "all";

type AutomationSummary = {
  id: string;
  name: string;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  deliveryRate: number | null;
  openRate: number | null;
  clickRate: number | null;
};

type AnalyticsResponse = {
  automations: AutomationSummary[];
  totals: {
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
  };
};

const PERIOD_OPTIONS: Array<{ value: Period; label: string }> = [
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "all", label: "All time" },
];

const CARD_DEFINITIONS: Array<{
  key: keyof AnalyticsResponse["totals"];
  label: string;
  color: string;
}> = [
  { key: "sent", label: "Sent", color: "text-blue-500" },
  { key: "delivered", label: "Delivered", color: "text-green-500" },
  { key: "opened", label: "Opened", color: "text-amber-500" },
  { key: "clicked", label: "Clicked", color: "text-purple-500" },
];

function formatRate(rate: number | null): string {
  if (rate === null) return "\u2014";
  return `${(rate * 100).toFixed(1)}%`;
}

function formatCount(n: number): string {
  return n.toLocaleString();
}

function PeriodSelector({
  value,
  onChange,
}: {
  value: Period;
  onChange: (period: Period) => void;
}) {
  return (
    <div className="flex items-center gap-1 rounded-lg border border-border p-0.5">
      {PERIOD_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            "rounded-md px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer",
            value === opt.value
              ? "bg-accent text-accent-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function SummaryCards({
  totals,
}: {
  totals: AnalyticsResponse["totals"];
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {CARD_DEFINITIONS.map((def) => (
        <div
          key={def.key}
          className="rounded-xl border border-border bg-card p-4"
        >
          <p className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
            {def.label}
          </p>
          <p className={cn("mt-1.5 text-2xl font-bold tabular-nums", def.color)}>
            {formatCount(totals[def.key])}
          </p>
        </div>
      ))}
    </div>
  );
}

function AutomationTable({
  automations,
}: {
  automations: AutomationSummary[];
}) {
  if (automations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card py-16">
        <p className="text-sm text-muted-foreground">
          No automation data available.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <Th>Automation</Th>
              <Th>Sent</Th>
              <Th>Delivered</Th>
              <Th>Opened</Th>
              <Th>Clicked</Th>
              <Th>Delivery Rate</Th>
              <Th>Open Rate</Th>
              <Th>Click Rate</Th>
            </tr>
          </thead>
          <tbody>
            {automations.map((auto, idx) => (
              <tr
                key={auto.id}
                className={cn(
                  "border-b border-border transition-colors hover:bg-muted/20",
                  idx === automations.length - 1 && "border-b-0",
                )}
              >
                <Td className="font-medium text-foreground max-w-[200px] truncate">
                  {auto.name}
                </Td>
                <Td>{formatCount(auto.sent)}</Td>
                <Td>{formatCount(auto.delivered)}</Td>
                <Td>{formatCount(auto.opened)}</Td>
                <Td>{formatCount(auto.clicked)}</Td>
                <Td className="tabular-nums">{formatRate(auto.deliveryRate)}</Td>
                <Td className="tabular-nums">{formatRate(auto.openRate)}</Td>
                <Td className="tabular-nums">{formatRate(auto.clickRate)}</Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground whitespace-nowrap">
      {children}
    </th>
  );
}

function Td({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <td className={cn("px-4 py-3 text-muted-foreground whitespace-nowrap", className)}>
      {children}
    </td>
  );
}

export function AnalyticsDashboard() {
  const [period, setPeriod] = useState<Period>("all");
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async (p: Period) => {
    setLoading(true);
    setError(null);

    try {
      const url = new URL("/api/analytics", window.location.origin);
      if (p !== "all") {
        url.searchParams.set("period", p);
      }

      const res = await fetch(url.toString(), { cache: "no-store" });
      const body = (await res.json()) as AnalyticsResponse & { error?: string };

      if (!res.ok) {
        setError(body.error ?? "Failed to load analytics data.");
        return;
      }

      setData(body);
    } catch {
      setError("Failed to load analytics data. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchAnalytics(period);
  }, [period, fetchAnalytics]);

  const handlePeriodChange = (p: Period) => {
    setPeriod(p);
  };

  return (
    <main className="flex-1 min-w-0 min-h-0 overflow-auto bg-background p-6">
      <div className="mx-auto max-w-6xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-foreground">Analytics</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Message performance across all automations.
            </p>
          </div>
          <PeriodSelector value={period} onChange={handlePeriodChange} />
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center rounded-xl border border-border bg-card py-16">
            <p className="text-sm text-muted-foreground">Loading analytics data&hellip;</p>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card py-16">
            <p className="text-sm font-medium text-red-500">{error}</p>
            <button
              type="button"
              onClick={() => fetchAnalytics(period)}
              className="mt-3 rounded-lg border border-border px-4 py-2 text-xs font-medium text-foreground hover:bg-accent transition-colors cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && data && data.automations.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card py-16">
            <p className="text-sm text-muted-foreground">
              No analytics data yet. Start sending messages to see performance metrics.
            </p>
          </div>
        )}

        {/* Data */}
        {!loading && !error && data && data.automations.length > 0 && (
          <>
            <SummaryCards totals={data.totals} />
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-foreground">
                Per-Automation Breakdown
              </h2>
              <AutomationTable automations={data.automations} />
            </div>
          </>
        )}
      </div>
    </main>
  );
}
