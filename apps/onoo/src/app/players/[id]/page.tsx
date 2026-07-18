import { detectMilestones, getStatLabel } from "@onoo/core";
import {
  ArrowLeft,
  ChartNoAxesCombined,
  Medal,
  TableProperties,
  Target,
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
} from "../../lib/data";
import { AwardsShelf } from "./components/awards-shelf";
import { HeroCard } from "./components/hero-card";
import { Milestones } from "./components/milestones";
import { RecentGames } from "./components/recent-games";
import { SeasonArc } from "./components/season-arc";
import { SeasonSelector } from "./components/season-selector";
import { ShootingProfile } from "./components/shooting-profile";
import { SkillRadar } from "./components/skill-radar";
import { StatCard } from "./components/stat-card";

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
        "\u0422\u043E\u0433\u043B\u043E\u0433\u0447 \u043E\u043B\u043E\u0434\u0441\u043E\u043D\u0433\u04AF\u0439 \u2014 \u041E\u043D\u043E\u043E",
    };

  return {
    title: `${data.player.canonical_name} \u2014 \u041E\u043D\u043E\u043E`,
    description: `${data.player.canonical_name} (${data.player.name_latin}) \u0442\u043E\u0433\u043B\u043E\u0433\u0447\u0438\u0439\u043D \u043C\u044D\u0434\u044D\u044D\u043B \u0431\u0430 \u0441\u0442\u0430\u0442\u0438\u0441\u0442\u0438\u043A.`,
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

  const [shootingProfile, leagueData, careerTotals, playerGameLog, playerAwards] =
    await Promise.all([
      activeCompetitionId
        ? getPlayerShootingProfile(id, activeCompetitionId)
        : Promise.resolve(null),
      activeCompetitionId
        ? getLeagueAverages(activeCompetitionId)
        : Promise.resolve(null),
      getPlayerCareerTotals(id),
      getPlayerGameLog(id, activeCompetitionId),
      getPlayerAwards(id),
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
  const seasonLabel = isCareer
    ? isEn
      ? "Career Total"
      : "\u041A\u0430\u0440\u044C\u0435\u0440\u0438\u0439\u043D \u0431\u04AF\u0445 \u0442\u043E\u0433\u043B\u043E\u0442"
    : `${activeProfile.season_name} \u00B7 ${activeProfile.competition_name}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: player.canonical_name,
    alternateName: player.name_latin ?? undefined,
    jobTitle:
      player.position ??
      "\u0411\u0430\u0441\u043A\u0435\u0442\u0431\u043E\u043B\u0447",
    memberOf: {
      "@type": "SportsTeam",
      name: player.team_name,
      sport: "Basketball",
    },
    description: [
      player.points_per_game != null
        ? `${player.points_per_game.toFixed(1)} \u043D\u044D\u0433\u044D\u043D \u0442\u043E\u0433\u043B\u043E\u043B\u0442\u043E\u0434`
        : null,
      player.games_played
        ? `${player.games_played} \u0442\u043E\u0433\u043B\u043E\u043B\u0442`
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
                : "\u0422\u043E\u0433\u043B\u043E\u0447\u0438\u0434"}
            </Link>
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--brand-sports)]">
              {isEn
                ? "Player Profile"
                : "\u0422\u043E\u0433\u043B\u043E\u0433\u0447\u0438\u0439\u043D \u043F\u0440\u043E\u0444\u0430\u0439\u043B"}
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
              {isEn ? "Share" : "\u0425\u04AF\u0442\u043B\u044D\u0445"}
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
        <RecentGames gameLines={playerGameLog} />

        {/* ─── Main stats grid ─── */}
        <Tabs defaultValue="summary" className="gap-6">
          <TabsList className="grid w-full grid-cols-2 sm:w-fit">
            <TabsTrigger value="summary">
              <ChartNoAxesCombined aria-hidden="true" />
              {isEn ? "Summary" : "\u0422\u043E\u0439\u043C"}
            </TabsTrigger>
            <TabsTrigger value="gamelog">
              <TableProperties aria-hidden="true" />
              {isEn
                ? "All Games"
                : "\u0411\u04AF\u0445 \u0442\u043E\u0433\u043B\u043E\u0442"}
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
                          : "\u0423\u043B\u0438\u0440\u0430\u043B\u044B\u043D \u0445\u0430\u043D\u0434\u043B\u0430\u0433"}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {isEn
                          ? "Performance change game by game"
                          : "\u0422\u043E\u0433\u043B\u043E\u0431\u044B\u043D \u0431\u04AF\u0440\u0438\u0439\u043D \u044F\u0432\u0436\u0438\u043B\u0442\u044B\u043D \u0435\u0440\u0445\u043B\u044D\u043D\u0442"}
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
            </div>

            {/* Skill radar + milestones row */}
            <div className="grid gap-6 lg:grid-cols-12">
              {/* Skill radar — only for season view with league data */}
              {!isCareer && leagueData && (
                <Card className="lg:col-span-5">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <span className="flex size-10 items-center justify-center rounded-xl bg-[var(--brand-sports)]/10 text-[var(--brand-sports)]">
                        <Target className="size-5" aria-hidden="true" />
                      </span>
                      <div>
                        <CardTitle className="text-lg">
                          {isEn
                            ? "Skill Radar"
                            : "\u0427\u0430\u0434\u0430\u043B\u044B\u043D \u0441\u0443\u043F\u0440\u0430\u0433\u0430\u043D"}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          {isEn
                            ? "Player vs League Average"
                            : "\u0422\u043E\u0433\u043B\u043E\u0433\u0447 \u0431\u0430 \u043B\u0438\u0433\u0438\u0439\u043D \u0434\u0443\u043D\u0434\u0430\u0436"}
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
                          : "\u0422\u043E\u0433\u043B\u043E\u0433\u0447"}
                      </span>
                      <span className="inline-flex items-center gap-2">
                        <span className="size-2 rounded-full bg-muted-foreground" />{" "}
                        {isEn
                          ? "League Average"
                          : "\u041B\u0438\u0433\u0438\u0439\u043D \u0434\u0443\u043D\u0434\u0430\u0436"}
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
              <Card className={isCareer ? "lg:col-span-5" : "lg:col-span-7"}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <span className="flex size-10 items-center justify-center rounded-xl bg-[var(--brand-sports)]/10 text-[var(--brand-sports)]">
                      <Medal className="size-5" aria-hidden="true" />
                    </span>
                    <div>
                      <CardTitle className="text-lg">
                        {isEn
                          ? "Career Highs"
                          : "\u041E\u043D\u0446\u043B\u043E\u0445 \u0430\u043C\u0436\u0438\u043B\u0442\u0443\u0443\u0434"}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {isEn
                          ? "Top performances and consistency"
                          : "\u04D8\u0434\u044D\u044D \u044F\u0432\u0446\u0430\u043B\u0442 \u0431\u0430 \u0442\u043E\u0433\u0442\u0432\u043E\u0440\u0442\u043E\u0439 \u0440\u04AF\u0443\u0437\u043C\u044D\u043B\u0442"}
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
                        : "\u0422\u043E\u0433\u043B\u043E\u044B\u043D \u0434\u044D\u043B\u0433\u044D\u0432\u0440"}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {playerGameLog.length}{" "}
                      {isEn
                        ? "verified games"
                        : "\u0431\u0430\u0442\u0430\u043B\u0433\u0430\u0430\u0436\u0441\u0430\u043D \u0442\u043E\u0433\u043B\u043E\u043C\u0442"}{" "}
                      {"\u00B7"} {seasonLabel}
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
                            {isEn ? "Date" : "\u041E\u0430\u0433"}
                          </th>
                          <th className="px-4 py-3 font-medium" scope="col">
                            {isEn
                              ? "Opponent"
                              : "\u041E\u043F\u043F\u043E\u043D\u0435\u043D\u0442"}
                          </th>
                          <th
                            className="px-4 py-3 text-center font-medium"
                            scope="col"
                          >
                            {isEn
                              ? "Result"
                              : "\u04AE\u0440 \u0434\u04AF\u043D"}
                          </th>
                          <StatHead>{getStatLabel("mpg", locale)}</StatHead>
                          <StatHead>{getStatLabel("pts", locale)}</StatHead>
                          <StatHead>
                            {isEn ? "FGM" : "\u041E\u0440\u043E\u043B\u0442"}
                          </StatHead>
                          <StatHead>
                            {isEn ? "3PT" : "3 \u0445\u043E\u043E\u043D"}
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
                                {line.result} \u00B7 {line.team_score}\u2013
                                {line.opponent_score}
                              </Badge>
                            </td>
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
                        : "\u0422\u043E\u0433\u043B\u043E\u043D\u044B \u0431\u04AF\u0440\u0442\u0446\u044D \u0431\u0430\u0439\u043D\u0430"}
                    </h2>
                    <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                      {isEn
                        ? "Detailed stats will appear after verified games."
                        : "\u0411\u0430\u0442\u0430\u043B\u0433\u0430\u0430\u0436\u0441\u0430\u043D \u0442\u043E\u0433\u043B\u043E\u043B\u0442\u044B\u043D \u0434\u0430\u0440\u0430\u0430 \u0434\u044D\u043B\u0433\u044D\u0440\u044D\u0433\u044D\u044D \u0441\u0442\u0430\u0442\u0438\u0441\u0442\u0438\u043A \u044D\u043D\u0434 \u043D\u044D\u0436\u0438\u0433\u043B\u044D\u043D\u044D."}
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
