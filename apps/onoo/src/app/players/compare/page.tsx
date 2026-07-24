import type { Metadata } from "next";
import { getPlayers } from "../../lib/data";
import { ComparePlayersClient } from "./compare-players-client";

export const metadata: Metadata = {
  title: "Тоглогч харьцуулах — Оноо",
  description:
    "Хоёр тоглогчийн оноо, самбар, дамжуулалт, хамгаалалт болон шидэлтийг зэрэгцүүлэн харьцуулах.",
};

export default async function ComparePlayersPage({
  searchParams,
}: {
  searchParams: Promise<{ players?: string }>;
}) {
  const { players: playersParam = "" } = await searchParams;
  const players = await getPlayers();
  const initialPlayerIds = playersParam.split(",").filter(Boolean).slice(0, 2);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <header className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Толгой тулсан үзүүлэлт
        </p>
        <h1 className="mt-2 font-display text-4xl leading-tight tracking-tight sm:text-5xl">
          Тоглогч харьцуулах
        </h1>
        <p className="mt-3 leading-relaxed text-muted-foreground">
          Хоёр тоглогч сонгож улирлын гол үзүүлэлт, шидэлт болон үр ашгийг нэг
          дэлгэц дээр харьцуулна.
        </p>
      </header>

      <ComparePlayersClient
        players={players}
        initialPlayerIds={initialPlayerIds}
      />
    </main>
  );
}
