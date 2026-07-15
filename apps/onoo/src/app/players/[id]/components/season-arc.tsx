"use client";

import { useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type GameDataPoint = {
  game_id: string;
  game_date: string;
  opponent: string;
  pts: number;
  reb: number;
  ast: number;
  result: "W" | "L";
};

type StatKey = "pts" | "reb" | "ast";

// ---------------------------------------------------------------------------
// Chart config — maps stat keys to labels and token colors
// ---------------------------------------------------------------------------

const chartConfig = {
  pts: {
    label: "Оноо",
    color: "var(--color-chart-1)",
  },
  reb: {
    label: "Буулт",
    color: "var(--color-chart-2)",
  },
  ast: {
    label: "Дамжуулалт",
    color: "var(--color-chart-5)",
  },
} satisfies ChartConfig;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDateShort(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("mn-MN", {
    month: "short",
    day: "numeric",
  });
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface SeasonArcProps {
  data: GameDataPoint[];
}

export function SeasonArc({ data }: SeasonArcProps) {
  const [activeStat, setActiveStat] = useState<StatKey>("pts");

  // Empty state
  if (data.length === 0) {
    return (
      <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">
        Дүнгийн мэдээлэл байхгүй
      </div>
    );
  }

  // Single game — hide chart, show message
  if (data.length === 1) {
    const game = data[0] as GameDataPoint;
    return (
      <div className="flex h-[200px] flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
        <p>Нэг тоглолтын мэдээлэл</p>
        <p className="tabular-nums text-foreground">
          {game.result === "W" ? "Ялалт" : "Ялагдал"} · {game.opponent} ·{" "}
          {game.pts} оноо, {game.reb} буулт, {game.ast} дамжуулалт
        </p>
      </div>
    );
  }

  // Add index-based X axis (1, 2, 3…)
  const chartData = data.map((d, i) => ({
    ...d,
    gameIndex: i + 1,
  }));

  const colorVar =
    activeStat === "pts"
      ? "var(--color-chart-1)"
      : activeStat === "reb"
        ? "var(--color-chart-2)"
        : "var(--color-chart-5)";

  const statLabel =
    activeStat === "pts"
      ? "Оноо"
      : activeStat === "reb"
        ? "Буулт"
        : "Дамжуулалт";

  return (
    <div className="space-y-3">
      <Tabs
        value={activeStat}
        onValueChange={(v) => setActiveStat(v as StatKey)}
      >
        <TabsList variant="line">
          <TabsTrigger value="pts">Оноо</TabsTrigger>
          <TabsTrigger value="reb">Буулт</TabsTrigger>
          <TabsTrigger value="ast">Дамжуулалт</TabsTrigger>
        </TabsList>
      </Tabs>

      <ChartContainer config={chartConfig} className="h-[200px] w-full">
        <AreaChart
          data={chartData}
          margin={{ top: 4, right: 4, left: -12, bottom: 0 }}
        >
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis
            dataKey="gameIndex"
            tickLine={false}
            axisLine={false}
            tickMargin={4}
            fontSize={11}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickMargin={4}
            fontSize={11}
            width={32}
          />
          <ChartTooltip
            content={
              <ChartTooltipContent
                hideLabel
                formatter={(value) => [value, statLabel]}
              />
            }
            cursor={false}
          />
          <Area
            type="monotone"
            dataKey={activeStat}
            stroke={colorVar}
            fill={colorVar}
            fillOpacity={0.15}
            strokeWidth={2}
            dot={false}
            activeDot={{
              r: 4,
              strokeWidth: 2,
              stroke: "var(--background)",
            }}
          />
        </AreaChart>
      </ChartContainer>
    </div>
  );
}
