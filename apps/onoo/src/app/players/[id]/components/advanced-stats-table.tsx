import { ChartNoAxesCombined } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface AdvancedStatsTableProps {
  stats: {
    tsPct: number;
    efgPct: number;
    avgGameScore: number;
    astTovRatio: number;
    tovPct: number;
    ptsPer36: number;
    rebPer36: number;
    astPer36: number;
    mpg: number;
    gp: number;
  };
  leagueAverages?: {
    tsPct?: number;
    efgPct?: number;
  } | null;
  locale?: "mn" | "en";
  className?: string;
}

function pct(n: number): string {
  return `${(n * 100).toFixed(1)}%`;
}

function ratio(n: number): string {
  return n.toFixed(2);
}

function per36(n: number): string {
  return n.toFixed(1);
}

function StatCell({
  label,
  value,
  benchmark,
  isEn,
}: {
  label: string;
  value: string;
  benchmark?: number;
  isEn: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <span className="text-xl font-bold tabular-nums">{value}</span>
      {benchmark != null && (
        <span className="text-xs text-muted-foreground">
          {isEn ? "Lg avg" : "Лигийн"}: {pct(benchmark)}
        </span>
      )}
    </div>
  );
}

export function AdvancedStatsTable({
  stats,
  leagueAverages,
  locale = "mn",
  className,
}: AdvancedStatsTableProps) {
  const isEn = locale === "en";

  return (
    <Card className={cn("", className)}>
      <CardHeader>
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl bg-[var(--brand-sports)]/10 text-[var(--brand-sports)]">
            <ChartNoAxesCombined className="size-5" aria-hidden="true" />
          </span>
          <div>
            <CardTitle className="text-lg">
              {isEn ? "Advanced Stats" : "Дэлгэрүүлсэн статистик"}
            </CardTitle>
            <CardDescription className="mt-1">
              {isEn
                ? `${stats.gp} games · ${stats.mpg.toFixed(1)} MPG`
                : `${stats.gp} тоглолт · ${stats.mpg.toFixed(1)} НТТ`}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-6 sm:grid-cols-5">
          <StatCell
            label="TS%"
            value={pct(stats.tsPct)}
            benchmark={leagueAverages?.tsPct}
            isEn={isEn}
          />
          <StatCell
            label="eFG%"
            value={pct(stats.efgPct)}
            benchmark={leagueAverages?.efgPct}
            isEn={isEn}
          />
          <StatCell
            label={isEn ? "Game Score" : "Тоглолтын оноо"}
            value={ratio(stats.avgGameScore)}
            isEn={isEn}
          />
          <StatCell
            label="AST/TOV"
            value={ratio(stats.astTovRatio)}
            isEn={isEn}
          />
          <StatCell
            label="TOV%"
            value={pct(stats.tovPct)}
            isEn={isEn}
          />
        </div>
        <div className="mt-5 grid grid-cols-3 gap-6 border-t pt-5">
          <StatCell
            label={isEn ? "PTS/36" : "ОНОО/36"}
            value={per36(stats.ptsPer36)}
            isEn={isEn}
          />
          <StatCell
            label={isEn ? "REB/36" : "Сандал/36"}
            value={per36(stats.rebPer36)}
            isEn={isEn}
          />
          <StatCell
            label={isEn ? "AST/36" : "Дамж/36"}
            value={per36(stats.astPer36)}
            isEn={isEn}
          />
        </div>
      </CardContent>
    </Card>
  );
}
