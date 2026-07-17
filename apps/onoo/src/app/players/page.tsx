import type { Metadata } from "next";
import { getPlayers } from "../lib/data";
import { PlayerGrid } from "./components/player-grid";

export const metadata: Metadata = {
  title: "Тоглогчид — Оноо",
  description: "Сагсан бөмбөгийн лигийн бүх тоглогчид — нэр, баг, статистик.",
};

export default async function PlayersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const players = await getPlayers();

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <header className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Тамирчдын түүх
        </p>
        <h1 className="mt-2 font-display text-4xl leading-tight tracking-tight sm:text-5xl">
          Тоглогчид
        </h1>
        <p className="mt-3 leading-relaxed text-muted-foreground">
          Тоглогчоо нэр, баг, байрлалаар олж улирлын гүйцэтгэл болон бүрэн
          тоглолтын түүхийг нь үзээрэй.
        </p>
        {players.length > 0 && (
          <p className="mt-4 text-sm tabular-nums text-muted-foreground">
            <span className="stat-number">{players.length}</span> тоглогч
          </p>
        )}
      </header>

      <PlayerGrid players={players} initialSearch={q} />
    </main>
  );
}
