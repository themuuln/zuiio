import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  getPlayerById,
  getPlayerShootingProfile,
  getLeagueAverages,
  getPlayerCompetitions,
  getPlayerCareerTotals,
  formatMinutes,
} from "../../lib/data";
import { HeroCard } from "./components/hero-card";
import { ShootingProfile } from "./components/shooting-profile";
import { SkillRadar } from "./components/skill-radar";
import { SeasonSelector } from "./components/season-selector";

type PlayerPageProps = { params: Promise<{ id: string }>; searchParams: Promise<{ season?: string }> };

export async function generateMetadata({ params }: PlayerPageProps): Promise<Metadata> {
  const { id } = await params;
  const data = await getPlayerById(id);
  if (!data?.player) return { title: "Тоглогч олдсонгүй — Оноо" };

  return {
    title: `${data.player.canonical_name} — Оноо`,
    description: `${data.player.canonical_name} (${data.player.name_latin}) тоглогчийн мэдээлэл ба статистик.`,
  };
}

export default async function PlayerPage({ params, searchParams }: PlayerPageProps) {
  const { id } = await params;
  const { season } = await searchParams;
  const [data, competitions] = await Promise.all([
    getPlayerById(id),
    getPlayerCompetitions(id),
  ]);
  if (!data?.player) notFound();

  const { player: playerMaybe, seasonStats, gameLog } = data;
  const player = playerMaybe!;
  const latestSeason = seasonStats[0];

  // Determine current competition from URL or default to latest
  const isCareer = !season;
  const currentCompetitionId = isCareer
    ? null
    : competitions.find((c) => c.competition_id === season)?.competition_id ?? null;
  const activeCompetitionId = currentCompetitionId ?? player.competition_id;

  const [shootingProfile, leagueData, careerTotals] = await Promise.all([
    activeCompetitionId
      ? getPlayerShootingProfile(id, activeCompetitionId)
      : Promise.resolve(null),
    activeCompetitionId && !isCareer
      ? getLeagueAverages(activeCompetitionId)
      : Promise.resolve(null),
    getPlayerCareerTotals(id),
  ]);

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 space-y-6">
      {/* Season selector */}
      {competitions.length > 1 && (
        <Suspense>
          <SeasonSelector
            competitions={competitions}
            currentCompetitionId={currentCompetitionId}
          />
        </Suspense>
      )}

      {/* Career totals summary — visible in both modes */}
      {careerTotals && (
        <p className="text-sm text-muted-foreground">
          Карьер: {careerTotals.gp} тоглолт{" | "}
          {careerTotals.pts} оноо{" | "}
          {careerTotals.reb} самбар{" | "}
          {careerTotals.ast} дамжуулалт
        </p>
      )}

      <Tabs defaultValue="summary" className="space-y-6">
        <TabsList>
          <TabsTrigger value="summary">Тойм</TabsTrigger>
          <TabsTrigger value="gamelog">Бүх тоглолт</TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="space-y-6">
          {/* Hero identity card */}
          <HeroCard
            playerId={id}
            competitionId={activeCompetitionId}
            careerTotals={isCareer ? careerTotals : null}
          />
          {/* Shooting profile */}
          {shootingProfile && (
            <ShootingProfile
              data={shootingProfile}
              teamColor={latestSeason?.team_color}
            />
          )}

          {/* Bio */}
          <section aria-labelledby="bio-heading">
            <h2 id="bio-heading" className="sr-only">
              Мэдээлэл
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <BioCard label="Байрлал" value={player.position ?? "—"} />
              <BioCard
                label="Өндөр"
                value={player.height_cm ? `${player.height_cm} см` : "—"}
              />
              <BioCard
                label="Жин"
                value={player.weight_kg ? `${player.weight_kg} кг` : "—"}
              />
              <BioCard
                label="Төрсөн өдөр"
                value={
                  player.dob
                    ? new Date(player.dob).toLocaleDateString("mn-MN", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })
                    : "—"
                }
              />
            </div>
          </section>

          {/* Season stats */}
          {latestSeason && (
            <section aria-labelledby="stats-heading" className="space-y-3">
              <h2 id="stats-heading" className="text-xl font-semibold">
                Улирлын статистик — {latestSeason.team_name}
              </h2>
              <Card>
                <CardContent className="p-0 overflow-x-auto">
                  <table className="w-full text-sm" role="table">
                    <thead>
                      <tr className="border-b text-left text-muted-foreground">
                        <th className="px-3 py-2.5 font-medium" scope="col">ТТ</th>
                        <th className="px-3 py-2.5 font-medium text-right" scope="col">Оноо</th>
                        <th className="px-3 py-2.5 font-medium text-right" scope="col">Дундаж</th>
                        <th className="px-3 py-2.5 font-medium text-right" scope="col">Давсан</th>
                        <th className="px-3 py-2.5 font-medium text-right" scope="col">Олгосон</th>
                        <th className="px-3 py-2.5 font-medium text-right" scope="col">Булаасан</th>
                        <th className="px-3 py-2.5 font-medium text-right" scope="col">Хаасан</th>
                        <th className="px-3 py-2.5 font-medium text-right" scope="col">Алдаа</th>
                        <th className="px-3 py-2.5 font-medium text-right" scope="col">Мин</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b last:border-0">
                        <td className="px-3 py-2.5 tabular-nums font-medium">
                          {latestSeason.gp}
                        </td>
                        <td className="px-3 py-2.5 text-right tabular-nums font-semibold">
                          {latestSeason.pts?.toFixed(1)}
                        </td>
                        <td className="px-3 py-2.5 text-right tabular-nums">
                          {latestSeason.seconds_played?.toFixed(1)}
                        </td>
                        <td className="px-3 py-2.5 text-right tabular-nums">
                          {((latestSeason.oreb ?? 0) + (latestSeason.dreb ?? 0)).toFixed(1)}
                        </td>
                        <td className="px-3 py-2.5 text-right tabular-nums">
                          {latestSeason.ast?.toFixed(1)}
                        </td>
                        <td className="px-3 py-2.5 text-right tabular-nums">
                          {latestSeason.stl?.toFixed(1)}
                        </td>
                        <td className="px-3 py-2.5 text-right tabular-nums">
                          {latestSeason.blk?.toFixed(1)}
                        </td>
                        <td className="px-3 py-2.5 text-right tabular-nums">
                          {latestSeason.tov?.toFixed(1)}
                        </td>
                        <td className="px-3 py-2.5 text-right tabular-nums text-muted-foreground">
                          {latestSeason.seconds_played?.toFixed(1)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            </section>
          )}

          {/* Skill radar — player vs league average */}
          {!isCareer && latestSeason && leagueData && (
            <section aria-labelledby="radar-heading" className="space-y-3">
              <h2 id="radar-heading" className="text-xl font-semibold">
                Чадварын зураглал
              </h2>
              <Card>
                <CardContent className="flex justify-center py-6">
                  <SkillRadar
                    playerStats={{
                      pts: latestSeason.pts ?? 0,
                      reb: (latestSeason.oreb ?? 0) + (latestSeason.dreb ?? 0),
                      ast: latestSeason.ast ?? 0,
                      stl: latestSeason.stl ?? 0,
                      blk: latestSeason.blk ?? 0,
                    }}
                    leagueAverages={leagueData.averages}
                    leagueMaxes={leagueData.maxes}
                  />
                </CardContent>
              </Card>
            </section>
          )}
        </TabsContent>

        <TabsContent value="gamelog" className="space-y-3">
          {gameLog.length > 0 ? (
            <Card>
              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full text-sm" role="table">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="px-3 py-2.5 font-medium whitespace-nowrap" scope="col">Өдөр</th>
                      <th className="px-3 py-2.5 font-medium whitespace-nowrap" scope="col">Баг</th>
                      <th className="px-3 py-2.5 font-medium text-right whitespace-nowrap" scope="col">Мин</th>
                      <th className="px-3 py-2.5 font-medium text-right whitespace-nowrap" scope="col">Оноо</th>
                      <th className="px-3 py-2.5 font-medium text-right whitespace-nowrap" scope="col">Ол/Нийт</th>
                      <th className="px-3 py-2.5 font-medium text-right whitespace-nowrap" scope="col">3Ол/Нийт</th>
                      <th className="px-3 py-2.5 font-medium text-right whitespace-nowrap" scope="col">ШОл/Нийт</th>
                      <th className="px-3 py-2.5 font-medium text-right whitespace-nowrap" scope="col">Давсан</th>
                      <th className="px-3 py-2.5 font-medium text-right whitespace-nowrap" scope="col">Олгосон</th>
                      <th className="px-3 py-2.5 font-medium text-right whitespace-nowrap" scope="col">Булаасан</th>
                      <th className="px-3 py-2.5 font-medium text-right whitespace-nowrap" scope="col">Хаасан</th>
                      <th className="px-3 py-2.5 font-medium text-right whitespace-nowrap" scope="col">Алдаа</th>
                      <th className="px-3 py-2.5 font-medium text-right whitespace-nowrap" scope="col">Зөрчил</th>
                    </tr>
                  </thead>
                  <tbody>
                    {gameLog.map((gl, i) => (
                      <tr
                        key={`${gl.game_id}-${i}`}
                        className="border-b last:border-0"
                      >
                        <td className="px-3 py-2.5 text-muted-foreground whitespace-nowrap tabular-nums">
                          {new Date(gl.revision_approved_at).toLocaleDateString("mn-MN", { month: "short", day: "numeric" })}
                        </td>
                        <td className="px-3 py-2.5">
                          <Badge variant="outline">{gl.team_short}</Badge>
                        </td>
                        <td className="px-3 py-2.5 text-right tabular-nums text-muted-foreground">
                          {formatMinutes(gl.seconds_played)}
                        </td>
                        <td className="px-3 py-2.5 text-right tabular-nums font-semibold">
                          {gl.pts}
                        </td>
                        <td className="px-3 py-2.5 text-right tabular-nums">
                          {gl.fgm}/{gl.fga}
                        </td>
                        <td className="px-3 py-2.5 text-right tabular-nums">
                          {gl.tpm}/{gl.tpa}
                        </td>
                        <td className="px-3 py-2.5 text-right tabular-nums">
                          {gl.ftm}/{gl.fta}
                        </td>
                        <td className="px-3 py-2.5 text-right tabular-nums">
                          {gl.oreb + gl.dreb}
                        </td>
                        <td className="px-3 py-2.5 text-right tabular-nums">
                          {gl.ast}
                        </td>
                        <td className="px-3 py-2.5 text-right tabular-nums">
                          {gl.stl}
                        </td>
                        <td className="px-3 py-2.5 text-right tabular-nums">
                          {gl.blk}
                        </td>
                        <td className="px-3 py-2.5 text-right tabular-nums">
                          {gl.tov}
                        </td>
                        <td className="px-3 py-2.5 text-right tabular-nums text-muted-foreground">
                          {gl.pf}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          ) : (
            <p className="text-sm text-muted-foreground py-8 text-center">
              Тоглолтын мэдээлэл байхгүй байна.
            </p>
          )}
        </TabsContent>
      </Tabs>

      <div>
        <Link href="/leaders" className="text-sm text-primary hover:underline">
          ← Тэргүүлэгчид руу буцах
        </Link>
      </div>
    </main>
  );
}

function BioCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="py-4 text-center">
        <div className="text-lg font-semibold">{value}</div>
        <div className="text-xs text-muted-foreground mt-1">{label}</div>
      </CardContent>
    </Card>
  );
}
