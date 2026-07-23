import { BarChart3 } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { ViewBeacon } from "@/components/view-beacon";
import { cn } from "@/lib/utils";
import { PublicEmptyState } from "../components/public-empty-state";
import { getLeaders, getMvpRace } from "../lib/data";
import type { LeaderRow } from "../lib/shared";
import { CompactLeaderRow } from "./components/leader-row";
import { MvpRace } from "./components/mvp-race";
import { Podium } from "./components/podium";
import { UnqualifiedSection } from "./components/unqualified-section";

export const metadata: Metadata = {
  title: "Тэргүүлэгчид — Оноо",
  description:
    "Сагсан бөмбөгийн лигийн шилдэг тоглогчид бүх ангилалд: оноо, давсан, олгосон, булаасан, хаасан.",
};
export const revalidate = 3600;

const STATS = [
  {
    key: "pts" as const,
    label: "Оноо",
    getValue: (l: LeaderRow) => l.pts ?? 0,
  },
  {
    key: "reb" as const,
    label: "Самбар",
    getValue: (l: LeaderRow) => (l.oreb ?? 0) + (l.dreb ?? 0),
  },
  {
    key: "ast" as const,
    label: "Дамжуулалт",
    getValue: (l: LeaderRow) => l.ast ?? 0,
  },
  {
    key: "stl" as const,
    label: "Бөмбөг таслалт",
    getValue: (l: LeaderRow) => l.stl ?? 0,
  },
  {
    key: "blk" as const,
    label: "Хаалт",
    getValue: (l: LeaderRow) => l.blk ?? 0,
  },
] as const;

export default async function LeadersPage({
  searchParams,
}: {
  searchParams: Promise<{ competition?: string; stat?: string }>;
}) {
  const { competition, stat } = await searchParams;
  // Qualified leaders for main leaderboard
  const qualifiedLeaders = await getLeaders();
  // All leaders including unqualified, for the unqualified section
  const allLeaders = await getLeaders(true);

  const competitions = Array.from(
    new Map(
      allLeaders.map(
        (row) => [row.competition_id, row.competition_name] as const,
      ),
    ),
  );
  const activeCompetitionId = competition ?? competitions[0]?.[0];
  const activeStatKey =
    STATS.find((s) => s.key === stat)?.key ?? ("pts" as const);
  const activeConfig = STATS.find((s) => s.key === activeStatKey)!;

  // Filter qualified leaders for the main leaderboard
  const filteredQualified = activeCompetitionId
    ? qualifiedLeaders.filter(
        (row) => row.competition_id === activeCompetitionId,
      )
    : qualifiedLeaders;

  const sorted = [...filteredQualified]
    .sort((a, b) => activeConfig.getValue(b) - activeConfig.getValue(a))
    .slice(0, 10);

  const top3 = sorted.slice(0, 3);
  const rest = sorted.slice(3);

  // Filter unqualified players for the expandable section
  const unqualified = activeCompetitionId
    ? allLeaders.filter(
        (row) => row.competition_id === activeCompetitionId && !row.qualified,
      )
    : allLeaders.filter((row) => !row.qualified);

  const mvpCandidates = activeCompetitionId
    ? await getMvpRace(activeCompetitionId)
    : [];

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <ViewBeacon
        entityType="leaders"
        entityId="00000000-0000-0000-0000-000000000000"
      />
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
              href={`/leaders?stat=${activeStatKey}&competition=${id}`}
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
        <div className="space-y-6 lg:col-span-8">
          {/* Stat category tabs */}
          <nav aria-label="Үзүүлэлт сонгох">
            <div className="flex flex-wrap gap-2">
              {STATS.map((s) => (
                <Link
                  key={s.key}
                  href={`/leaders?stat=${s.key}&competition=${activeCompetitionId ?? ""}`}
                  className={cn(
                    "inline-flex h-8 items-center justify-center gap-1 rounded-[min(var(--radius-md),12px)] px-3 text-sm font-medium whitespace-nowrap transition-all",
                    s.key === activeStatKey
                      ? "bg-primary text-primary-foreground"
                      : "border border-border bg-background hover:bg-muted",
                  )}
                >
                  {s.label}
                </Link>
              ))}
            </div>
          </nav>
          {/* Podium — top 3 */}
          {top3.length > 0 && <Podium leaders={top3} statKey={activeStatKey} />}

          {/* Compact rows — ranks 4–10 */}
          {rest.length > 0 && (
            <div className="divide-y divide-border rounded-xl border">
              {rest.map((leader, i) => (
                <CompactLeaderRow
                  key={leader.player_id}
                  leader={leader}
                  rank={i + 4}
                  statValue={activeConfig.getValue(leader)}
                />
              ))}
            </div>
          )}

          {/* Empty state — when no qualified leaders for this competition */}
          {top3.length === 0 && rest.length === 0 && (
            <PublicEmptyState
              icon={BarChart3}
              title="Статистик байхгүй"
              description="Энэ тэмцээнд шалгуур хангасан тоглогч байхгүй байна."
            />
          )}
        </div>

        <aside className="lg:col-span-4">
          <MvpRace candidates={mvpCandidates} className="sticky top-24" />
        </aside>
      </div>

      {unqualified.length > 0 && (
        <UnqualifiedSection
          unqualifiedPlayers={unqualified}
          statLabel={activeConfig.label}
        />
      )}
    </main>
  );
}
