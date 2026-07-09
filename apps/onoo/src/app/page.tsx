import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  getGamesByDate,
  getLiveGames,
  getStandings,
  formatGameTime,
  statusLabel,
} from "./lib/data";

import { connection } from "next/server";

export const metadata: Metadata = {
  title: "Оноо — Спортын тоо баримт",
  description:
    "Сагсан бөмбөгийн лигийн тоглолтууд, шалгуур, тоглогчдын гүйцэтгэлийн статистик.",
};

export default async function HomePage() {
  // Required before new Date() under cacheComponents
  await connection();
  const today = new Date().toISOString().slice(0, 10);
  const [todayGames, liveGames, standings] = await Promise.all([
    getGamesByDate(today),
    getLiveGames(),
    getStandings(),
  ]);

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 space-y-10">
      {/* Hero */}
      <section className="text-center space-y-4 py-12">
        <h1 className="text-5xl font-bold tracking-tight text-foreground sm:text-6xl">
          Оноо
        </h1>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto">
          Спортын тоо баримт, тоглогчдын гүйцэтгэл, шууд статистик
        </p>
        <div className="flex justify-center gap-3 pt-2">
          <Link
            href="/games"
            className="rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Тоглолтууд
          </Link>
          <Link
            href="/standings"
            className="rounded-lg border border-border px-6 py-3 text-sm font-medium transition-colors hover:bg-accent"
          >
            Шалгуур
          </Link>
          <Link
            href="/leaders"
            className="rounded-lg border border-border px-6 py-3 text-sm font-medium transition-colors hover:bg-accent"
          >
            Тэргүүлэгчид
          </Link>
        </div>
      </section>

      {/* Live games */}
      {liveGames.length > 0 && (
        <section aria-labelledby="live-heading" className="space-y-4">
          <h2
            id="live-heading"
            className="flex items-center gap-2 text-xl font-semibold"
          >
            <span
              className="inline-block size-2.5 rounded-full bg-red-500"
              aria-hidden="true"
            />
            Шууд тоглолт
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {liveGames.map((game) => (
              <Link key={game.id} href={`/games/${game.id}`}>
                <Card className="transition-colors hover:border-red-500/50">
                  <CardContent className="flex items-center justify-between gap-4 py-4">
                    <div className="flex flex-col items-center gap-1 min-w-0">
                      <TeamDot color={game.home_color} />
                      <span className="text-sm font-medium truncate">
                        {game.home_short || game.home_name}
                      </span>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold tabular-nums">
                        {game.home_score ?? 0} — {game.away_score ?? 0}
                      </div>
                      <Badge variant="destructive" className="mt-1">
                        Шууд
                      </Badge>
                    </div>
                    <div className="flex flex-col items-center gap-1 min-w-0">
                      <TeamDot color={game.away_color} />
                      <span className="text-sm font-medium truncate">
                        {game.away_short || game.away_name}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Today's games */}
      <section aria-labelledby="today-heading" className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 id="today-heading" className="text-xl font-semibold">
            Өнөөдрийн тоглолтууд
          </h2>
          <Link
            href="/games"
            className="text-sm text-primary hover:underline"
          >
            Бүгдийг харах →
          </Link>
        </div>
        {todayGames.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Өнөөдөр тоглолт товлогоогүй байна.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {todayGames.map((game) => (
              <Link key={game.id} href={`/games/${game.id}`}>
                <Card className="transition-colors hover:bg-accent/50">
                  <CardContent className="flex items-center justify-between gap-4 py-4 px-6">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <TeamDot color={game.home_color} />
                      <span className="text-sm font-medium truncate">
                        {game.home_name}
                      </span>
                    </div>
                    <div className="text-center shrink-0">
                      {game.status === "final" ||
                      game.status === "verified" ? (
                        <span className="text-lg font-bold tabular-nums">
                          {game.home_score} — {game.away_score}
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground tabular-nums">
                          {formatGameTime(game.scheduled_at)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 min-w-0 flex-1 justify-end">
                      <span className="text-sm font-medium truncate text-right">
                        {game.away_name}
                      </span>
                      <TeamDot color={game.away_color} />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Standings snippet — top 4 */}
      <section aria-labelledby="standings-heading" className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 id="standings-heading" className="text-xl font-semibold">
            Шалгуур
          </h2>
          <Link
            href="/standings"
            className="text-sm text-primary hover:underline"
          >
            Бүх шалгуур →
          </Link>
        </div>
        <Card>
          <CardContent className="p-0">
            <table className="w-full text-sm" role="table">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="px-4 py-3 font-medium" scope="col">#</th>
                  <th className="px-4 py-3 font-medium" scope="col">Баг</th>
                  <th className="px-4 py-3 font-medium text-right" scope="col">Я</th>
                  <th className="px-4 py-3 font-medium text-right" scope="col">О</th>
                  <th className="px-4 py-3 font-medium text-right" scope="col">Хувь</th>
                </tr>
              </thead>
              <tbody>
                {standings.slice(0, 4).map((row, i) => (
                  <tr
                    key={row.team_season_id}
                    className="border-b last:border-0"
                  >
                    <td className="px-4 py-3 text-muted-foreground">
                      {i + 1}
                    </td>
                    <td className="px-4 py-3 font-medium">
                      <Link
                        href={`/teams/${row.team_slug}`}
                        className="hover:underline"
                      >
                        <span className="inline-flex items-center gap-2">
                          <TeamDot color={row.team_color} />
                          {row.team_name}
                        </span>
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {row.w}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {row.l}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {((row.w / (row.w + row.l)) * 100).toFixed(1) + "%"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </section>

      {/* Quick links */}
      <section aria-label="Холбоосууд" className="grid gap-4 sm:grid-cols-3">
        <Link href="/games" className="group">
          <Card className="transition-colors group-hover:bg-accent/50">
            <CardHeader>
              <CardTitle className="text-base">Тоглолтууд</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Бүх тоглолтуудын хуваарь, үр дүн
              </p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/standings" className="group">
          <Card className="transition-colors group-hover:bg-accent/50">
            <CardHeader>
              <CardTitle className="text-base">Шалгуур</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Багуудын жагсаалт, ялагдал
              </p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/leaders" className="group">
          <Card className="transition-colors group-hover:bg-accent/50">
            <CardHeader>
              <CardTitle className="text-base">Тэргүүлэгчид</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Шилдэг тоглогчид бүх ангилалд
              </p>
            </CardContent>
          </Card>
        </Link>
      </section>
    </main>
  );
}

/** Inline team color dot — avoids extracting a trivial wrapper. */
function TeamDot({ color }: { color: string | null }) {
  return (
    <span
      className="inline-block size-3 shrink-0 rounded-full border"
      style={{
        backgroundColor: color ?? "oklch(0.5 0 0)",
      }}
      aria-hidden="true"
    />
  );
}
