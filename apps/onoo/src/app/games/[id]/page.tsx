import { Download, Flag, MapPin, Radio, Trophy } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PlayerAvatar } from "@/components/player-avatar";
import { ReportErrorDialog } from "@/components/report-error-dialog";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { GameStatusBadge } from "../../components/game-status-badge";
import { PublicEmptyState } from "../../components/public-empty-state";
import {
  type BoxScoreRow,
  formatGameTime,
  formatMinutes,
  getBoxScore,
  getGameById,
} from "../../lib/data";

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
  const homeRows = boxScore.filter(
    (row) => row.team_season_id === game.home_team_season_id,
  );
  const awayRows = boxScore.filter(
    (row) => row.team_season_id === game.away_team_season_id,
  );
  const homeTotals = calculateTeamTotals(homeRows);
  const awayTotals = calculateTeamTotals(awayRows);
  const topPerformers = [...boxScore].sort((a, b) => b.pts - a.pts).slice(0, 3);

  const homeWon = (game.home_score ?? 0) > (game.away_score ?? 0);
  const winnerName = homeWon ? game.home_team_name : game.away_team_name;
  const margin = Math.abs((game.home_score ?? 0) - (game.away_score ?? 0));

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
      <section className="game-scoreboard-hero overflow-hidden rounded-3xl bg-sidebar p-6 text-sidebar-foreground sm:p-8 lg:p-10">
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
              <p className="text-4xl font-black tabular-nums tracking-tight sm:text-7xl">
                {game.home_score ?? 0}
                <span className="px-2 text-sidebar-foreground/30">–</span>
                {game.away_score ?? 0}
              </p>
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
          <Card className="shadow-none lg:col-span-7">
            <CardHeader>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Тоглолтын өгүүлэмж
                </p>
                <CardTitle className="mt-1 text-2xl tracking-tight">
                  Товч дүгнэлт
                </CardTitle>
              </div>
              <CardAction>
                <Trophy aria-hidden="true" />
              </CardAction>
            </CardHeader>
            <CardContent>
              <p className="font-display text-2xl leading-relaxed tracking-tight sm:text-3xl">
                {winnerName} {margin} онооны зөрүүгээр ялалт байгууллаа.
                {topPerformers[0]
                  ? ` ${topPerformers[0].player_name} ${topPerformers[0].pts} оноогоор тоглолтыг тэргүүлэв.`
                  : ""}
              </p>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                Энэ дүгнэлт зөвхөн лигийн баталгаажсан оноо болон box score-д
                тулгуурласан.
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-none lg:col-span-5">
            <CardHeader>
              <CardTitle>Шилдэг тоглогчид</CardTitle>
              <CardDescription>Оноогоор тэргүүлсэн эхний гурав</CardDescription>
            </CardHeader>
            <CardContent>
              {topPerformers.length > 0 ? (
                <ol className="flex flex-col gap-2">
                  {topPerformers.map((player, index) => (
                    <li key={player.player_id}>
                      <Link
                        href={`/players/${player.player_id}`}
                        className="flex items-center gap-3 rounded-lg p-2 transition-[background-color,transform] hover:bg-accent active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none"
                      >
                        <span className="w-5 text-sm font-black text-muted-foreground">
                          {index + 1}
                        </span>
                        <PlayerAvatar name={player.player_name} />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-semibold">
                            {player.player_name}
                          </span>
                          <span className="block truncate text-xs text-muted-foreground">
                            {player.team_name}
                          </span>
                        </span>
                        <span className="text-xl font-black tabular-nums">
                          {player.pts}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Тоглогчийн мөр хараахан нийтлэгдээгүй байна.
                </p>
              )}
            </CardContent>
          </Card>
        </section>
      ) : null}

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

      {isFinal ? (
        <BoxScoreSection rows={boxScore} />
      ) : (
        <PublicEmptyState
          icon={isLive ? Radio : Trophy}
          title={isLive ? "Тоглолт үргэлжилж байна" : "Тоглолт эхлээгүй байна"}
          description={
            isLive
              ? "Шууд оноо урьдчилсан төлөвтэй. Бүрэн box score лигийн хяналтын дараа энд нийтлэгдэнэ."
              : "Тоглолт эхэлж, үр дүн баталгаажмагц бүрэн статистик энд гарна."
          }
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
            <Table>
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
                  <TableHead className="text-right">ТАС</TableHead>
                  <TableHead className="text-right">ХАА</TableHead>
                  <TableHead className="text-right">АЛД</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows
                  .filter((row) => row.team_name === teamName)
                  .map((row) => (
                    <TableRow key={`${row.team_season_id}-${row.player_id}`}>
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
                      <TableCell className="text-right font-black tabular-nums">
                        {row.pts}
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
                      <TableCell className="text-right tabular-nums">
                        {row.stl}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {row.blk}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
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
