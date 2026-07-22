"use client";

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
import { cn, decodeEscapedUnicode } from "@/lib/utils";

interface CompareRadarProps {
  readonly leftName: string;
  readonly rightName: string;
  readonly leftStats: Record<string, number>;
  readonly rightStats: Record<string, number>;
  readonly className?: string;
}

const STAT_KEYS = [
  "pts",
  "reb",
  "ast",
  "stl",
  "blk",
  "fg",
  "tp",
  "ft",
] as const;
type StatKey = (typeof STAT_KEYS)[number];

const STAT_LABELS_MN: Record<StatKey, string> = {
  pts: "Оноо",
  reb: "Буулт",
  ast: "Дамжуулалт",
  stl: "Булчих",
  blk: "Хаалт",
  fg: "FG%",
  tp: "3P%",
  ft: "FT%",
};

const _chartConfig = {
  player1: {
    label: "",
    color: "var(--brand-sports)",
  },
  player2: {
    label: "",
    color: "var(--primary)",
  },
} satisfies ChartConfig;

export function CompareRadar({
  leftName,
  rightName,
  leftStats,
  rightStats,
  className,
}: CompareRadarProps) {
  // Normalize each stat to 0-100 against the max of both players
  const data = STAT_KEYS.map((key) => {
    const lv = leftStats[key] ?? 0;
    const rv = rightStats[key] ?? 0;
    const maxVal = Math.max(lv, rv, 1);
    return {
      stat: STAT_LABELS_MN[key],
      player1: Math.round((lv / maxVal) * 100),
      player2: Math.round((rv / maxVal) * 100),
      player1Actual: lv,
      player2Actual: rv,
    };
  });

  const config: ChartConfig = {
    player1: {
      label: leftName,
      color: "var(--brand-sports)",
    },
    player2: {
      label: rightName,
      color: "var(--primary)",
    },
  };

  return (
    <section
      aria-labelledby="compare-radar-heading"
      className={cn("w-full", className)}
    >
      <h2 id="compare-radar-heading" className="sr-only">
        Чадварын профиль харьцуулалт
      </h2>

      <ChartContainer
        config={config}
        className="aspect-square w-full max-w-md mx-auto"
      >
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
          <PolarGrid stroke="var(--color-border)" />
          <PolarAngleAxis
            dataKey="stat"
            tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
          />
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
                  const isP1 = decodeEscapedUnicode(String(name)) === leftName;
                  const actual = isP1
                    ? (point.player1Actual as number)
                    : (point.player2Actual as number);
                  return [
                    `${actual.toFixed(1)} (${value}%)`,
                    decodeEscapedUnicode(String(name)),
                  ];
                }}
              />
            }
          />
          <Radar
            name={rightName}
            dataKey="player2"
            stroke="var(--color-player2)"
            fill="var(--color-player2)"
            fillOpacity={0.3}
            strokeWidth={2}
            isAnimationActive={false}
          />
          <Radar
            name={leftName}
            dataKey="player1"
            stroke="var(--color-player1)"
            fill="var(--color-player1)"
            fillOpacity={0.3}
            strokeWidth={2}
            isAnimationActive={false}
          />
        </RadarChart>
      </ChartContainer>

      {/* Legend */}
      <div
        className="mt-4 flex justify-center gap-6 text-sm"
        role="list"
        aria-label="Тоглогчдын тэмдэглэгээ"
      >
        <span role="listitem" className="inline-flex items-center gap-2">
          <span
            className="inline-block size-3 rounded-full"
            style={{ backgroundColor: "var(--brand-sports)" }}
          />
          {leftName}
        </span>
        <span role="listitem" className="inline-flex items-center gap-2">
          <span
            className="inline-block size-3 rounded-full"
            style={{ backgroundColor: "var(--primary)" }}
          />
          {rightName}
        </span>
      </div>
    </section>
  );
}
