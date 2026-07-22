import { getStatLabel } from "@onoo/core";
import { CalendarDays, MapPin, Ruler, Weight } from "lucide-react";
import Link from "next/link";
import type { CSSProperties } from "react";
import { getLeaders, getPlayerById, getPlayerSeasonAverages } from "@/app/lib/data";
import { FlipStatCard } from "@/app/components/flip-stat-card";
import { PlayerAvatar } from "@/components/player-avatar";
import { TeamLogo } from "@/components/team-logo";
import { Badge } from "@/components/ui";
import { cn } from "@/lib/utils";
import { StatNumber } from "./stat-number";

interface HeroCardProps {
  playerId: string;
  competitionId: string | null;
  careerTotals?: { gp: number; pts: number; reb: number; ast: number } | null;
  advancedStats?: {
    tsPct: number;
    efgPct: number;
    avgGameScore: number;
    astTovRatio: number;
  } | null;
  locale?: "mn" | "en";
  className?: string;
}

function formatBirthDate(value: string | null, locale: "mn" | "en"): string {
  if (!value) return "—";

  return new Date(`${value}T12:00:00`).toLocaleDateString(
    locale === "mn" ? "mn-MN" : "en-US",
    {
      year: "numeric",
      month: "short",
      day: "numeric",
    },
  );
}

