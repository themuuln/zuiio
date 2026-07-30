import { CalendarDays, Trophy, Users } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { TeamLogo } from "@/components/team-logo";
import { Badge } from "@/components/ui";
import { PublicEmptyState } from "../../components/public-empty-state";
import {
  getClassificationRounds,
  getCompetition,
  getLeaders,
  getStandings,
  getTournamentBracket,
  getTournamentGroups,
  getTournamentPhases,
} from "../../lib/data";
import { ClassificationBracket } from "./components/classification-bracket";
import { GroupStandings } from "./components/group-standings";
import { TournamentBracket } from "./components/tournament-bracket";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const competition = await getCompetition(id);
  return {
    title: competition ? `${competition.name} — Оноо` : "Тэмцээн — Оноо",
    description: competition
      ? `${competition.name} тэмцээний байрлал, тоглолт, шилдгүүд.`
      : "Тэмцээний мэдээлэл.",
  };
}

export default async function TournamentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [
    competition,
    allStandings,
    allLeaders,
    phases,
    groups,
    classificationRounds,
    bracket,
  ] = await Promise.all([
    getCompetition(id),
    getStandings(),
    getLeaders(true),
    getTournamentPhases(id),
    getTournamentGroups(id),
    getClassificationRounds(id),
    getTournamentBracket(id),
  ]);

  if (!competition) {
    return (
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <PublicEmptyState
          icon={Trophy}
          title="Тэмцээн олдсонгүй"
          description="Энэ тэмцээний мэдээлэл байхгүй байна."
          actionHref="/standings"
          actionLabel="Шалгуур харах"
        />
      </main>
    );
  }

  const standings = allStandings.filter((row) => row.competition_id === id);
  const leaders = allLeaders.filter((row) => row.competition_id === id);

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      {/* Header */}
      <header className="flex flex-col gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {competition.league}
          </p>
          <h1 className="mt-2 font-display text-4xl leading-tight tracking-tight sm:text-5xl">
            {competition.name}
          </h1>
          <p className="mt-3 max-w-2xl leading-relaxed text-muted-foreground">
            {competition.season} улирлын бүрэн статистик, байрлал болон
            шилдгүүд.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/standings?competition=${id}`}
            className="inline-flex items-center gap-2 rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <Trophy className="size-4" />
            Шалгуур
          </Link>
          <Link
            href={`/leaders?competition=${id}`}
            className="inline-flex items-center gap-2 rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <Users className="size-4" />
            Тэргүүлэгчид
          </Link>
        </div>
      </header>

      {/* Standings Preview */}
      {standings.length > 0 && (
        <section aria-labelledby="tournament-standings">
          <h2
            id="tournament-standings"
            className="mb-4 font-display text-2xl font-semibold"
          >
            Байрлал
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {standings.slice(0, 6).map((row, index) => (
              <Link
                key={row.team_season_id}
                href={`/teams/${row.team_slug}`}
                className="group flex items-center gap-4 rounded-xl border p-4 transition-colors hover:bg-sidebar-accent/50"
              >
                <span className="stat-number text-xl text-muted-foreground">
                  {index + 1}
                </span>
                <TeamLogo
                  logoUrl={row.team_logo_url}
                  shortCode={row.team_short_code}
                  size="sm"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold group-hover:text-[var(--brand-sports)]">
                    {row.team_name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {row.w}W - {row.l}L
                  </p>
                </div>
                <Badge variant="secondary">
                  {(row.win_pct * 100).toFixed(1)}%
                </Badge>
              </Link>
            ))}
          </div>
          {standings.length > 6 && (
            <div className="mt-4">
              <Link
                href={`/standings?competition=${id}`}
                className="inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                Бүх баг →
              </Link>
            </div>
          )}
        </section>
      )}

      {/* Leaders Preview */}
      {leaders.length > 0 && (
        <section aria-labelledby="tournament-leaders">
          <h2
            id="tournament-leaders"
            className="mb-4 font-display text-2xl font-semibold"
          >
            Шилдгүүд
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {leaders.slice(0, 4).map((leader) => (
              <Link
                key={leader.player_id}
                href={`/players/${leader.player_id}`}
                className="group flex items-center gap-3 rounded-xl border p-4 transition-colors hover:bg-sidebar-accent/50"
              >
                <TeamLogo
                  logoUrl={leader.team_logo_url}
                  shortCode={leader.team_short_code}
                  size="sm"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold group-hover:text-[var(--brand-sports)]">
                    {leader.player_name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {leader.pts?.toFixed(1)} PPG
                  </p>
                </div>
              </Link>
            ))}
          </div>
          <div className="mt-4">
            <Link
              href={`/leaders?competition=${id}`}
              className="inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              Бүх тэргүүлэгч →
            </Link>
          </div>
        </section>
      )}

      {/* Group Standings */}
      <section aria-labelledby="tournament-groups">
        <h2
          id="tournament-groups"
          className="mb-4 font-display text-2xl font-semibold"
        >
          Хэсгийн байрлал
        </h2>
        {phases.length > 0 && groups.length > 0 ? (
          <GroupStandings groups={groups} />
        ) : (
          <div className="relative">
            <div className="blur-[3px] pointer-events-none">
              <div className="grid gap-6 md:grid-cols-2">
                {["А", "Б"].map((name) => (
                  <div key={name}>
                    <h3 className="font-semibold mb-2">Хэсэг {name}</h3>
                    <div className="rounded-lg border">
                      <div className="flex items-center gap-2 border-b px-4 py-2 text-xs font-medium text-muted-foreground">
                        <span className="flex-1">Баг</span>
                        <span className="w-12 text-center">Я</span>
                        <span className="w-12 text-center">Х</span>
                        <span className="w-12 text-center">О</span>
                        <span className="w-12 text-center">А</span>
                      </div>
                      <div className="p-4 text-sm text-muted-foreground/60 flex items-center justify-center py-8">
                        —
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-[1px]">
              <div className="rounded-lg border bg-background px-4 py-2 text-center shadow-sm">
                <p className="text-sm font-medium text-muted-foreground">
                  Тун удахгүй
                </p>
                <p className="text-xs text-muted-foreground/60">Coming Soon</p>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Knockout Bracket */}      <section aria-labelledby="tournament-bracket">        {bracket.length > 0 ? (          <TournamentBracket matchups={bracket} />        ) : (          <div className="relative">            <div className="blur-[3px] pointer-events-none">              <TournamentBracket matchups={[]} />            </div>            <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-[1px]">              <div className="rounded-lg border bg-background px-4 py-2 text-center shadow-sm">                <p className="text-sm font-medium text-muted-foreground">                  Тун удахгүй                </p>                <p className="text-xs text-muted-foreground/60">Coming Soon</p>              </div>            </div>          </div>        )}      </section>      {/* Classification Bracket */}
      <section aria-labelledby="tournament-classification">
        {phases.length > 0 && classificationRounds.length > 0 ? (
          <ClassificationBracket rounds={classificationRounds} />
        ) : (
          <div className="relative">
            <div className="blur-[3px] pointer-events-none">
              <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
                <div className="flex flex-col space-y-1.5 p-6 pb-3">
                  <h3 className="font-semibold leading-none tracking-tight">
                    Классификацийн шат
                  </h3>
                </div>
                <div className="p-6 pt-2">
                  <div className="space-y-4">
                    {["Хагас шигшээ", "Шигшээ"].map((round) => (
                      <div key={round}>
                        <h4 className="text-sm text-muted-foreground mb-2">
                          {round}
                        </h4>
                        <div className="space-y-2">
                          {[1, 2].map((i) => (
                            <div
                              key={i}
                              className="flex items-center justify-between text-sm p-2 rounded border"
                            >
                              <span>Баг A</span>
                              <span className="font-mono font-bold mx-3">
                                ? – ?
                              </span>
                              <span>Баг Б</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-[1px]">
              <div className="rounded-lg border bg-background px-4 py-2 text-center shadow-sm">
                <p className="text-sm font-medium text-muted-foreground">
                  Тун удахгүй
                </p>
                <p className="text-xs text-muted-foreground/60">Coming Soon</p>
              </div>
            </div>
          </div>
        )}
      </section>
      {/* Empty state */}
      {standings.length === 0 && leaders.length === 0 && (
        <PublicEmptyState
          icon={CalendarDays}
          title="Мэдээлэл байхгүй"
          description="Энэ тэмцээний статистик одоогоор байхгүй байна."
          actionHref="/games"
          actionLabel="Тоглолтууд харах"
        />
      )}
    </main>
  );
}
