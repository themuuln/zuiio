"use client";

import { Home, Plane } from "lucide-react";
import {
  Bar,
  BarChart,
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { PlayerGameLine } from "@/app/lib/shared";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface HomeAwaySplitsProps {
  gameLines: PlayerGameLine[];
  locale?: "mn" | "en";
  className?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function avg(
  lines: PlayerGameLine[],
  fn: (l: PlayerGameLine) => number,
): number {
  if (lines.length === 0) return 0;
  return lines.reduce((sum, l) => sum + fn(l), 0) / lines.length;
}

const BRAND = "var(--brand-sports)";
const HOME_COLOR = "var(--color-chart-2)";
const AWAY_COLOR = "var(--color-chart-5)";

const chartConfig = {
  home: { label: "Home", color: HOME_COLOR },
  away: { label: "Away", color: AWAY_COLOR },
} satisfies ChartConfig;

const STAT_KEYS = ["pts", "reb", "ast", "stl", "blk"] as const;

const LABELS_MN: Record<(typeof STAT_KEYS)[number], string> = {
  pts: "Оноо",
  reb: "Дамжуулалт",
  ast: "Пас",
  stl: "Мултлага",
  blk: "Блок",
};

const LABELS_EN: Record<(typeof STAT_KEYS)[number], string> = {
  pts: "PTS",
  reb: "REB",
  ast: "AST",
  stl: "STL",
  blk: "BLK",
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function HomeAwaySplits({
  gameLines,
  locale = "mn",
  className,
}: HomeAwaySplitsProps) {
  const home = gameLines.filter((l) => l.is_home);
  const away = gameLines.filter((l) => !l.is_home);

  if (home.length === 0 && away.length === 0) return null;

  const labels = locale === "mn" ? LABELS_MN : LABELS_EN;

  const data = STAT_KEYS.map((key) => {
    const fn =
      key === "reb"
        ? (l: PlayerGameLine) => l.oreb + l.dreb
        : (l: PlayerGameLine) => l[key as keyof PlayerGameLine] as number;

    return {
      stat: labels[key],
      home: Number(avg(home, fn).toFixed(1)),
      away: Number(avg(away, fn).toFixed(1)),
    };
  });

  const homeGames = home.length;
  const awayGames = away.length;
  const homeWinPct =
    home.length > 0
      ? ((home.filter((l) => l.result === "W").length / home.length) * 100).toFixed(0)
      : "—";
  const awayWinPct =
    away.length > 0
      ? ((away.filter((l) => l.result === "W").length / away.length) * 100).toFixed(0)
      : "—";

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center gap-3">
          <span
            className="flex size-10 items-center justify-center rounded-xl text-[var(--brand-sports)]"
            style={{ backgroundColor: `color-mix(in srgb, ${BRAND} 10%, transparent)` }}
          >
            <Home className="size-5" aria-hidden="true" />
          </span>
          <div>
            <CardTitle className="text-lg">
              {locale === "mn" ? "Гэрэл / Зочин" : "Home / Away"}
            </CardTitle>
            <CardDescription className="mt-1">
              {locale === "mn"
                ? "Байршлаархи дундаж үзүүлэлт"
                : "Performance splits by location"}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Win% badges */}
        <div className="flex gap-3">
          <div className="flex items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2">
            <Home className="size-3.5 text-[var(--color-chart-2)]" aria-hidden="true" />
            <span className="text-xs text-muted-foreground">
              {locale === "mn" ? "Гэр" : "Home"}
            </span>
            <span className="text-sm font-semibold tabular-nums">
              {homeWinPct}%
            </span>
            <span className="text-xs text-muted-foreground">
              ({homeGames} {locale === "mn" ? "тоглолт" : "gp"})
            </span>
          </div>
          <div className="flex items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2">
            <Plane className="size-3.5 text-[var(--color-chart-5)]" aria-hidden="true" />
            <span className="text-xs text-muted-foreground">
              {locale === "mn" ? "Зочин" : "Away"}
            </span>
            <span className="text-sm font-semibold tabular-nums">
              {awayWinPct}%
            </span>
            <span className="text-xs text-muted-foreground">
              ({awayGames} {locale === "mn" ? "тоглолт" : "gp"})
            </span>
          </div>
        </div>

        {/* Grouped bar chart */}
        <ChartContainer config={chartConfig} className="h-[220px] w-full">
          <BarChart data={data} barGap={4} barCategoryGap="25%">
            <CartesianGrid
              vertical={false}
              stroke="color-mix(in srgb, var(--color-foreground) 8%, transparent)"
            />
            <XAxis
              dataKey="stat"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
              width={35}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value, name) => (
                    <span>
                      {name === "home"
                        ? locale === "mn"
                          ? "Гэр"
                          : "Home"
                        : locale === "mn"
                          ? "Зочин"
                          : "Away"}
                      : {Number(value).toFixed(1)}
                    </span>
                  )}
                />
              }
            />
            <Bar
              dataKey="home"
              fill={HOME_COLOR}
              radius={[4, 4, 0, 0]}
              maxBarSize={28}
            />
            <Bar
              dataKey="away"
              fill={AWAY_COLOR}
              radius={[4, 4, 0, 0]}
              maxBarSize={28}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
