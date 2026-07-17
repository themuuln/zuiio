import { CalendarDays, ChevronRight, Trophy, Users } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PlayerAvatar } from "@/components/player-avatar";
import { TeamLogo } from "@/components/team-logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { GameCard } from "../../components/game-card";
import { PublicEmptyState } from "../../components/public-empty-state";
import { type GameWithTeams, getTeamBySlug } from "../../lib/data";

interface TeamPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: TeamPageProps): Promise<Metadata> {
  const { slug } = await params;
  const data = await getTeamBySlug(slug);
  if (!data) return { title: "Баг олдсонгүй — Оноо" };

  return {
    title: `${data.team.name} — Оноо`,
    description: `${data.team.name} багийн бүрэлдэхүүн, форм, тоглолт болон статистик.`,
  };
}

function getResult(game: GameWithTeams, teamId: string): "W" | "L" {
  const isHome = game.home_team_id === teamId;
  const teamScore = (isHome ? game.home_score : game.away_score) ?? 0;
  const opponentScore = (isHome ? game.away_score : game.home_score) ?? 0;
  return teamScore > opponentScore ? "W" : "L";
}

function formatPercent(value: number): string {
  const percent = value <= 1 ? value * 100 : value;
  return `${percent.toFixed(1)}%`;
}

