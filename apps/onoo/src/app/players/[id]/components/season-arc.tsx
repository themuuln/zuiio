"use client";

import { ChartNoAxesCombined } from "lucide-react";
import { useState } from "react";
import {
  Area,
  AreaChart,
  Brush,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface GameDataPoint {
  game_id: string;
  game_date: string;
  opponent: string;
  pts: number;
  reb: number;
  ast: number;
  result: "W" | "L";
}

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
// Component
// ---------------------------------------------------------------------------

interface SeasonArcProps {
  data: GameDataPoint[];
  className?: string;
}

export function SeasonArc({ data, className }: SeasonArcProps) {
  const [activeStat, setActiveStat] = useState<StatKey>("pts");

  // Empty state
  if (data.length === 0) {
    return (
      <div
        className={cn(
          "flex min-h-56 flex-col items-center justify-center text-center",
          className,
        )}
      >
        <ChartNoAxesCombined
          className="size-6 text-muted-foreground"
          aria-hidden="true"
        />
        <p className="mt-3 font-semibold">Хандлага хараахан үүсээгүй</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Хоёр ба түүнээс олон тоглолтын дараа график гарна.
        </p>
      </div>
    );
  }

  // Single game — hide chart, show message
  if (data.length === 1) {
    const game = data[0] as GameDataPoint;
    return (
      <div
        className={cn(
          "flex min-h-56 flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground",
          className,
        )}
      >
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
    <div className={cn("space-y-4", className)}>
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

      <ChartContainer config={chartConfig} className="h-64 w-full">
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
            isAnimationActive={false}
            dot={false}
            activeDot={{
              r: 4,
              strokeWidth: 2,
              stroke: "var(--background)",
            }}
          />
          {data.length > 8 && (
            <Brush
              dataKey="gameIndex"
              height={24}
              stroke="var(--color-muted-foreground)"
              fill="var(--color-muted)"
              travellerWidth={8}
              className="text-xs"
            />
          )}
        </AreaChart>
      </ChartContainer>

      {data.length > 8 && (
        <p className="text-center text-xs text-muted-foreground">
          Доод шугамыг чирч хугацаа сонгоно уу
        </p>
      )}
    </div>
  );
}
