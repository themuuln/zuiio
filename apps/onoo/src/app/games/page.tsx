import type { Metadata } from "next";
import { getUlaanbaatarDate } from "../lib/data";
import { DateNav } from "./components/date-nav";
import { GamesList } from "./components/games-list";

export const metadata: Metadata = {
  title: "Тоглолтууд — Оноо",
  description: "Сагсан бөмбөгийн лигийн тоглолтын хуваарь ба үр дүн.",
};

export default async function GamesPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date } = await searchParams;
  const dateStr = date ?? (await getUlaanbaatarDate());

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Тоглолтын хуваарь
        </p>
        <h1 className="font-display text-4xl leading-tight tracking-tight sm:text-5xl">
          Тоглолтууд
        </h1>
      </div>

      {/* Date navigation */}
      <DateNav currentDate={dateStr} />

      {/* Games list (streams via Suspense) */}
      <GamesList dateStr={dateStr} />
    </main>
  );
}
