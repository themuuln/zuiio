import { Award, Flame, Star, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { PlayerAwardRow } from "../../../lib/shared";

interface AwardsShelfProps {
  awards: PlayerAwardRow[];
  locale?: "mn" | "en";
  className?: string;
}

const AWARD_TYPE_CONFIG: Record<
  "mvp" | "player_of_week" | "top_scorer",
  { icon: typeof Trophy; label: string; variant: "default" | "secondary" | "outline" }
> = {
  mvp: {
    icon: Trophy,
    label: "MVP",
    variant: "default",
  },
  player_of_week: {
    icon: Star,
    label: "Долооны шилдэг",
    variant: "secondary",
  },
  top_scorer: {
    icon: Flame,
    label: "Шилдэг онооч",
    variant: "outline",
  },
};

function formatPeriod(
  start: string | null,
  end: string | null,
): string | null {
  if (!start && !end) return null;
  const fmt = (d: string) =>
    new Date(`${d}T12:00:00`).toLocaleDateString("mn-MN", {
      month: "short",
      day: "numeric",
    });
  if (start && end) return `${fmt(start)} – ${fmt(end)}`;
  if (start) return fmt(start);
  return fmt(end!);
}

export function AwardsShelf({
  awards,
  locale = "mn",
  className,
}: AwardsShelfProps) {
  if (awards.length === 0) return null;

  return (
    <div className={cn("space-y-3", className)}>
      <h2 className="court-dot-accent flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        <Award className="size-4" aria-hidden="true" />
        {locale === "en" ? "Awards" : "Нэрэмжүүд"}
      </h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {awards.map((award) => {
          const awardKey = award.award_type as
            | "mvp"
            | "player_of_week"
            | "top_scorer";
          const config = AWARD_TYPE_CONFIG[awardKey] ?? AWARD_TYPE_CONFIG.mvp;
          const Icon = config.icon;
          const period = formatPeriod(award.period_start, award.period_end);

          return (
            <div
              key={award.id}
              className="flex items-start gap-3 rounded-lg border bg-card p-3 transition-colors hover:bg-muted/30"
            >
              <span
                className={cn(
                  "flex size-9 shrink-0 items-center justify-center rounded-lg",
                  award.award_type === "mvp"
                    ? "bg-amber-500/10 text-amber-600 dark:bg-amber-400/10 dark:text-amber-400"
                    : award.award_type === "top_scorer"
                      ? "bg-orange-500/10 text-orange-600 dark:bg-orange-400/10 dark:text-orange-400"
                      : "bg-blue-500/10 text-blue-600 dark:bg-blue-400/10 dark:text-blue-400",
                )}
              >
                <Icon className="size-4.5" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant={config.variant} className="text-xs">
                    {config.label}
                  </Badge>
                </div>
                <p className="truncate text-xs text-muted-foreground">
                  {award.competition_name}
                </p>
                {period && (
                  <p className="text-[10px] text-muted-foreground/70">
                    {period}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
