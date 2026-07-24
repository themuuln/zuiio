import type { Metadata } from "next";
import { getPlayers } from "../lib/data";
import { PlayerGrid } from "./components/player-grid";

export const metadata: Metadata = {
  title: "Тоглогчид — Оноо",
  description:
    "Сагсан бөмбөгийн лигийн бүх тоглогчид — нэр, баг, статистик.",
};

export default async function PlayersPage() {
  const players = await getPlayers();

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 space-y-6">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Тоглогчид</h1>
        <p className="text-muted-foreground">
          Бүх тоглогчид — хайж, шүүж, статистик үзэх
        </p>
      </header>

      <PlayerGrid players={players} />
    </main>
  );
}
