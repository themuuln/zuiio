"use client";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronRight, Minus, TrendingDown, TrendingUp } from "lucide-react";
import Link from "next/link";
import { Fragment, useCallback, useState } from "react";
import { TeamDrawer } from "@/app/standings/components/team-drawer";
import { TeamLogo } from "@/components/team-logo";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface StandingsTableRow {
  team_season_id: string;
  team_id: string;
  team_name: string;
  team_slug: string;
  team_logo_url: string | null;
  team_short_code: string;
  team_primary_color: string | null;
  w: number;
  l: number;
  win_pct: number;
  gb: number | string | null;
  streak: string | null;
  last10: string | null;
  points_for: number | null;
  points_against: number | null;
  home_record?: string | null;
  away_record?: string | null;
  last5?: string | null;
}

interface StandingsTableProps {
  rows: StandingsTableRow[];
  className?: string;
  playoffLineAfter?: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatPercent(value: number): string {
  const percent = value <= 1 ? value * 100 : value;
  return `${percent.toFixed(1)}%`;
}

function getPointDifference(row: StandingsTableRow): number {
  return (row.points_for ?? 0) - (row.points_against ?? 0);
}

function getMovementType(streak: string | null): "up" | "down" | "neutral" {
  if (!streak) return "neutral";
  const prefix = streak.trim().charAt(0).toUpperCase();
  if (prefix === "W") return "up";
  if (prefix === "L") return "down";
  return "neutral";
}

function parseLast5(last5: string | null): ("W" | "L")[] | null {
  if (!last5) return null;
  const chars = last5.replace(/[^WwLl]/g, "");
  if (!chars) return null;
  return chars
    .slice(0, 5)
    .split("")
    .map((c) => (c.toUpperCase() === "W" ? "W" : "L"));
}

function MovementIndicator({ streak }: { streak: string | null }) {
  const type = getMovementType(streak);
  switch (type) {
    case "up":
      return (
        <TrendingUp
          className="size-3.5 text-emerald-500"
          aria-label="Дээшилж байна"
        />
      );
    case "down":
      return (
        <TrendingDown
          className="size-3.5 text-red-500"
          aria-label="Доошилж байна"
        />
      );
    default:
      return (
        <Minus
          className="size-3.5 text-muted-foreground/50"
          aria-label="Тогтмол"
        />
      );
  }
}

function FormGuide({ last5 }: { last5: string | null }) {
  const results = parseLast5(last5);
  if (!results) {
    return <span className="text-muted-foreground text-xs">—</span>;
  }
  return (
    <span className="inline-flex items-center gap-0.5">
      {results.map((r, i) => (
        <span
          key={i}
          className={cn(
            "inline-block size-2 rounded-full",
            r === "W" ? "bg-emerald-500" : "bg-red-400",
          )}
          aria-label={r === "W" ? "Ялалт" : "Хожигдол"}
        />
      ))}
    </span>
  );
}

function parseLast10(
  last10: string | null,
): { wins: number; losses: number } | null {
  if (!last10) return null;
  const match = last10.match(/^(\d+)\s*[-–]\s*(\d+)$/);
  if (!match) return null;
  return { wins: Number(match[1]), losses: Number(match[2]) };
}

function Last10Dots({ last10 }: { last10: string | null }) {
  const parsed = parseLast10(last10);
  if (!parsed) {
    return <span className="text-center text-muted-foreground text-xs">—</span>;
  }
  const dots = Array.from({ length: 10 }, (_, i) => {
    if (i < parsed.wins) return "W";
    if (i < parsed.wins + parsed.losses) return "L";
    return "E";
  });
  return (
    <>
      <span className="hidden items-center justify-center gap-0.5 sm:flex">
        {dots.map((r, i) => (
          <span
            key={i}
            className={cn(
              "inline-block size-1.5 rounded-full",
              r === "W"
                ? "bg-emerald-500"
                : r === "L"
                  ? "bg-red-400"
                  : "bg-muted",
            )}
          />
        ))}
      </span>
      <span className="text-center tabular-nums sm:hidden">{last10}</span>
    </>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function StandingsTable({
  rows,
  className,
  playoffLineAfter = 4,
}: StandingsTableProps) {
  const [selectedTeam, setSelectedTeam] = useState<
    (StandingsTableRow & { rank: number }) | null
  >(null);
  const queryClient = useQueryClient();

  const handlePrefetch = useCallback(
    (teamSeasonId: string) => {
      queryClient.prefetchQuery({
        queryKey: ["team-quickview", teamSeasonId],
        queryFn: async () => {
          const res = await fetch(`/api/standings/team/${teamSeasonId}`);
          if (!res.ok) throw new Error("Failed to load team data");
          return res.json();
        },
        staleTime: 30_000,
      });
    },
    [queryClient],
  );

  const openDrawer = useCallback(
    (row: StandingsTableRow, rank: number) => {
      setSelectedTeam({ ...row, rank });
    },
    [],
  );

  const closeDrawer = useCallback(() => {
    setSelectedTeam(null);
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, row: StandingsTableRow, rank: number) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openDrawer(row, rank);
      }
    },
    [openDrawer],
  );

  const topColor = rows[0]?.team_primary_color;

  return (
    <>
      <div className={cn("hidden md:block overflow-x-auto", className)}>
        <Table>
          <TableCaption className="sr-only">
            Лигийн байрлалын хүснэгт — {rows.length} баг
          </TableCaption>
          <TableHeader className="sticky top-0 z-10 bg-background">
            <TableRow
              className={cn("border-b-2", topColor && "bg-gradient-to-r")}
              style={
                topColor
                  ? {
                      backgroundImage: `linear-gradient(to right, ${topColor}15, transparent)`,
                    }
                  : undefined
              }
            >
              <TableHead className="w-12">#</TableHead>
              <TableHead>Баг</TableHead>
              <TableHead className="text-center">Я</TableHead>
              <TableHead className="text-center">Х</TableHead>
              <TableHead className="text-center">Хувь</TableHead>
              <TableHead className="text-center">GB</TableHead>
              <TableHead className="text-center">Цуврал</TableHead>
              <TableHead className="text-center">Форм</TableHead>
              <TableHead className="text-center">Сүүлийн 10</TableHead>
              <TableHead className="text-right">Зөрүү</TableHead>
              <TableHead className="w-8" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, index) => {
              const pointDifference = getPointDifference(row);
              return (
                <Fragment key={row.team_season_id}>
                  <TableRow
                    className={cn(
                      "cursor-pointer transition-colors hover:bg-accent/50 odd:bg-muted/50",
                    )}
                    style={
                      row.team_primary_color
                        ? {
                            borderLeft: `3px solid ${row.team_primary_color}`,
                          }
                        : undefined
                    }
                    tabIndex={0}
                    role="button"
                    onClick={() => openDrawer(row, index + 1)}
                    onKeyDown={(e) => handleKeyDown(e, row, index + 1)}
                    onMouseEnter={() => handlePrefetch(row.team_season_id)}
                    aria-haspopup="dialog"
                    aria-label={`${row.team_name} — ${row.w} ялалт, ${row.l} хожигдол. Дарж дэлгэрэнгүй харах.`}
                  >
                    <TableCell className="font-semibold tabular-nums text-muted-foreground">
                      <span className="inline-flex items-center gap-1.5">
                        {index + 1}
                        <MovementIndicator streak={row.streak} />
                      </span>
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/teams/${row.team_slug}`}
                        className="inline-flex items-center gap-3 font-semibold hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <TeamLogo
                          logoUrl={row.team_logo_url}
                          shortCode={row.team_short_code}
                          primaryColor={row.team_primary_color}
                        />
                        {row.team_name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-center font-semibold tabular-nums">
                      {row.w}
                    </TableCell>
                    <TableCell className="text-center tabular-nums">
                      {row.l}
                    </TableCell>
                    <TableCell className="text-center font-semibold tabular-nums">
                      <div className="flex flex-col items-center gap-1">
                        <span>{formatPercent(row.win_pct)}</span>
                        <div
                          className="h-1.5 w-full max-w-14 rounded-full bg-muted overflow-hidden"
                          aria-hidden
                        >
                          <div
                            className="h-full rounded-full bg-emerald-500/70"
                            style={{
                              width: `${row.win_pct <= 1 ? row.win_pct * 100 : row.win_pct}%`,
                            }}
                          />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center tabular-nums text-muted-foreground">
                      {row.gb ?? "—"}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline">{row.streak ?? "—"}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <FormGuide last5={row.last5 ?? null} />
                    </TableCell>
                    <TableCell className="text-center">
                      <Last10Dots last10={row.last10 ?? null} />
                    </TableCell>
                    <TableCell
                      className={cn(
                        "text-right font-semibold tabular-nums",
                        pointDifference > 0 && "text-emerald-600",
                        pointDifference < 0 && "text-red-500",
                      )}
                    >
                      {pointDifference > 0 ? "+" : ""}
                      {pointDifference}
                    </TableCell>
                    <TableCell>
                      <ChevronRight
                        className="size-4"
                        aria-hidden="true"
                      />
                    </TableCell>
                  </TableRow>

                  {index === playoffLineAfter - 1 &&
                    index < rows.length - 1 && (
                      <TableRow className="pointer-events-none border-t-0">
                        <TableCell colSpan={11} className="px-0 pt-1 pb-2">
                          <div className="flex items-center gap-3">
                            <div className="h-px flex-1 border-t border-dashed border-muted-foreground/30" />
                            <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground/60">
                              Плэйоффийн шугам
                            </span>
                            <div className="h-px flex-1 border-t border-dashed border-muted-foreground/30" />
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                </Fragment>
              );
            })}
          </TableBody>
        </Table>
      </div>
      <div className="md:hidden flex flex-col gap-3">
        {rows.map((row, index) => {
          return (
            <button
              key={row.team_season_id}
              type="button"
              tabIndex={0}
              onClick={() => openDrawer(row, index + 1)}
              onKeyDown={(e) => handleKeyDown(e, row, index + 1)}
              onMouseEnter={() => handlePrefetch(row.team_season_id)}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl border bg-card p-4 text-left cursor-pointer transition-colors hover:bg-accent/50 odd:bg-muted/50",
              )}
              style={
                row.team_primary_color
                  ? { borderLeft: `3px solid ${row.team_primary_color}` }
                  : undefined
              }
              aria-haspopup="dialog"
              aria-label={`${row.team_name} — ${row.w} ялалт, ${row.l} хожигдол. Дарж дэлгэрэнгүй харах.`}
            >
              <span className="text-sm font-black tabular-nums text-muted-foreground w-6 text-center">
                {index + 1}
                <MovementIndicator streak={row.streak} />
              </span>
              <TeamLogo
                logoUrl={row.team_logo_url}
                shortCode={row.team_short_code}
                primaryColor={row.team_primary_color}
              />
              <div className="min-w-0 flex-1">
                <p className="font-semibold truncate">{row.team_name}</p>
                <p className="text-xs text-muted-foreground">
                  {row.w}Я - {row.l}Х · {formatPercent(row.win_pct)}
                </p>
              </div>
              <div className="text-right">
                <FormGuide last5={row.last5 ?? null} />
              </div>
              <ChevronRight
                className="size-4 shrink-0 text-muted-foreground"
              />
            </button>
          );
        })}
        {rows.length > 0 &&
          rows.map((row, index) =>
            index === playoffLineAfter - 1 && index < rows.length - 1 ? (
              <div
                key={`playoff-${row.team_season_id}`}
                className="flex items-center gap-3 py-1"
              >
                <div className="h-px flex-1 border-t border-dashed border-muted-foreground/30" />
                <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground/60">
                  Плэйоффийн шугам
                </span>
                <div className="h-px flex-1 border-t border-dashed border-muted-foreground/30" />
              </div>
            ) : null,
          )}
      </div>

      <TeamDrawer
        team={selectedTeam}
        open={!!selectedTeam}
        onClose={closeDrawer}
      />
    </>
  );
}
