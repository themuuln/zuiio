import { Download, Flag, MapPin, Radio, Trophy } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ShareStatCardButton } from "@/app/components/share-stat-card-button";
import { ReportErrorDialog } from "@/components/report-error-dialog";
import { TeamLogo } from "@/components/team-logo";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui";
import { ViewBeacon } from "@/components/view-beacon";
import { cn } from "@/lib/utils";
import { GameStatusBadge } from "../../components/game-status-badge";
import { PublicEmptyState } from "../../components/public-empty-state";
import { ScoreBoard } from "../../components/score-board";
import {
  type BoxScoreRow,
  type GameSummaryRow,
  type PeriodScoreRow,
  type ScoringCheckpointRow,
  type TeamGameStatsRow,
  formatGameTime,
  formatMinutes,
  getBoxScore,
  getGameById,
  getGameDetailStats,
  getLiveGameData,
  getPlayByPlay,
} from "../../lib/data";
import { LiveGameCenter } from "./components/live-game-center";
import { LiveStream } from "./components/live-stream";
import { RecapHeader } from "./components/recap-header";
import { ScoreWorm } from "./components/score-worm";
import { PlayerHighlights, TopPerformers } from "./components/top-performers";

interface GamePageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: GamePageProps): Promise<Metadata> {
  const { id } = await params;
  const game = await getGameById(id);
  if (!game) return { title: "Тоглолт олдсонгүй — Оноо" };

  return {
    title: `${game.home_team_name} vs ${game.away_team_name} — Оноо`,
    description: `${game.home_team_name} vs ${game.away_team_name} тоглолтын үр дүн, шилдэг тоглогчид ба бүрэн статистик.`,
    alternates: { canonical: `https://onoo.mn/games/${id}` },
  };
}



