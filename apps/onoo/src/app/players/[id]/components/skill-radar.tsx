"use client";

import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

/**
 * Normalization: each axis value = (player_value / league_max) × 100.
 * League-max is the max value across all qualified players for that stat.
 * This lets shapes be visually comparable across axes — a player who leads
 * the league in one stat and is average in another shows an asymmetric shape
 * that immediately communicates their skill profile.
 *
 * The chart displays NORMALIZED values (0–100) on the axes, but tooltips
 * show the ACTUAL per-game values so readers can interpret the real numbers.
 */

const STATS = ["pts", "reb", "ast", "stl", "blk"] as const;
type StatKey = (typeof STATS)[number];

const chartConfig = {
  player: {
    label: "Тоглогч",
    color: "var(--team-color, oklch(0.78 0.16 80))",
  },
  league: {
    label: "Лигийн дундаж",
    color: "oklch(0.65 0.01 265)",
  },
} satisfies ChartConfig;

// Mongolian labels for axes — kept inline to avoid server-import of i18n
const STAT_LABELS_MN: Record<StatKey, string> = {
  pts: "Оноо",
  reb: "Буулт",
  ast: "Олгосон",
  stl: "Булаасан",
  blk: "Блок",
};

interface SkillRadarProps {
  playerStats: { pts: number; reb: number; ast: number; stl: number; blk: number };
  leagueAverages: { pts: number; reb: number; ast: number; stl: number; blk: number };
  leagueMaxes: { pts: number; reb: number; ast: number; stl: number; blk: number };
}

export function SkillRadar({
  playerStats,
  leagueAverages,
  leagueMaxes,
}: SkillRadarProps) {
  // Build chart data: normalize to league-max = 100
  const data = STATS.map((stat) => ({
    stat: STAT_LABELS_MN[stat],
    statKey: stat,
    player: leagueMaxes[stat] > 0
      ? Math.round((playerStats[stat] / leagueMaxes[stat]) * 100)
      : 0,
    league: leagueMaxes[stat] > 0
      ? Math.round((leagueAverages[stat] / leagueMaxes[stat]) * 100)
      : 0,
    // Actual values for tooltip display
    playerActual: playerStats[stat],
    leagueActual: leagueAverages[stat],
  }));

  return (
    <ChartContainer config={chartConfig} className="aspect-square w-full max-w-[320px]">
      <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
        <PolarGrid />
        <PolarAngleAxis dataKey="stat" tick={{ fontSize: 11 }} />
        <PolarRadiusAxis
          angle={90}
          domain={[0, 100]}
          tick={{ fontSize: 10 }}
          tickCount={5}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={(value, name) => {
                const item = data.find((d) => {
                  if (name === "Тоглогч") return true;
                  if (name === "Лигийн дундаж") return true;
                  return false;
                });
                const actual = name === "Тоглагч"
                  ? item?.playerActual
                  : item?.leagueActual;
                return [
                  actual !== undefined ? actual.toFixed(1) : String(value),
                  String(name),
                ];
              }}
            />
          }
        />
        <Radar
          name="Лигийн дундаж"
          dataKey="league"
          stroke="var(--color-league)"
          fill="var(--color-league)"
          fillOpacity={0.08}
          strokeWidth={1.5}
          strokeDasharray="4 2"
        />
        <Radar
          name="Тоглогч"
          dataKey="player"
          stroke="var(--color-player)"
          fill="var(--color-player)"
          fillOpacity={0.18}
          strokeWidth={2}
        />
      </RadarChart>
    </ChartContainer>
  );
}
