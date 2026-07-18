import { Clock, Lock } from "lucide-react";
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
              {isEn
                ? "Clutch Performance"
                : "Шийдвэрлэх үеийн статистик"}
            </CardTitle>
            <CardDescription className="mt-1">
              {isEn
                ? "Close games (5 points or fewer)"
                : "Ойр тоглолтууд (5 оноо эсвэл түүнээс бага)"}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {available ? (
          <div className="grid grid-cols-3 gap-6">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {isEn ? "Close-Game PPG" : "Ойр тоглолтын оноо"}
              </span>
              <span className="text-xl font-bold tabular-nums">
                {closeGamePpg?.toFixed(1) ?? "—"}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {isEn ? "Record" : "Бүртгэл"}
              </span>
              <span className="text-xl font-bold tabular-nums">
                {closeGameRecord ?? "—"}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {isEn ? "Win %" : "Ялалтын %"}
              </span>
              <span className="text-xl font-bold tabular-nums">
                {clutchWinPct != null ? `${(clutchWinPct * 100).toFixed(0)}%` : "—"}
              </span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
            <Lock className="size-8 text-muted-foreground/40" aria-hidden="true" />
            <p className="max-w-sm text-sm text-muted-foreground">
              {note ??
                (isEn
                  ? "Clutch stats will be available when play-by-play data is integrated."
                  : "Шийдвэрлэх үеийн статистик нь тоглолтын бичлэгийн өгөгдөл нэмэгдсэний дараа боломжтой болно.")}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
