import { Badge } from "@/components/ui/badge";
import { MILESTONE_LABELS } from "@onoo/core";
import type { Milestone } from "@onoo/core";

interface MilestonesProps {
  milestones: Milestone[];
  locale?: "mn" | "en";
}

function formatMilestone(m: Milestone, locale: "mn" | "en"): string {
  const label = MILESTONE_LABELS[m.type]?.[locale] ?? m.type;

  switch (m.type) {
    case "career_high_pts":
    case "career_high_reb":
    case "career_high_ast":
    case "career_high_stl":
    case "career_high_blk":
      return m.game_date ? `${label}: ${m.value} (${m.game_date})` : `${label}: ${m.value}`;
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

export function Milestones({ milestones, locale = "mn" }: MilestonesProps) {
  if (milestones.length === 0) return null;

  return (
    <section aria-label={locale === "mn" ? "Амжилтууд" : "Milestones"}>
      <h3 className="text-sm font-medium text-muted-foreground mb-2">
        {locale === "mn" ? "Амжилтууд" : "Milestones"}
      </h3>
      <div className="flex flex-wrap gap-2">
        {milestones.map((m) => (
          <Badge key={m.type} variant={milestoneVariant(m)}>
            {formatMilestone(m, locale)}
          </Badge>
        ))}
      </div>
    </section>
  );
}
