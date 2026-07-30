import { Clock } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ClutchStatsProps {
  available: boolean;
  note?: string;
  closeGamePpg?: number;
  closeGameRecord?: string;
  clutchWinPct?: number;
  locale?: "mn" | "en";
  className?: string;
}

export function ClutchStats({
  available,
  note,
  closeGamePpg,
  closeGameRecord,
  clutchWinPct,
  locale = "mn",
  className,
}: ClutchStatsProps) {
  const isEn = locale === "en";

  return (
    <Card className={cn("", className)}>
      <CardHeader>
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl bg-[var(--brand-sports)]/10 text-[var(--brand-sports)]">
            <Clock className="size-5" aria-hidden="true" />
          </span>
          <div>
            <CardTitle className="text-lg">
              {isEn ? "Clutch Performance" : "Шийдвэрлэх үеийн статистик"}
            </CardTitle>
            <CardDescription className="mt-1">
              {isEn
                ? "Close games (5 points or fewer)"
                : "Ойр тоглолтууд (5 оноо эсвэл түүнээс бага)"}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="relative">
        {available ? (
          <div className="grid grid-cols-3 gap-3 sm:gap-6">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {isEn ? "Close-Game PPG" : "Ойр тоглолтын оноо"}
              </span>
              <span className="text-base sm:text-xl font-bold tabular-nums">
                {closeGamePpg?.toFixed(1) ?? "—"}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {isEn ? "Record" : "Бүртгэл"}
              </span>
              <span className="text-base sm:text-xl font-bold tabular-nums">
                {closeGameRecord ?? "—"}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {isEn ? "Win %" : "Ялалтын %"}
              </span>
              <span className="text-base sm:text-xl font-bold tabular-nums">
                {clutchWinPct != null
                  ? `${(clutchWinPct * 100).toFixed(0)}%`
                  : "—"}
              </span>
            </div>
          </div>
        ) : (
          <div className="relative">
            {/* Blurred preview of the stat grid */}
            <div className="blur-[3px] pointer-events-none">
              <div className="grid grid-cols-3 gap-3 sm:gap-6">
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {isEn ? "Close-Game PPG" : "Ойр тоглолтын оноо"}
                  </span>
                  <span className="text-base sm:text-xl font-bold tabular-nums">
                    —
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {isEn ? "Record" : "Бүртгэл"}
                  </span>
                  <span className="text-base sm:text-xl font-bold tabular-nums">
                    —
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {isEn ? "Win %" : "Ялалтын %"}
                  </span>
                  <span className="text-base sm:text-xl font-bold tabular-nums">
                    —
                  </span>
                </div>
              </div>
            </div>
            {/* Overlay */}
            <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-[1px]">
              <div className="rounded-lg border bg-background px-4 py-2 text-center shadow-sm">
                <p className="text-sm font-medium text-muted-foreground">
                  Тун удахгүй
                </p>
                <p className="text-xs text-muted-foreground/60">Coming Soon</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
