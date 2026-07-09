import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  getGameById,
  getPlayByPlay,
  formatGameTime,
  statusLabel,
} from "../../lib/data";
import { LiveGameCenter } from "./components/live-game-center";

type GamePageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: GamePageProps): Promise<Metadata> {
  const { id } = await params;
  const game = await getGameById(id);
  if (!game) return { title: "Тоглолт олдсонгүй — Оноо" };

  return {
    title: `${game.home_name} vs ${game.away_name} — Оноо`,
    description: `${game.home_name} vs ${game.away_name} тоглолтын дэлгэрэнгүй тоо баримт.`,
  };
}

export default async function GameDetailPage({ params }: GamePageProps) {
  const { id } = await params;
  const game = await getGameById(id);
  if (!game) notFound();

  const isFinal =
    game.status === "final" ||
    game.status === "verified" ||
    game.status === "official";
  const isLive = game.status === "live";
  const playByPlay = isLive ? await getPlayByPlay(game.id) : [];

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 space-y-6">
      {/* Game header */}
      <Card>
        <CardContent className="py-6">
          <div className="flex items-center justify-center gap-6 sm:gap-10">
            {/* Home */}
            <div className="flex flex-col items-center gap-2 min-w-0">
              <span
                className="inline-block size-10 rounded-full border-2"
                style={{
                  backgroundColor: game.home_color ?? "oklch(0.5 0 0)",
                }}
                aria-hidden="true"
              />
              <span className="text-sm font-semibold text-center">
                {game.home_name}
              </span>
            </div>

            {/* Score / Time */}
            <div className="text-center shrink-0">
              {isFinal || game.status === "official" ? (
                <div className="text-4xl font-bold tabular-nums">
                  {game.home_score} — {game.away_score}
                </div>
              ) : isLive ? (
                <div className="text-4xl font-bold tabular-nums text-red-500">
                  {game.home_score ?? 0} — {game.away_score ?? 0}
                </div>
              ) : (
                <div className="text-2xl font-semibold tabular-nums text-muted-foreground">
                  {formatGameTime(game.scheduled_at)}
                </div>
              )}
              <Badge
                variant={
                  isLive
                    ? "destructive"
                    : isFinal
                      ? "secondary"
                      : "outline"
                }
                className="mt-2"
              >
                {statusLabel(game.status)}
              </Badge>
              {isLive && game.current_period > 0 && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {game.current_period}р үе
                </p>
              )}
            </div>

            {/* Away */}
            <div className="flex flex-col items-center gap-2 min-w-0">
              <span
                className="inline-block size-10 rounded-full border-2"
                style={{
                  backgroundColor: game.away_color ?? "oklch(0.5 0 0)",
                }}
                aria-hidden="true"
              />
              <span className="text-sm font-semibold text-center">
                {game.away_name}
              </span>
            </div>
          </div>

          {/* Venue */}
          <p className="mt-4 text-center text-sm text-muted-foreground">
            {game.venue_name}
            {game.venue_city ? `, ${game.venue_city}` : ""}
          </p>
        </CardContent>
      </Card>

      {/* Live Game Center (live only) */}
      {isLive && (
        <LiveGameCenter
          gameId={game.id}
          homeTeamSeasonId={game.home_team_season_id}
          awayTeamSeasonId={game.away_team_season_id}
          initialEvents={playByPlay as any}
          rosters={[] as any}
          sportConfig={{
            periods: 4,
            period_minutes: 10,
            overtime_minutes: 5,
            fouls_to_bonus: 5,
            personal_foul_limit: 5,
            players_on_court: 5,
          }}
        />
      )}

      {/* Box score (final/verified) */}
      {isFinal && <BoxScoreSection gameId={game.id} />}

      {/* Back link */}
      <div>
        <Link
          href="/games"
          className="text-sm text-primary hover:underline"
        >
          ← Буцах
        </Link>
      </div>

      {/* Export Buttons */}
      <div className="flex gap-2">
        <a href={`/api/export?gameId=${game.id}&type=boxscore`} className="text-sm text-primary hover:underline" download>CSV татаж авах</a>
        <span className="text-muted-foreground">|</span>
        <a href={`/api/export/pdf?gameId=${game.id}`} className="text-sm text-primary hover:underline" target="_blank">PDF татаж авах</a>
      </div>
    </main>
  );
}

async function BoxScoreSection({ gameId }: { gameId: string }) {
  // Mock box score data — in production, fetch from game_player_stats
  const mockBoxScore = [
    {
      player_name: "Бат-Эрдэнэ",
      player_latin: "Bat-Erdene",
      team_short: "ХАС",
      minutes: 30,
      pts: 24,
      fgm: 9,
      fga: 18,
      tpm: 3,
      tpa: 7,
      ftm: 3,
      fta: 4,
      oreb: 1,
      dreb: 4,
      ast: 8,
      stl: 2,
      blk: 0,
      tov: 3,
      pf: 2,
    },
    {
      player_name: "Мөнх-Түвшин",
      player_latin: "Munkh-Tuvshin",
      team_short: "ХАС",
      minutes: 28,
      pts: 18,
      fgm: 7,
      fga: 14,
      tpm: 2,
      tpa: 5,
      ftm: 2,
      fta: 2,
      oreb: 2,
      dreb: 3,
      ast: 4,
      stl: 1,
      blk: 1,
      tov: 2,
      pf: 3,
    },
  ];

  return (
    <section aria-labelledby="boxscore-heading">
      <h2 id="boxscore-heading" className="text-xl font-semibold mb-3">
        Гүйцэтгэлийн хүснэгт
      </h2>
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm" role="table">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="px-3 py-2.5 font-medium" scope="col">Тоглогч</th>
                <th className="px-3 py-2.5 font-medium text-right" scope="col">Мин</th>
                <th className="px-3 py-2.5 font-medium text-right" scope="col">Оноо</th>
                <th className="px-3 py-2.5 font-medium text-right" scope="col">Ор/Нийт</th>
                <th className="px-3 py-2.5 font-medium text-right" scope="col">3О/Нийт</th>
                <th className="px-3 py-2.5 font-medium text-right" scope="col">Шир/Нийт</th>
                <th className="px-3 py-2.5 font-medium text-right" scope="col">Дав</th>
                <th className="px-3 py-2.5 font-medium text-right" scope="col">Олг</th>
                <th className="px-3 py-2.5 font-medium text-right" scope="col">Бул</th>
                <th className="px-3 py-2.5 font-medium text-right" scope="col">Хаа</th>
                <th className="px-3 py-2.5 font-medium text-right" scope="col">Алд</th>
              </tr>
            </thead>
            <tbody>
              {mockBoxScore.map((row) => (
                <tr key={row.player_name} className="border-b last:border-0">
                  <td className="px-3 py-2 font-medium whitespace-nowrap">
                    {row.player_name}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">{row.minutes}</td>
                  <td className="px-3 py-2 text-right tabular-nums font-semibold">{row.pts}</td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {row.fgm}/{row.fga}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {row.tpm}/{row.tpa}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {row.ftm}/{row.fta}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">{row.oreb + row.dreb}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{row.ast}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{row.stl}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{row.blk}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{row.tov}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </section>

  );
}
