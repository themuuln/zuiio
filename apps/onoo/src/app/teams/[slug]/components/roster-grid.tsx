import { Users } from "lucide-react";
import Link from "next/link";
import { PublicEmptyState } from "@/app/components/public-empty-state";
import type { LeaderRow, TeamRosterRow } from "@/app/lib/shared";
import { PlayerAvatar } from "@/components/player-avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface RosterGridProps {
  teamName: string;
  primaryColor: string | null;
  players: TeamRosterRow[];
  leadersByPlayer: Map<string, LeaderRow>;
}

/**
 * Responsive grid of mini player cards.
 *
 * 2 columns at 360px, 4 columns at `md`. Each card shows:
 * PlayerAvatar (md), player name, jersey number, position, PPG (if qualified).
 */
export function RosterGrid({
  teamName,
  primaryColor,
  players,
  leadersByPlayer,
}: RosterGridProps) {
  if (players.length === 0) {
    return (
      <PublicEmptyState
        icon={Users}
        title="Бүрэлдэхүүн нийтлэгдээгүй"
        description="Лигийн баталгаажсан ростер нийтлэгдэхэд тоглогчид энд харагдана."
      />
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {players.map((player) => {
        const stats = leadersByPlayer.get(player.player_id);
        return (
          <Link
            key={player.id}
            href={`/players/${player.id}`}
            className="group rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <Card className="h-full shadow-none transition-[background-color,transform] group-hover:bg-accent/40 group-active:scale-95 motion-reduce:transition-none">
              <CardHeader className="p-3 pb-0">
                <div className="flex flex-col items-center gap-2">
                  <PlayerAvatar
                    photoUrl={player.photo_url}
                    name={player.canonical_name}
                    primaryColor={primaryColor}
                    size="md"
                  />
                  <div className="text-center">
                    <CardTitle className="truncate text-sm font-semibold leading-tight">
                      {player.canonical_name}
                    </CardTitle>
                    <CardDescription className="mt-0.5 text-xs">
                      #{player.jersey_number ?? "—"} ·{" "}
                      {player.position ?? "Байрлалгүй"}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-3 pt-2">
                <div className="text-center">
                  <span className="text-xs text-muted-foreground">PPG</span>
                  <p className="text-xl font-bold leading-tight">
                    {stats ? stats.pts?.toFixed(1) : "—"}
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
