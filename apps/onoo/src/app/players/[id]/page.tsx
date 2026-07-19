import { detectMilestones, getStatLabel } from "@onoo/core";
import {
  ArrowLeft,
  ChartNoAxesCombined,
  Medal,
  TableProperties,
  Target,
  TrendingUp,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { LanguageToggle } from "@/app/components/language-toggle";
import { ReportErrorDialog } from "@/components/report-error-dialog";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  formatMinutes,
  getLeagueAverages,
  getPlayerAwards,
  getPlayerById,
  getPlayerCareerTotals,
  getPlayerCompetitions,
  getPlayerGameLog,
  getPlayerShootingProfile,
  getPlayerShotZones,
} from "../../lib/data";
import { AwardsShelf } from "./components/awards-shelf";
import { FormTrends } from "./components/form-trends";
import { HeroCard } from "./components/hero-card";
import { Milestones } from "./components/milestones";
import { RecentGames } from "./components/recent-games";
import { SeasonArc } from "./components/season-arc";
import { SeasonSelector } from "./components/season-selector";
import { ShootingProfile } from "./components/shooting-profile";
import { ShotChart } from "./components/shot-chart";
import { SkillRadar } from "./components/skill-radar";
import { StatCard } from "./components/stat-card";
import { HomeAwaySplits } from "./components/home-away-splits";
import { ScrollReveal, StaggerContainer, StaggerItem } from "./components/motion-wrapper";
import { getPlayerShotScatter } from "../../lib/data";

interface PlayerPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ season?: string; lang?: string }>;
}

const EMPTY_SHOOTING_PROFILE = {
  fgm: 0,
  fga: 0,
  tpm: 0,
  tpa: 0,
  ftm: 0,
  fta: 0,
};

export async function generateMetadata({
  params,
}: PlayerPageProps): Promise<Metadata> {
  const { id } = await params;
  const data = await getPlayerById(id);
  if (!data?.player)
    return {
      title:
        "Тоглогч олодсонгүй — Оноо",
    };

  return {
    title: `${data.player.canonical_name} — Оноо`,
    description: `${data.player.canonical_name} (${data.player.name_latin}) тоглогчийн мэдээл ба статистик.`,
  };
}

