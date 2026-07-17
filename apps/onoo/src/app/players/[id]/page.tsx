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
  getPlayerById,
  getPlayerCareerTotals,
  getPlayerCompetitions,
  getPlayerGameLog,
  getPlayerShootingProfile,
} from "../../lib/data";
import { HeroCard } from "./components/hero-card";
import { Milestones } from "./components/milestones";
import { RecentGames } from "./components/recent-games";
import { SeasonArc } from "./components/season-arc";
import { SeasonSelector } from "./components/season-selector";
import { ShootingProfile } from "./components/shooting-profile";
import { SkillRadar } from "./components/skill-radar";

interface PlayerPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ season?: string }>;
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
  if (!data?.player) return { title: "Тоглогч олдсонгүй — Оноо" };

  return {
    title: `${data.player.canonical_name} — Оноо`,
    description: `${data.player.canonical_name} (${data.player.name_latin}) тоглогчийн мэдээлэл ба статистик.`,
  };
}

export default async function PlayerPage({
  params,
  searchParams,
}: PlayerPageProps) {
  const { id } = await params;
  const { season } = await searchParams;
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

  const [shootingProfile, leagueData, careerTotals, playerGameLog] =
    await Promise.all([
      activeCompetitionId
        ? getPlayerShootingProfile(id, activeCompetitionId)
        : Promise.resolve(null),
      activeCompetitionId
        ? getLeagueAverages(activeCompetitionId)
        : Promise.resolve(null),
      getPlayerCareerTotals(id),
      getPlayerGameLog(id, activeCompetitionId),
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
    ? "Карьерийн бүх тоглолт"
    : `${activeProfile.season_name} · ${activeProfile.competition_name}`;

  return (
    <main className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <Link
            href="/players"
            className="inline-flex min-h-11 items-center gap-2 rounded-lg text-sm font-medium text-muted-foreground transition-colors hover:text-foreground active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Тоглогчид
          </Link>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-warning-foreground">
              Тоглогчийн профайл
            </p>
            <p className="mt-1 text-sm text-muted-foreground">{seasonLabel}</p>
          </div>
        </div>

        {competitions.length > 0 && (
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
        )}
      </div>

      <Tabs defaultValue="summary" className="gap-6">
        <TabsList className="grid w-full grid-cols-2 sm:w-fit">
          <TabsTrigger value="summary">
            <ChartNoAxesCombined aria-hidden="true" />
            Тойм
          </TabsTrigger>
          <TabsTrigger value="gamelog">
            <TableProperties aria-hidden="true" />
            Бүх тоглолт
          </TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="space-y-8">
          <HeroCard
            playerId={id}
            competitionId={activeCompetitionId}
            careerTotals={isCareer ? careerTotals : null}
          />

          <RecentGames gameLines={playerGameLog} />

          <div className="grid gap-6 lg:grid-cols-12">
            <Card className="lg:col-span-7">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <span className="flex size-10 items-center justify-center rounded-xl bg-warning/20 text-warning-foreground">
                    <ChartNoAxesCombined
                      className="size-5"
                      aria-hidden="true"
                    />
                  </span>
                  <div>
                    <CardTitle className="text-lg">Улирлын хэмнэл</CardTitle>
                    <CardDescription className="mt-1">
                      Тоглолт бүрийн үзүүлэлтийн өөрчлөлт
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <SeasonArc data={trendData} />
              </CardContent>
            </Card>

            {!isCareer && (
              <ShootingProfile
                data={shootingProfile ?? EMPTY_SHOOTING_PROFILE}
                className="lg:col-span-5"
              />
            )}

            {!isCareer && leagueData && (
              <Card className="lg:col-span-5">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <span className="flex size-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
                      <Target className="size-5" aria-hidden="true" />
                    </span>
                    <div>
                      <CardTitle className="text-lg">
                        Чадварын зураглал
                      </CardTitle>
                      <CardDescription className="mt-1">
                        Тоглогч ба лигийн дундаж
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col items-center">
                  <div className="mb-2 flex flex-wrap justify-center gap-4 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-2">
                      <span className="size-2 rounded-full bg-warning" />{" "}
                      Тоглогч
                    </span>
                    <span className="inline-flex items-center gap-2">
                      <span className="size-2 rounded-full bg-muted-foreground" />{" "}
                      Лигийн дундаж
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

            <Card className={isCareer ? "lg:col-span-5" : "lg:col-span-7"}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <span className="flex size-10 items-center justify-center rounded-xl bg-warning/20 text-warning-foreground">
                    <Medal className="size-5" aria-hidden="true" />
                  </span>
                  <div>
                    <CardTitle className="text-lg">Онцлох амжилтууд</CardTitle>
                    <CardDescription className="mt-1">
                      Дээд үзүүлэлт ба тогтвортой гүйцэтгэл
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Milestones milestones={milestones} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="gamelog">
          <Card>
            <CardHeader className="border-b">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle className="text-lg">
                    Тоглолтын дэлгэрэнгүй
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {playerGameLog.length} баталгаажсан тоглолт · {seasonLabel}
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
                          Өдөр
                        </th>
                        <th className="px-4 py-3 font-medium" scope="col">
                          Өрсөлдөгч
                        </th>
                        <th
                          className="px-4 py-3 text-center font-medium"
                          scope="col"
                        >
                          Үр дүн
                        </th>
                        <StatHead>{getStatLabel("mpg", "mn")}</StatHead>
                        <StatHead>{getStatLabel("pts", "mn")}</StatHead>
                        <StatHead>Оролт</StatHead>
                        <StatHead>3 оноо</StatHead>
                        <StatHead>{getStatLabel("reb", "mn")}</StatHead>
                        <StatHead>{getStatLabel("ast", "mn")}</StatHead>
                        <StatHead>{getStatLabel("stl", "mn")}</StatHead>
                        <StatHead>{getStatLabel("blk", "mn")}</StatHead>
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
                              {line.result} · {line.team_score}–
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
                    Тоглолтын бүртгэл байхгүй байна
                  </h2>
                  <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                    Баталгаажсан тоглолтын дараа дэлгэрэнгүй статистик энд
                    нэмэгдэнэ.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </main>
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
