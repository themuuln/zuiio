"use client";

import { ChartNoAxesCombined } from "lucide-react";
import { useState } from "react";
import { Area, AreaChart, Brush, CartesianGrid, XAxis, YAxis } from "recharts";
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
    label: "\u041E\u043D\u043E\u043E",
    color: "var(--color-chart-1)",
  },
  reb: {
    label: "\u0411\u0443\u0443\u043B\u0442",
    color: "var(--color-chart-2)",
  },
  ast: {
    label: "\u0414\u0430\u043C\u0436\u0443\u0443\u043B\u0430\u043B\u0442",
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
        <p className="mt-3 font-semibold">
          {
            "\u0425\u0430\u043D\u0434\u043B\u0430\u0433\u0430 \u0445\u0430\u0440\u0430\u0430\u0445\u0430\u043D \u04AF\u0443\u0441\u044D\u044D\u0433\u04AF\u0439"
          }
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {
            "\u0425\u043E\u0451\u0440 \u0431\u0430 \u0442\u04AF\u0443\u043D\u044D\u044D\u0441 \u043E\u043B\u043E\u043D \u0442\u043E\u0433\u043B\u043E\u0442\u044B\u043D \u0434\u0430\u0440\u0430\u0430 \u0433\u0440\u0430\u0444\u0438\u043A \u0433\u0430\u0440\u043D\u0430."
          }
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
        <p>
          {
            "\u041D\u044D\u0433 \u0442\u043E\u0433\u043B\u043E\u043B\u0442\u044B\u043D \u043C\u044D\u0434\u044D\u044D\u043B\u044D\u043B"
          }
        </p>
        <p className="tabular-nums text-foreground">
          {game.result === "W"
            ? "\u042F\u043B\u0430\u043B\u0442"
            : "\u042F\u043B\u0430\u0433\u0434\u0430\u043B"}{" "}
          \u00B7 {game.opponent} \u00B7 {game.pts} {"\u043E\u043D\u043E\u043E"},{" "}
          {game.reb} {"\u0431\u0443\u0443\u043B\u0442"}, {game.ast}{" "}
          {"\u0434\u0430\u043C\u0436\u0443\u0443\u043B\u0430\u043B\u0442"}
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
      ? "\u041E\u043D\u043E\u043E"
      : activeStat === "reb"
        ? "\u0411\u0443\u0443\u043B\u0442"
        : "\u0414\u0430\u043C\u0436\u0443\u0443\u043B\u0430\u043B\u0442";

  return (
    <div className={cn("space-y-4", className)}>
      <Tabs
        value={activeStat}
        onValueChange={(v) => setActiveStat(v as StatKey)}
      >
        <TabsList variant="line">
          <TabsTrigger value="pts">{"\u041E\u043D\u043E\u043E"}</TabsTrigger>
          <TabsTrigger value="reb">
            {"\u0411\u0443\u0443\u043B\u0442"}
          </TabsTrigger>
          <TabsTrigger value="ast">
            {"\u0414\u0430\u043C\u0436\u0443\u0443\u043B\u0430\u043B\u0442"}
          </TabsTrigger>
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
                labelFormatter={(value) => `#${value}`}
                formatter={(value, _name, item) => {
                  const point = item.payload as Record<string, unknown>;
                  const result = point.result as string;
                  const opponent = point.opponent as string;
                  return [
                    `${value} ${statLabel}`,
                    `${result === "W" ? "\u2713" : "\u2717"} ${opponent}`,
                  ];
                }}
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
              r: 5,
              strokeWidth: 2,
              stroke: "var(--background)",
              fill: colorVar,
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
          {
            "\u0414\u043E\u043E\u0434 \u0448\u0443\u0433\u0430\u043C\u044B\u0433 \u0447\u0438\u0440\u0447 \u0445\u0443\u0433\u0430\u0446\u0430\u0430 \u0441\u043E\u043D\u0433\u043E\u043D\u043E \u0443\u0443"
          }
        </p>
      )}
    </div>
  );
}
