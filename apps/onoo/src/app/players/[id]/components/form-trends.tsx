"use client";

import { ChartNoAxesCombined, Crosshair, TrendingUp } from "lucide-react";
import { useMemo } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  Scatter,
  ScatterChart,
  XAxis,
  YAxis,
} from "recharts";
import type { PlayerGameLine } from "@/app/lib/shared";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface FormTrendsProps {
  gameLines: PlayerGameLine[];
  locale?: "mn" | "en";
  className?: string;
}

interface PointRow {
  gameIndex: number;
  date: string;
  opponent: string;
  result: "W" | "L";
  eff: number;
  rollingEff: number | null;
  pts: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const BRAND = "var(--brand-sports)";
const WIN = "var(--color-chart-2)";
const LOSS = "var(--color-chart-5)";
const MUTED = "var(--color-muted-foreground)";

/** EFF = pts + reb + 1.5·ast + 2·stl + 2·blk − tov  (per game). */
function gameEff(line: PlayerGameLine): number {
  const reb = line.oreb + line.dreb;
  return (
    line.pts + reb + 1.5 * line.ast + 2 * line.stl + 2 * line.blk - line.tov
  );
}

function rollingAverage(
  values: number[],
  idx: number,
  window = 5,
): number | null {
  if (idx < window - 1) return null;
  let sum = 0;
  for (let i = idx - window + 1; i <= idx; i++) {
    const v = values[i];
    if (v == null) return null;
    sum += v;
  }
  return sum / window;
}
// Component
// ---------------------------------------------------------------------------

export function FormTrends({
  gameLines,
  locale = "mn",
  className,
}: FormTrendsProps) {
  const isEn = locale === "en";

  const rows = useMemo<PointRow[]>(() => {
    return gameLines.map((line, i) => {
      const eff = gameEff(line);
      return {
        gameIndex: i + 1,
        date: line.game_date.slice(0, 10),
        opponent: line.opponent_short_code,
        result: line.result,
        eff,
        rollingEff: rollingAverage(gameLines.map(gameEff), i),
        pts: line.pts,
      };
    });
  }, [gameLines]);

  // Win/loss + streak summary derived from the game log.
  const summary = useMemo(() => {
    let wins = 0;
    let losses = 0;
    let currentStreak = 0;
    let bestStreak = 0;
    let twentyPlus = 0;
    let doubleDoubles = 0;

    // Iterate oldest → newest so the trailing streak is "current".
    for (const line of gameLines) {
      if (line.result === "W") {
        wins++;
        currentStreak = currentStreak >= 0 ? currentStreak + 1 : 1;
      } else {
        losses++;
        currentStreak = currentStreak <= 0 ? currentStreak - 1 : -1;
      }
      bestStreak = Math.max(bestStreak, currentStreak);
      if (line.pts >= 20) twentyPlus++;
      const reb = line.oreb + line.dreb;
      const cats = [line.pts, reb, line.ast, line.stl, line.blk].filter(
        (v) => v >= 10,
      ).length;
      if (cats >= 2) doubleDoubles++;
    }

    return { wins, losses, bestStreak, twentyPlus, doubleDoubles };
  }, [gameLines]);

  if (rows.length === 0) {
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
          {isEn ? "No data yet" : "Өгөгдөл байхгүй"}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {isEn
            ? "Charts appear after verified games."
            : "Баталгаажсан тоглолтын дараа график гарна."}
        </p>
      </div>
    );
  }

  const effConfig = {
    eff: { label: isEn ? "Efficiency" : "Үр ашиг", color: BRAND },
    rollingEff: {
      label: isEn ? "5-Game Avg" : "5 тоглолтын дундаж",
      color: MUTED,
    },
  } satisfies ChartConfig;

  const ptsConfig = {
    pts: { label: isEn ? "Points" : "Оноо", color: BRAND },
  } satisfies ChartConfig;

