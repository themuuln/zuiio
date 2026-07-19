import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays, Trophy, Users } from "lucide-react";
import { TeamLogo } from "@/components/team-logo";
import { Badge } from "@zuiio/ui";
import { PublicEmptyState } from "../../components/public-empty-state";
import {
  getCompetition,
  getStandings,
  getLeaders,
} from "../../lib/data";

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
  const [competition, allStandings, allLeaders] = await Promise.all([
    getCompetition(id),
    getStandings(),
    getLeaders(true),
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

  const standings = allStandings.filter(
    (row) => row.competition_id === id,
  );
  const leaders = allLeaders.filter(
    (row) => row.competition_id === id,
  );

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
            {competition.season} улирлын бүрэн статистик, байрлал болон шилдгүүд.
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
