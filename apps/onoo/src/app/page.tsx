import {
  CalendarDays,
  ChevronRight,
  Radio,
  Search,
  Trophy,
  Users,
} from "lucide-react";
import type { Metadata } from "next";
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
  Input,
} from "@/components/ui";
import { ViewBeacon } from "@/components/view-beacon";
import { cn } from "@/lib/utils";
import { CountdownTimer } from "./components/countdown-timer";
import { FlipScore } from "./components/flip-score";
import { PublicEmptyState } from "./components/public-empty-state";
import { Sponsors } from "./components/sponsors";
import {
  getBoxScore,
  getGamesByDate,
  getLeaders,
  getLiveGames,
  getPlayers,
  getRecentGames,
  getStandings,
  getUlaanbaatarDate,
} from "./lib/data";

export const metadata: Metadata = {
  title: "Оноо — Спортын тоо баримт",
  description:
    "Монголын сагсан бөмбөгийн лигийн тоглолт, шалгуур, шилдэг тоглогчид.",
};

function formatAverage(value: number | null): string {
  return value?.toFixed(1) ?? "—";
}
export default async function HomePage() {
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
  const tonightGames = todayGames.filter(
    (g) => g.status === "scheduled" || g.status === "live_provisional",
  );

  return (
    <main className="flex flex-col">
      <ViewBeacon
        entityType="home"
        entityId="00000000-0000-0000-0000-000000000000"
      />
      {/* ── Hero: full-width dramatic scoreboard ── */}
      <section
        aria-labelledby="hero-heading"
        className="player-showcase-hero relative overflow-hidden bg-sidebar text-sidebar-foreground"
      >
        <div className="player-showcase-court" aria-hidden="true" />
        <div className="relative mx-auto flex max-w-7xl flex-col gap-8 px-4 py-10 sm:px-6 sm:py-14 lg:px-8 lg:py-20">
          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-warning">
              {liveGame
                ? "Яг одоо"
                : todayScheduled
                  ? "Өнөө орой"
                  : upcomingGames.length > 0
                    ? "Дараагийн тоглолт"
                    : "Сүүлийн баталгаажсан"}
            </p>
            <h1
              id="hero-heading"
              className="font-display text-4xl leading-tight tracking-tight sm:text-5xl lg:text-6xl"
            >
              {heroGame ? "Тоглолтын төв" : "Лигийн бүх түүх нэг дор."}
            </h1>
          </div>

          {heroGame ? (
            <div className="grid gap-6 lg:grid-cols-12 lg:items-center">
              {/* Teams & Score */}
              <div className="flex items-center justify-center gap-6 sm:gap-10 lg:col-span-8">
                <Link
                  href={`/teams/${heroGame.home_team_slug}`}
                  className="flex flex-col items-center gap-3 text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring rounded-xl"
                >
                  <TeamLogo
                    logoUrl={heroGame.home_team_logo_url}
                    shortCode={heroGame.home_team_short_code}
                    primaryColor={heroGame.home_team_primary_color}
                    size="xl"
                  />
                  <span className="text-sm font-semibold sm:text-base">
                    {heroGame.home_team_name}
                  </span>
                </Link>

                <div className="text-center">
                  {heroGame.home_score != null &&
                  heroGame.away_score != null ? (
                    <FlipScore
                      homeScore={heroGame.home_score}
                      awayScore={heroGame.away_score}
                      className="text-warning"
                    />
                  ) : (
                    <p className="text-2xl font-bold tabular-nums text-sidebar-foreground/70">
                      {new Date(heroGame.scheduled_at).toLocaleTimeString(
                        "mn-MN",
                        { hour: "2-digit", minute: "2-digit" },
                      )}
                    </p>
                  )}
                  {liveGame && (
                    <p className="mt-2 flex items-center justify-center gap-2 text-sm font-semibold text-warning">
                      <Radio
                        className="size-4 animate-pulse"
                        aria-hidden="true"
                      />
                      Шууд
                    </p>
                  )}
                </div>

                <Link
                  href={`/teams/${heroGame.away_team_slug}`}
                  className="flex flex-col items-center gap-3 text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring rounded-xl"
                >
                  <TeamLogo
                    logoUrl={heroGame.away_team_logo_url}
                    shortCode={heroGame.away_team_short_code}
                    primaryColor={heroGame.away_team_primary_color}
                    size="xl"
                  />
                  <span className="text-sm font-semibold sm:text-base">
                    {heroGame.away_team_name}
                  </span>
                </Link>
              </div>

              {/* Quick actions */}
              <div className="flex flex-col gap-3 lg:col-span-4 lg:items-end">
                <Button
                  asChild
                  variant="ghost"
                  className="text-sidebar-foreground/70 hover:text-sidebar-foreground"
                >
                  <Link href="/games">
                    Бүх тоглолт
                    <ChevronRight data-icon="inline-end" aria-hidden="true" />
                  </Link>
                </Button>
                {heroGame.venue_name && (
                  <p className="text-xs text-sidebar-foreground/50">
                    {heroGame.venue_name}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <PublicEmptyState
              icon={CalendarDays}
              title="Тоглолтын мэдээлэл хараахан алга"
              description="Лигийн баталгаажсан хуваарь нийтлэгдэхэд энд хамгийн эхэнд харагдана."
              actionHref="/players"
              actionLabel="Тоглогчидтой танилцах"
              className="min-h-48 border-sidebar-border bg-sidebar/50"
            />
          )}
        </div>
      </section>

      {/* ── Countdown to next game ── */}
      {!liveGame && heroGame && heroGame.status === "scheduled" && (
        <CountdownTimer
          targetIso={heroGame.scheduled_at}
          label="Дараагийн тоглолт хүртэл"
          className="border-b bg-[var(--surface-1)]"
        />
      )}

      {/* ── Tonight's games ticker ── */}
      {tonightGames.length > 0 && (
        <section
          aria-labelledby="tonight-heading"
          className="border-b bg-[var(--surface-1)]"
        >
          <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <h2
                id="tonight-heading"
                className="text-sm font-semibold text-muted-foreground"
              >
                Өнөө орой · {tonightGames.length} тоглолт
              </h2>
              <Link
                href="/games"
                className="text-xs text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md px-1 py-0.5"
              >
                Бүгд →
              </Link>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none">
              {tonightGames.map((game) => (
                <Link
                  key={game.id}
                  href={`/games/${game.id}`}
                  className="flex shrink-0 items-center gap-3 rounded-xl border bg-card px-4 py-3 transition-[box-shadow,transform] hover:shadow-md active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 min-w-64"
                >
                  <TeamLogo
                    logoUrl={game.home_team_logo_url}
                    shortCode={game.home_team_short_code}
                    primaryColor={game.home_team_primary_color}
                    size="sm"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">
                      {game.home_team_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(game.scheduled_at).toLocaleTimeString("mn-MN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">vs</span>
                  <div className="min-w-0 flex-1 text-right">
                    <p className="truncate text-sm font-semibold">
                      {game.away_team_name}
                    </p>
                  </div>
                  <TeamLogo
                    logoUrl={game.away_team_logo_url}
                    shortCode={game.away_team_short_code}
                    primaryColor={game.away_team_primary_color}
                    size="sm"
                  />
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Main content: two-column editorial ── */}
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 py-10 sm:px-6 lg:px-8">
        {/* Search bar — prominent */}
        <search className="mx-auto w-full max-w-xl">
          <form action="/players" className="relative">
            <Search
              className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              name="q"
              type="search"
              aria-label="Тоглогч эсвэл баг хайх"
              placeholder="Тоглогч хайх..."
              className="pl-11 py-6 text-base"
            />
          </form>
        </search>

        {/* Two-column: Latest story + Featured player */}
        <section className="grid gap-6 lg:grid-cols-12">
          {/* Latest result */}
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
                  {/* Score + teams */}
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
                        <p className="text-sm text-muted-foreground">
                          Эзэн баг
                        </p>
                      </div>
                      <span className="stat-number text-3xl">
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
                        <p className="text-sm text-muted-foreground">
                          Зочин баг
                        </p>
                      </div>
                      <span className="stat-number text-3xl">
                        {latestFinal.away_score ?? 0}
                      </span>
                    </div>
                  </div>

                  {/* Top performer */}
                  <div className="rounded-xl bg-[var(--surface-3)] p-5">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Тоглолтын онцлох тоглогч
                    </p>
                    {topPerformer ? (
                      <div className="mt-4 flex items-center gap-3">
                        <PlayerAvatar
                          name={topPerformer.player_name}
                          size="lg"
                        />
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

          {/* Featured player spotlight — hero card */}
          <Card
            variant="hero"
            className="overflow-hidden text-sidebar-foreground shadow-none lg:col-span-5"
          >
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
                <div className="flex flex-col gap-6">
                  <div className="flex items-center gap-5">
                    <PlayerAvatar
                      photoUrl={featuredPlayer.photo_url}
                      name={featuredPlayer.player_name}
                      primaryColor={featuredPlayer.team_primary_color}
                      size="2xl"
                      className="ring-4 ring-sidebar-border"
                    />
                    <div className="min-w-0">
                      <p className="text-sm text-sidebar-foreground/60">
                        {featuredPlayer.team_name}
                      </p>
                      <Link
                        href={`/players/${featuredPlayer.player_id}`}
                        className="mt-1 block font-display text-3xl leading-tight tracking-tight hover:text-warning focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
                      >
                        {featuredPlayer.player_name}
                      </Link>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
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
              ) : (
                <p className="text-sm leading-relaxed text-sidebar-foreground/70">
                  Баталгаажсан тоглогчийн статистик нийтлэгдэхэд улирлын онцлох
                  тамирчин энд харагдана.
                </p>
              )}
            </CardContent>
          </Card>
        </section>

        {/* ── Leaders + Standings ── */}
        <section className="court-divider grid gap-6 rounded-xl bg-[var(--surface-1)] p-6 sm:p-8 lg:grid-cols-12">
          {/* Leaders top 3 — podium style */}
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
                        className={cn(
                          "flex items-center gap-3 rounded-lg p-3 transition-[background-color,transform] hover:bg-accent active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none",
                          index === 0 &&
                            "bg-[var(--surface-3)] ring-1 ring-[var(--brand-sports)]/20",
                        )}
                      >
                        <span
                          className={cn(
                            "w-5 text-sm font-black tabular-nums",
                            index === 0
                              ? "text-[var(--brand-sports)]"
                              : "text-muted-foreground",
                          )}
                        >
                          {index + 1}
                        </span>
                        <PlayerAvatar
                          photoUrl={leader.player_photo_url}
                          name={leader.player_name}
                          primaryColor={leader.team_primary_color}
                          size={index === 0 ? "md" : "sm"}
                        />
                        <div className="min-w-0 flex-1">
                          <p
                            className={cn(
                              "truncate font-semibold",
                              index === 0 && "text-base",
                            )}
                          >
                            {leader.player_name}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {leader.team_name}
                          </p>
                        </div>
                        <span
                          className={cn(
                            "stat-number",
                            index === 0 ? "text-2xl" : "text-xl",
                          )}
                        >
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

          {/* Standings top 5 — compact table with team colors */}
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
                        className={cn(
                          "grid grid-cols-12 items-center gap-3 rounded-lg p-3 transition-[background-color,transform] hover:bg-accent active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none",
                          index === 0 &&
                            "bg-[var(--surface-3)] ring-1 ring-[var(--brand-sports)]/20",
                        )}
                      >
                        <span
                          className={cn(
                            "col-span-1 text-sm font-black tabular-nums",
                            index === 0
                              ? "text-[var(--brand-sports)]"
                              : "text-muted-foreground",
                          )}
                        >
                          {index + 1}
                        </span>
                        <span className="col-span-7 flex min-w-0 items-center gap-3">
                          <TeamLogo
                            logoUrl={row.team_logo_url}
                            shortCode={row.team_short_code}
                            primaryColor={row.team_primary_color}
                          />
                          <span
                            className={cn(
                              "truncate font-semibold",
                              index === 0 && "text-base",
                            )}
                          >
                            {row.team_name}
                          </span>
                        </span>
                        <span className="col-span-2 text-center text-sm tabular-nums text-muted-foreground">
                          {row.w}-{row.l}
                        </span>
                        <span
                          className={cn(
                            "col-span-2 text-right font-black tabular-nums",
                            index === 0 && "text-[var(--brand-sports)]",
                          )}
                        >
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
        {/* ── Multi-category leaderboard strip ── */}
        {leaders.length > 0 && (
          <section className="grid gap-6 rounded-xl bg-[var(--surface-1)] p-6 sm:p-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Ангилал бүрийн шилдэг
                </p>
                <h2 className="mt-1 text-xl font-bold tracking-tight">
                  Шилдгүүд ангилал бүрээр
                </h2>
              </div>
              <Button asChild variant="ghost" size="sm">
                <Link href="/leaders" className="gap-1">
                  Бүгд <ChevronRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {(
                [
                  { key: "rebounds_per_game" as const, label: "Сэргэлт" },
                  { key: "assists_per_game" as const, label: "Олголт" },
                  { key: "stl" as const, label: "Булаалт" },
                  { key: "blk" as const, label: "Блок" },
                ] satisfies {
                  key: keyof (typeof leaders)[number];
                  label: string;
                }[]
              ).map(({ key, label }) => {
                const top3 = [...leaders]
                  .sort((a, b) => (b[key] ?? 0) - (a[key] ?? 0))
                  .slice(0, 3);
                const hasData = top3.some((p) => p[key] != null && p[key] > 0);

                return (
                  <Card key={key} className="shadow-none">
                    <CardHeader>
                      <CardTitle className="text-base">{label}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {hasData ? (
                        <ol className="flex flex-col gap-1">
                          {top3.map((player, index) => {
                            const statValue = player[key];
                            return (
                              <li key={`${player.player_id}-${key}`}>
                                <Link
                                  href={`/players/${player.player_id}`}
                                  className={cn(
                                    "flex items-center gap-3 rounded-lg p-3 transition-[background-color,transform] hover:bg-accent active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none",
                                    index === 0 &&
                                      "bg-[var(--surface-3)] ring-1 ring-[var(--brand-sports)]/20",
                                  )}
                                >
                                  <span
                                    className={cn(
                                      "w-5 text-sm font-black tabular-nums",
                                      index === 0
                                        ? "text-[var(--brand-sports)]"
                                        : "text-muted-foreground",
                                    )}
                                  >
                                    {index + 1}
                                  </span>
                                  <PlayerAvatar
                                    photoUrl={player.player_photo_url}
                                    name={player.player_name}
                                    primaryColor={player.team_primary_color}
                                    size="sm"
                                  />
                                  <div className="min-w-0 flex-1">
                                    <p className="truncate font-semibold">
                                      {player.player_name}
                                    </p>
                                    <p className="truncate text-xs text-muted-foreground">
                                      {player.team_name}
                                    </p>
                                  </div>
                                  <span className="stat-number text-xl tabular-nums">
                                    {formatAverage(statValue)}
                                  </span>
                                </Link>
                              </li>
                            );
                          })}
                        </ol>
                      ) : (
                        <p className="py-4 text-center text-sm text-muted-foreground">
                          Мэдээлэл алга
                        </p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>
        )}

      </div>
        <Sponsors />
    </main>
  );
}

interface StatementStatProps {
  label: string;
  value: string;
}

function StatementStat({ label, value }: StatementStatProps) {
  return (
    <div className="rounded-lg bg-sidebar-accent p-3">
      <p className="stat-number text-2xl text-warning">{value}</p>
      <p className="mt-1 text-xs font-semibold tracking-wider text-sidebar-foreground/60 uppercase">
        {label}
      </p>
    </div>
  );
}
