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

const STAT_KEYS: StatKey[] = ["pts", "reb", "ast"];

// ---------------------------------------------------------------------------
// Theme colors (must match the CSS token vars)
// ---------------------------------------------------------------------------

const THEME: Record<StatKey, string> = {
  pts: "var(--color-chart-1)",
  reb: "var(--color-chart-2)",
  ast: "var(--color-chart-5)",
};

// ---------------------------------------------------------------------------
// Chart config — maps stat keys to labels for tooltip
// ---------------------------------------------------------------------------

const chartConfig = {
  pts: { label: "Оноо", color: THEME.pts },
  reb: { label: "Буулт", color: THEME.reb },
  ast: { label: "Дамжуулалт", color: THEME.ast },
} satisfies ChartConfig;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface SeasonArcProps {
  data: GameDataPoint[];
  className?: string;
}

export function SeasonArc({ data, className }: SeasonArcProps) {
  const [highlightedStat, setHighlightedStat] = useState<StatKey | null>(null);

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
        <p className="mt-3 font-semibold">{"Хандлага хараахан үусээгүй"}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {"Хоёр ба түунээс олон тоглотын дараа график гарна."}
        </p>
      </div>
    );
  }

  // Add index + formatted short date
  const chartData = data.map((d, i) => {
    const dObj = new Date(d.game_date);
    const shortDate = `${dObj.getMonth() + 1}/${dObj.getDate()}`;
    return {
      ...d,
      gameIndex: i + 1,
      shortDate,
    };
  });

  return (
    <div className={cn("space-y-4", className)}>
      <Tabs
        value={highlightedStat ?? undefined}
        onValueChange={(v) =>
          setHighlightedStat(v === highlightedStat ? null : (v as StatKey))
        }
      >
        <TabsList variant="line">
          <TabsTrigger value="pts">{"Оноо"}</TabsTrigger>
          <TabsTrigger value="reb">{"Буулт"}</TabsTrigger>
          <TabsTrigger value="ast">{"Дамжуулалт"}</TabsTrigger>
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
                labelFormatter={(value) => {
                  const point = chartData[value - 1];
                  return point ? `${point.shortDate} · #${value}` : `#${value}`;
                }}
                formatter={(value, name, item) => {
                  const point = item.payload as Record<string, unknown>;
                  const result = point.result as string;
                  const opponent = point.opponent as string;
                  const statLabel =
                    name === "pts"
                      ? "Оноо"
                      : name === "reb"
                        ? "Буулт"
                        : "Дамжуулалт";
                  return [
                    `${value} ${statLabel}`,
                    `${result === "W" ? "✓" : "✗"} ${opponent}`,
                  ];
                }}
              />
            }
            cursor={false}
          />
          {STAT_KEYS.map((key) => {
            const isDimmed =
              highlightedStat !== null && highlightedStat !== key;
            return (
              <Area
                key={key}
                type="monotone"
                dataKey={key}
                stroke={THEME[key]}
                fill={THEME[key]}
                fillOpacity={isDimmed ? 0.05 : 0.15}
                strokeWidth={isDimmed ? 1 : 2.5}
                opacity={isDimmed ? 0.35 : 1}
                isAnimationActive={false}
                dot={false}
              />
            );
          })}
          {data.length > 8 && (
            <Brush
              dataKey="shortDate"
              height={28}
              stroke="var(--color-muted-foreground)"
              fill="var(--color-muted)"
              travellerWidth={10}
              className="text-xs"
              tickFormatter={(v: string) => v}
            />
          )}
        </AreaChart>
      </ChartContainer>

      {data.length > 8 && (
        <p className="text-center text-xs text-muted-foreground">
          {"Доод шугамыг чирч хугацаа сонгоно уу"}
        </p>
      )}
    </div>
  );
}
