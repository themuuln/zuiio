"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { PointDifferentialSparkline } from "@/app/standings/components/point-differential-sparkline";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TeamQuickView {
  recentGames: Array<{
    id: string;
    status: string;
    scheduled_at: string;
    home_team_id: string;
    home_team_name: string;
    home_team_short_code: string;
    home_team_logo_url: string | null;
    home_team_primary_color: string | null;
    home_team_slug: string;
    home_score: number | null;
    away_team_id: string;
    away_team_name: string;
    away_team_short_code: string;
    away_team_logo_url: string | null;
    away_team_primary_color: string | null;
    away_team_slug: string;
    away_score: number | null;
    is_provisional: boolean;
  }>;
  leaders: Array<{
    player_id: string;
    player_name: string;
    player_photo_url: string | null;
    team_primary_color: string | null;
    pts: number | null;
    oreb: number | null;
    dreb: number | null;
    ast: number | null;
    gp: number;
  }>;
  nextGame: Record<string, unknown> | null;
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ExpandedStandingsContentProps {
  teamSeasonId: string;
  teamId: string;
  /** The expand/collapse state drives data fetching — only fetch when visible. */
  expanded: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getResult(
  game: TeamQuickView["recentGames"][number],
  teamId: string,
): "W" | "L" {
  const isHome = game.home_team_id === teamId;
  const teamScore = isHome ? (game.home_score ?? 0) : (game.away_score ?? 0);
  const oppScore = isHome ? (game.away_score ?? 0) : (game.home_score ?? 0);
  return teamScore > oppScore ? "W" : "L";
}

function getPointDifferential(
  game: TeamQuickView["recentGames"][number],
  teamId: string,
): number {
  const isHome = game.home_team_id === teamId;
  const teamScore = isHome ? (game.home_score ?? 0) : (game.away_score ?? 0);
  const oppScore = isHome ? (game.away_score ?? 0) : (game.home_score ?? 0);
  return teamScore - oppScore;
}

function _formatShortDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("mn-MN", { month: "numeric", day: "numeric" });
  } catch {
    return iso;
  }
}

function computeDifferentials(
  games: TeamQuickView["recentGames"],
  teamId: string,
): number[] {
  return games.map((g) => getPointDifferential(g, teamId));
}

// ---------------------------------------------------------------------------
// Content Skeleton
// ---------------------------------------------------------------------------

function ContentSkeleton() {
  return (
    <div className="space-y-4 py-3" aria-busy="true">
      {/* Sparkline area */}
      <Skeleton className="h-8 w-48" />
      {/* Games list */}
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton array
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="size-7 shrink-0 rounded-md" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
      {/* Scorers */}
      <div className="flex gap-4 pt-2">
        {Array.from({ length: 3 }).map((_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton array
          <div key={i} className="flex items-center gap-2">
            <Skeleton className="size-8 rounded-full" />
            <div className="space-y-1">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-10" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function GameResultBadge({ result }: { result: "W" | "L" }) {
  return (
    <span
      className={cn(
        "inline-flex size-7 shrink-0 items-center justify-center rounded-md text-xs font-bold leading-none",
        result === "W"
          ? "bg-emerald-500/15 text-emerald-600"
          : "bg-red-500/15 text-red-600",
      )}
    >
      {result}
    </span>
  );
}

function RecentGameRow({
  game,
  teamId,
}: {
  game: TeamQuickView["recentGames"][number];
  teamId: string;
}) {
  const isHome = game.home_team_id === teamId;
  const opponentName = isHome ? game.away_team_name : game.home_team_name;
  const _opponentSlug = isHome ? game.away_team_slug : game.home_team_slug;
  const teamScore = isHome ? (game.home_score ?? 0) : (game.away_score ?? 0);
  const oppScore = isHome ? (game.away_score ?? 0) : (game.home_score ?? 0);
  const result = getResult(game, teamId);

  return (
    <div className="flex items-center gap-2.5 text-sm">
      <GameResultBadge result={result} />
      <Link
        href={`/games/${game.id}`}
        className="truncate text-muted-foreground hover:text-foreground hover:underline transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        {opponentName}
      </Link>
      <span
        className={cn(
          "ml-auto tabular-nums font-medium shrink-0",
          teamScore > oppScore && "text-emerald-600",
          teamScore < oppScore && "text-red-500",
        )}
      >
        {teamScore}–{oppScore}
      </span>
    </div>
  );
}

function ScorerCard({ player }: { player: TeamQuickView["leaders"][number] }) {
  const ppg =
    player.pts != null && player.gp > 0
      ? (player.pts / player.gp).toFixed(1)
      : "—";

  return (
    <Link
      href={`/players/${player.player_id}`}
      className="flex items-center gap-2 rounded-lg border border-border/50 bg-[var(--surface-2)] px-3 py-2 transition-colors hover:bg-accent/50"
      onClick={(e) => e.stopPropagation()}
    >
      <div
        className={cn(
          "size-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold shrink-0",
          player.team_primary_color && "text-white",
        )}
        style={
          player.team_primary_color
            ? { backgroundColor: player.team_primary_color }
            : undefined
        }
      >
        {player.player_name.charAt(0)}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium truncate leading-tight">
          {player.player_name}
        </p>
        <p className="text-xs text-muted-foreground tabular-nums">
          <span className="font-semibold">{ppg}</span> PPG
        </p>
      </div>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function ExpandedStandingsContent({
  teamSeasonId,
  teamId,
  expanded,
}: ExpandedStandingsContentProps) {
  const { data: quickView, isPending } = useQuery({
    queryKey: ["team-quickview", teamSeasonId],
    queryFn: async () => {
      const res = await fetch(`/api/standings/team/${teamSeasonId}`);
      if (!res.ok) throw new Error("Failed to load team data");
      return res.json() as Promise<TeamQuickView>;
    },
    enabled: expanded && !!teamSeasonId,
    staleTime: 30_000,
  });

  if (isPending) {
    return <ContentSkeleton />;
  }

  if (!quickView) {
    return (
      <p className="py-3 text-sm text-muted-foreground">
        Мэдээлэл авах боломжгүй байна.
      </p>
    );
  }

  const recentGames = quickView.recentGames.slice(0, 5);
  const leaders = quickView.leaders.slice(0, 3);
  const differentials = computeDifferentials(quickView.recentGames, teamId);

  return (
    <div className="space-y-5 py-3">
      {/* Sparkline */}
      {differentials.length > 0 && (
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground shrink-0">
            Зөрүү
          </span>
          <PointDifferentialSparkline
            differentials={differentials}
            className="text-muted-foreground/20"
          />
        </div>
      )}

      {/* Recent 5 games */}
      <div>
        <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Сүүлийн тоглолтууд
        </h4>
        {recentGames.length > 0 ? (
          <div className="space-y-1.5">
            {recentGames.map((game) => (
              <RecentGameRow key={game.id} game={game} teamId={teamId} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground/60">Тоглолт байхгүй</p>
        )}
      </div>

      {/* Top 3 scorers */}
      {leaders.length > 0 && (
        <div>
          <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Шилдэг тоглогчид
          </h4>
          <div className="flex flex-wrap gap-2">
            {leaders.map((player) => (
              <ScorerCard key={player.player_id} player={player} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
