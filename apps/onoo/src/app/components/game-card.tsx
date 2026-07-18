import { ArrowUpRight, MapPin } from "lucide-react";
import Link from "next/link";
import { TeamLogo } from "@/components/team-logo";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { GameWithTeams } from "../lib/shared";
import { formatGameTime } from "../lib/shared";
import { GameStatusBadge } from "./game-status-badge";

interface GameCardProps {
  game: GameWithTeams;
  featured?: boolean;
  className?: string;
}

function hasScore(game: GameWithTeams): boolean {
  return game.status !== "scheduled" && game.home_score !== null;
}

// A game card is only rendered with a game. Collection-level empty states are
// handled by PublicEmptyState in the parent page.
export function GameCard({ game, featured = false, className }: GameCardProps) {
  const isLive =
    game.status === "live_provisional" || game.status === "league_verified";

  return (
    <Link
      href={`/games/${game.id}`}
      className="group block rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <Card
        variant={featured ? "featured" : "default"}
        className={cn(
          "h-full transition-[box-shadow,transform] duration-[var(--duration-fast)] group-hover:shadow-md group-active:scale-[0.98] motion-reduce:transition-none",
          featured
            ? "bg-sidebar text-sidebar-foreground group-hover:bg-white/10"
            : "group-hover:bg-accent/40",
          isLive && "ring-1 ring-red-500/20",
          className,
        )}
      >
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <GameStatusBadge game={game} />
            <CardDescription
              className={cn(featured && "text-sidebar-foreground/70")}
            >
              {game.competition_name}
            </CardDescription>
          </div>
          <CardAction>
            <ArrowUpRight aria-hidden="true" />
          </CardAction>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <div className="grid grid-cols-3 items-center gap-3">
            <div className="flex min-w-0 flex-col items-center gap-2 text-center sm:flex-row sm:text-left">
              <TeamLogo
                logoUrl={game.home_team_logo_url}
                shortCode={game.home_team_short_code}
                primaryColor={game.home_team_primary_color}
                size={featured ? "lg" : "md"}
              />
              <CardTitle className="truncate text-sm sm:text-base">
                {game.home_team_name}
              </CardTitle>
            </div>

            <div className="min-w-20 text-center">
              {hasScore(game) ? (
                <p
                  className={cn(
                    "stat-number text-2xl tracking-tight",
                    featured && "sm:text-4xl",
                  )}
                >
                  {game.home_score ?? 0}
                  <span className="px-1 text-muted-foreground">–</span>
                  {game.away_score ?? 0}
                </p>
              ) : (
                <p className="text-lg font-bold tabular-nums">
                  {formatGameTime(game.scheduled_at)}
                </p>
              )}
            </div>

            <div className="flex min-w-0 flex-col items-center gap-2 text-center sm:flex-row-reverse sm:text-right">
              <TeamLogo
                logoUrl={game.away_team_logo_url}
                shortCode={game.away_team_short_code}
                primaryColor={game.away_team_primary_color}
                size={featured ? "lg" : "md"}
              />
              <CardTitle className="truncate text-sm sm:text-base">
                {game.away_team_name}
              </CardTitle>
            </div>
          </div>

          {game.venue_name ? (
            <p
              className={cn(
                "flex items-center justify-center gap-1 text-xs text-muted-foreground",
                featured && "text-sidebar-foreground/70",
              )}
            >
              <MapPin className="size-3" aria-hidden="true" />
              {game.venue_name}
            </p>
          ) : null}
        </CardContent>
      </Card>
    </Link>
  );
}

interface GameCardSkeletonProps {
  className?: string;
}

export function GameCardSkeleton({ className }: GameCardSkeletonProps) {
  return (
    <Card className={cn("shadow-none", className)} aria-hidden="true">
      <CardHeader>
        <Skeleton className="h-5 w-28" />
      </CardHeader>
      <CardContent className="grid grid-cols-3 items-center gap-3">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-12 w-full" />
      </CardContent>
    </Card>
  );
}
