import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getPlayerById, formatMinutes } from "../../lib/data";

type PlayerPageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: PlayerPageProps): Promise<Metadata> {
  const { id } = await params;
  const data = await getPlayerById(id);
  if (!data?.player) return { title: "Тоглогч олдсонгүй — Оноо" };

  return {
    title: `${data.player.canonical_name} — Оноо`,
    description: `${data.player.canonical_name} (${data.player.name_latin}) тоглогчийн мэдээлэл ба статистик.`,
  };
}

export default async function PlayerPage({ params }: PlayerPageProps) {
  const { id } = await params;
  const data = await getPlayerById(id);
  if (!data?.player) notFound();

  const { player: playerMaybe, seasonStats, gameLog } = data;
  const player = playerMaybe!;
  const latestSeason = seasonStats[0];

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 space-y-6">
      {/* Player header */}
      <Card>
        <CardContent className="flex items-center gap-6 py-8 px-6">
          <div
            className="flex size-16 shrink-0 items-center justify-center rounded-full text-xl font-bold text-white"
            style={{
              backgroundColor: latestSeason?.team_color ?? "oklch(0.4 0 0)",
            }}
          >
            {player.jersey_number}
          </div>
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">
              {player.canonical_name}
            </h1>
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              {player.name_latin && <span>{player.name_latin}</span>}
              <span aria-hidden="true">·</span>
              <Badge variant="outline">{player.position}</Badge>
              <span aria-hidden="true">·</span>
              <span>{player.nationality}</span>
            </div>
          </div>
        </CardContent>
      </Card>

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

      {/* Game log */}
      {gameLog.length > 0 && (
        <section aria-labelledby="gamelog-heading" className="space-y-3">
          <h2 id="gamelog-heading" className="text-xl font-semibold">
            Тоглолтын түүх
          </h2>
          <Card>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-sm" role="table">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="px-3 py-2.5 font-medium" scope="col">Баг</th>
                    <th className="px-3 py-2.5 font-medium text-right" scope="col">Оноо</th>
                    <th className="px-3 py-2.5 font-medium text-right" scope="col">Ор/Нийт</th>
                    <th className="px-3 py-2.5 font-medium text-right" scope="col">Дав</th>
                    <th className="px-3 py-2.5 font-medium text-right" scope="col">Олг</th>
                    <th className="px-3 py-2.5 font-medium text-right" scope="col">Мин</th>
                  </tr>
                </thead>
                <tbody>
                  {gameLog.map((gl, i) => (
                    <tr
                      key={`${gl.game_id}-${i}`}
                      className="border-b last:border-0"
                    >
                      <td className="px-3 py-2.5">
                        <Badge variant="outline">{gl.team_short}</Badge>
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums font-semibold">
                        {gl.pts}
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums">
                        {gl.fgm}/{gl.fga}
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums">
                        {gl.oreb + gl.dreb}
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums">
                        {gl.ast}
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-muted-foreground">
                        {formatMinutes(gl.seconds_played)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </section>
      )}

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
