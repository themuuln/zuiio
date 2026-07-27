import { formatInTimeZone } from "date-fns-tz";
import { Radio } from "lucide-react";
import Link from "next/link";
import type { GameWithTeams } from "@/app/lib/shared";
import { statusLabel, statusVariant } from "@/app/lib/shared";
import { TeamLogo } from "@/components/team-logo";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { GameStatusBadge } from "./game-status-badge";

interface GameCardProps {
  game: GameWithTeams;
  /** When true, the winning team's score is bolded. */
  showWinner?: boolean;
  className?: string;
}

/**
 * Reusable game card showing both teams, score or start time, venue, and status.
 *
 * - Final/live games: score center with optional winner bold.
 * - Scheduled games: start time (Asia/Ulaanbaatar).
 * - Links to `games/[id]`.
 */
export function GameCard({
  game,
  showWinner = true,
  className,
}: GameCardProps) {
  const homeScore = game.home_score ?? 0;
  const awayScore = game.away_score ?? 0;
  const isFinished =
    game.status === "official" || game.status === "league_verified";
  const isLive = game.status === "live_provisional";
  const isScheduled = game.status === "scheduled";
  const hasScores = homeScore > 0 || awayScore > 0 || isFinished;

  const homeWon = isFinished && hasScores && homeScore > awayScore;
  const awayWon = isFinished && hasScores && awayScore > homeScore;

  const statusText = statusLabel(game.status);
  const variant = statusVariant(game.status);

  return (
    <Link
      href={`/games/${game.id}`}
      className={cn(
        "flex items-center gap-4 rounded-xl border border-border/50 bg-[var(--surface-2)] p-4 transition-all hover:border-border hover:bg-accent active:scale-[0.98] motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
    >
      {/* Home team */}
      <div className="flex min-w-0 flex-1 flex-col items-center gap-1.5 text-center">
        <TeamLogo
          logoUrl={game.home_team_logo_url}
          shortCode={game.home_team_short_code}
          primaryColor={game.home_team_primary_color}
          size="lg"
        />
        <span
          className={cn(
            "max-w-[100px] truncate text-xs font-semibold leading-tight sm:max-w-[140px]",
            showWinner && homeWon && "font-bold",
          )}
        >
          {game.home_team_name}
        </span>
      </div>

      {/* Score / Time */}
      <div className="flex flex-col items-center gap-1">
        {isScheduled || (!hasScores && !isLive) ? (
          <time
            dateTime={game.scheduled_at}
            className="text-lg font-bold tabular-nums leading-none"
          >
            {formatInTimeZone(
              new Date(game.scheduled_at),
              "Asia/Ulaanbaatar",
              "HH:mm",
            )}
          </time>
        ) : (
          <div className="flex items-center gap-2 text-center tabular-nums leading-none">
            <span
              className={cn(
                "text-2xl font-bold",
                showWinner && homeWon && "text-foreground",
                showWinner && !homeWon && hasScores && "text-muted-foreground",
              )}
            >
              {homeScore}
            </span>
            <span className="text-lg text-muted-foreground">:</span>
            <span
              className={cn(
                "text-2xl font-bold",
                showWinner && awayWon && "text-foreground",
                showWinner && !awayWon && hasScores && "text-muted-foreground",
              )}
            >
              {awayScore}
            </span>
          </div>
        )}

        {/* Status chip */}
        {isLive ? (
          <span className="mt-0.5 flex items-center gap-1 text-xs font-semibold text-destructive">
            <Radio className="size-3 animate-pulse" aria-hidden="true" />
            Шууд
          </span>
        ) : game.is_provisional ? (
          <GameStatusBadge
            game={game}
            className="mt-0.5 text-[10px] leading-none"
          />
        ) : (
          <Badge variant={variant} className="mt-0.5 text-[10px] leading-none">
            {isFinished ? "Эцсийн" : statusText}
          </Badge>
        )}
      </div>

      {/* Away team */}
      <div className="flex min-w-0 flex-1 flex-col items-center gap-1.5 text-center">
        <TeamLogo
          logoUrl={game.away_team_logo_url}
          shortCode={game.away_team_short_code}
          primaryColor={game.away_team_primary_color}
          size="lg"
        />
        <span
          className={cn(
            "max-w-[100px] truncate text-xs font-semibold leading-tight sm:max-w-[140px]",
            showWinner && awayWon && "font-bold",
          )}
        >
          {game.away_team_name}
        </span>
      </div>
    </Link>
  );
}

export function GameCardSkeleton() {
  return (
    <div
      className="flex items-center gap-4 rounded-xl border border-border/50 bg-[var(--surface-2)] p-4"
      aria-hidden="true"
    >
      {/* Home team skeleton */}
      <div className="flex min-w-0 flex-1 flex-col items-center gap-1.5 text-center">
        <Skeleton className="size-12 rounded-full" />
        <Skeleton className="h-3 w-16" />
      </div>

      {/* Score skeleton */}
      <div className="flex flex-col items-center gap-1">
        <div className="flex items-center gap-2 text-center tabular-nums leading-none">
          <Skeleton className="h-7 w-7" />
          <Skeleton className="h-5 w-3" />
          <Skeleton className="h-7 w-7" />
        </div>
        <Skeleton className="h-4 w-14 rounded-full" />
      </div>

      {/* Away team skeleton */}
      <div className="flex min-w-0 flex-1 flex-col items-center gap-1.5 text-center">
        <Skeleton className="size-12 rounded-full" />
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
  );
}
