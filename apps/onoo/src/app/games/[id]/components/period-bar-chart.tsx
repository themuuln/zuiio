/**
 * Period bar chart — visual quarter-by-quarter scoring comparison.
 *
 * Renders horizontal segmented bars showing each period's score
 * contribution, making it easy to spot which team dominated which
 * quarter. The bars show the percentage of total points scored in
 * each period.
 *
 * Server-safe — no client hooks.
 */

import type { PeriodScoreRow } from "../../../lib/shared";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PeriodBarChartProps {
  periodScores: PeriodScoreRow[];
  homeTeamName: string;
  awayTeamName: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Get a human-readable period label.
 */
function periodLabel(period: number): string {
  if (period <= 4) return `${period}-р үе`;
  return `Нэмэлт цаг ${period - 4}`;
}

/**
 * Background color for each period — cycles through chart color classes.
 */
function periodBg(index: number, side: "home" | "away"): string {
  const colors = [
    "bg-chart-1",
    "bg-chart-2",
    "bg-chart-3",
    "bg-chart-4",
    "bg-chart-5",
  ];
  const color = colors[index % colors.length] ?? "bg-primary";
  // Away side gets a lighter / muted version via opacity
  if (side === "away") return `${color}/60`;
  return color;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PeriodBarChart({
  periodScores,
  homeTeamName,
  awayTeamName,
}: PeriodBarChartProps) {
  if (periodScores.length === 0) return null;

  const totalHomePts = periodScores.reduce(
    (sum, ps) => sum + ps.home_points,
    0,
  );
  const totalAwayPts = periodScores.reduce(
    (sum, ps) => sum + ps.away_points,
    0,
  );
  const maxTotal = Math.max(totalHomePts, totalAwayPts, 1);

  return (
    <div className="space-y-4">
      {/* Home team bar */}
      <div className="space-y-1.5">
        <div className="flex items-baseline justify-between">
          <span className="text-sm font-semibold">{homeTeamName}</span>
          <span className="text-sm tabular-nums text-muted-foreground">
            Нийт{" "}
            <span className="font-bold text-foreground">{totalHomePts}</span>
          </span>
        </div>
        <div className="flex h-8 w-full gap-0.5 overflow-hidden rounded-lg">
          {periodScores.map((ps, i) => {
            const pct =
              totalHomePts > 0 ? (ps.home_points / totalHomePts) * 100 : 0;
            return (
              <div
                key={`home-${ps.period}`}
                className={`relative flex items-center justify-center transition-all ${periodBg(i, "home")}`}
                style={{ width: `${Math.max(pct, 2)}%` }}
                title={`${periodLabel(ps.period)}: ${ps.home_points} оноо`}
              >
                {pct > 12 ? (
                  <span className="text-[11px] font-bold tabular-nums text-primary-foreground leading-none">
                    {ps.home_points}
                  </span>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      {/* Away team bar */}
      <div className="space-y-1.5">
        <div className="flex items-baseline justify-between">
          <span className="text-sm font-semibold">{awayTeamName}</span>
          <span className="text-sm tabular-nums text-muted-foreground">
            Нийт{" "}
            <span className="font-bold text-foreground">{totalAwayPts}</span>
          </span>
        </div>
        <div className="flex h-8 w-full gap-0.5 overflow-hidden rounded-lg">
          {periodScores.map((ps, i) => {
            const pct =
              totalAwayPts > 0 ? (ps.away_points / totalAwayPts) * 100 : 0;
            return (
              <div
                key={`away-${ps.period}`}
                className={`relative flex items-center justify-center transition-all ${periodBg(i, "away")}`}
                style={{ width: `${Math.max(pct, 2)}%` }}
                title={`${periodLabel(ps.period)}: ${ps.away_points} оноо`}
              >
                {pct > 12 ? (
                  <span className="text-[11px] font-bold tabular-nums text-primary-foreground leading-none">
                    {ps.away_points}
                  </span>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      {/* Period legend */}
      <div className="flex flex-wrap gap-2">
        {periodScores.map((ps, i) => {
          const colors = [
            "bg-chart-1",
            "bg-chart-2",
            "bg-chart-3",
            "bg-chart-4",
            "bg-chart-5",
          ];
          return (
            <div
              key={`legend-${ps.period}`}
              className="flex items-center gap-1.5"
            >
              <span
                className={`inline-block size-2.5 rounded-sm ${colors[i % colors.length]}`}
              />
              <span className="text-xs text-muted-foreground">
                {periodLabel(ps.period)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
