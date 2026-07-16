import {
  CalendarDays,
  ChevronRight,
  Search,
  Trophy,
  Users,
} from "lucide-react";
import type { Metadata } from "next";
import { connection } from "next/server";
import Link from "next/link";
import { PlayerAvatar } from "@/components/player-avatar";
import { TeamLogo } from "@/components/team-logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { GameCard } from "./components/game-card";
import { PublicEmptyState } from "./components/public-empty-state";
import {
  getBoxScore,
  getGamesByDate,
  getLeaders,
  getPlayers,
  getRecentGames,
  getStandings,
  getUlaanbaatarDate,
  getLiveGames,
} from "./lib/data";

export const metadata: Metadata = {
  title: "Оноо — Монгол сагсан бөмбөгийн лигийн төв",
  description:
    "Шууд тоглолт, үр дүн, тэргүүлэгчид, шалгуур болон тоглогчдын гүйцэтгэл.",
};

function formatAverage(value: number | null): string {
  return value?.toFixed(1) ?? "—";
}

export default async function HomePage() {
  await connection();
  const today = getUlaanbaatarDate();
  const [todayGames, upcomingGames, recentGames, standings, leaders, players] =
    await Promise.all([
      getGamesByDate(today),
      getLiveGames(),
      getRecentGames(4),
      getStandings(),
      getLeaders(),
      getPlayers(),
    ]);

  const liveGame = todayGames.find(
    (game) => game.status === "live_provisional",
  );
  const todayScheduled = todayGames.find((game) => game.status === "scheduled");
  const heroGame =
    liveGame ?? todayScheduled ?? upcomingGames[0] ?? recentGames[0] ?? null;
  const latestFinal = recentGames[0] ?? null;
  const latestBoxScore = latestFinal ? await getBoxScore(latestFinal.id) : [];
  const topPerformer = [...latestBoxScore].sort((a, b) => b.pts - a.pts)[0];
  const featuredPlayer = players[0] ?? null;

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-12 px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
      <section
        aria-labelledby="league-pulse-heading"
        className="grid gap-5 lg:grid-cols-12"
      >
        <div className="flex flex-col justify-between gap-8 rounded-3xl bg-sidebar p-6 text-sidebar-foreground lg:col-span-4 lg:p-8">
          <div className="flex flex-col gap-4">
            <Badge variant="secondary" className="w-fit">
              Монголын сагсан бөмбөг
            </Badge>
            <div className="flex flex-col gap-3">
              <h1
                id="league-pulse-heading"
                className="font-display text-4xl leading-tight tracking-tight sm:text-5xl"
              >
                Лигийн бүх түүх нэг дор.
              </h1>
              <p className="max-w-md text-sm leading-relaxed text-sidebar-foreground/70 sm:text-base">
                Өнөөдрийн тоглолт, баталгаажсан үр дүн, шилдэг тоглогчид болон
                хүснэгтийн өрсөлдөөнийг шууд хараарай.
              </p>
            </div>
          </div>

          <search>
            <form action="/players" className="flex gap-2">
              <Input
                name="q"
                type="search"
                aria-label="Тоглогч эсвэл баг хайх"
                placeholder="Тоглогч хайх"
                className="bg-background text-foreground"
              />
              <Button type="submit" size="icon" aria-label="Хайх">
                <Search aria-hidden="true" />
              </Button>
            </form>
          </search>
        </div>

        <div className="lg:col-span-8">
          {heroGame ? (
            <div className="flex h-full flex-col gap-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {liveGame
                      ? "Яг одоо"
                      : todayScheduled
                        ? "Өнөө орой"
                        : upcomingGames.length > 0
                          ? "Дараагийн тоглолт"
                          : "Сүүлийн баталгаажсан тоглолт"}
                  </p>
                  <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
                    Тоглолтын төв
                  </h2>
                </div>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/games">
                    Бүх тоглолт
                    <ChevronRight data-icon="inline-end" aria-hidden="true" />
                  </Link>
                </Button>
              </div>
              <GameCard game={heroGame} featured className="flex-1" />
            </div>
          ) : (
            <PublicEmptyState
              icon={CalendarDays}
              title="Тоглолтын мэдээлэл хараахан алга"
              description="Лигийн баталгаажсан хуваарь нийтлэгдэхэд энд хамгийн эхэнд харагдана."
              actionHref="/players"
              actionLabel="Тоглогчидтой танилцах"
              className="h-full min-h-80"
            />
          )}
        </div>
      </section>

      <section
        aria-labelledby="latest-story-heading"
        className="grid gap-5 lg:grid-cols-12"
      >
        <Card className="shadow-none lg:col-span-7">
          <CardHeader>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Сүүлийн үр дүн
              </p>
              <CardTitle
                id="latest-story-heading"
                className="mt-1 text-2xl tracking-tight"
              >
                Тоглолтын түүх
              </CardTitle>
            </div>
            {latestFinal ? (
              <CardAction>
                <Button asChild variant="ghost" size="sm">
                  <Link href={`/games/${latestFinal.id}`}>
                    Дэлгэрэнгүй
                    <ChevronRight data-icon="inline-end" aria-hidden="true" />
                  </Link>
                </Button>
              </CardAction>
            ) : null}
          </CardHeader>
          <CardContent>
            {latestFinal ? (
              <div className="grid gap-6 sm:grid-cols-2 sm:items-center">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <TeamLogo
                      logoUrl={latestFinal.home_team_logo_url}
                      shortCode={latestFinal.home_team_short_code}
                      primaryColor={latestFinal.home_team_primary_color}
                      size="lg"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">
                        {latestFinal.home_team_name}
                      </p>
                      <p className="text-sm text-muted-foreground">Эзэн баг</p>
                    </div>
                    <span className="text-3xl font-black tabular-nums">
                      {latestFinal.home_score ?? 0}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <TeamLogo
                      logoUrl={latestFinal.away_team_logo_url}
                      shortCode={latestFinal.away_team_short_code}
                      primaryColor={latestFinal.away_team_primary_color}
                      size="lg"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">
                        {latestFinal.away_team_name}
                      </p>
                      <p className="text-sm text-muted-foreground">Зочин баг</p>
                    </div>
                    <span className="text-3xl font-black tabular-nums">
                      {latestFinal.away_score ?? 0}
                    </span>
                  </div>
                </div>
                <div className="rounded-xl bg-muted p-5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Тоглолтын онцлох тоглогч
                  </p>
                  {topPerformer ? (
                    <div className="mt-4 flex items-center gap-3">
                      <PlayerAvatar name={topPerformer.player_name} size="lg" />
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
                  ) : (
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                      Баталгаажсан тоглогчийн мөр нийтлэгдэхэд энд харагдана.
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <PublicEmptyState
                icon={Trophy}
                title="Баталгаажсан үр дүн хараахан алга"
                description="Эхний тоглолт лигээр баталгаажмагц тоглолтын онцлох түүх энд гарна."
              />
            )}
          </CardContent>
        </Card>

        <Card className="overflow-hidden bg-sidebar text-sidebar-foreground shadow-none lg:col-span-5">
          <CardHeader>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/60">
                Онцлох тамирчин
              </p>
              <CardTitle className="mt-1 text-2xl tracking-tight">
                Улирлын өнгө
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {featuredPlayer ? (
              <div className="flex flex-col gap-6 sm:flex-row sm:items-end lg:flex-col lg:items-stretch xl:flex-row xl:items-end">
                <PlayerAvatar
                  photoUrl={featuredPlayer.photo_url}
                  name={featuredPlayer.player_name}
                  primaryColor={featuredPlayer.team_primary_color}
                  size="2xl"
                  className="ring-4 ring-sidebar-border"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-sidebar-foreground/60">
                    {featuredPlayer.team_name}
                  </p>
                  <Link
                    href={`/players/${featuredPlayer.player_id}`}
                    className="mt-1 block font-display text-3xl leading-tight tracking-tight hover:text-warning focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
                  >
                    {featuredPlayer.player_name}
                  </Link>
                  <div className="mt-5 grid grid-cols-3 gap-2">
                    <StatementStat
                      label="ОНОО"
                      value={formatAverage(featuredPlayer.points_per_game)}
                    />
                    <StatementStat
                      label="САМБАР"
                      value={formatAverage(featuredPlayer.rebounds_per_game)}
                    />
                    <StatementStat
                      label="ДАМЖ"
                      value={formatAverage(featuredPlayer.assists_per_game)}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm leading-relaxed text-sidebar-foreground/70">
                Баталгаажсан тоглогчийн статистик нийтлэгдэхэд улирлын онцлох
                тамирчин энд харагдана.
              </p>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-5 lg:grid-cols-12">
        <Card className="shadow-none lg:col-span-5">
          <CardHeader>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Лигийн шилдгүүд
              </p>
              <CardTitle className="mt-1 text-xl tracking-tight">
                Онооны тэргүүлэгчид
              </CardTitle>
            </div>
            <CardAction>
              <Button asChild variant="ghost" size="sm">
                <Link href="/leaders">Бүгд</Link>
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent>
            {leaders.length > 0 ? (
              <ol className="flex flex-col gap-1">
                {leaders.slice(0, 3).map((leader, index) => (
                  <li key={`${leader.player_id}-${leader.competition_id}`}>
                    <Link
                      href={`/players/${leader.player_id}`}
                      className="flex items-center gap-3 rounded-lg p-3 transition-[background-color,transform] hover:bg-accent active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none"
                    >
                      <span className="w-5 text-sm font-black tabular-nums text-muted-foreground">
                        {index + 1}
                      </span>
                      <PlayerAvatar
                        photoUrl={leader.player_photo_url}
                        name={leader.player_name}
                        primaryColor={leader.team_primary_color}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold">
                          {leader.player_name}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {leader.team_name}
                        </p>
                      </div>
                      <span className="text-xl font-black tabular-nums">
                        {formatAverage(leader.pts)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ol>
            ) : (
              <PublicEmptyState
                icon={Users}
                title="Тэргүүлэгч тодроогүй байна"
                description="Тоглогчид шаардлагатай тоглолтын тоонд хүрэхэд эрэмбэ үүснэ."
              />
            )}
          </CardContent>
        </Card>

        <Card className="shadow-none lg:col-span-7">
          <CardHeader>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Лигийн өрсөлдөөн
              </p>
              <CardTitle className="mt-1 text-xl tracking-tight">
                Шалгуурын эхний тав
              </CardTitle>
            </div>
            <CardAction>
              <Button asChild variant="ghost" size="sm">
                <Link href="/standings">Бүх шалгуур</Link>
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent>
            {standings.length > 0 ? (
              <ol className="flex flex-col gap-1">
                {standings.slice(0, 5).map((row, index) => (
                  <li key={row.team_season_id}>
                    <Link
                      href={`/teams/${row.team_slug}`}
                      className="grid grid-cols-12 items-center gap-3 rounded-lg p-3 transition-[background-color,transform] hover:bg-accent active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none"
                    >
                      <span className="col-span-1 text-sm font-black tabular-nums text-muted-foreground">
                        {index + 1}
                      </span>
                      <span className="col-span-7 flex min-w-0 items-center gap-3">
                        <TeamLogo
                          logoUrl={row.team_logo_url}
                          shortCode={row.team_short_code}
                          primaryColor={row.team_primary_color}
                        />
                        <span className="truncate font-semibold">
                          {row.team_name}
                        </span>
                      </span>
                      <span className="col-span-2 text-center text-sm tabular-nums text-muted-foreground">
                        {row.w}-{row.l}
                      </span>
                      <span className="col-span-2 text-right font-black tabular-nums">
                        {(row.win_pct * 100).toFixed(1)}%
                      </span>
                    </Link>
                  </li>
                ))}
              </ol>
            ) : (
              <PublicEmptyState
                icon={Trophy}
                title="Шалгуур хараахан үүсээгүй"
                description="Баталгаажсан эхний тоглолтын дараа багуудын байрлал энд шинэчлэгдэнэ."
              />
            )}
          </CardContent>
        </Card>
      </section>
    </main>
  );
}

interface StatementStatProps {
  label: string;
  value: string;
}

// Display-only statistic: loading and empty states are handled by its parent.
function StatementStat({ label, value }: StatementStatProps) {
  return (
    <div className="rounded-lg bg-sidebar-accent p-3">
      <p className="text-2xl font-black tabular-nums text-warning">{value}</p>
      <p className="mt-1 text-xs font-semibold tracking-wider text-sidebar-foreground/60">
        {label}
      </p>
    </div>
  );
}