  return (
    <div className={cn("space-y-4", className)}>
      {/* ─── Efficiency trend (per-game + rolling average) ─── */}
      <div>
        <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <TrendingUp className="size-3.5" aria-hidden="true" />
          <span className="font-medium uppercase tracking-wider">
            {isEn ? "Efficiency trend" : "Үр ашгийн хандлага"}
          </span>
          <span aria-hidden="true">·</span>
          <span>
            {isEn
              ? "EFF = PTS+REB+1.5·AST+2·STL+2·BLK−TOV"
              : "EFF = ОНОО+БУУЛТ+1.5·ДАМЖ+2·БУЛ+2·БЛОК−АЛДАА"}
          </span>
        </div>
        <ChartContainer config={effConfig} className="h-48 w-full">
          <LineChart
            data={rows}
            margin={{ top: 4, right: 4, left: -16, bottom: 0 }}
          >
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="gameIndex"
              tickLine={false}
              axisLine={false}
              tickMargin={4}
              fontSize={11}
              tickFormatter={(v) => `#${v}`}
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
                    const opponent = point.opponent as string;
                    const result = point.result as string;
                    return [
                      `${value}`,
                      `${result === "W" ? "✓" : "✗"} ${opponent}`,
                    ];
                  }}
                />
              }
              cursor={false}
            />
            <Line
              dataKey="eff"
              type="monotone"
              stroke={`var(--color-eff)`}
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
            <Line
              dataKey="rollingEff"
              type="monotone"
              stroke={`var(--color-rollingEff)`}
              strokeWidth={2}
              strokeDasharray="4 3"
              dot={false}
              connectNulls
              isAnimationActive={false}
            />
          </LineChart>
        </ChartContainer>
      </div>

      {/* ─── Performance by opponent (points scatter, colored by result) ─── */}
      <div>
        <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
          <Crosshair className="size-3.5" aria-hidden="true" />
          <span className="font-medium uppercase tracking-wider">
            {isEn ? "Points by opponent" : "Өрсөлдөгчөөр оноо"}
          </span>
        </div>
        <ChartContainer config={ptsConfig} className="h-48 w-full">
          <ScatterChart margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="gameIndex"
              type="number"
              tickLine={false}
              axisLine={false}
              tickMargin={4}
              fontSize={11}
              domain={[0, "dataMax"]}
              tickFormatter={(v) => `#${v}`}
            />
            <YAxis
              dataKey="pts"
              tickLine={false}
              axisLine={false}
              tickMargin={4}
              fontSize={11}
              width={32}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  labelFormatter={() => ""}
                  formatter={(value, _name, item) => {
                    const point = item.payload as Record<string, unknown>;
                    const opponent = point.opponent as string;
                    const result = point.result as string;
                    return [
                      `${value} ${isEn ? "PTS" : "оноо"}`,
                      `${result === "W" ? "✓" : "✗"} ${opponent}`,
                    ];
                  }}
                />
              }
              cursor={{ strokeDasharray: "3 3" }}
            />
            <Scatter
              data={rows}
              dataKey="pts"
              isAnimationActive={false}
              fillOpacity={0.85}
              shape={({
                cx,
                cy,
                payload,
              }: {
                cx?: number;
                cy?: number;
                payload?: Record<string, unknown>;
              }) => {
                if (cx == null || cy == null) return null;
                const result = (payload?.result as string) ?? "L";
                const color = result === "W" ? WIN : LOSS;
                return (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={4}
                    fill={color}
                    stroke="var(--background)"
                    strokeWidth={1}
                  />
                );
              }}
            />
          </ScatterChart>
        </ChartContainer>
        <div className="mt-2 flex flex-wrap gap-4 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-2">
            <span className="size-2 rounded-full" style={{ background: WIN }} />
            {isEn ? "Win" : "Хожилт"}
          </span>
          <span className="inline-flex items-center gap-2">
            <span
              className="size-2 rounded-full"
              style={{ background: LOSS }}
            />
            {isEn ? "Loss" : "Хожигдол"}
          </span>
        </div>
      </div>

      {/* ─── Win/loss + streak summary tiles ─── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryTile
          value={`${summary.wins}–${summary.losses}`}
          label={isEn ? "W–L" : "Х–Я"}
        />
        <SummaryTile
          value={`${summary.bestStreak > 0 ? summary.bestStreak : 0}`}
          label={isEn ? "Best streak (W)" : "Хамгийн урт цуврал (Х)"}
        />
        <SummaryTile
          value={`${summary.twentyPlus}`}
          label={isEn ? "20+ pt games" : "20+ оноот тоглолт"}
        />
        <SummaryTile
          value={`${summary.doubleDoubles}`}
          label={isEn ? "Double-doubles" : "Давхар-X"}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Summary tile
// ---------------------------------------------------------------------------

function SummaryTile({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-xl border bg-muted/20 px-3 py-2.5">
      <div className="font-black tabular-nums leading-none tracking-tight text-lg text-foreground">
        {value}
      </div>
      <div className="mt-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
    </div>
  );
}
