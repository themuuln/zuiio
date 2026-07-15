import { CalendarDays, Radio } from "lucide-react";
import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { GameCard } from "../components/game-card";
import { PublicEmptyState } from "../components/public-empty-state";
import {
  formatDate,
  type GameWithTeams,
  getGamesByDate,
  getUlaanbaatarDate,
} from "../lib/data";
import { DateNav } from "./components/date-nav";

export const metadata: Metadata = {
  title: "Тоглолтууд — Оноо",
  description: "Сагсан бөмбөгийн лигийн тоглолтын хуваарь ба үр дүн.",
};

function isFinal(game: GameWithTeams): boolean {
  return (
    game.status === "final_pending_review" ||
    game.status === "league_verified" ||
    game.status === "official"
  );
}

export default async function GamesPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date } = await searchParams;
  const dateStr = date ?? getUlaanbaatarDate();
  const games = await getGamesByDate(dateStr);
  const liveGames = games.filter((game) => game.status === "live_provisional");
  const upcomingGames = games.filter(
    (game) =>
      game.status === "scheduled" ||
      game.status === "postponed" ||
      game.status === "cancelled",
  );
  const completedGames = games.filter(isFinal);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <header className="grid gap-5 lg:grid-cols-12 lg:items-end">
        <div className="lg:col-span-7">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Хуваарь ба үр дүн
          </p>
          <h1 className="mt-2 font-display text-4xl leading-tight tracking-tight sm:text-5xl">
            Тоглолтын төв
          </h1>
          <p className="mt-3 max-w-2xl leading-relaxed text-muted-foreground">
            Өдрийн бүх тоглолтыг шууд, удахгүй, дууссан төлөвөөр нь нэг дор
            хараарай.
          </p>
        </div>
        <div className="lg:col-span-5 lg:justify-self-end">
          <p className="mb-2 text-sm font-semibold">{formatDate(dateStr)}</p>
          <DateNav currentDate={dateStr} />
        </div>
      </header>

      {games.length === 0 ? (
        <PublicEmptyState
          icon={CalendarDays}
          title="Энэ өдөр тоглолтгүй"
          description="Өөр өдөр сонгох эсвэл өнөөдрийн хуваарь руу буцаж шалгана уу."
          actionHref={`/games?date=${getUlaanbaatarDate()}`}
          actionLabel="Өнөөдөр рүү буцах"
        />
      ) : (
        <div className="flex flex-col gap-10">
          {liveGames.length > 0 ? (
            <GameGroup
              id="live-games"
              eyebrow="Яг одоо"
              title="Шууд тоглолт"
              games={liveGames}
              live
            />
          ) : null}
          {upcomingGames.length > 0 ? (
            <GameGroup
              id="upcoming-games"
              eyebrow="Дараагийн бөмбөг"
              title="Удахгүй эхлэх"
              games={upcomingGames}
            />
          ) : null}
          {completedGames.length > 0 ? (
            <GameGroup
              id="completed-games"
              eyebrow="Баталгаажсан түүх"
              title="Дууссан тоглолт"
              games={completedGames}
            />
          ) : null}
        </div>
      )}
    </main>
  );
}

interface GameGroupProps {
  id: string;
  eyebrow: string;
  title: string;
  games: GameWithTeams[];
  live?: boolean;
}

function GameGroup({
  id,
  eyebrow,
  title,
  games,
  live = false,
}: GameGroupProps) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-4">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {eyebrow}
          </p>
          <h2 id={id} className="mt-1 text-2xl font-bold tracking-tight">
            {title}
          </h2>
        </div>
        <Badge variant={live ? "destructive" : "secondary"}>
          {live ? <Radio data-icon="inline-start" aria-hidden="true" /> : null}
          {games.length} тоглолт
        </Badge>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {games.map((game) => (
          <GameCard key={game.id} game={game} featured={live} />
        ))}
      </div>
    </section>
  );
}
