/**
 * Game at a glance — key advanced stats as compact visual stat cards.
 *
 * Renders a horizontal strip of stat cards showing the most important
 * game-level analytics: biggest lead, lead changes, times tied, fast
 * break points, points in paint, second chance points, biggest run,
 * and time leading.
 *
 * Server-safe — no client hooks.
 *
 * Data comes from TeamGameStatsRow records — we match the home team
 * stats and pull the away comparison alongside for context.
 */

import type { TeamGameStatsRow } from "../../../lib/shared";
import { formatMinutes } from "../../../lib/shared";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface GameAtAGlanceProps {
  homeTeamStats: TeamGameStatsRow | undefined;
  awayTeamStats: TeamGameStatsRow | undefined;
  /** Lead changes count from the summary */
  leadChanges: number;
  /** Times tied count from the summary */
  timesTied: number;
}

interface StatCardProps {
  label: string;
  homeValue: string | number;
  awayValue: string | number;
  icon?: string;
  homeWins?: boolean;
}

// ---------------------------------------------------------------------------
// Stat card sub-component
// ---------------------------------------------------------------------------

function StatCard({ label, homeValue, awayValue, homeWins }: StatCardProps) {
  return (
    <div className="flex flex-col gap-1.5 rounded-xl border bg-card p-3">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <div className="flex items-baseline gap-1.5">
        <span
          className={`text-lg font-black tabular-nums leading-none ${homeWins === true ? "text-primary" : homeWins === false ? "text-muted-foreground" : ""}`}
        >
          {homeValue}
        </span>
        <span className="text-xs text-muted-foreground">/</span>
        <span
          className={`text-lg font-black tabular-nums leading-none ${homeWins === false ? "text-warning" : homeWins === true ? "text-muted-foreground" : ""}`}
        >
          {awayValue}
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function GameAtAGlance({
  homeTeamStats,
  awayTeamStats,
  leadChanges,
  timesTied,
}: GameAtAGlanceProps) {
  if (!homeTeamStats) return null;

  const items: StatCardProps[] = [];

  if (homeTeamStats.biggest_lead != null) {
    items.push({
      label: "Хамгийн их харьцуулалт",
      homeValue: homeTeamStats.biggest_lead,
      awayValue: awayTeamStats?.biggest_lead ?? 0,
      homeWins:
        (homeTeamStats.biggest_lead ?? 0) > (awayTeamStats?.biggest_lead ?? 0),
    });
  }

  if (homeTeamStats.biggest_scoring_run_for != null) {
    items.push({
      label: "Хамгийн урт цуврал",
      homeValue: homeTeamStats.biggest_scoring_run_for,
      awayValue: awayTeamStats?.biggest_scoring_run_for ?? 0,
    });
  }

  if (homeTeamStats.fast_break_points != null) {
    items.push({
      label: "Хурдан довтолгоо",
      homeValue: homeTeamStats.fast_break_points,
      awayValue: awayTeamStats?.fast_break_points ?? 0,
    });
  }

  if (homeTeamStats.points_in_paint != null) {
    items.push({
      label: "Онооны талбай",
      homeValue: homeTeamStats.points_in_paint,
      awayValue: awayTeamStats?.points_in_paint ?? 0,
    });
  }

  if (homeTeamStats.second_chance_points != null) {
    items.push({
      label: "2-р боломж",
      homeValue: homeTeamStats.second_chance_points,
      awayValue: awayTeamStats?.second_chance_points ?? 0,
    });
  }

  if (homeTeamStats.points_from_turnovers != null) {
    items.push({
      label: "Алдалтаас",
      homeValue: homeTeamStats.points_from_turnovers,
      awayValue: awayTeamStats?.points_from_turnovers ?? 0,
    });
  }

  if (homeTeamStats.time_leading_seconds != null) {
    items.push({
      label: "Тэргүүлсэн",
      homeValue: formatMinutes(homeTeamStats.time_leading_seconds),
      awayValue: formatMinutes(awayTeamStats?.time_leading_seconds ?? 0),
    });
  }

  // Lead changes / times tied — special combined card
  const hasFlowData = leadChanges > 0 || timesTied > 0;

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((stat) => (
        <StatCard key={stat.label} {...stat} />
      ))}
      {hasFlowData ? (
        <div className="flex flex-col gap-1.5 rounded-xl border bg-card p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Тэргүүлэлт / Тэнцэл
          </p>
          <div className="flex items-baseline gap-3">
            <span className="flex items-center gap-1">
              <span className="text-lg font-black tabular-nums leading-none text-primary">
                {leadChanges}
              </span>
              <span className="text-[11px] text-muted-foreground">
                удаа тэргүүлэлт солигдсон
              </span>
            </span>
            <span className="text-xs text-muted-foreground">·</span>
            <span className="flex items-center gap-1">
              <span className="text-lg font-black tabular-nums leading-none text-warning">
                {timesTied}
              </span>
              <span className="text-[11px] text-muted-foreground">
                удаа тэнцсэн
              </span>
            </span>
          </div>
        </div>
      ) : null}
    </div>
  );
}
