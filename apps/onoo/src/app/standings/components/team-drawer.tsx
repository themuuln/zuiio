"use client";

import { useQuery } from "@tanstack/react-query";
import {
  BarChart3,
  ChevronRight,
  ExternalLink,
  Eye,
  Minus,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { PlayerAvatar } from "@/components/player-avatar";
import { TeamLogo } from "@/components/team-logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { StandingsTableRow } from "./standings-table";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TeamDrawerProps {
  team: (StandingsTableRow & { rank: number }) | null;
  open: boolean;
  onClose: () => void;
}

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
  nextGame: {
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
  } | null;
}

function formatPercent(value: number): string {
  const percent = value <= 1 ? value * 100 : value;
  return `${percent.toFixed(1)}%`;
}

function getPointDifference(row: StandingsTableRow): number {
  return (row.points_for ?? 0) - (row.points_against ?? 0);
}

function formatGameTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("mn-MN", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function getResult(
  game: TeamQuickView["recentGames"][number],
  teamId: string,
): "W" | "L" {
  const isHome = game.home_team_id === teamId;
  const teamScore = isHome ? (game.home_score ?? 0) : (game.away_score ?? 0);
  const oppScore = isHome ? (game.away_score ?? 0) : (game.home_score ?? 0);
  return teamScore > oppScore ? "W" : "L";
}

function getMovementType(streak: string | null): "up" | "down" | "neutral" {
  if (!streak) return "neutral";
  const first = streak.charAt(0);
  if (first === "W") return "up";
  if (first === "L") return "down";
  return "neutral";
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function MovementIcon({ streak }: { streak: string | null }) {
  const type = getMovementType(streak);
  if (type === "up")
    return <TrendingUp className="size-3 text-emerald-500" aria-hidden />;
  if (type === "down")
    return <TrendingDown className="size-3 text-red-500" aria-hidden />;
  return <Minus className="size-3 text-muted-foreground" aria-hidden />;
}

function StatCard({
  label,
  value,
  trend,
}: {
  label: string;
  value: string;
  trend?: "up" | "down" | "neutral";
}) {
  return (
    <div className="rounded-lg border border-border/50 bg-[var(--surface-2)] p-3">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-0.5 flex items-center gap-1 text-lg font-bold tabular-nums leading-none">
        {trend === "up" && (
          <TrendingUp className="size-3.5 text-emerald-500" aria-hidden />
        )}
        {trend === "down" && (
          <TrendingDown className="size-3.5 text-red-500" aria-hidden />
        )}
        {trend === "neutral" && (
          <Minus className="size-3.5 text-muted-foreground" aria-hidden />
        )}
        {value}
      </p>
    </div>
  );
}

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

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function TeamDrawer({ team, open, onClose }: TeamDrawerProps) {
  const teamSeasonId = team?.team_season_id;

  const {
    data: quickView,
    isPending,
    error,
  } = useQuery({
    queryKey: ["team-quickview", teamSeasonId],
    queryFn: async () => {
      const res = await fetch(`/api/standings/team/${teamSeasonId}`);
      if (!res.ok) throw new Error("Failed to load team data");
      return res.json() as Promise<TeamQuickView>;
    },
    enabled: !!teamSeasonId && open,
    staleTime: 30_000,
  });

  // Compute instant stats
  const pointDiff = team ? getPointDifference(team) : 0;
  const totalGames = team ? team.w + team.l : 0;
  const avgPpg =
    team && totalGames > 0
      ? ((team.points_for ?? 0) / totalGames).toFixed(1)
      : "—";
  const avgOppPpg =
    team && totalGames > 0
      ? ((team.points_against ?? 0) / totalGames).toFixed(1)
      : "—";

  const _streakType = getMovementType(team?.streak ?? null);

  return (
    <Drawer
      open={open}
      onOpenChange={(next) => !next && onClose()}
    >
      <DrawerContent
        className="w-full sm:max-w-md"
        showCloseButton
        backdropClassName="pointer-events-none"
      >
        <div className="flex flex-col gap-5 p-5 pt-6">
          {/* Section 1: Team identity bar */}
          {team && (
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <Badge variant="secondary" className="shrink-0 tabular-nums">
                  #{team.rank}
                </Badge>
                <TeamLogo
                  logoUrl={team.team_logo_url}
                  shortCode={team.team_short_code}
                  primaryColor={team.team_primary_color}
                  size="lg"
                />
                <div className="min-w-0">
                  <DrawerTitle className="truncate text-lg">
                    {team.team_name}
                  </DrawerTitle>
                  <DrawerDescription className="mt-0.5 text-xs tabular-nums">
                    {team.w}Я — {team.l}Х · {formatPercent(team.win_pct)}
                    {team.streak && (
                      <>
                        {" "}
                        · <MovementIcon streak={team.streak} /> {team.streak}
                      </>
                    )}
                  </DrawerDescription>
                </div>
              </div>
            </div>
          )}

          {/* Section 2: Key stats quad */}
          {team && (
            <div className="grid grid-cols-2 gap-2">
              <StatCard label="Дундаж оноо" value={avgPpg} />
              <StatCard label="Алдсан оноо" value={avgOppPpg} />
              <StatCard
                label="Зөрүү"
                value={pointDiff > 0 ? `+${pointDiff}` : String(pointDiff)}
                trend={
                  pointDiff > 0 ? "up" : pointDiff < 0 ? "down" : "neutral"
                }
              />
              <StatCard
                label="GB"
                value={team.gb != null ? String(team.gb) : "—"}
              />
            </div>
          )}

          {/* Section 3: Last 5 games form strip */}
          <div>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Сүүлийн тоглолтууд
            </h3>
            {error ? (
              <p className="py-3 text-center text-sm text-destructive">
                Ачаалахад алдаа гарлаа
              </p>
            ) : isPending ? (
              <div className="flex flex-col gap-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-11 w-full rounded-lg" />
                ))}
              </div>
            ) : quickView?.recentGames && quickView.recentGames.length > 0 ? (
              <div className="flex flex-col gap-1.5">
                {quickView.recentGames.map((game) => {
                  const result = getResult(game, team?.team_id);
                  const isHome = game.home_team_id === team?.team_id;
                  const homeScore = game.home_score ?? 0;
                  const awayScore = game.away_score ?? 0;
                  const teamScore = isHome ? homeScore : awayScore;
                  const oppScore = isHome ? awayScore : homeScore;
                  const oppName = isHome
                    ? game.away_team_name
                    : game.home_team_name;
                  const _oppSlug = isHome
                    ? game.away_team_slug
                    : game.home_team_slug;
                  const hasScores = homeScore > 0 || awayScore > 0;

                  return (
                    <Link
                      key={game.id}
                      href={`/games/${game.id}`}
                      className="flex items-center gap-3 rounded-lg border border-border/50 bg-[var(--surface-2)] px-3 py-2 text-sm transition-colors hover:bg-accent active:scale-[0.98] motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <GameResultBadge result={result} />
                      <div className="flex min-w-0 flex-1 items-center gap-2">
                        <span className="text-xs text-muted-foreground shrink-0">
                          {isHome ? "vs" : "@"}
                        </span>
                        <span className="truncate font-medium">{oppName}</span>
                      </div>
                      {hasScores && (
                        <span
                          className={cn(
                            "shrink-0 font-bold tabular-nums",
                            result === "W"
                              ? "text-emerald-600"
                              : "text-red-500",
                          )}
                        >
                          {teamScore}:{oppScore}
                        </span>
                      )}
                      <ChevronRight className="size-3.5 shrink-0 text-muted-foreground" />
                    </Link>
                  );
                })}
              </div>
            ) : (
              <p className="py-3 text-center text-sm text-muted-foreground">
                Тоглолт хараахан байхгүй
              </p>
            )}
          </div>

          {/* Section 4: Team leaders */}
          <div>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Багийн тэргүүлэгчид
            </h3>
            {error ? (
              <p className="py-3 text-center text-sm text-destructive">
                Ачаалахад алдаа гарлаа
              </p>
            ) : isPending ? (
              <div className="flex flex-col gap-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full rounded-lg" />
                ))}
              </div>
            ) : quickView?.leaders && quickView.leaders.length > 0 ? (
              <div className="flex flex-col gap-2">
                {quickView.leaders.map((player, index) => (
                  <Link
                    key={player.player_id}
                    href={`/players/${player.player_id}`}
                    className="flex items-center gap-3 rounded-lg border border-border/50 bg-[var(--surface-2)] px-3 py-2.5 transition-colors hover:bg-accent active:scale-[0.98] motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <span className="w-5 text-center text-xs font-bold text-muted-foreground">
                      {index + 1}
                    </span>
                    <PlayerAvatar
                      photoUrl={player.player_photo_url}
                      name={player.player_name}
                      primaryColor={team?.team_primary_color}
                      size="sm"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {player.player_name}
                      </p>
                      <p className="text-xs text-muted-foreground tabular-nums">
                        {player.gp} тоглолт
                      </p>
                    </div>
                    <div className="text-right tabular-nums">
                      <p className="text-sm font-bold">
                        {player.pts?.toFixed(1) ?? "—"}
                      </p>
                      <p className="text-[10px] text-muted-foreground">PPG</p>
                    </div>
                    <ChevronRight className="size-3.5 shrink-0 text-muted-foreground" />
                  </Link>
                ))}
              </div>
            ) : (
              <p className="py-3 text-center text-sm text-muted-foreground">
                Тоглогчийн өгөгдөл байхгүй
              </p>
            )}
          </div>
          {/* Section 5: Next game */}
          <div>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Дараагийн тоглолт
            </h3>
            {error ? (
              <p className="py-3 text-center text-sm text-destructive">
                Ачаалахад алдаа гарлаа
              </p>
            ) : isPending ? (
              <Skeleton className="h-20 w-full rounded-lg" />
            ) : quickView?.nextGame ? (
              <Link
                href={`/games/${quickView.nextGame.id}`}
                className="flex items-center gap-4 rounded-lg border border-border/50 bg-[var(--surface-2)] p-4 transition-colors hover:bg-accent active:scale-[0.98] motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <TeamLogo
                  logoUrl={
                    quickView.nextGame.home_team_id === team?.team_id
                      ? quickView.nextGame.away_team_logo_url
                      : quickView.nextGame.home_team_logo_url
                  }
                  shortCode={
                    quickView.nextGame.home_team_id === team?.team_id
                      ? quickView.nextGame.away_team_short_code
                      : quickView.nextGame.home_team_short_code
                  }
                  primaryColor={
                    quickView.nextGame.home_team_id === team?.team_id
                      ? quickView.nextGame.away_team_primary_color
                      : quickView.nextGame.home_team_primary_color
                  }
                  size="lg"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">
                    {quickView.nextGame.home_team_id === team?.team_id
                      ? quickView.nextGame.away_team_name
                      : quickView.nextGame.home_team_name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {quickView.nextGame.home_team_id === team?.team_id
                      ? "Гэрт"
                      : "Зочилсон"}{" "}
                    · {formatGameTime(quickView.nextGame.scheduled_at)}
                  </p>
                </div>
                <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
              </Link>
            ) : (
              <p className="py-3 text-center text-sm text-muted-foreground">
                Дараагийн тоглолт товлогдоогүй
              </p>
            )}
          </div>

          {/* Section 6: Quick action links */}
          {team && (
            <div className="grid grid-cols-2 gap-2 border-t border-border/50 pt-4">
              <Button variant="outline" size="sm">
                <Link href={`/teams/${team.team_slug}`}>
                  <ExternalLink className="size-3.5" />
                  Баг харах
                </Link>
              </Button>
              <Button variant="outline" size="sm">
                <Link href={`/teams/${team.team_slug}/analytics`}>
                  <BarChart3 className="size-3.5" />
                  Аналитик
                </Link>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="col-span-2"
               
              >
                <Link href={`/teams/${team.team_slug}/scout`}>
                  <Eye className="size-3.5" />
                  Скаутын тайлан
                </Link>
              </Button>
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
