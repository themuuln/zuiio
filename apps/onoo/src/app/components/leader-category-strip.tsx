import Link from "next/link";
import { PlayerAvatar } from "@/components/player-avatar";
import type { LeaderRow } from "@/app/lib/shared";
import { cn } from "@/lib/utils";

interface LeaderCategoryStripProps {
  statKey: string;
  label: string;
  icon?: React.ReactNode;
  leaders: LeaderRow[];
  getValue: (row: LeaderRow) => number;
}

const RANK_STYLES = [
  {
    badge: "bg-accent text-accent-foreground",
    border: "border-accent/20",
  },
  {
    badge: "bg-muted-foreground/10 text-muted-foreground",
    border: "border-border",
  },
  {
    badge: "bg-muted-foreground/5 text-muted-foreground/50",
    border: "border-border/50",
  },
] as const;

/**
 * Horizontal scrollable strip showing top 3 players for a stat category.
 * Each card shows rank badge, avatar, player name, team, and stat value.
 * Falls back to empty state when fewer than 3 qualified players exist.
 */
export function LeaderCategoryStrip({
  statKey,
  label,
  icon,
  leaders,
  getValue,
}: LeaderCategoryStripProps) {
  const sorted = [...leaders]
    .filter((l) => {
      const v = getValue(l);
      return v > 0;
    })
    .sort((a, b) => getValue(b) - getValue(a))
    .slice(0, 3);

  if (sorted.length < 3) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-card px-4 py-8 text-center">
        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
          {icon}
        </div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <p className="mt-1 text-sm text-muted-foreground/60">
          Шалгуур хангасан тоглогч хүрэлцэхгүй байна
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="flex items-center gap-1.5 text-sm font-semibold">
          {icon && <span className="text-muted-foreground">{icon}</span>}
          {label}
        </h3>
        <Link
          href={`/leaders?stat=${statKey}`}
          className="rounded-md px-1 py-0.5 text-xs text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Бүгдийг харах
        </Link>
      </div>
      <div className="flex flex-col gap-1.5">
        {sorted.map((player, i) => {
          const rank = RANK_STYLES[i]!;
          return (
            <Link
              key={player.player_id}
              href={`/players/${player.player_id}`}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl border bg-card px-3 py-2.5 transition-[box-shadow,transform] hover:shadow-md active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                rank.border,
              )}
            >
              {/* Rank badge */}
              <div
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-xs font-bold tabular-nums",
                  rank.badge,
                )}
              >
                {i + 1}
              </div>
              <PlayerAvatar
                photoUrl={player.player_photo_url}
                name={player.player_name}
                primaryColor={player.team_primary_color}
                size="sm"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold leading-tight">
                  {player.player_name}
                </p>
                <p className="truncate text-xs leading-tight text-muted-foreground">
                  {player.team_name}
                </p>
              </div>
              {/* Stat value */}
              <div className="text-right">
                <span className="stat-number text-base tabular-nums font-bold">
                  {getValue(player).toFixed(1)}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
