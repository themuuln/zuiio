import {
  BarChart3,
  CalendarDays,
  ChevronRight,
  Eye,
  Trophy,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GameCard } from "@/app/components/game-card";
import { PublicEmptyState } from "@/app/components/public-empty-state";
import { type GameWithTeams, getTeamBySlug } from "@/app/lib/data";
import { getProductsByTeamSlug } from "@/app/lib/data-shop";
import { ProductCard } from "@/app/shop/components/product-card";
import { PlayerAvatar } from "@/components/player-avatar";
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
import { ViewBeacon } from "@/components/view-beacon";
import { RosterGrid } from "./components/roster-grid";
import { TeamHeader } from "./components/team-header";

// ISR — team data changes after games
export const revalidate = 60;

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
    description: `${data.team.name} багийн байрлал, форм, тоглогчид ба сүүлийн тоглолтууд.`,
    alternates: {
      canonical: `https://onoo.mn/teams/${slug}`,
    },
  };
}

function getResult(game: GameWithTeams, teamId: string): "W" | "L" {
  const isHome = game.home_team_id === teamId;
  const teamScore = isHome ? (game.home_score ?? 0) : (game.away_score ?? 0);
  const opponentScore = isHome
    ? (game.away_score ?? 0)
    : (game.home_score ?? 0);
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
  const teamProducts = await getProductsByTeamSlug(team.slug);
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

  const recordDescription = standings
    ? `${team.name} — Basketball team with ${standings.w} wins and ${standings.l} losses.`
    : `${team.name} — Basketball team.`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SportsTeam",
    name: team.name,
    sport: "Basketball",
    description: recordDescription,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
        <ViewBeacon entityType="team" entityId={team.slug} />
        <TeamHeader
          team={team}
          standings={standings}
          form={form}
          averagePoints={averagePoints}
          pointDifference={pointDifference}
        />

        <div className="flex items-center gap-3">
          <Link
            href={`/teams/${slug}/analytics`}
            className="inline-flex items-center gap-1.5 rounded-lg border bg-card px-3 py-1.5 text-xs font-medium text-card-foreground shadow-sm transition-colors hover:bg-accent"
          >
            <BarChart3 className="size-3.5" />
            Дэвшилтэт үзүүлэлт
          </Link>
          <Link
            href={`/teams/${slug}/scout`}
            className="inline-flex items-center gap-1.5 rounded-lg border bg-card px-3 py-1.5 text-xs font-medium text-card-foreground shadow-sm transition-colors hover:bg-accent"
          >
            <Eye className="size-3.5" />
            Скаутын тайлан
          </Link>
        </div>

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
              <GameCard game={nextGame} />
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
            <Button variant="outline" size="sm">
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
                  <Card
                    className="h-full shadow-none transition-[background-color,transform] group-hover:bg-accent/40 group-active:scale-95 motion-reduce:transition-none"
                    style={
                      index === 0 && team.primary_color
                        ? {
                            borderTop: `3px solid ${team.primary_color}`,
                          }
                        : undefined
                    }
                  >
                    <CardHeader>
                      <Badge variant="secondary">#{index + 1}</Badge>
                      <CardAction>
                        <span className="stat-number text-2xl">
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

        <section
          aria-labelledby="roster-heading"
          className="flex flex-col gap-4"
        >
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
          <RosterGrid
            teamName={team.name}
            primaryColor={team.primary_color}
            players={players}
            leadersByPlayer={leadersByPlayer}
          />
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

        {/* ════════════════════════════════════════════════════════
            SHOP SECTION
           ════════════════════════════════════════════════════════ */}
        {teamProducts.length > 0 && (
          <section aria-labelledby="team-shop-heading" className="flex flex-col gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Багийн дэлгүүр
              </p>
              <h2
                id="team-shop-heading"
                className="mt-1 text-2xl font-bold tracking-tight"
              >
                Дэлгүүр
              </h2>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {teamProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
            <Link
              href={`/shop?team=${team.slug}`}
              className="self-start text-sm font-medium text-[var(--brand-sports)] hover:underline"
            >
              Бүх бүтээгдэхүүн үзэх →
            </Link>
          </section>
        )}
      </main>
    </>
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
      <p className="mt-1 text-xs font-semibold uppercase text-muted-foreground">
        {label}
      </p>
    </div>
  );
}