export default async function TeamPage({ params }: TeamPageProps) {
  const { slug } = await params;
  const data = await getTeamBySlug(slug);
  if (!data) notFound();

  const { team, players, standings, leaders, recentGames, upcomingGames } =
    data;
  const nextGame = upcomingGames[0] ?? null;
  const form = recentGames.slice(0, 5).map((game) => ({
    gameId: game.id,
    result: getResult(game, team.id),
  }));
  const totalGames = standings ? standings.w + standings.l : 0;
  const averagePoints =
    standings && totalGames > 0
      ? (standings.points_for ?? 0) / totalGames
      : null;
  const pointDifference = standings
    ? (standings.points_for ?? 0) - (standings.points_against ?? 0)
    : null;
  const leadersByPlayer = new Map(
    leaders.map((leader) => [leader.player_id, leader]),
  );

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
      <section className="team-showcase-hero relative overflow-hidden rounded-3xl bg-sidebar p-6 text-sidebar-foreground sm:p-8 lg:p-10">
        <div className="relative grid gap-8 lg:grid-cols-12 lg:items-end">
          <div className="flex items-center gap-5 lg:col-span-7">
            <TeamLogo
              logoUrl={team.logo_url}
              shortCode={team.short_code}
              primaryColor={team.primary_color}
              size="xl"
              className="ring-4 ring-sidebar-border"
            />
            <div className="min-w-0">
              <p className="text-sm font-semibold tracking-wider text-warning">
                {team.short_code}
              </p>
              <h1 className="mt-2 font-display text-4xl leading-tight tracking-tight sm:text-6xl">
                {team.name}
              </h1>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-sidebar-foreground/70">
                {standings ? (
                  <>
                    <span>
                      {standings.w}-{standings.l}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{formatPercent(standings.win_pct)}</span>
                    <span aria-hidden="true">·</span>
                    <span>{standings.competition_name}</span>
                  </>
                ) : (
                  <span>Баталгаажсан улирлын бүртгэл хүлээгдэж байна</span>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 lg:col-span-5">
            <TeamStatement
              label="ЯЛАЛТ"
              value={standings ? String(standings.w) : "—"}
            />
            <TeamStatement label="ФОРМ" value={standings?.last10 ?? "—"} />
            <TeamStatement
              label="ЗӨРҮҮ"
              value={
                pointDifference === null
                  ? "—"
                  : `${pointDifference > 0 ? "+" : ""}${pointDifference}`
              }
            />
          </div>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-12">
        <div className="flex flex-col gap-4 lg:col-span-7">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Дараагийн сорилт
            </p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight">
              Дараагийн тоглолт
            </h2>
          </div>
          {nextGame ? (
            <GameCard game={nextGame} featured />
          ) : (
            <PublicEmptyState
              icon={CalendarDays}
              title="Дараагийн тоглолт товлогдоогүй"
              description="Лиг хуваарийг нийтлэхэд багийн дараагийн өрсөлдөгч энд гарна."
              actionHref="/games"
              actionLabel="Бүх тоглолт"
            />
          )}
        </div>

        <Card className="shadow-none lg:col-span-5">
          <CardHeader>
            <CardTitle>Сүүлийн форм</CardTitle>
            <CardDescription>
              Сүүлийн таван баталгаажсан тоглолт
            </CardDescription>
          </CardHeader>
          <CardContent>
            {form.length > 0 ? (
              <div className="flex flex-wrap gap-3">
                {form.map(({ gameId, result }) => (
                  <Badge
                    key={gameId}
                    variant={result === "W" ? "default" : "destructive"}
                    className="size-11 text-sm"
                  >
                    {result}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm leading-relaxed text-muted-foreground">
                Баталгаажсан тоглолт бүрдмэгц форм энд харагдана.
              </p>
            )}
            <div id="team-analytics" className="mt-6 grid grid-cols-2 gap-3">
              <TeamMetric
                label="Дундаж оноо"
                value={averagePoints?.toFixed(1) ?? "—"}
              />
              <TeamMetric
                label="Ялалтын хувь"
                value={standings ? formatPercent(standings.win_pct) : "—"}
              />
            </div>
          </CardContent>
        </Card>
      </section>

      <section
        aria-labelledby="team-leaders-heading"
        className="flex flex-col gap-4"
      >
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Багийн хөдөлгөгч хүч
            </p>
            <h2
              id="team-leaders-heading"
              className="mt-1 text-2xl font-bold tracking-tight"
            >
              Багийн тэргүүлэгчид
            </h2>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/leaders">
              Лигийн тэргүүлэгчид
              <ChevronRight data-icon="inline-end" aria-hidden="true" />
            </Link>
          </Button>
        </div>
        {leaders.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-3">
            {leaders.slice(0, 3).map((leader, index) => (
              <Link
                key={leader.player_id}
                href={`/players/${leader.player_id}`}
                className="group rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <Card className="h-full shadow-none transition-[background-color,transform] group-hover:bg-accent/40 group-active:scale-95 motion-reduce:transition-none">
                  <CardHeader>
                    <Badge variant="secondary">#{index + 1}</Badge>
                    <CardAction>
                      <span className="text-2xl font-black tabular-nums">
                        {leader.pts?.toFixed(1) ?? "—"}
                      </span>
                    </CardAction>
                  </CardHeader>
                  <CardContent className="flex items-center gap-4">
                    <PlayerAvatar
                      photoUrl={leader.player_photo_url}
                      name={leader.player_name}
                      primaryColor={team.primary_color}
                      size="xl"
                    />
                    <div className="min-w-0">
                      <CardTitle className="truncate text-xl">
                        {leader.player_name}
                      </CardTitle>
                      <CardDescription className="mt-2">
                        {leader.gp} тоглолт ·{" "}
                        {(leader.oreb ?? 0) + (leader.dreb ?? 0)} самбар
                      </CardDescription>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <PublicEmptyState
            icon={Trophy}
            title="Багийн тэргүүлэгч тодроогүй"
            description="Баталгаажсан улирлын статистик бүрдмэгц багийн шилдэг гурав энд гарна."
          />
        )}
      </section>

      <section aria-labelledby="roster-heading" className="flex flex-col gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Багийн хүмүүс
          </p>
          <h2
            id="roster-heading"
            className="mt-1 text-2xl font-bold tracking-tight"
          >
            Бүрэлдэхүүн
          </h2>
        </div>
        {players.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {players.map((player) => {
              const stats = leadersByPlayer.get(player.player_id);
              return (
                <Link
                  key={player.id}
                  href={`/players/${player.id}`}
                  className="group rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <Card className="h-full shadow-none transition-[background-color,transform] group-hover:bg-accent/40 group-active:scale-95 motion-reduce:transition-none">
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <PlayerAvatar
                          photoUrl={player.photo_url}
                          name={player.canonical_name}
                          primaryColor={team.primary_color}
                          size="lg"
                        />
                        <div className="min-w-0">
                          <CardTitle className="truncate">
                            {player.canonical_name}
                          </CardTitle>
                          <CardDescription className="mt-1">
                            #{player.jersey_number ?? "—"} ·{" "}
                            {player.position ?? "Байрлалгүй"}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="grid grid-cols-3 gap-2">
                      <RosterStat
                        label="ОНОО"
                        value={stats?.pts?.toFixed(1) ?? "—"}
                      />
                      <RosterStat
                        label="САМБ"
                        value={
                          stats
                            ? ((stats.oreb ?? 0) + (stats.dreb ?? 0)).toFixed(1)
                            : "—"
                        }
                      />
                      <RosterStat
                        label="ДАМЖ"
                        value={stats?.ast?.toFixed(1) ?? "—"}
                      />
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        ) : (
          <PublicEmptyState
            icon={Users}
            title="Бүрэлдэхүүн нийтлэгдээгүй"
            description="Лигийн баталгаажсан ростер нийтлэгдэхэд тоглогчид энд харагдана."
          />
        )}
      </section>

      <section
        aria-labelledby="recent-team-games"
        className="flex flex-col gap-4"
      >
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Сүүлийн түүх
          </p>
          <h2
            id="recent-team-games"
            className="mt-1 text-2xl font-bold tracking-tight"
          >
            Сүүлийн тоглолтууд
          </h2>
        </div>
        {recentGames.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {recentGames.slice(0, 4).map((game) => (
              <GameCard key={game.id} game={game} />
            ))}
          </div>
        ) : (
          <PublicEmptyState
            icon={CalendarDays}
            title="Баталгаажсан тоглолт байхгүй"
            description="Эхний тоглолтын үр дүн баталгаажмагц багийн түүх энд эхэлнэ."
          />
        )}
      </section>
    </main>
  );
}

interface TeamStatementProps {
  label: string;
  value: string;
}

function TeamStatement({ label, value }: TeamStatementProps) {
  return (
    <div className="rounded-xl bg-sidebar-accent p-4 text-center">
      <p className="stat-number text-2xl text-warning">{value}</p>
      <p className="mt-1 text-xs font-semibold tracking-wider text-sidebar-foreground/60 uppercase">
        {label}
      </p>
    </div>
  );
}

interface TeamMetricProps {
  label: string;
  value: string;
}

function TeamMetric({ label, value }: TeamMetricProps) {
  return (
    <div className="rounded-lg bg-[var(--surface-3)] p-4">
      <p className="stat-number text-2xl">{value}</p>
      <p className="mt-1 text-xs font-semibold text-muted-foreground uppercase">
        {label}
      </p>
    </div>
  );
}

interface RosterStatProps {
  label: string;
  value: string;
}

function RosterStat({ label, value }: RosterStatProps) {
  return (
    <div className="rounded-lg bg-[var(--surface-3)] p-2 text-center">
      <p className="stat-number">{value}</p>
      <p className="mt-1 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
        {label}
      </p>
    </div>
  );
}
