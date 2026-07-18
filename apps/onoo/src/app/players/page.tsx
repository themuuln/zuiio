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
      {/* ── Hero header with court motif ── */}
      <header className="court-accent relative overflow-hidden rounded-xl bg-sidebar px-6 py-8 sm:px-10 sm:py-10">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          aria-hidden="true"
          style={{
            backgroundImage: [
              "linear-gradient(to right, transparent 49.8%, var(--color-sidebar-border) 50%, transparent 50.2%)",
              "radial-gradient(circle at 50% 50%, transparent 0 14%, var(--color-sidebar-border) 14.2% 14.5%, transparent 14.7%)",
            ].join(", "),
          }}
        />
        <div className="relative max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/60">
            Тамирчдын түүх
          </p>
          <h1 className="mt-2 font-display text-4xl leading-tight tracking-tight text-sidebar-foreground sm:text-5xl">
            Тоглогчид
          </h1>
          <p className="mt-3 leading-relaxed text-sidebar-foreground/70">
            Тоглогчоо нэр, баг, байрлалаар олж улирлын гүйцэтгэл болон бүрэн
            тоглолтын түүхийг нь үзээрэй.
          </p>
          {players.length > 0 && (
            <p className="mt-4 text-sm tabular-nums text-sidebar-foreground/50">
              <span className="font-display text-lg text-warning">
                {players.length}
              </span>{" "}
              тоглогч
            </p>
          )}
        </div>
      </header>

      <PlayerGrid players={players} initialSearch={q} />
    </main>
  );
}
