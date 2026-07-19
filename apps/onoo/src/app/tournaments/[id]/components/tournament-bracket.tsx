"use client";

import { cn } from "@/lib/utils";

interface BracketTeam {
  id: string;
  name: string;
  shortCode: string;
  logoUrl: string | null;
  score?: number | null;
  winner?: boolean;
}

interface BracketMatchup {
  id: string;
  round: number;
  position: number;
  home?: BracketTeam;
  away?: BracketTeam;
}

interface TournamentBracketProps {
  matchups: BracketMatchup[];
  className?: string;
}

const ROUND_LABELS: Record<number, string> = {
  1: "Шөвийн 1/4 финал",
  2: "Хагас финал",
  3: "Финал",
};

function MatchCard({ matchup }: { matchup: BracketMatchup }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-lg border bg-card text-sm">
      <TeamRow team={matchup.home} isWinner={matchup.home?.winner} />
      <div className="border-t" />
      <TeamRow team={matchup.away} isWinner={matchup.away?.winner} />
    </div>
  );
}

function TeamRow({
  team,
  isWinner,
}: {
  team?: BracketTeam;
  isWinner?: boolean;
}) {
  if (!team) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 text-muted-foreground/50">
        <span className="text-xs">—</span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center gap-2 px-3 py-2",
        isWinner && "font-semibold",
      )}
    >
      <span className="min-w-[2ch] text-xs text-muted-foreground">
        {team.shortCode.slice(0, 3)}
      </span>
      <span className="min-w-0 flex-1 truncate">{team.name}</span>
      {team.score != null && (
        <span className={cn("tabular-nums", isWinner && "text-[var(--brand-sports)]")}>
          {team.score}
        </span>
      )}
    </div>
  );
}

export function TournamentBracket({
  matchups,
  className,
}: TournamentBracketProps) {
  const rounds = Array.from(new Set(matchups.map((m) => m.round))).sort(
    (a, b) => a - b,
  );

  return (
    <div className={cn("overflow-x-auto", className)}>
      <div className="flex gap-8 pb-4">
        {rounds.map((round) => {
          const roundMatchups = matchups
            .filter((m) => m.round === round)
            .sort((a, b) => a.position - b.position);

          return (
            <div key={round} className="flex flex-col gap-4">
              <h3 className="text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {ROUND_LABELS[round] ?? `Раунд ${round}`}
              </h3>
              <div className="flex flex-col gap-4">
                {roundMatchups.map((matchup) => (
                  <MatchCard key={matchup.id} matchup={matchup} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
