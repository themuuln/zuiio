"use client";

import { ChevronDown, ChevronUp, Users } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import type { LeaderRow } from "@/app/lib/shared";
import { PlayerAvatar } from "@/components/player-avatar";

interface UnqualifiedSectionProps {
  unqualifiedPlayers: LeaderRow[];
  statLabel: string;
}

/**
 * Expandable section showing players who don't meet the qualification
 * threshold (min 3 games or half the team's games).
 *
 * Each row shows: PlayerAvatar, name, team, stat value, and
 * how many more games they need to qualify.
 */
export function UnqualifiedSection({
  unqualifiedPlayers,
  statLabel,
}: UnqualifiedSectionProps) {
  const [open, setOpen] = useState(false);

  if (unqualifiedPlayers.length === 0) return null;

  return (
    <div className="rounded-xl border bg-card text-card-foreground shadow-none">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium transition-colors hover:bg-accent/40"
        aria-expanded={open}
      >
        <div className="flex items-center gap-2">
          <Users className="size-4 text-muted-foreground" aria-hidden="true" />
          <span>Шалгуур хангаагүй ({unqualifiedPlayers.length})</span>
        </div>
        {open ? (
          <ChevronUp className="size-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="size-4 text-muted-foreground" />
        )}
      </button>

      {open && (
        <div className="divide-y">
          {unqualifiedPlayers.map((player) => {
            const needed = Math.max(
              0,
              Math.max(3, Math.ceil(0.5 * (player.team_games_played ?? 0))) -
                (player.gp ?? 0),
            );
            return (
              <Link
                key={player.player_id}
                href={`/players/${player.player_id}`}
                className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-accent/20"
              >
                <PlayerAvatar
                  photoUrl={player.player_photo_url}
                  name={player.player_name}
                  primaryColor={player.team_primary_color}
                  size="sm"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {player.player_name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {player.team_short_code}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold tabular-nums">
                    {statLabel === "Оноо"
                      ? player.pts?.toFixed(1)
                      : statLabel === "Самбар"
                        ? ((player.oreb ?? 0) + (player.dreb ?? 0)).toFixed(1)
                        : statLabel === "Дамжуулалт"
                          ? player.ast?.toFixed(1)
                          : statLabel === "Бөмбөг таслалт"
                            ? player.stl?.toFixed(1)
                            : player.blk?.toFixed(1)}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {needed > 0 ? `${needed} тоглолт дутуу` : "шалгуур хангах"}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
