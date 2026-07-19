import type { Metadata } from "next";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { getLeaders, getMvpRace } from "../lib/data";
import { LeaderTabs } from "./components/leader-tabs";
import { MvpRace } from "./components/mvp-race";

export const metadata: Metadata = {
  title: "Тэргүүлэгчид — Оноо",
  description:
    "Сагсан бөмбөгийн лигийн шилдэг тоглогчид бүх ангилалд: оноо, давсан, олгосон, булаасан, хаасан.",
};

export default async function LeadersPage({
  searchParams,
}: {
  searchParams: Promise<{ competition?: string }>;
}) {
  const { competition } = await searchParams;
  const allLeaders = await getLeaders(true);

  const competitions = Array.from(
    new Map(
      allLeaders.map((row) => [
        row.competition_id,
        row.competition_name,
      ]),
    ),
  );

  const activeCompetitionId = competition ?? competitions[0]?.[0];
  const leaders = activeCompetitionId
    ? allLeaders.filter((row) => row.competition_id === activeCompetitionId)
    : allLeaders;

  // Derive active competition for MVP race
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

      {competitions.length > 1 && (
        <nav aria-label="Тэмцээн сонгох" className="flex flex-wrap gap-2">
          {competitions.map(([id, item]) => (
            <Link
              key={id}
              href={`/leaders?competition=${id}`}
              className={cn(
                "inline-flex h-7 shrink-0 items-center justify-center gap-1 rounded-[min(var(--radius-md),12px)] px-2.5 text-[0.8rem] font-medium whitespace-nowrap transition-all outline-none select-none [&_svg:not([class*='size-'])]:size-3.5",
                id === activeCompetitionId
                  ? "bg-primary text-primary-foreground hover:bg-primary/80"
                  : "border-border bg-background hover:bg-muted hover:text-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
              )}
            >
              {item}
            </Link>
          ))}
        </nav>
      )}

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
