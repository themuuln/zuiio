import { Trophy } from "lucide-react";
import Link from "next/link";
import { PlayerAvatar } from "@/components/player-avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui";
import { cn } from "@/lib/utils";
import type { MvpRaceRow } from "../../lib/shared";

interface MvpRaceProps {
  candidates: MvpRaceRow[];
  className?: string;
}

export function MvpRace({ candidates, className }: MvpRaceProps) {
  if (candidates.length === 0) return null;

  return (
    <Card variant="stat" className={cn("overflow-hidden", className)}>
      <CardHeader>
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:bg-amber-400/10 dark:text-amber-400">
            <Trophy className="size-5" aria-hidden="true" />
          </span>
          <div>
            <CardTitle className="text-lg">MVP уралдаан</CardTitle>
            <CardDescription className="mt-1">
              Үр дүнгийн индексээр шалгарсан тоглогчид
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-1">
        {candidates.map((player, index) => (
          <Link
            key={player.player_id}
            href={`/players/${player.player_id}`}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-muted/50",
              index === 0 &&
                "bg-amber-500/5 ring-1 ring-amber-500/20 hover:bg-amber-500/10",
            )}
          >
            <span
              className={cn(
                "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                index === 0
                  ? "bg-amber-500 text-white"
                  : "bg-muted text-muted-foreground",
              )}
            >
              {index + 1}
            </span>
            <PlayerAvatar
              photoUrl={player.photo_url}
              name={player.canonical_name}
              primaryColor={player.team_primary_color}
              size="sm"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">
                {player.canonical_name}
              </p>
              <p className="text-xs text-muted-foreground">
                {player.team_short_code}
              </p>
            </div>
            <div className="text-right">
              <p
                className={cn(
                  "text-sm font-bold tabular-nums",
                  index === 0
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-foreground",
                )}
              >
                {player.eff.toFixed(1)}
              </p>
              <p className="text-[10px] text-muted-foreground">EFF</p>
            </div>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