export default async function GameDetailPage({ params }: GamePageProps) {
  const { id } = await params;
  const game = await getGameById(id);
  if (!game) notFound();

  const isFinal =
    game.status === "final_pending_review" ||
    game.status === "league_verified" ||
    game.status === "official";
  const isLive = game.status === "live_provisional";
  const boxScore = isFinal ? await getBoxScore(game.id) : [];
  const liveGameData = isLive ? await getLiveGameData(game.id) : null;
  const gameDetailStats = isFinal ? await getGameDetailStats(game.id) : null;
  const teamStats = gameDetailStats?.teamStats ?? [];
  const homeTeamStats = teamStats.find(
    (row) => row.team_season_id === game.home_team_season_id,
  );
  const awayTeamStats = teamStats.find(
    (row) => row.team_season_id === game.away_team_season_id,
  );
  const periodScores = gameDetailStats?.periodScores ?? [];
  const scoringCheckpoints = gameDetailStats?.scoringCheckpoints ?? [];
  const summary = gameDetailStats?.summary ?? null;

  // Play-by-play for lead change flow
  const playByPlay = isFinal ? await getPlayByPlay(game.id) : [];
  const scoringEvents = playByPlay.filter((e) =>
    ["shot_2pt_made", "shot_3pt_made", "ft_made"].includes(e.event_type),
  );
  const pointsMap: Record<string, number> = {
    shot_2pt_made: 2,
    shot_3pt_made: 3,
    ft_made: 1,
  };
  let homeRunning = 0;
  let awayRunning = 0;
  let lastLeader: "home" | "away" | "tied" = "tied";
  let leadChanges = 0;
  for (const ev of scoringEvents) {
    const pts = pointsMap[ev.event_type] ?? 0;
    if (ev.team_season_id === game.home_team_season_id) {
      homeRunning += pts;
    } else {
      awayRunning += pts;
    }
    const leader =
      homeRunning > awayRunning
        ? "home"
        : awayRunning > homeRunning
          ? "away"
          : "tied";
    if (leader !== lastLeader && lastLeader !== "tied" && leader !== "tied") {
      leadChanges++;
    }
    lastLeader = leader;
  }

  const homeWon = (game.home_score ?? 0) > (game.away_score ?? 0);

  const gameStatusUrl =
    game.status === "scheduled"
      ? "https://schema.org/EventScheduled"
      : game.status === "live_provisional"
        ? "https://schema.org/EventInProgress"
        : game.status === "cancelled"
          ? "https://schema.org/EventCancelled"
          : game.status === "postponed"
            ? "https://schema.org/EventPostponed"
            : "https://schema.org/EventEnded";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SportsEvent",
    name: `${game.home_team_name} vs ${game.away_team_name}`,
    startDate: game.scheduled_at,
    eventStatus: gameStatusUrl,
    sport: "Basketball",
    location: game.venue_name
      ? { "@type": "Place", name: game.venue_name }
      : undefined,
    organizer: {
      "@type": "SportsOrganization",
      name: game.league_name,
    },
    competitor: [
      {
        "@type": "SportsTeam",
        name: game.home_team_name,
      },
      {
        "@type": "SportsTeam",
        name: game.away_team_name,
      },
    ],
  };

  return (
    <>
      <ViewBeacon entityType="game" entityId={game.id} />
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD structured data for SEO
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
        <section
          className="game-scoreboard-hero overflow-hidden rounded-3xl bg-sidebar p-6 text-sidebar-foreground sm:p-8 lg:p-10"
          aria-label={`${game.home_team_name} vs ${game.away_team_name} тоглолтын оноо`}
          style={{
            borderTop: `3px solid ${homeWon ? (game.home_team_primary_color ?? "") : (game.away_team_primary_color ?? "")}`,
          }}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <GameStatusBadge game={game} />
              <Badge
                variant="outline"
                className="border-sidebar-border text-sidebar-foreground"
              >
                {game.competition_name}
              </Badge>
            </div>
            <div className="flex items-center gap-3">
              <p className="text-sm text-sidebar-foreground/60">
                {game.season_name} · {game.league_name}
              </p>
              <ShareStatCardButton
                endpoint={`/api/cards/game/${id}`}
                filename={`${game.home_team_name}-vs-${game.away_team_name}.png`}
                label="Карт"
                className="h-7 px-2 text-xs"
              />
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 items-center gap-4 sm:grid-cols-3 sm:gap-8">
            <Link
              href={`/teams/${game.home_team_slug}`}
              className="flex min-w-0 flex-col items-center gap-3 rounded-xl text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring sm:flex-row sm:text-left"
            >
              <TeamLogo
                logoUrl={game.home_team_logo_url}
                shortCode={game.home_team_short_code}
                primaryColor={game.home_team_primary_color}
                size="xl"
              />
              <span className="min-w-0">
                <span className="block truncate text-sm text-sidebar-foreground/60">
                  Эзэн баг
                </span>
                <span className="mt-1 block truncate text-lg font-bold sm:text-2xl">
                  {game.home_team_name}
                </span>
              </span>
            </Link>

            <div className="text-center">
              {game.status === "scheduled" ? (
                <p className="text-3xl font-black tabular-nums sm:text-5xl">
                  {formatGameTime(game.scheduled_at)}
                </p>
              ) : (
                <ScoreBoard
                  homeScore={game.home_score ?? 0}
                  awayScore={game.away_score ?? 0}
                  className="justify-center"
                />
              )}
              {isLive && game.current_period > 0 ? (
                <p className="mt-3 flex items-center justify-center gap-2 text-sm font-semibold text-warning">
                  <Radio className="size-4" aria-hidden="true" />
                  {game.current_period}-р үе
                </p>
              ) : null}
            </div>

            <Link
              href={`/teams/${game.away_team_slug}`}
              className="flex min-w-0 flex-col items-center gap-3 rounded-xl text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring sm:flex-row-reverse sm:text-right"
            >
              <TeamLogo
                logoUrl={game.away_team_logo_url}
                shortCode={game.away_team_short_code}
                primaryColor={game.away_team_primary_color}
                size="xl"
              />
              <span className="min-w-0">
                <span className="block truncate text-sm text-sidebar-foreground/60">
                  Зочин баг
                </span>
                <span className="mt-1 block truncate text-lg font-bold sm:text-2xl">
                  {game.away_team_name}
                </span>
              </span>
            </Link>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-sm text-sidebar-foreground/60">
            {game.venue_name ? (
              <span className="flex items-center gap-2">
                <MapPin className="size-4" aria-hidden="true" />
                {game.venue_name}
              </span>
            ) : null}
            {game.revision_number ? (
              <span>Баталгаажсан хувилбар #{game.revision_number}</span>
            ) : null}
          </div>

          {game.stream_url ? (
            <LiveStream streamUrl={game.stream_url} isLive={isLive} />
          ) : null}
        </section>

        {isFinal ? (
          <section className="grid gap-5 lg:grid-cols-12">
            <RecapHeader
              game={game}
              boxScore={boxScore}
              leadChanges={leadChanges}
            />
            <TopPerformers
              rows={boxScore}
              homeTeamSeasonId={game.home_team_season_id}
              homeTeamPrimaryColor={game.home_team_primary_color}
              awayTeamPrimaryColor={game.away_team_primary_color}
            />
          </section>
        ) : null}

        <PlayerHighlights
          rows={boxScore}
          homeTeamSeasonId={game.home_team_season_id}
          awayTeamSeasonId={game.away_team_season_id}
          homeWon={homeWon}
          homeScore={game.home_score ?? 0}
          awayScore={game.away_score ?? 0}
          homeTeamShortCode={game.home_team_short_code}
          awayTeamShortCode={game.away_team_short_code}
          homeTeamPrimaryColor={game.home_team_primary_color}
          awayTeamPrimaryColor={game.away_team_primary_color}
        />
        {boxScore.length > 0 ? (
          <section
            aria-labelledby="team-comparison-heading"
            className="flex flex-col gap-4"
          >
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Тоон зураг
              </p>
              <h2
                id="team-comparison-heading"
                className="mt-1 text-2xl font-bold tracking-tight"
              >
                Багийн харьцуулалт
              </h2>
            </div>
            <Card className="shadow-none">
              <CardContent className="flex flex-col gap-5 pt-6">
                <TeamComparison
                  label="Оноо"
                  home={homeTeamStats?.team_pts ?? 0}
                  away={awayTeamStats?.team_pts ?? 0}
                />
                <TeamComparison
                  label="Самбар"
                  home={(homeTeamStats?.team_oreb ?? 0) + (homeTeamStats?.team_dreb ?? 0)}
                  away={(awayTeamStats?.team_oreb ?? 0) + (awayTeamStats?.team_dreb ?? 0)}
                />
                <TeamComparison
                  label="Дамжуулалт"
                  home={homeTeamStats?.team_ast ?? 0}
                  away={awayTeamStats?.team_ast ?? 0}
                />
                <TeamComparison
                  label="Бөмбөг таслалт"
                  home={homeTeamStats?.team_stl ?? 0}
                  away={awayTeamStats?.team_stl ?? 0}
                />
                <TeamComparison
                  label="Блок"
                  home={homeTeamStats?.team_blk ?? 0}
                  away={awayTeamStats?.team_blk ?? 0}
                />
                <TeamComparison
                  label="Алдалт"
                  home={homeTeamStats?.team_tov ?? 0}
                  away={awayTeamStats?.team_tov ?? 0}
                  lowerWins
                />
                <TeamComparison
                  label="Хувь"
                  home={homeTeamStats ? Math.round((homeTeamStats.team_fgm / Math.max(homeTeamStats.team_fga, 1)) * 100) : 0}
                  away={awayTeamStats ? Math.round((awayTeamStats.team_fgm / Math.max(awayTeamStats.team_fga, 1)) * 100) : 0}
                  suffix="%"
                />
                <TeamComparison
                  label="2 онооны %"
                  home={homeTeamStats ? Math.round(((homeTeamStats.team_fgm - homeTeamStats.team_tpm) / Math.max(homeTeamStats.team_fga - homeTeamStats.team_tpa, 1)) * 100) : 0}
                  away={awayTeamStats ? Math.round(((awayTeamStats.team_fgm - awayTeamStats.team_tpm) / Math.max(awayTeamStats.team_fga - awayTeamStats.team_tpa, 1)) * 100) : 0}
                  suffix="%"
                />
                <TeamComparison
                  label="3 онооны %"
                  home={homeTeamStats ? Math.round((homeTeamStats.team_tpm / Math.max(homeTeamStats.team_tpa, 1)) * 100) : 0}
                  away={awayTeamStats ? Math.round((awayTeamStats.team_tpm / Math.max(awayTeamStats.team_tpa, 1)) * 100) : 0}
                  suffix="%"
                />
                <TeamComparison
                  label="Чөлөөт шидэлтийн %"
                  home={homeTeamStats ? Math.round((homeTeamStats.team_ftm / Math.max(homeTeamStats.team_fta, 1)) * 100) : 0}
                  away={awayTeamStats ? Math.round((awayTeamStats.team_ftm / Math.max(awayTeamStats.team_fta, 1)) * 100) : 0}
                  suffix="%"
                />
                <TeamComparison
                  label="Довтолгооны самбар"
                  home={homeTeamStats?.team_oreb ?? 0}
                  away={awayTeamStats?.team_oreb ?? 0}
                />
                <TeamComparison
                  label="Хамгаалалтын самбар"
                  home={homeTeamStats?.team_dreb ?? 0}
                  away={awayTeamStats?.team_dreb ?? 0}
                />
                <TeamComparison
                  label="Хувийн алдаа"
                  home={homeTeamStats?.team_pf ?? 0}
                  away={awayTeamStats?.team_pf ?? 0}
                  lowerWins
                />
              </CardContent>
            </Card>
          </section>
        ) : null}

        {isFinal && summary ? (
          <section aria-labelledby="game-flow-heading">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Тоглоомын анализ
              </p>
              <h2 id="game-flow-heading" className="mt-1 text-2xl font-bold tracking-tight">
                Тоглоомын урсгал
              </h2>
            </div>
            <Card className="mt-4 shadow-none">
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3 lg:grid-cols-4">
                  {homeTeamStats?.team_points_from_turnovers != null && (
                    <div className="space-y-1 rounded-lg border p-3">
                      <p className="text-xs text-muted-foreground">Бөмбөг алдалтаас авсан оноо</p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-lg font-bold text-primary">{homeTeamStats.team_points_from_turnovers}</span>
                        <span className="text-muted-foreground">–</span>
                        <span className="text-lg font-bold text-warning">{awayTeamStats?.team_points_from_turnovers ?? 0}</span>
                      </div>
                    </div>
                  )}
                  {homeTeamStats?.team_points_in_paint != null && (
                    <div className="space-y-1 rounded-lg border p-3">
                      <p className="text-xs text-muted-foreground">Онооны талбайн оноо</p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-lg font-bold text-primary">{homeTeamStats.team_points_in_paint}</span>
                        <span className="text-muted-foreground">–</span>
                        <span className="text-lg font-bold text-warning">{awayTeamStats?.team_points_in_paint ?? 0}</span>
                      </div>
                    </div>
                  )}
                  {homeTeamStats?.team_second_chance_points != null && (
                    <div className="space-y-1 rounded-lg border p-3">
                      <p className="text-xs text-muted-foreground">Хоёр дахь боломжийн оноо</p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-lg font-bold text-primary">{homeTeamStats.team_second_chance_points}</span>
                        <span className="text-muted-foreground">–</span>
                        <span className="text-lg font-bold text-warning">{awayTeamStats?.team_second_chance_points ?? 0}</span>
                      </div>
                    </div>
                  )}
                  {homeTeamStats?.team_fast_break_points != null && (
                    <div className="space-y-1 rounded-lg border p-3">
                      <p className="text-xs text-muted-foreground">Хурдан довтолгооны оноо</p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-lg font-bold text-primary">{homeTeamStats.team_fast_break_points}</span>
                        <span className="text-muted-foreground">–</span>
                        <span className="text-lg font-bold text-warning">{awayTeamStats?.team_fast_break_points ?? 0}</span>
                      </div>
                    </div>
                  )}
                  {homeTeamStats?.team_bench_points != null && (
                    <div className="space-y-1 rounded-lg border p-3">
                      <p className="text-xs text-muted-foreground">Сэлгээний тоглогчдын оноо</p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-lg font-bold text-primary">{homeTeamStats.team_bench_points}</span>
                        <span className="text-muted-foreground">–</span>
                        <span className="text-lg font-bold text-warning">{awayTeamStats?.team_bench_points ?? 0}</span>
                      </div>
                    </div>
                  )}
                  {homeTeamStats?.team_biggest_lead != null && (
                    <div className="space-y-1 rounded-lg border p-3">
                      <p className="text-xs text-muted-foreground">Хамгийн их харьцуулалт</p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-lg font-bold text-primary">{homeTeamStats.team_biggest_lead}</span>
                        <span className="text-muted-foreground">–</span>
                        <span className="text-lg font-bold text-warning">{awayTeamStats?.team_biggest_lead ?? 0}</span>
                      </div>
                    </div>
                  )}
                  {homeTeamStats?.team_biggest_scoring_run_for != null && (
                    <div className="space-y-1 rounded-lg border p-3">
                      <p className="text-xs text-muted-foreground">Хамгийн урт цуврал</p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-lg font-bold text-primary">{homeTeamStats.team_biggest_scoring_run_for}</span>
                        <span className="text-muted-foreground">–</span>
                        <span className="text-lg font-bold text-warning">{awayTeamStats?.team_biggest_scoring_run_for ?? 0}</span>
                      </div>
                    </div>
                  )}
                  {homeTeamStats?.team_time_leading_seconds != null && (
                    <div className="space-y-1 rounded-lg border p-3">
                      <p className="text-xs text-muted-foreground">Тэргүүлсэн хугацаа</p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-lg font-bold text-primary">{formatMinutes(homeTeamStats.team_time_leading_seconds)}</span>
                        <span className="text-muted-foreground">–</span>
                        <span className="text-lg font-bold text-warning">{formatMinutes(awayTeamStats?.team_time_leading_seconds ?? 0)}</span>
                      </div>
                    </div>
                  )}
                  {summary.lead_changes != null && (
                    <div className="col-span-2 space-y-1 rounded-lg border p-3 text-center sm:col-span-3 lg:col-span-2">
                      <p className="text-xs text-muted-foreground">Тэргүүлсэн солигдол / Тэнцэл</p>
                      <div className="flex items-center justify-center gap-4">
                        <span className="text-lg font-bold">{summary.lead_changes} удаа тэргүүлэлт солигдсон</span>
                        <span className="text-muted-foreground">·</span>
                        <span className="text-lg font-bold">{summary.times_tied} удаа тэнцсэн</span>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </section>
        ) : null}

        {isFinal && periodScores.length > 0 ? (
          <section aria-labelledby="periods-heading">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Үеийн дүн
              </p>
              <h2 id="periods-heading" className="mt-1 text-2xl font-bold tracking-tight">
                Үеүүд
              </h2>
            </div>
            <Card className="mt-4 shadow-none">
              <CardContent className="overflow-x-auto p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Үе</TableHead>
                      <TableHead className="text-right">{game.home_team_name}</TableHead>
                      <TableHead className="text-right">{game.away_team_name}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {periodScores.map((ps) => (
                      <TableRow key={ps.period}>
                        <TableCell className="font-medium">
                          {ps.period <= 4 ? `${ps.period}-р үе` : `Нэмэлт цаг`}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{ps.home_points}</TableCell>
                        <TableCell className="text-right tabular-nums">{ps.away_points}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </section>
        ) : null}

        {isFinal && scoringCheckpoints.length > 0 ? (
          <section aria-labelledby="checkpoints-heading">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Тоглоомын үе шат
              </p>
              <h2 id="checkpoints-heading" className="mt-1 text-2xl font-bold tracking-tight">
                5 минутын үзүүлэлт
              </h2>
            </div>
            <Card className="mt-4 shadow-none">
              <CardContent className="overflow-x-auto p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Цаг</TableHead>
                      <TableHead className="text-right">{game.home_team_name}</TableHead>
                      <TableHead className="text-right">{game.away_team_name}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {scoringCheckpoints.map((cp) => (
                      <TableRow key={cp.elapsed_seconds}>
                        <TableCell className="font-medium">
                          {cp.elapsed_seconds >= 3600
                            ? `${Math.floor(cp.elapsed_seconds / 60)} мин`
                            : `${cp.elapsed_seconds / 60} мин`}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{cp.home_score}</TableCell>
                        <TableCell className="text-right tabular-nums">{cp.away_score}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </section>
        ) : null}
        {isFinal && playByPlay.length > 0 ? (
          <ScoreWorm
            events={playByPlay}
            homeTeamSeasonId={game.home_team_season_id}
            homeTeamShortCode={game.home_team_short_code}
            awayTeamShortCode={game.away_team_short_code}
            homeTeamColor={game.home_team_primary_color}
            awayTeamColor={game.away_team_primary_color}
            homeScore={game.home_score ?? 0}
            awayScore={game.away_score ?? 0}
            leadChanges={leadChanges}
          />
        ) : null}

        {isFinal ? (
          <BoxScoreSection rows={boxScore} />
        ) : isLive ? (
          <LiveGameCenter
            gameId={game.id}
            homeTeamSeasonId={game.home_team_season_id}
            awayTeamSeasonId={game.away_team_season_id}
            initialEvents={liveGameData?.events}
            rosters={liveGameData?.rosters}
            sportConfig={
              liveGameData?.sportConfig ?? {
                periods: 4,
                period_minutes: 10,
                overtime_minutes: 5,
                fouls_to_bonus: 5,
                personal_foul_limit: 5,
                players_on_court: 5,
              }
            }
            playerNameMap={liveGameData?.playerNameMap}
          />
        ) : (
          <PublicEmptyState
            icon={Trophy}
            title="Тоглолт эхлээгүй байна"
            description="Тоглолт эхэлж, үр дүн баталгаажмагц бүрэн статистик энд гарна."
          />
        )}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button variant="outline">
            <Link href="/games">← Тоглолтууд руу буцах</Link>
          </Button>
          <div className="flex flex-wrap items-center gap-2">
            <ReportErrorDialog gameId={game.id} />
            {isFinal ? (
              <>
                <Button variant="outline">
                  <a
                    href={`/api/export?gameId=${game.id}&type=boxscore`}
                    download
                  >
                    <Download data-icon="inline-start" aria-hidden="true" />
                    CSV
                  </a>
                </Button>
                <Button variant="outline">
                  <a
                    href={`/api/export/pdf?gameId=${game.id}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Download data-icon="inline-start" aria-hidden="true" />
                    PDF
                  </a>
                </Button>
              </>
            ) : null}
          </div>
        </div>
      </main>
    </>
  );
}

interface TeamComparisonProps {
  label: string;
  home: number;
  away: number;
  lowerWins?: boolean;
  suffix?: string;
}

function TeamComparison({
  label,
  home,
  away,
  lowerWins = false,
  suffix,
}: TeamComparisonProps) {
  const homeWins = lowerWins ? home < away : home > away;
  const awayWins = lowerWins ? away < home : away > home;
  const maxValue = Math.max(home, away, 1);
  const homeWidth = (home / maxValue) * 100;
  const awayWidth = (away / maxValue) * 100;

  return (
    <div className="grid grid-cols-6 items-center gap-2 sm:gap-3 sm:grid-cols-12">
      <span
        className={cn(
          "col-span-2 text-right text-lg tabular-nums",
          homeWins && "font-black",
        )}
      >
        {home}{suffix}
      </span>
      <svg
        className="col-span-3 h-3 w-full text-primary"
        viewBox="0 0 100 10"
        aria-hidden="true"
      >
        <rect
          x={100 - homeWidth}
          y="1"
          width={homeWidth}
          height="8"
          rx="4"
          fill="currentColor"
        />
      </svg>
      <span className="col-span-2 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <svg
        className="col-span-3 h-3 w-full text-warning"
        viewBox="0 0 100 10"
        aria-hidden="true"
      >
        <rect
          x="0"
          y="1"
          width={awayWidth}
          height="8"
          rx="4"
          fill="currentColor"
        />
      </svg>
      <span
        className={cn(
          "col-span-2 text-lg tabular-nums",
          awayWins && "font-black",
        )}
      >
        {away}{suffix}
      </span>
    </div>
  );
}

interface BoxScoreSectionProps {
  rows: BoxScoreRow[];
}

function pctOrDash(made: number, att: number): string {
  if (att <= 0) return "—";
  return `${Math.round((made / att) * 100)}%`;
}

function statOrDash(val: number | null | undefined): string | number {
  return val != null ? val : "—";
}

function BoxScoreSection({ rows }: BoxScoreSectionProps) {
  if (rows.length === 0) {
    return (
      <PublicEmptyState
        icon={Flag}
        title="Box score хараахан нийтлэгдээгүй"
        description="Лигийн хяналт дууссаны дараа тоглогч бүрийн мөр энд гарна."
      />
    );
  }

  const teams = Array.from(new Set(rows.map((row) => row.team_name)));
  return (
    <section aria-labelledby="boxscore-heading" className="flex flex-col gap-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Бүрэн бүртгэл
        </p>
        <h2
          id="boxscore-heading"
          className="mt-1 text-2xl font-bold tracking-tight"
        >
          Box score
        </h2>
      </div>
      {teams.map((teamName) => {
        const teamRows = rows
          .filter((row) => row.team_name === teamName)
          .sort((a, b) => {
            if (a.dnp_reason && !b.dnp_reason) return 1;
            if (!a.dnp_reason && b.dnp_reason) return -1;
            return (a.jersey_number ?? 999) - (b.jersey_number ?? 999);
          });

        return (
          <Card key={teamName} className="shadow-none">
            <CardHeader>
              <CardTitle>{teamName}</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto p-0">
              <Table aria-label={`${teamName} box score`}>
                <TableCaption className="sr-only">
                  {teamName} тоглогчдын бүрэн статистик
                </TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead aria-label="Гарааны" className="w-0" />
                    <TableHead>#</TableHead>
                    <TableHead>Тоглогч</TableHead>
                    <TableHead className="text-right">МИН</TableHead>
                    <TableHead className="text-right">FG</TableHead>
                    <TableHead className="text-right">2P</TableHead>
                    <TableHead className="text-right">3P</TableHead>
                    <TableHead className="text-right">FT</TableHead>
                    <TableHead className="text-right">ДСАМ</TableHead>
                    <TableHead className="text-right">ХСАМ</TableHead>
                    <TableHead className="text-right">САМБ</TableHead>
                    <TableHead className="text-right">ДАМЖ</TableHead>
                    <TableHead className="text-right">ТАС</TableHead>
                    <TableHead className="text-right">ХАА</TableHead>
                    <TableHead className="text-right">АЛД</TableHead>
                    <TableHead className="text-right">PF</TableHead>
                    <TableHead className="text-right">C</TableHead>
                    <TableHead className="text-right">D</TableHead>
                    <TableHead className="text-right">+/−</TableHead>
                    <TableHead className="text-right">ОНОО</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teamRows.map((row) => {
                    const isDnp = row.dnp_reason != null;
                    return (
                      <TableRow
                        key={`${row.team_season_id}-${row.player_id}`}
                        className={cn(
                          "hover:bg-accent/50",
                          isDnp && "text-muted-foreground",
                        )}
                      >
                        <TableCell className="w-0 pr-0">
                          {row.is_starter ? (
                            <Badge
                              variant="outline"
                              className="h-5 px-1.5 text-[10px] font-semibold leading-none"
                              aria-label="Гарааны"
                            >
                              Г
                            </Badge>
                          ) : null}
                        </TableCell>
                        <TableCell className="tabular-nums">
                          {row.jersey_number ?? "—"}
                        </TableCell>
                        <TableCell>
                          {isDnp ? (
                            <span className="flex items-center gap-1.5">
                              <span className="font-semibold">{row.player_name}</span>
                              <Badge
                                variant="secondary"
                                className="h-5 px-1.5 text-[10px] font-semibold leading-none"
                              >
                                DNP
                              </Badge>
                            </span>
                          ) : (
                            <Link
                              href={`/players/${row.player_id}`}
                              className="font-semibold hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            >
                              {row.player_name}
                            </Link>
                          )}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {isDnp ? "—" : formatMinutes(row.seconds_played)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {isDnp ? "—" : `${row.fgm}/${row.fga} (${pctOrDash(row.fgm, row.fga)})`}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {isDnp ? "—" : `${row.fgm - row.tpm}/${row.fga - row.tpa} (${pctOrDash(row.fgm - row.tpm, row.fga - row.tpa)})`}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {isDnp ? "—" : `${row.tpm}/${row.tpa} (${pctOrDash(row.tpm, row.tpa)})`}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {isDnp ? "—" : `${row.ftm}/${row.fta} (${pctOrDash(row.ftm, row.fta)})`}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{isDnp ? "—" : row.oreb}</TableCell>
                        <TableCell className="text-right tabular-nums">{isDnp ? "—" : row.dreb}</TableCell>
                        <TableCell className="text-right tabular-nums">{isDnp ? "—" : row.oreb + row.dreb}</TableCell>
                        <TableCell className="text-right tabular-nums">{isDnp ? "—" : row.ast}</TableCell>
                        <TableCell className="text-right tabular-nums">{isDnp ? "—" : row.stl}</TableCell>
                        <TableCell className="text-right tabular-nums">{isDnp ? "—" : row.blk}</TableCell>
                        <TableCell className="text-right tabular-nums">{isDnp ? "—" : row.tov}</TableCell>
                        <TableCell className="text-right tabular-nums">{isDnp ? "—" : row.pf}</TableCell>
                        <TableCell className="text-right tabular-nums">{statOrDash(row.fouls_committed)}</TableCell>
                        <TableCell className="text-right tabular-nums">{statOrDash(row.fouls_drawn)}</TableCell>
                        <TableCell className="text-right tabular-nums">{statOrDash(row.plus_minus)}</TableCell>
                        <TableCell className="text-right tabular-nums">
                          {isDnp ? (
                            "—"
                          ) : (
                            <span className="font-semibold">{row.pts}</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        );
      })}
    </section>
  );
}


