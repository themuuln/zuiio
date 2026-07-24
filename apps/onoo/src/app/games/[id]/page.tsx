import type { StatEvent } from "@onoo/core/types";
import { Download, Flag, MapPin, Radio, Trophy } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
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
import { FlipScore } from "../../components/flip-score";
import { GameStatusBadge } from "../../components/game-status-badge";
import { PublicEmptyState } from "../../components/public-empty-state";
import {
  type BoxScoreRow,
  formatGameTime,
  formatMinutes,
  getBoxScore,
  getGameById,
  getLiveGameData,
  getPlayByPlay,
} from "../../lib/data";
import { LiveGameCenter } from "./components/live-game-center";
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

interface TeamTotals {
  pts: number;
  reb: number;
  ast: number;
  stl: number;
  blk: number;
  tov: number;
}

function calculateTeamTotals(rows: BoxScoreRow[]): TeamTotals {
  return rows.reduce<TeamTotals>(
    (totals, row) => ({
      pts: totals.pts + row.pts,
      reb: totals.reb + row.oreb + row.dreb,
      ast: totals.ast + row.ast,
      stl: totals.stl + row.stl,
      blk: totals.blk + row.blk,
      tov: totals.tov + row.tov,
    }),
    { pts: 0, reb: 0, ast: 0, stl: 0, blk: 0, tov: 0 },
  );
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
  const homeRows = boxScore.filter(
    (row) => row.team_season_id === game.home_team_season_id,
  );
  const awayRows = boxScore.filter(
    (row) => row.team_season_id === game.away_team_season_id,
  );
  const homeTotals = calculateTeamTotals(homeRows);
  const awayTotals = calculateTeamTotals(awayRows);
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
            <p className="text-sm text-sidebar-foreground/60">
              {game.season_name} · {game.league_name}
            </p>
          </div>

          <div className="mt-8 grid grid-cols-3 items-center gap-4 sm:gap-8">
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
                <FlipScore
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
                  home={homeTotals.pts}
                  away={awayTotals.pts}
                />
                <TeamComparison
                  label="Самбар"
                  home={homeTotals.reb}
                  away={awayTotals.reb}
                />
                <TeamComparison
                  label="Дамжуулалт"
                  home={homeTotals.ast}
                  away={awayTotals.ast}
                />
                <TeamComparison
                  label="Бөмбөг таслалт"
                  home={homeTotals.stl}
                  away={awayTotals.stl}
                />
                <TeamComparison
                  label="Алдалт"
                  home={homeTotals.tov}
                  away={awayTotals.tov}
                  lowerWins
                />
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
            initialEvents={liveGameData!.events}
            rosters={liveGameData!.rosters}
            sportConfig={
              liveGameData!.sportConfig ?? {
                periods: 4,
                period_minutes: 10,
                overtime_minutes: 5,
                fouls_to_bonus: 5,
                personal_foul_limit: 5,
                players_on_court: 5,
              }
            }
            playerNameMap={liveGameData!.playerNameMap}
          />
        ) : (
          <PublicEmptyState
            icon={Trophy}
            title="Тоглолт эхлээгүй байна"
            description="Тоглолт эхэлж, үр дүн баталгаажмагц бүрэн статистик энд гарна."
          />
        )}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button asChild variant="outline">
            <Link href="/games">← Тоглолтууд руу буцах</Link>
          </Button>
          <div className="flex flex-wrap items-center gap-2">
            <ReportErrorDialog gameId={game.id} />
            {isFinal ? (
              <>
                <Button asChild variant="outline">
                  <a
                    href={`/api/export?gameId=${game.id}&type=boxscore`}
                    download
                  >
                    <Download data-icon="inline-start" aria-hidden="true" />
                    CSV
                  </a>
                </Button>
                <Button asChild variant="outline">
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
}

function TeamComparison({
  label,
  home,
  away,
  lowerWins = false,
}: TeamComparisonProps) {
  const homeWins = lowerWins ? home < away : home > away;
  const awayWins = lowerWins ? away < home : away > home;
  const maxValue = Math.max(home, away, 1);
  const homeWidth = (home / maxValue) * 100;
  const awayWidth = (away / maxValue) * 100;

  return (
    <div className="grid grid-cols-12 items-center gap-3">
      <span
        className={cn(
          "col-span-2 text-right text-lg tabular-nums",
          homeWins && "font-black",
        )}
      >
        {home}
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
        {away}
      </span>
    </div>
  );
}

interface BoxScoreSectionProps {
  rows: BoxScoreRow[];
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
      {teams.map((teamName) => (
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
                  <TableHead>Тоглогч</TableHead>
                  <TableHead className="text-right">МИН</TableHead>
                  <TableHead className="text-right">ОНОО</TableHead>
                  <TableHead className="text-right">FG</TableHead>
                  <TableHead className="text-right">3P</TableHead>
                  <TableHead className="text-right">FT</TableHead>
                  <TableHead className="text-right">САМБ</TableHead>
                  <TableHead className="text-right">ДАМЖ</TableHead>
                  <TableHead className="hidden text-right md:table-cell">
                    ТАС
                  </TableHead>
                  <TableHead className="hidden text-right md:table-cell">
                    ХАА
                  </TableHead>
                  <TableHead className="hidden text-right md:table-cell">
                    АЛД
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows
                  .filter((row) => row.team_name === teamName)
                  .map((row) => (
                    <TableRow
                      key={`${row.team_season_id}-${row.player_id}`}
                      className="hover:bg-accent/50"
                    >
                      <TableCell>
                        <Link
                          href={`/players/${row.player_id}`}
                          className="font-semibold hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          {row.player_name}
                        </Link>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatMinutes(row.seconds_played)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        <span className="stat-number">{row.pts}</span>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {row.fgm}/{row.fga}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {row.tpm}/{row.tpa}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {row.ftm}/{row.fta}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {row.oreb + row.dreb}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {row.ast}
                      </TableCell>
                      <TableCell className="hidden text-right tabular-nums md:table-cell">
                        {row.stl}
                      </TableCell>
                      <TableCell className="hidden text-right tabular-nums md:table-cell">
                        {row.blk}
                      </TableCell>
                      <TableCell className="hidden text-right tabular-nums md:table-cell">
                        {row.tov}
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}
    </section>
  );
}
