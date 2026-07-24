import Link from "next/link";
import type { LeaderRow } from "@/app/lib/shared";
import { PlayerAvatar } from "@/components/player-avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type StatKey = "pts" | "reb" | "ast" | "stl" | "blk";

interface PodiumProps {
  leaders: LeaderRow[];
  statKey: StatKey;
  className?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function getStatValue(leader: LeaderRow, statKey: StatKey): number {
  switch (statKey) {
    case "pts":
      return leader.pts ?? 0;
    case "reb":
      return (leader.oreb ?? 0) + (leader.dreb ?? 0);
    case "ast":
      return leader.ast ?? 0;
    case "stl":
      return leader.stl ?? 0;
    case "blk":
      return leader.blk ?? 0;
  }
}

const STAT_LABELS: Record<StatKey, string> = {
  pts: "Оноо",
  reb: "Самбар",
  ast: "Дамжуулалт",
  stl: "Бөмбөг таслалт",
  blk: "Хаалт",
};

// ---------------------------------------------------------------------------
// Helpers: rank configs
// ---------------------------------------------------------------------------

interface RankConfig {
  avatarSize: "sm" | "md" | "lg" | "xl" | "2xl";
  statClass: string;
  borderColor: string;
  ringColor: string;
  smOrder: string;
}

const RANK_CONFIGS: Record<number, RankConfig> = {
  1: {
    avatarSize: "2xl",
    statClass: "text-4xl",
    borderColor: "border-[#FFD700]",
    ringColor: "ring-[#FFD700]/20",
    smOrder: "sm:order-2",
  },
  2: {
    avatarSize: "lg",
    statClass: "text-2xl",
    borderColor: "border-[#C0C0C0]",
    ringColor: "ring-[#C0C0C0]/20",
    smOrder: "sm:order-1",
  },
  3: {
    avatarSize: "md",
    statClass: "text-xl",
    borderColor: "border-[#CD7F32]",
    ringColor: "ring-[#CD7F32]/20",
    smOrder: "sm:order-3",
  },
};

// ---------------------------------------------------------------------------
// Podium
// ---------------------------------------------------------------------------

export function Podium({ leaders, statKey, className }: PodiumProps) {
  if (leaders.length === 0) return null;

  // Render rank-ordered cards. On mobile (flex-col) they appear top-to-bottom
  // as 1→2→3 (DOM order). On sm+ (flex-row) CSS order re-arranges them as
  // 2→1→3 (left→center→right).
  return (
    <div
      className={cn(
        "flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-center",
        className,
      )}
    >
      {leaders.slice(0, 3).map((leader, i) => {
        const rank = i + 1;
        const cfg = RANK_CONFIGS[rank]!;
        return (
          <Link
            key={leader.player_id}
            href={`/players/${leader.player_id}`}
            className={cn(
              "flex flex-1 flex-col items-center gap-4 rounded-xl border-2 p-6 text-center",
              "transition-colors hover:bg-muted/50",
              "ring-1",
              cfg.borderColor,
              cfg.ringColor,
              cfg.smOrder,
            )}
          >
            <PlayerAvatar
              photoUrl={leader.photo_url}
              name={leader.player_name}
              primaryColor={leader.team_primary_color}
              size={cfg.avatarSize}
            />

            <div className="flex flex-col items-center gap-1">
              <span
                className={cn(
                  "font-bold tabular-nums tracking-tight",
                  cfg.statClass,
                )}
              >
                {getStatValue(leader, statKey).toFixed(1)}
              </span>
              <Badge variant="secondary">{STAT_LABELS[statKey]}</Badge>
            </div>

            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              {leader.team_name}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
