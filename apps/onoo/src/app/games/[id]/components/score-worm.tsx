/**
 * Score worm — cumulative score differential chart (Recharts AreaChart).
 *
 * Client component that renders a stacked area chart showing the
 * cumulative home lead (positive) or away lead (negative) across
 * scoring events, with quarter-boundary reference lines.
 *
 * Positive values = home team leads, negative = away team leads.
 * Home fill / away fill use team primary colors.
 */

"use client";

import { useId } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent } from "@/components/ui";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import type { PlayByPlayRow } from "../../../lib/shared";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ScoreWormProps {
  /** Chronologically sorted scoring events. */
  events: PlayByPlayRow[];
  homeTeamSeasonId: string;
  homeTeamShortCode: string;
  awayTeamShortCode: string;
  homeTeamColor?: string | null;
  awayTeamColor?: string | null;
  homeScore: number;
  awayScore: number;
  leadChanges: number;
}

interface ChartPoint {
  /** Display label — either quarter name or empty. */
  label: string;
  /** First seq in each quarter is labeled with period number. */
  period: number | null;
  /** Cumulative home score at this point. */
  home: number;
  /** Cumulative away score at this point. */
  away: number;
  /** Cumulative lead: positive = home, negative = away. */
  diff: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const POINTS_MAP: Record<string, number> = {
  shot_2pt_made: 2,
  shot_3pt_made: 3,
  ft_made: 1,
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ScoreWorm({
  events,
  homeTeamSeasonId,
  homeTeamShortCode,
  awayTeamShortCode,
  homeTeamColor,
  awayTeamColor,
  homeScore,
  awayScore,
  leadChanges,
}: ScoreWormProps) {
  const chartId = useId();

  // Build chart series: accumulate score per event, track period changes
  const chartData: ChartPoint[] = [];
  let homeRunning = 0;
  let awayRunning = 0;
  let lastPeriod = 0;

  // Record the origin point (0,0) on period 1
  chartData.push({ label: "1-р үе", period: 1, home: 0, away: 0, diff: 0 });

  for (const ev of events) {
    const pts = POINTS_MAP[ev.event_type] ?? 0;
    if (pts === 0) continue;

    // Insert a period boundary if period changed
    if (ev.period !== lastPeriod && lastPeriod > 0) {
      chartData.push({
        label: `${ev.period}-р үе`,
        period: ev.period,
        home: homeRunning,
        away: awayRunning,
        diff: homeRunning - awayRunning,
      });
    }
    lastPeriod = ev.period;

    if (ev.team_season_id === homeTeamSeasonId) {
      homeRunning += pts;
    } else {
      awayRunning += pts;
    }

    chartData.push({
      label: "",
      period: null,
      home: homeRunning,
      away: awayRunning,
      diff: homeRunning - awayRunning,
    });
  }

  const chartConfig = {
    lead: {
      label: "Илүү ээлж",
    },
    home: {
      label: homeTeamShortCode,
      color: homeTeamColor ?? "var(--color-primary)",
    },
    away: {
      label: awayTeamShortCode,
      color: awayTeamColor ?? "var(--color-muted-foreground)",
    },
  } satisfies ChartConfig;

  const maxAbs = Math.max(
    Math.abs(Math.min(...chartData.map((d) => d.diff))),
    Math.max(...chartData.map((d) => d.diff)),
    1,
  );

  return (
    <section
      aria-labelledby="lead-flow-heading"
      className="flex flex-col gap-4"
    >
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Илүү ээлжийн урсгал
        </p>
        <h2
          id="lead-flow-heading"
          className="mt-1 text-2xl font-bold tracking-tight"
        >
          Илүү ээлжийн урсгал
        </h2>
      </div>
      <Card className="shadow-none">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4 text-sm">
            <span className="flex items-center gap-1.5">
              <span
                className="inline-block size-3 rounded-sm"
                style={{
                  backgroundColor: homeTeamColor ?? "var(--color-primary)",
                }}
                aria-hidden="true"
              />
              {homeTeamShortCode}
            </span>
            <span className="text-muted-foreground">
              {leadChanges} удаа солигдлоо
            </span>
            <span className="flex items-center gap-1.5">
              <span
                className="inline-block size-3 rounded-sm"
                style={{
                  backgroundColor:
                    awayTeamColor ?? "var(--color-muted-foreground)",
                }}
                aria-hidden="true"
              />
              {awayTeamShortCode}
            </span>
          </div>

          <ChartContainer config={chartConfig} className="mt-4 h-40 w-full">
            <AreaChart
              data={chartData}
              margin={{ top: 8, right: 8, bottom: 8, left: 0 }}
            >
              <defs>
                <linearGradient
                  id={`homeFill-${chartId}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="5%"
                    stopColor={homeTeamColor ?? "var(--color-primary)"}
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="95%"
                    stopColor={homeTeamColor ?? "var(--color-primary)"}
                    stopOpacity={0.02}
                  />
                </linearGradient>
                <linearGradient
                  id={`awayFill-${chartId}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="5%"
                    stopColor={awayTeamColor ?? "var(--color-muted-foreground)"}
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="95%"
                    stopColor={awayTeamColor ?? "var(--color-muted-foreground)"}
                    stopOpacity={0.02}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                fontSize={11}
                tickFormatter={(value: string) =>
                  value ? value.slice(0, 3) : ""
                }
              />
              <YAxis
                domain={[-maxAbs, maxAbs]}
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                fontSize={11}
                tickFormatter={(value: number) => `${Math.abs(value)}`}
              />
              <ReferenceLine y={0} stroke="var(--color-border)" />
              <ChartTooltip
                content={<ChartTooltipContent indicator="dot" />}
                cursor={false}
              />
              <Area
                type="monotone"
                dataKey="diff"
                name="lead"
                stroke={homeTeamColor ?? "var(--color-primary)"}
                fill={`url(#homeFill-${chartId})`}
                strokeWidth={2}
              />
            </AreaChart>
          </ChartContainer>

          <p className="mt-2 text-center text-xs text-muted-foreground">
            {homeTeamShortCode} {homeScore} — {awayScore} {awayTeamShortCode}
          </p>
        </CardContent>
      </Card>
    </section>
  );
}
