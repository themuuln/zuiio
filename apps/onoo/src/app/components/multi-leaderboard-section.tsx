import { ChevronRight, Eye, Hand, Shield, Swords, Trophy } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui";
import type { LeaderRow } from "@/lib/shared";
import { cn } from "@/lib/utils";
import { LeaderCategoryStrip } from "./leader-category-strip";

interface MultiLeaderboardSectionProps {
  leaders: LeaderRow[];
  className?: string;
}

const STATS_CONFIG = [
  {
    key: "pts",
    label: "Оноо",
    icon: <Trophy className="h-3.5 w-3.5" />,
    getValue: (l: LeaderRow) => l.pts ?? 0,
  },
  {
    key: "reb",
    label: "Самбар",
    icon: <Swords className="h-3.5 w-3.5" />,
    getValue: (l: LeaderRow) => (l.oreb ?? 0) + (l.dreb ?? 0),
  },
  {
    key: "ast",
    label: "Дамжуулалт",
    icon: <Eye className="h-3.5 w-3.5" />,
    getValue: (l: LeaderRow) => l.ast ?? 0,
  },
  {
    key: "stl",
    label: "Бөмбөг таслалт",
    icon: <Hand className="h-3.5 w-3.5" />,
    getValue: (l: LeaderRow) => l.stl ?? 0,
  },
  {
    key: "blk",
    label: "Хаалт",
    icon: <Shield className="h-3.5 w-3.5" />,
    getValue: (l: LeaderRow) => l.blk ?? 0,
  },
] as const;

/**
 * Container that renders 5 category leader strips (pts, reb, ast, stl, blk).
 * Each strip is a horizontal scrollable row of top 3 players per stat.
 */
export function MultiLeaderboardSection({
  leaders,
  className,
}: MultiLeaderboardSectionProps) {
  return (
    <section
      className={cn(
        "grid gap-6 rounded-xl bg-[var(--surface-1)] p-4 sm:p-6 lg:p-8",
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Ангилал бүрийн шилдэг
          </p>
          <h2 className="mt-1 text-xl font-bold tracking-tight">
            Шилдгүүд ангилал бүрээр
          </h2>
        </div>
        <Button asChild variant="ghost" size="sm">
          <Link href="/leaders" className="gap-1">
            Бүгд <ChevronRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {STATS_CONFIG.map((stat) => (
          <LeaderCategoryStrip
            key={stat.key}
            statKey={stat.key}
            label={stat.label}
            icon={stat.icon}
            leaders={leaders}
            getValue={stat.getValue}
          />
        ))}
      </div>
    </section>
  );
}
