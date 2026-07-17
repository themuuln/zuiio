"use client";

import { ChartNoAxesCombined, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
} from "recharts";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { cn } from "@/lib/utils";

/**
 * Normalization: each axis value = (player_value / league_max) × 100.
 * League-max is the max value across all qualified players for that stat.
 * This lets shapes be visually comparable across axes — a player who leads
 * the league in one stat and is average in another shows an asymmetric shape
 * that immediately communicates their skill profile.
 *
 * The chart displays NORMALIZED values (0–100) on the axes, but tooltips
 * show the ACTUAL per-game values so readers can interpret the real numbers.
 *
 * Enhanced: league average overlay can be toggled on/off for comparison.
 */

const STATS = ["pts", "reb", "ast", "stl", "blk"] as const;
type StatKey = (typeof STATS)[number];

const chartConfig = {
  player: {
    label: "Тоглогч",
    color: "var(--team-color, var(--brand-sports))",
  },
  league: {
    label: "Лигийн дундаж",
    color: "var(--color-muted-foreground)",
  },
} satisfies ChartConfig;

// Mongolian labels for axes — kept inline to avoid server-import of i18n
const STAT_LABELS_MN: Record<StatKey, string> = {
  pts: "Оноо",
  reb: "Буулт",
  ast: "Дамжуулалт",
  stl: "Булчих",
  blk: "Хамгаалалт",
};

interface SkillRadarProps {
  playerStats: {
    pts: number;
    reb: number;
    ast: number;
    stl: number;
    blk: number;
  };
  leagueAverages: {
    pts: number;
    reb: number;
    ast: number;
    stl: number;
    blk: number;
  };
  leagueMaxes: {
    pts: number;
    reb: number;
    ast: number;
    stl: number;
    blk: number;
  };
  className?: string;
}

export function SkillRadar({
  playerStats,
  leagueAverages,
  leagueMaxes,
  className,
}: SkillRadarProps) {
  const [showLeague, setShowLeague] = useState(true);

  // Build chart data: normalize to league-max = 100
  const data = STATS.map((stat) => ({
    stat: STAT_LABELS_MN[stat],
    statKey: stat,
    player:
      leagueMaxes[stat] > 0
        ? Math.round((playerStats[stat] / leagueMaxes[stat]) * 100)
        : 0,
    league:
      leagueMaxes[stat] > 0
        ? Math.round((leagueAverages[stat] / leagueMaxes[stat]) * 100)
        : 0,
    // Actual values for tooltip display
    playerActual: playerStats[stat],
    leagueActual: leagueAverages[stat],
  }));

  if (STATS.every((stat) => leagueMaxes[stat] === 0)) {
    return (
      <div
        className={cn(
          "flex min-h-64 flex-col items-center justify-center text-center",
          className,
        )}
      >
        <ChartNoAxesCombined
          className="size-6 text-muted-foreground"
          aria-hidden="true"
        />
        <p className="mt-3 font-semibold">Харьцуулах мэдээлэл хүрэлцэхгүй</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Лигийн тав ба түүнээс олон тоглолттой тоглогчид нэмэгдэхэд зураглал
          гарна.
        </p>
      </div>
    );
  }

  return (
    <div className={cn("w-full max-w-sm", className)}>
      {/* Toggle league overlay */}
      <div className="mb-2 flex justify-end">
        <button
          type="button"
          onClick={() => setShowLeague((v) => !v)}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium transition-colors",
            showLeague
              ? "text-muted-foreground hover:bg-muted"
              : "text-muted-foreground/50 hover:bg-muted/50",
          )}
          aria-label={
            showLeague
              ? "Лигийн дундаж нуух"
              : "Лигийн дундаж харуулах"
          }
        >
          {showLeague ? (
            <Eye className="size-3" aria-hidden="true" />
          ) : (
            <EyeOff className="size-3" aria-hidden="true" />
          )}
          Лигийн дундаж
        </button>
      </div>

      <ChartContainer
        config={chartConfig}
        className="aspect-square w-full"
      >
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
          <PolarGrid />
          <PolarAngleAxis dataKey="stat" tick={{ fontSize: 11 }} />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={false}
            tickCount={5}
          />
          <ChartTooltip
            content={
              <ChartTooltipContent
                formatter={(value, name, item) => {
                  const point = item.payload as Record<string, unknown>;
                  const isPlayer = name === "Тоглогч";
                  const actual = isPlayer
                    ? (point.playerActual as number)
                    : (point.leagueActual as number);
                  return [`${actual.toFixed(1)} (${value}%)`, String(name)];
                }}
              />
            }
          />
          {showLeague && (
            <Radar
              name="Лигийн дундаж"
              dataKey="league"
              stroke="var(--color-league)"
              fill="var(--color-league)"
              fillOpacity={0.12}
              strokeWidth={1.5}
              strokeDasharray="4 2"
              isAnimationActive={false}
            />
          )}
          <Radar
            name="Тоглогч"
            dataKey="player"
            stroke="var(--color-player)"
            fill="var(--color-player)"
            fillOpacity={0.18}
            strokeWidth={2}
            isAnimationActive={false}
          />
        </RadarChart>
      </ChartContainer>
    </div>
  );
}
