import Link from "next/link";
import { getPlayerById, getPlayerSeasonAverages } from "@/app/lib/data";
import { PlayerAvatar } from "@/components/player-avatar";
import { TeamLogo } from "@/components/team-logo";
import { Badge } from "@/components/ui/badge";
import { StatNumber } from "./stat-number";
import { getStatLabel } from "@onoo/core";

interface HeroCardProps {
  playerId: string;
  competitionId: string | null;
  careerTotals?: { gp: number; pts: number; reb: number; ast: number } | null;
}

const BRAND_ACCENT = "oklch(0.78 0.16 80)";

/**
 * Trading-card style hero for the player page.
 * Server Component — fetches bio + season averages.
 */
export async function HeroCard({ playerId, competitionId, careerTotals }: HeroCardProps) {
  const [data, averages] = await Promise.all([
    getPlayerById(playerId),
    competitionId ? getPlayerSeasonAverages(playerId, competitionId) : Promise.resolve(null),
  ]);

  if (!data?.player) return null;

  const { player } = data;

  return (
    <div
      className="overflow-hidden rounded-xl border border-border bg-card"
      style={{ "--team-color": BRAND_ACCENT } as React.CSSProperties}
    >
      {/* Accent top bar */}
      <div
        className="h-1 w-full"
        style={{ backgroundColor: "var(--team-color)" }}
      />

      {/* Identity row: avatar + bio */}
      <div className="flex items-center gap-4 p-4 sm:gap-6 sm:p-6">
        <PlayerAvatar
          photoUrl={player.photo_url}
          name={player.canonical_name}
          primaryColor={null}
          size="xl"
        />

        <div className="min-w-0 flex-1 space-y-1.5">
          {/* Name + jersey */}
          <div className="flex items-baseline gap-2">
            <h1 className="min-w-0 truncate text-2xl font-bold tracking-tight sm:text-3xl">
              {player.canonical_name}
            </h1>
            {player.jersey_number != null && (
              <span
                className="shrink-0 text-lg font-semibold tabular-nums"
                style={{ color: "var(--team-color)" }}
              >
                #{player.jersey_number}
              </span>
            )}
          </div>

          {/* Position + nationality */}
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            {player.position && <Badge variant="outline">{player.position}</Badge>}
            {player.nationality && <span>{player.nationality}</span>}
          </div>

          {/* Team chip */}
          <Link
            href={`/teams/${player.team_slug}`}
            className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 -ml-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors min-h-11"
          >
            <TeamLogo
              logoUrl={player.team_logo_url}
              shortCode={player.team_name.slice(0, 3).toUpperCase()}
              size="sm"
            />
            <span>{player.team_name}</span>
          </Link>
        </div>
      </div>

      {/* Stats row — 3 cols mobile, 5 cols sm+ */}
      {careerTotals ? (
        <div className="grid grid-cols-4 gap-3 border-t border-border px-4 py-4 sm:gap-4 sm:px-6">
          <StatNumber value={careerTotals.gp} label="Тоглолт" />
          <StatNumber value={careerTotals.pts} label={getStatLabel("pts", "mn")} />
          <StatNumber value={careerTotals.reb} label="Давсан" />
          <StatNumber value={careerTotals.ast} label={getStatLabel("ast", "mn")} />
        </div>
      ) : averages ? (
        <div className="grid grid-cols-3 gap-3 border-t border-border px-4 py-4 sm:grid-cols-5 sm:gap-4 sm:px-6">
          <StatNumber value={averages.ppg} label={getStatLabel("pts", "mn")} />
          <StatNumber value={averages.rpg} label="Давсан" />
          <StatNumber value={averages.apg} label={getStatLabel("ast", "mn")} />
          <div className="hidden sm:block">
            <StatNumber value={averages.spg} label={getStatLabel("stl", "mn")} />
          </div>
          <div className="hidden sm:block">
            <StatNumber value={averages.bpg} label={getStatLabel("blk", "mn")} />
          </div>
        </div>
      ) : null}
    </div>
  );
}
