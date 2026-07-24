import Link from "next/link";
import type { LeaderRow } from "@/app/lib/shared";
import { PlayerAvatar } from "@/components/player-avatar";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CompactLeaderRowProps {
  leader: LeaderRow;
  rank: number;
  statValue: number;
  className?: string;
}

// ---------------------------------------------------------------------------
// CompactLeaderRow
// ---------------------------------------------------------------------------

export function CompactLeaderRow({
  leader,
  rank,
  statValue,
  className,
}: CompactLeaderRowProps) {
  return (
    <Link
      href={`/players/${leader.player_id}`}
      className={cn(
        "flex items-center gap-3 rounded-lg px-4 py-3 transition-colors hover:bg-muted/80",
        "odd:bg-muted/50",
        className,
      )}
    >
      {/* Rank */}
      <span className="w-6 shrink-0 text-center text-sm font-semibold text-muted-foreground">
        {rank}
      </span>

      {/* Avatar */}
      <PlayerAvatar
        photoUrl={leader.photo_url}
        name={leader.player_name}
        primaryColor={leader.team_primary_color}
        size="sm"
      />

      {/* Name + team */}
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm font-medium">
          {leader.player_name}
        </span>
        <span className="text-xs text-muted-foreground">
          {leader.team_short_code}
        </span>
      </div>

      {/* Stat value */}
      <span className="text-sm font-bold tabular-nums">
        {statValue.toFixed(1)}
      </span>
    </Link>
  );
}
