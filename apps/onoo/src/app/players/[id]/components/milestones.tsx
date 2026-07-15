import type { Milestone } from "@onoo/core";
import { MILESTONE_LABELS } from "@onoo/core";
import { Award, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface MilestonesProps {
  milestones: Milestone[];
  locale?: "mn" | "en";
  className?: string;
}

function formatMilestoneDate(value: string, locale: "mn" | "en"): string {
  return new Date(`${value}T12:00:00`).toLocaleDateString(
    locale === "mn" ? "mn-MN" : "en-US",
    { month: "short", day: "numeric" },
  );
}

function formatMilestone(m: Milestone, locale: "mn" | "en"): string {
  const label = MILESTONE_LABELS[m.type]?.[locale] ?? m.type;

  switch (m.type) {
    case "career_high_pts":
    case "career_high_reb":
    case "career_high_ast":
    case "career_high_stl":
    case "career_high_blk":
      return m.game_date
        ? `${label}: ${m.value} · ${formatMilestoneDate(m.game_date, locale)}`
        : `${label}: ${m.value}`;
    case "double_double":
    case "triple_double":
    case "twenty_plus":
      return m.count != null ? `${label}: ${m.count}` : label;
    case "double_digit_streak":
      return m.streak != null ? `${label}: ${m.streak}` : label;
    default:
      return label;
  }
}

function milestoneVariant(m: Milestone): "default" | "secondary" | "outline" {
  switch (m.type) {
    case "triple_double":
      return "default";
    case "career_high_pts":
    case "career_high_reb":
    case "career_high_ast":
    case "career_high_stl":
    case "career_high_blk":
      return "secondary";
    case "double_double":
    case "twenty_plus":
    case "double_digit_streak":
      return "outline";
    default:
      return "outline";
  }
}

export function Milestones({
  milestones,
  locale = "mn",
  className,
}: MilestonesProps) {
  if (milestones.length === 0) {
    return (
      <div
        className={cn(
          "flex min-h-48 flex-col items-center justify-center text-center",
          className,
        )}
      >
        <Sparkles className="size-6 text-muted-foreground" aria-hidden="true" />
        <p className="mt-3 font-semibold">
          {locale === "mn"
            ? "Амжилтын түүх эхэлж байна"
            : "Milestones are on the way"}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {locale === "mn"
            ? "Баталгаажсан тоглолтууд нэмэгдэхэд онцлох амжилтууд гарна."
            : "Highlights appear as verified games are added."}
        </p>
      </div>
    );
  }

  return (
    <section
      aria-label={locale === "mn" ? "Амжилтууд" : "Milestones"}
      className={cn("grid gap-3 sm:grid-cols-2", className)}
    >
      {milestones.map((milestone) => (
        <div
          key={milestone.type}
          className="flex items-start gap-3 rounded-xl border bg-muted/25 p-3"
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-warning/20 text-warning-foreground">
            <Award className="size-4" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <Badge
              variant={milestoneVariant(milestone)}
              className="mb-1 max-w-full"
            >
              {milestone.type.startsWith("career_high")
                ? locale === "mn"
                  ? "Карьерийн дээд"
                  : "Career high"
                : locale === "mn"
                  ? "Амжилт"
                  : "Milestone"}
            </Badge>
            <p className="text-sm font-semibold leading-snug">
              {formatMilestone(milestone, locale)}
            </p>
          </div>
        </div>
      ))}
    </section>
  );
}