export default async function PlayerPage({
  params,
  searchParams,
}: PlayerPageProps) {
  const { id } = await params;
  const { season, lang } = await searchParams;
  const locale = lang === "en" ? "en" : "mn";
  const isEn = locale === "en";
  const [data, competitions] = await Promise.all([
    getPlayerById(id),
    getPlayerCompetitions(id),
  ]);

  if (!data?.player) notFound();

  const { player, profiles } = data;
  const isCareer = season === "career";
  const latestCompetitionId =
    competitions[0]?.competition_id ?? player.competition_id;
  const requestedCompetitionId = competitions.some(
    (competition) => competition.competition_id === season,
  )
    ? season
    : null;
  const activeCompetitionId = isCareer
    ? null
    : (requestedCompetitionId ?? latestCompetitionId);
  const activeProfile =
    profiles.find(
      (profile) => profile.competition_id === activeCompetitionId,
    ) ?? player;
  const [
    shootingProfile,
    leagueData,
    careerTotals,
    playerGameLog,
    playerAwards,
    shotZones,
  ] = await Promise.all([
    activeCompetitionId
      ? getPlayerShootingProfile(id, activeCompetitionId)
      : Promise.resolve(null),
    activeCompetitionId
      ? getLeagueAverages(activeCompetitionId)
      : Promise.resolve(null),
    getPlayerCareerTotals(id),
    getPlayerGameLog(id, activeCompetitionId),
    getPlayerAwards(id),
    activeCompetitionId
      ? getPlayerShotZones(id, activeCompetitionId)
      : Promise.resolve([]),
  ]);

  const trendData = playerGameLog.map((line) => ({
    game_id: line.game_id,
    game_date: line.game_date,
    opponent: line.opponent_short_code,
    pts: line.pts,
    reb: line.oreb + line.dreb,
    ast: line.ast,
    result: line.result,
  }));
  const milestones = detectMilestones(
    playerGameLog.map((line) => ({
      game_id: line.game_id,
      game_date: line.game_date.slice(0, 10),
      pts: line.pts,
      reb: line.oreb + line.dreb,
      ast: line.ast,
      stl: line.stl,
      blk: line.blk,
    })),
  );
  const shotScatter = activeCompetitionId
    ? await getPlayerShotScatter(id, activeCompetitionId)
    : [];
  const seasonLabel = isCareer
    ? isEn
      ? "Career Total"
      : "Карьерийн бүх тоглот"
    : `${activeProfile.season_name} · ${activeProfile.competition_name}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: player.canonical_name,
    alternateName: player.name_latin ?? undefined,
    jobTitle:
      player.position ??
      "Баскетболч",
    memberOf: {
      "@type": "SportsTeam",
      name: player.team_name,
      sport: "Basketball",
    },
    description: [
      player.points_per_game != null
        ? `${player.points_per_game.toFixed(1)} нэгэн тоглолтод`
        : null,
      player.games_played
        ? `${player.games_played} тоглолт`
        : null,
    ]
      .filter(Boolean)
      .join(", "),
  };

  return (
    <>
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD structured data for SEO
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main
        id="main-content"
        className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10"
      >
        {/* ─── Breadcrumb + heading ─── */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <Link
              href="/players"
              className="inline-flex min-h-11 items-center gap-2 rounded-lg text-sm font-medium text-muted-foreground transition-colors hover:text-foreground active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
              {isEn
                ? "Players"
                : "Тоглочид"}
            </Link>
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--brand-sports)]">
              {isEn
                ? "Player Profile"
                : "Тоглогчийн профайл"}
            </p>
            <p className="text-sm text-muted-foreground">{seasonLabel}</p>
          </div>
          <div className="flex items-center gap-2">
            <Suspense
              fallback={
                <div className="h-9 w-full animate-pulse rounded-lg bg-muted sm:w-72" />
              }
            >
              <SeasonSelector
                competitions={competitions}
                currentCompetitionId={activeCompetitionId}
              />
            </Suspense>
            <Suspense fallback={null}>
              <LanguageToggle />
            </Suspense>
            <Link
              href={`/players/compare?players=${id}`}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border bg-background px-3 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              {isEn ? "Compare" : "Харьцуулах"}
            </Link>
          </div>
        </div>

        {/* ─── Hero card — player identity + season averages ─── */}
        <HeroCard
          playerId={id}
          competitionId={activeCompetitionId}
          careerTotals={isCareer ? careerTotals : null}
          locale={locale}
        />

        {/* ─── Quick share card (shown when stats available) ─── */}
        {(activeProfile.points_per_game != null ||
          activeProfile.oreb_per_game != null ||
          careerTotals) && (
          <div className="space-y-3">
            <h2 className="court-dot-accent text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              {isEn ? "Share" : "Хүтлэх"}
            </h2>
            <StatCard
              playerName={
                isEn
                  ? player.name_latin || player.canonical_name
                  : player.canonical_name
              }
              teamName={player.team_name}
              seasonLabel={seasonLabel}
              stats={
                careerTotals
                  ? {
                      pts: careerTotals.pts,
                      reb: careerTotals.reb,
                      ast: careerTotals.ast,
                      gp: careerTotals.gp,
                    }
                  : {
                      pts: activeProfile.points_per_game ?? null,
                      reb:
                        (activeProfile.oreb_per_game ?? 0) +
                          (activeProfile.dreb_per_game ?? 0) || null,
                      ast: activeProfile.ast_per_game ?? null,
                      stl: activeProfile.stl_per_game ?? null,
                      blk: activeProfile.blk_per_game ?? null,
                      gp: activeProfile.games_played ?? null,
                    }
              }
              locale={locale}
            />
          </div>
        )}

        {/* ─── Recent games strip ─── */}
        <ScrollReveal>
          <RecentGames gameLines={playerGameLog} />
        </ScrollReveal>

        {/* ─── Main stats grid ─── */}
        <Tabs defaultValue="summary" className="gap-6">
          <TabsList className="grid w-full grid-cols-2 sm:w-fit">
            <TabsTrigger value="summary">
              <ChartNoAxesCombined aria-hidden="true" />
              {isEn ? "Summary" : "Тойм"}
            </TabsTrigger>
            <TabsTrigger value="gamelog">
              <TableProperties aria-hidden="true" />
              {isEn
                ? "All Games"
                : "Бүх тоглот"}
            </TabsTrigger>
          </TabsList>

          {/* ─── Summary tab ─── */}
          <TabsContent value="summary" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-12">
              {/* Season trend chart */}
              <Card className="lg:col-span-7">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <span className="flex size-10 items-center justify-center rounded-xl bg-[var(--brand-sports)]/10 text-[var(--brand-sports)]">
                      <ChartNoAxesCombined
                        className="size-5"
                        aria-hidden="true"
                      />
                    </span>
                    <div>
                      <CardTitle className="text-lg">
                        {isEn
                          ? "Season Trend"
                          : "Улиралын хандлаг"}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {isEn
                          ? "Performance change game by game"
                          : "Тоглобын бүрийн явжилтын ерхлэнт"}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <SeasonArc data={trendData} />
                </CardContent>
              </Card>

              {/* Shooting profile — only for season view */}
              {!isCareer && (
                <ShootingProfile
                  data={shootingProfile ?? EMPTY_SHOOTING_PROFILE}
                  className="lg:col-span-5"
                />
              )}

              {/* Form & trends — efficiency, opponent scatter, win/loss */}
              <Card className="lg:col-span-12">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <span className="flex size-10 items-center justify-center rounded-xl bg-[var(--brand-sports)]/10 text-[var(--brand-sports)]">
                      <TrendingUp className="size-5" aria-hidden="true" />
                    </span>
                    <div>
                      <CardTitle className="text-lg">
                        {isEn ? "Form & Trends" : "Форм ба Хандлага"}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {isEn
                          ? "Recent efficiency and performance by opponent"
                          : "Сүүлийн үр ашаг болон өрсөлдөгчөөр үзүүлэлт"}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <FormTrends gameLines={playerGameLog} locale={locale} />
                </CardContent>
              </Card>

              {/* Shot chart — court heatmap (real zone data) + efficiency */}
              {!isCareer && (
                <ShotChart
                  shotZones={shotZones}
                  shots={shotScatter}
                  shootingProfile={shootingProfile ?? EMPTY_SHOOTING_PROFILE}
                  locale={locale}
                  className="lg:col-span-12"
                />
              )}
            </div>
            {/* Home/Away splits */}
            <HomeAwaySplits
              gameLines={playerGameLog}
              locale={locale}
              className="lg:col-span-12"
            />



            {/* Skill radar + milestones row */}
            <div className="grid gap-6 lg:grid-cols-12">
              {/* Skill radar — only for season view with league data */}
              {!isCareer && leagueData && (
                <Card className="lg:col-span-7">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <span className="flex size-10 items-center justify-center rounded-xl bg-[var(--brand-sports)]/10 text-[var(--brand-sports)]">
                        <Target className="size-5" aria-hidden="true" />
                      </span>
                      <div>
                        <CardTitle className="text-lg">
                          {isEn
                            ? "Skill Radar"
                            : "Чадалын супраган"}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          {isEn
                            ? "Player vs League Average"
                            : "Тоглогч ба лигийн дундаж"}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center">
                    {/* Legend */}
                    <div className="mb-2 flex flex-wrap justify-center gap-4 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-2">
                        <span className="size-2 rounded-full bg-[var(--brand-sports)]" />{" "}
                        {isEn
                          ? "Player"
                          : "Тоглогч"}
                      </span>
                      <span className="inline-flex items-center gap-2">
                        <span className="size-2 rounded-full bg-muted-foreground" />{" "}
                        {isEn
                          ? "League Average"
                          : "Лигийн дундаж"}
                      </span>
                    </div>
                    <SkillRadar
                      playerStats={{
                        pts: activeProfile.points_per_game ?? 0,
                        reb:
                          (activeProfile.oreb_per_game ?? 0) +
                          (activeProfile.dreb_per_game ?? 0),
                        ast: activeProfile.ast_per_game ?? 0,
                        stl: activeProfile.stl_per_game ?? 0,
                        blk: activeProfile.blk_per_game ?? 0,
                      }}
                      leagueAverages={leagueData.averages}
                      leagueMaxes={leagueData.maxes}
                    />
                  </CardContent>
                </Card>
              )}

              {/* Career highs / Milestones */}
              <Card className={isCareer ? "lg:col-span-7" : "lg:col-span-5"}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <span className="flex size-10 items-center justify-center rounded-xl bg-[var(--brand-sports)]/10 text-[var(--brand-sports)]">
                      <Medal className="size-5" aria-hidden="true" />
                    </span>
                    <div>
                      <CardTitle className="text-lg">
                        {isEn
                          ? "Career Highs"
                          : "Онцлох амжилтууд"}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {isEn
                          ? "Top performances and consistency"
                          : "Әдээ явцалт ба тогтвортой рүузмэлт"}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Milestones milestones={milestones} locale={locale} />
                </CardContent>
              </Card>
            </div>

            {playerAwards.length > 0 && (
              <AwardsShelf awards={playerAwards} locale={locale} />
            )}
          </TabsContent>

          {/* ─── Game log tab ─── */}
          <TabsContent value="gamelog">
            <Card>
              <CardHeader className="border-b">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle className="text-lg">
                      {isEn
                        ? "Game Log"
                        : "Тоглоын дэлгэвр"}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {playerGameLog.length}{" "}
                      {isEn
                        ? "verified games"
                        : "баталгаажсан тогломт"}{" "}
                      {"·"} {seasonLabel}
                    </CardDescription>
                  </div>
                  <ReportErrorDialog playerId={id} />
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {playerGameLog.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-max text-sm">
                      <thead>
                        <tr className="border-b bg-muted/35 text-left text-xs uppercase tracking-wide text-muted-foreground">
                          <th className="px-4 py-3 font-medium" scope="col">
                            {isEn ? "Date" : "Огноо"}
                          </th>
                          <th className="px-4 py-3 font-medium" scope="col">
                            {isEn ? "Opponent" : "Өрсөлдөгч"}
                          </th>
                          <th
                            className="px-4 py-3 text-center font-medium"
                            scope="col"
                          >
                            {isEn ? "Result" : "Үр дүн"}
                          </th>
                          <StatHead>{isEn ? "+/−" : "+/−"}</StatHead>
                          <StatHead>{getStatLabel("mpg", locale)}</StatHead>
                          <StatHead>{getStatLabel("pts", locale)}</StatHead>
                          <StatHead>
                            {isEn ? "FGM" : "Оруулсан"}
                          </StatHead>
                          <StatHead>
                            {isEn ? "3PT" : "3 хооноо"}
                          </StatHead>
                          <StatHead>{getStatLabel("reb", locale)}</StatHead>
                          <StatHead>{getStatLabel("ast", locale)}</StatHead>
                          <StatHead>{getStatLabel("stl", locale)}</StatHead>
                          <StatHead>{getStatLabel("blk", locale)}</StatHead>
                        </tr>
                      </thead>
                      <tbody>
                        {[...playerGameLog].reverse().map((line) => (
                          <tr
                            key={line.game_id}
                            className="border-b last:border-0 hover:bg-muted/25"
                          >
                            <td className="whitespace-nowrap px-4 py-3 text-muted-foreground tabular-nums">
                              {new Date(line.game_date).toLocaleDateString(
                                "mn-MN",
                                {
                                  month: "short",
                                  day: "numeric",
                                },
                              )}
                            </td>
                            <td className="px-4 py-3 font-medium">
                              <span className="mr-1.5 text-xs text-muted-foreground">
                                {line.is_home ? "🏠" : "✈️"}
                              </span>
                              {line.opponent_short_code}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <Badge
                                className={
                                  line.result === "W"
                                    ? "bg-success text-success-foreground hover:bg-success"
                                    : "bg-destructive text-destructive-foreground hover:bg-destructive"
                                }
                              >
                                {line.result} · {line.team_score}–
                                {line.opponent_score}
                              </Badge>
                            </td>
                            <StatCell
                              strong={
                                line.team_score - line.opponent_score > 0
                              }
                              muted={
                                line.team_score - line.opponent_score < 0
                              }
                            >
                              {line.team_score - line.opponent_score > 0
                                ? "+"
                                : ""}
                              {line.team_score - line.opponent_score}
                            </StatCell>
                            <StatCell muted>
                              {formatMinutes(line.seconds_played)}
                            </StatCell>
                            <StatCell strong>{line.pts}</StatCell>
                            <StatCell>
                              {line.fgm}/{line.fga}
                            </StatCell>
                            <StatCell>
                              {line.tpm}/{line.tpa}
                            </StatCell>
                            <StatCell>{line.oreb + line.dreb}</StatCell>
                            <StatCell>{line.ast}</StatCell>
                            <StatCell>{line.stl}</StatCell>
                            <StatCell>{line.blk}</StatCell>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center">
                    <TableProperties
                      className="size-7 text-muted-foreground"
                      aria-hidden="true"
                    />
                    <h2 className="mt-3 font-semibold">
                      {isEn
                        ? "No game records"
                        : "Тоглоны бүртцэ байна"}
                    </h2>
                    <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                      {isEn
                        ? "Detailed stats will appear after verified games."
                        : "Баталгаажсан тоглолтын дараа дэлгэрэгээ статистик энд нэжиглэнэ."}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </>
  );
}

function StatHead({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-4 py-3 text-right font-medium" scope="col">
      {children}
    </th>
  );
}

interface StatCellProps {
  children: React.ReactNode;
  muted?: boolean;
  strong?: boolean;
}

function StatCell({ children, muted = false, strong = false }: StatCellProps) {
  return (
    <td
      className={`px-4 py-3 text-right tabular-nums ${
        muted ? "text-muted-foreground" : ""
      } ${strong ? "stat-number" : ""}`}
    >
      {children}
    </td>
  );
}
