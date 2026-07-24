"use client";

import type { TeamSeasonAggregates } from "@/app/lib/shared";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface TeamStatsSummaryProps {
  aggregates: TeamSeasonAggregates;
  className?: string;
}

interface StatCardDef {
  key: keyof TeamSeasonAggregates;
  label: string;
  format: (v: number) => string;
  suffix?: string;
  /** Higher is better — used for color coding */
  higherIsBetter?: boolean;
  /** For percentage metrics */
  isPercent?: boolean;
}

const STAT_CARDS: StatCardDef[] = [
  {
    key: "avg_ortg",
    label: "Довтолгооны үнэлгээ",
    format: (v) => v.toFixed(1),
    higherIsBetter: true,
  },
  {
    key: "avg_drtg",
    label: "Хамгаалалтын үнэлгээ",
    format: (v) => v.toFixed(1),
    higherIsBetter: false,
  },
  {
    key: "avg_net_rtg",
    label: "NetRTG",
    format: (v) => (v > 0 ? "+" : "") + v.toFixed(1),
    higherIsBetter: true,
  },
  { key: "avg_pace", label: "Темп", format: (v) => v.toFixed(1) },
  {
    key: "avg_efg",
    label: "eFG%",
    format: (v) => v.toFixed(1),
    isPercent: true,
    higherIsBetter: true,
  },
  {
    key: "avg_tov_pct",
    label: "Алдаа %",
    format: (v) => v.toFixed(1),
    isPercent: true,
    higherIsBetter: false,
  },
  {
    key: "avg_oreb_pct",
    label: "Довт. самбар %",
    format: (v) => v.toFixed(1),
    isPercent: true,
    higherIsBetter: true,
  },
  {
    key: "avg_fta_rate",
    label: "Чөлөөт шидэлтийн хувь",
    format: (v) => v.toFixed(1),
    higherIsBetter: true,
  },
  {
    key: "avg_pie",
    label: "PIE",
    format: (v) => v.toFixed(1),
    isPercent: true,
    higherIsBetter: true,
  },
];

const TEAM_COLORS = [
  "from-blue-500/10 to-blue-500/5 border-blue-500/20",
  "from-red-500/10 to-red-500/5 border-red-500/20",
  "from-emerald-500/10 to-emerald-500/5 border-emerald-500/20",
  "from-purple-500/10 to-purple-500/5 border-purple-500/20",
  "from-amber-500/10 to-amber-500/5 border-amber-500/20",
  "from-cyan-500/10 to-cyan-500/5 border-cyan-500/20",
  "from-rose-500/10 to-rose-500/5 border-rose-500/20",
  "from-teal-500/10 to-teal-500/5 border-teal-500/20",
  "from-orange-500/10 to-orange-500/5 border-orange-500/20",
];

export function TeamStatsSummary({
  aggregates,
  className,
}: TeamStatsSummaryProps) {
  if (aggregates.games_played === 0) {
    return (
      <div className={cn("space-y-3", className)}>
        <h2 className="text-lg font-semibold tracking-tight">
          Багийн үзүүлэлтүүд
        </h2>
        <p className="text-sm text-muted-foreground">
          Хангалттай өгөгдөл байхгүй байна. Тоглолтын статистик бүрдээгүй байна.
        </p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      <h2 className="text-lg font-semibold tracking-tight">
        Багийн үзүүлэлтүүд
        <span className="ml-2 text-sm font-normal text-muted-foreground">
          ({aggregates.games_played} тоглолт, {aggregates.wins}–
          {aggregates.losses})
        </span>
      </h2>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-3">
        {STAT_CARDS.map((card, i) => {
          const value = aggregates[card.key] as number;

          return (
            <Card
              key={card.key}
              className={cn(
                "overflow-hidden border bg-gradient-to-br",
                TEAM_COLORS[i % TEAM_COLORS.length],
              )}
            >
              <CardContent className="p-4">
                <p className="text-xs font-medium text-muted-foreground">
                  {card.label}
                </p>
                <p
                  className={cn(
                    "mt-1 text-2xl font-bold tabular-nums tracking-tight",
                    card.higherIsBetter !== undefined &&
                      value > 0 &&
                      (card.higherIsBetter
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-red-600 dark:text-red-400"),
                    card.higherIsBetter !== undefined &&
                      value < 0 &&
                      (!card.higherIsBetter
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-red-600 dark:text-red-400"),
                  )}
                >
                  {card.format(value)}
                  {card.isPercent ? "%" : ""}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
