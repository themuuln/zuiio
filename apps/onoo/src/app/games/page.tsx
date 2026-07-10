import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getGamesByDate, formatGameTime, statusLabel } from "../lib/data";
import { DateNav } from "./components/date-nav";

export const metadata: Metadata = {
  title: "Тоглолтууд — Оноо",
  description: "Сагсан бөмбөгийн лигийн тоглолтуудын хуваарь ба үр дүн.",
};

export default async function GamesPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date: dateParam } = await searchParams;
  const dateStr = dateParam ?? new Date().toISOString().slice(0, 10);
  const games = await getGamesByDate(dateStr);

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 space-y-6">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Тоглолтууд</h1>
        <p className="text-muted-foreground">
          Тоглолтын хуваарь ба үр дүн
        </p>
      </header>

      <DateNav currentDate={dateStr} />

      {games.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Энэ өдөр тоглолт товлогоогүй байна.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {games.map((game) => (
            <Link key={game.id} href={`/games/${game.id}`}>
              <Card className="transition-colors hover:bg-accent/50">
                <CardContent className="flex items-center gap-4 py-4 px-6">
                  {/* Time / Status */}
                  <div className="w-16 shrink-0 text-center">
                    {game.status === "live_provisional" ? (
                      <Badge variant="destructive">Шууд</Badge>
                    ) : game.status === "final_pending_review" ||
                      game.status === "league_verified" ? (
                      <span className="text-xs text-muted-foreground">
                        Дууссан
                      </span>
                    ) : (
                      <span className="text-sm font-medium tabular-nums">
                        {formatGameTime(game.scheduled_at)}
                      </span>
                    )}
                  </div>

                  {/* Home team */}
                  <div className="flex-1 text-right">
                    <span className="inline-flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {game.home_name}
                      </span>
                      <span
                        className="inline-block size-3 rounded-full border"
                        style={{
                          backgroundColor:
                            game.home_color ?? "oklch(0.5 0 0)",
                        }}
                        aria-hidden="true"
                      />
                    </span>
                  </div>

                  {/* Score / Status */}
                  <div className="w-20 shrink-0 text-center">
                    {game.status === "final_pending_review" ||
                    game.status === "league_verified" ? (
                      <span className="text-lg font-bold tabular-nums">
                        {game.home_score} — {game.away_score}
                      </span>
                    ) : game.status === "live_provisional" ? (
                      <span className="text-lg font-bold tabular-nums text-red-500">
                        {game.home_score ?? 0} — {game.away_score ?? 0}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        {statusLabel(game.status)}
                      </span>
                    )}
                  </div>

                  {/* Away team */}
                  <div className="flex-1">
                    <span className="inline-flex items-center gap-2">
                      <span
                        className="inline-block size-3 rounded-full border"
                        style={{
                          backgroundColor:
                            game.away_color ?? "oklch(0.5 0 0)",
                        }}
                        aria-hidden="true"
                      />
                      <span className="text-sm font-medium">
                        {game.away_name}
                      </span>
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
