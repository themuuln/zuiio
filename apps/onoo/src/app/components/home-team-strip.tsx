import Link from "next/link";
import { TeamLogo } from "@/components/team-logo";
import type { StandingRow } from "../lib/shared";

interface HomeTeamStripProps {
  /** Standings rows double as the league team list (logo, short code, slug). */
  teams: StandingRow[];
}

/**
 * League team logo strip — one tile per team, horizontally scrollable.
 * Follows the Mongolian league-site convention (koo.mn shows all teams
 * on the homepage) without needing a separate teams fetch.
 */
export function HomeTeamStrip({ teams }: HomeTeamStripProps) {
  const seen = new Set<string>();
  const uniqueTeams = teams.filter((team) => {
    if (seen.has(team.team_id)) return false;
    seen.add(team.team_id);
    return true;
  });

  if (uniqueTeams.length === 0) return null;

  return (
    <section
      aria-labelledby="teams-heading"
      className="rounded-xl bg-[var(--surface-1)] px-4 py-5 sm:px-6"
    >
      <div className="flex items-center justify-between">
        <p
          id="teams-heading"
          className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
        >
          Багууд · {uniqueTeams.length}
        </p>
        <Link
          href="/standings"
          className="text-xs text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md px-1 py-0.5"
        >
          Шалгуур →
        </Link>
      </div>
      <div className="mt-3 flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {uniqueTeams.map((team) => (
          <Link
            key={team.team_id}
            href={`/teams/${team.team_slug}`}
            className="flex min-w-20 shrink-0 flex-col items-center gap-2 rounded-xl border bg-card px-3 py-3 transition-[box-shadow,transform] hover:shadow-md active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <TeamLogo
              logoUrl={team.team_logo_url}
              shortCode={team.team_short_code}
              primaryColor={team.team_primary_color}
              size="md"
            />
            <span className="max-w-full truncate text-xs font-semibold">
              {team.team_short_code}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
