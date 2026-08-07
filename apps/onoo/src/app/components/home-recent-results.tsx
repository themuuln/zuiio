import { ChevronRight, Trophy } from "lucide-react";
import Link from "next/link";
import { PlayerAvatar } from "@/components/player-avatar";
import { TeamLogo } from "@/components/team-logo";
import {
  Button,
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui";
import { cn } from "@/lib/utils";
import type { BoxScoreRow, GameWithTeams } from "../lib/shared";
import { PublicEmptyState } from "./public-empty-state";

interface HomeRecentResultsProps {
  /** Latest finalized games, most recent first. */
  games: GameWithTeams[];
  /** Top performer of the latest game, when a verified box score exists. */
  topPerformer?: BoxScoreRow | null;
}

function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString("mn-MN", {
    month: "numeric",
    day: "numeric",
  });
}

/**
 * Recent results feed — the league's verified game history, newest first.
 * Bounded to 5 rows: an endless archive belongs on the schedule page.
 */
export function HomeRecentResults({
  games,
  topPerformer,
}: HomeRecentResultsProps) {
  return (
    <Card className="shadow-none lg:col-span-7">
      <CardHeader>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Сүүлийн үр дүн
          </p>
          <CardTitle className="mt-1 text-2xl tracking-tight">
            Тоглолтын түүх
          </CardTitle>
        </div>
        <CardAction>
          <Button asChild variant="ghost" size="sm">
            <Link href="/games">
              Бүх үр дүн
              <ChevronRight data-icon="inline-end" aria-hidden="true" />
            </Link>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {games.length > 0 ? (
          <>
            <ol className="flex flex-col gap-1">
              {games.map((game) => {
                const homeScore = game.home_score ?? 0;
                const awayScore = game.away_score ?? 0;
                const homeWon = homeScore > awayScore;
                return (
                  <li key={game.id}>
                    <Link
                      href={`/games/${game.id}`}
                      className="grid grid-cols-12 items-center gap-2 rounded-lg p-2.5 transition-[background-color,transform] hover:bg-accent active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none"
                    >
                      <span className="col-span-2 text-xs tabular-nums text-muted-foreground">
                        {shortDate(game.scheduled_at)}
                      </span>
                      <span className="col-span-3 flex min-w-0 items-center gap-2">
                        <TeamLogo
                          logoUrl={game.home_team_logo_url}
                          shortCode={game.home_team_short_code}
                          primaryColor={game.home_team_primary_color}
                          size="sm"
                        />
                        <span
                          className={cn(
                            "truncate text-sm",
                            homeWon
                              ? "font-semibold text-foreground"
                              : "text-muted-foreground",
                          )}
                        >
                          {game.home_team_name}
                        </span>
                      </span>
                      <span className="col-span-2 text-center text-sm font-bold tabular-nums tracking-tight">
                        <span
                          className={homeWon ? "" : "text-muted-foreground"}
                        >
                          {homeScore}
                        </span>
                        <span className="mx-1 text-muted-foreground/50">–</span>
                        <span
                          className={homeWon ? "text-muted-foreground" : ""}
                        >
                          {awayScore}
                        </span>
                      </span>
                      <span className="col-span-3 flex min-w-0 items-center justify-end gap-2">
                        <span
                          className={cn(
                            "truncate text-sm text-right",
                            homeWon
                              ? "text-muted-foreground"
                              : "font-semibold text-foreground",
                          )}
                        >
                          {game.away_team_name}
                        </span>
                        <TeamLogo
                          logoUrl={game.away_team_logo_url}
                          shortCode={game.away_team_short_code}
                          primaryColor={game.away_team_primary_color}
                          size="sm"
                        />
                      </span>
                      <span className="col-span-2 text-right text-xs text-muted-foreground">
                        {game.venue_name}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ol>

            {/* Top performer of the latest game — auto-generated highlight */}
            {topPerformer ? (
              <div className="rounded-xl bg-[var(--surface-3)] p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Тоглолтын онцлох тоглогч
                </p>
                <div className="mt-3 flex items-center gap-3">
                  <PlayerAvatar name={topPerformer.player_name} size="md" />
                  <div className="min-w-0">
                    <Link
                      href={`/players/${topPerformer.player_id}`}
                      className="font-bold hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {topPerformer.player_name}
                    </Link>
                    <p className="text-sm text-muted-foreground">
                      {topPerformer.pts} оноо ·{" "}
                      {topPerformer.oreb + topPerformer.dreb} самбар ·{" "}
                      {topPerformer.ast} дамжуулалт
                    </p>
                  </div>
                </div>
              </div>
            ) : null}
          </>
        ) : (
          <PublicEmptyState
            icon={Trophy}
            title="Баталгаажсан үр дүн хараахан алга"
            description="Эхний тоглолт лигээр баталгаажмагц тоглолтын онцлох түүх энд гарна."
          />
        )}
      </CardContent>
    </Card>
  );
}
