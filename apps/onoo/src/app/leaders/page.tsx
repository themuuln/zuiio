import type { Metadata } from "next";
import { getLeaders, getMvpRace } from "../lib/data";
import { LeaderTabs } from "./components/leader-tabs";
import { MvpRace } from "./components/mvp-race";

export const metadata: Metadata = {
  title: "Тэргүүлэгчид — Оноо",
  description:
    "Сагсан бөмбөгийн лигийн шилдэг тоглогчид бүх ангилалд: оноо, давсан, олгосон, булаасан, хаасан.",
};

export default async function LeadersPage() {
  const leaders = await getLeaders(true);

  // Derive active competition from leaders data for MVP race
  const activeCompetitionId = leaders[0]?.competition_id ?? null;
  const mvpCandidates = activeCompetitionId
    ? await getMvpRace(activeCompetitionId)
    : [];

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <header className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Лигийн шилдгүүд
        </p>
        <h1 className="mt-2 font-display text-4xl leading-tight tracking-tight sm:text-5xl">
          Тэргүүлэгчид
        </h1>
        <p className="mt-3 leading-relaxed text-muted-foreground">
          Ангилал бүрийн шилдэг тоглогчдыг зураг, баг, тоглолтын тоо болон
          шалгуурын төлөвтэй нь харьцуулна.
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <LeaderTabs leaders={leaders} />
        </div>
        <aside className="lg:col-span-4">
          <MvpRace candidates={mvpCandidates} className="sticky top-24" />
        </aside>
      </div>
    </main>
  );
}