export async function HeroCard({
  playerId,
  competitionId,
  careerTotals,
  advancedStats,
  locale = "mn",
  className,
}: HeroCardProps) {
  const [data, averages] = await Promise.all([
    getPlayerById(playerId),
    competitionId
      ? getPlayerSeasonAverages(playerId, competitionId)
      : Promise.resolve(null),
  ]);
  // Fetch leaders for rank computation
  const leaders = competitionId ? await getLeaders(true) : [];

  // Compute ranks for each stat
  function getRank(statKey: 'pts' | 'reb' | 'ast'): number | null {
    if (!competitionId || leaders.length === 0) return null;
    const competitionLeaders = leaders.filter(l => l.competition_id === competitionId);
    const sorted = [...competitionLeaders].sort((a, b) => (b[statKey] ?? 0) - (a[statKey] ?? 0));
    const rank = sorted.findIndex(l => l.player_id === playerId);
    return rank >= 0 ? rank + 1 : null;
  }

  const ptsRank = getRank('pts');
  const rebRank = getRank('reb');
  const astRank = getRank('ast');


  if (!data?.player) return null;

  const player =
    data.profiles.find((profile) => profile.competition_id === competitionId) ??
    data.player;
  const isCareer = Boolean(careerTotals);
  const isEn = locale === "en";

  const displayName = isEn
    ? player.name_latin || player.canonical_name
    : player.canonical_name;
  const secondaryName = isEn ? null : player.name_latin;

  const POSITION_MAP: Record<string, string> = {
    G: isEn ? "Guard" : "G",
    F: isEn ? "Forward" : "F",
    C: isEn ? "Center" : "C",
  };

  const factLabels = {
    height: isEn ? "Height" : "Ӣндөр",
    weight: isEn ? "Weight" : "Жин",
    dob: isEn
      ? "Date of Birth"
      : "Төрсөн өдөр",
    nationality: isEn
      ? "Nationality"
      : "Харьяалал",
  };

  return (
    <section
      aria-labelledby="player-name"
      className={cn(
        "player-showcase-hero relative overflow-hidden rounded-3xl border border-sidebar-border bg-sidebar text-sidebar-foreground shadow-xl",
        className,
      )}
      style={{ "--team-color": "var(--brand-sports)" } as CSSProperties}
    >
      <div className="player-showcase-court" aria-hidden="true" />

      {/* Team-color accent stripe at top */}
      <div
        className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-[var(--brand-sports)] to-transparent opacity-80"
        aria-hidden="true"
      />

      <div className="relative grid gap-8 p-5 sm:p-8 lg:grid-cols-12 lg:gap-10 lg:p-10">
        {/* Identity column */}
        <div className="flex min-w-0 flex-col gap-6 sm:flex-row sm:items-center lg:col-span-7">
          <div className="relative mx-auto shrink-0 sm:mx-0">
            <div
              className="absolute inset-3 rounded-full bg-[var(--brand-sports)]/20 blur-3xl"
              aria-hidden="true"
            />
            <PlayerAvatar
              photoUrl={player.photo_url}
              name={player.canonical_name}
              primaryColor="var(--color-sidebar-accent)"
              size="2xl"
              className="relative ring-4 ring-sidebar-foreground/10"
            />
            {player.jersey_number != null && (
              <span className="absolute -bottom-2 -right-2 inline-flex size-12 items-center justify-center rounded-full border-4 border-sidebar bg-[var(--brand-sports)] text-base font-black text-sidebar shadow-lg">
                {player.jersey_number}
              </span>
            )}
          </div>

          <div className="min-w-0 space-y-4 text-center sm:text-left">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-widest text-[var(--brand-sports)]">
                {isCareer
                  ? isEn
                    ? "Career Summary"
                    : "Карьерийн тойм"
                  : player.season_name}
              </p>
              <h1
                id="player-name"
                className="font-display text-4xl font-normal leading-none tracking-tight text-balance sm:text-5xl"
              >
                {displayName}
              </h1>
              {secondaryName && (
                <p className="text-sm text-sidebar-foreground/55">
                  {secondaryName}
                </p>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              {player.position && (
                <Badge className="border-sidebar-border bg-sidebar-accent text-sidebar-accent-foreground hover:bg-sidebar-accent">
                  {POSITION_MAP[player.position] ?? player.position}
                </Badge>
              )}
              <Link
                href={`/teams/${player.team_slug}`}
                className="inline-flex min-h-11 items-center gap-2 rounded-full border border-sidebar-border bg-sidebar-accent/70 px-3 py-1.5 text-sm font-semibold text-sidebar-foreground transition-colors hover:bg-sidebar-accent active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-sports)] focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar"
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
        </div>

        {/* Profile facts grid */}
        <div className="grid grid-cols-2 gap-3 lg:col-span-5 lg:self-center">
          <ProfileFact
            icon={Ruler}
            label={factLabels.height}
            value={player.height_cm ? `${player.height_cm} cm` : "—"}
          />
          <ProfileFact
            icon={Weight}
            label={factLabels.weight}
            value={player.weight_kg ? `${player.weight_kg} kg` : "—"}
          />
          <ProfileFact
            icon={CalendarDays}
            label={factLabels.dob}
            value={formatBirthDate(player.dob, locale)}
          />
          <ProfileFact
            icon={MapPin}
            label={factLabels.nationality}
            value={player.nationality || "—"}
          />
        </div>
      </div>

      {/* Season averages bar */}
      <div className="relative border-t border-sidebar-border bg-sidebar-accent/55 px-5 py-5 backdrop-blur-sm sm:px-8 lg:px-10">
        {careerTotals ? (
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-4">
            <StatNumber
              value={careerTotals.gp}
              label={getStatLabel("gp", locale)}
              precision={0}
              inverse
            />
            <StatNumber
              value={careerTotals.pts}
              label={getStatLabel("pts", locale)}
              precision={0}
              inverse
              accent
            />
            <StatNumber
              value={careerTotals.reb}
              label={getStatLabel("reb", locale)}
              precision={0}
              inverse
            />
            <StatNumber
              value={careerTotals.ast}
              label={getStatLabel("ast", locale)}
              precision={0}
              inverse
            />
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4 sm:grid-cols-5 sm:gap-6">
            <FlipStatCard
              value={averages?.ppg ?? null}
              label={getStatLabel("pts", locale)}
              backLabel={ptsRank ? `#${ptsRank} лигт` : "—"}
              inverse
              accent
            />
            <FlipStatCard
              value={averages?.rpg ?? null}
              label={getStatLabel("reb", locale)}
              backLabel={rebRank ? `#${rebRank} лигт` : "—"}
              inverse
            />
            <FlipStatCard
              value={averages?.apg ?? null}
              label={getStatLabel("ast", locale)}
              backLabel={astRank ? `#${astRank} лигт` : "—"}
              inverse
            />
            <StatNumber
              value={averages?.spg ?? null}
              label={getStatLabel("stl", locale)}
              inverse
              className="hidden sm:flex"
            />
            <StatNumber
              value={averages?.bpg ?? null}
              label={getStatLabel("blk", locale)}
              inverse
              className="hidden sm:flex"
            />
          </div>
        )}
      </div>

        {/* Efficiency metrics strip */}
        {!careerTotals && advancedStats && (
          <div className="relative border-t border-sidebar-border/50 px-5 py-3 backdrop-blur-sm sm:px-8 lg:px-10">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
              <StatNumber
                value={advancedStats.efgPct * 100}
                label={isEn ? "eFG%" : "ҮШ%"}
                precision={1}
                size="sm"
                inverse
              />
              <StatNumber
                value={advancedStats.tsPct * 100}
                label={isEn ? "TS%" : "ЧШ%"}
                precision={1}
                size="sm"
                inverse
              />
              <StatNumber
                value={advancedStats.avgGameScore}
                label={isEn ? "GmSc" : "Тогл.үнэлгээ"}
                precision={1}
                size="sm"
                inverse
              />
              <StatNumber
                value={advancedStats.astTovRatio}
                label={isEn ? "AST/TO" : "АШ/АЛ"}
                precision={2}
                size="sm"
                inverse
              />
            </div>
          </div>
        )}
    </section>
  );
}

interface ProfileFactProps {
  icon: typeof Ruler;
  label: string;
  value: string;
}

function ProfileFact({ icon: Icon, label, value }: ProfileFactProps) {
  return (
    <div className="rounded-2xl border border-sidebar-border bg-sidebar-accent/55 p-3.5 backdrop-blur-sm sm:p-4">
      <Icon
        className="mb-4 size-4 text-[var(--brand-sports)]"
        aria-hidden="true"
      />
      <p className="truncate text-base font-bold tabular-nums">{value}</p>
      <p className="mt-1 text-xs text-sidebar-foreground/55">{label}</p>
    </div>
  );
}
