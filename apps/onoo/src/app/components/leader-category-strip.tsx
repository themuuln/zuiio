import Link from "next/link";
import { PlayerAvatar } from "@/components/player-avatar";
import type { LeaderRow } from "@/lib/shared";

interface LeaderCategoryStripProps {
  statKey: string;
  label: string;
  icon?: React.ReactNode;
  leaders: LeaderRow[];
  getValue: (row: LeaderRow) => number;
}

/**
 * Horizontal scrollable strip showing top 3 players for a stat category.
 * Each card shows avatar (32px), player name, team, and stat value.
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
      <div className="rounded-xl border bg-card p-4 text-center text-sm text-muted-foreground">
        <p className="mb-1 text-xs font-semibold">
          {icon && (
            <span className="mr-1 inline-block align-middle">{icon}</span>
          )}
          {label}
        </p>
        <p>Шалгуур хангасан тоглогч хүрэлцэхгүй байна</p>
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
      <div className="flex gap-3 overflow-x-auto pb-1 snap-x snap-mandatory scrollbar-none">
        {sorted.map((player, i) => (
          <Link
            key={player.player_id}
            href={`/players/${player.player_id}`}
            className="flex min-w-56 shrink-0 snap-start items-center gap-3 rounded-xl border bg-card px-4 py-3 transition-[box-shadow,transform] hover:shadow-md active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <span className="w-4 text-xs font-bold tabular-nums text-muted-foreground">
              {i + 1}
            </span>
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
            <span className="stat-number text-xl tabular-nums font-bold">
              {getValue(player).toFixed(1)}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
