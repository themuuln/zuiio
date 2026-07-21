"use client";

import { ChevronDown, Minus, TrendingDown, TrendingUp } from "lucide-react";
import Link from "next/link";
import { Fragment, useState } from "react";
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
  /** Insert a playoff line separator after this rank (0-indexed). Default: 4 (after 4th place). */
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

/** Derive movement direction from streak string. */
function getMovementType(streak: string | null): "up" | "down" | "neutral" {
  if (!streak) return "neutral";
  const prefix = streak.trim().charAt(0).toUpperCase();
  if (prefix === "W") return "up";
  if (prefix === "L") return "down";
  return "neutral";
}

/** Parse a "W-W-L-W-L" or "WWLWL" last5 string into individual results. */
function parseLast5(last5: string | null): ("W" | "L")[] | null {
  if (!last5) return null;
  const chars = last5.replace(/[^WwLl]/g, "");
  if (!chars) return null;
  return chars
    .slice(0, 5)
    .split("")
    .map((c) => (c.toUpperCase() === "W" ? "W" : "L"));
}

/** Render movement icon (TrendingUp/TrendingDown/Minus). */
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

/** Render last-5 form as a row of colored dots. */
function FormGuide({ last5 }: { last5: string | null }) {
  const results = parseLast5(last5);
  if (!results) {
    return <span className="text-muted-foreground text-xs">—</span>;
  }
  return (
    <span className="inline-flex items-center gap-0.5">
      {results.map((r, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: static list
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

/** Parse a "W-L" string like "6-4" into wins and losses. */
function parseLast10(last10: string | null): { wins: number; losses: number } | null {
  if (!last10) return null;
  const match = last10.match(/^(\d+)\s*[-–]\s*(\d+)$/);
  if (!match) return null;
  return { wins: Number(match[1]), losses: Number(match[2]) };
}

/** Render last-10 as 10 colored dots: green for wins, red for losses, gray for remaining. */
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
      {/* Dots — visible on sm+ */}
      <span className="hidden items-center justify-center gap-0.5 sm:flex">
        {dots.map((r, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: static list
          <span
            key={i}
            className={cn(
              "inline-block size-1.5 rounded-full",
              r === "W" ? "bg-emerald-500" : r === "L" ? "bg-red-400" : "bg-muted",
            )}
          />
        ))}
      </span>
      {/* Text fallback — visible below sm */}
      <span className="text-center tabular-nums sm:hidden">
        {last10}
      </span>
    </>
  );
}


// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Interactive standings table with collapsible detail rows.
 *
 * Click a team row to expand additional stats (home/away record,
 * points for/against, point difference breakdown).
 */
export function StandingsTable({ rows, className, playoffLineAfter = 4 }: StandingsTableProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  function toggleRow(id: string) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  const topColor = rows[0]?.team_primary_color;

  return (
    <>
      <div className={cn("hidden md:block overflow-x-auto", className)}>
      <Table>
        <TableCaption className="sr-only">
          Лигийн байрлалын хүснэгт — {rows.length} баг
        </TableCaption>
        <TableHeader>
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
            const isExpanded = expandedId === row.team_season_id;
            return (
              <>
              <Fragment key={row.team_season_id}>
                <TableRow
                  className={cn(
                    "cursor-pointer transition-colors hover:bg-accent/50",
                    isExpanded && "bg-muted/50",
                  )}
                  style={
                    row.team_primary_color
                      ? { borderLeft: `3px solid ${row.team_primary_color}` }
                      : undefined
                  }
                  onClick={() => toggleRow(row.team_season_id)}
                  aria-expanded={isExpanded}
                  aria-label={`${row.team_name} — ${row.w} ялалт, ${row.l} хожигдол`}
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
                    {formatPercent(row.win_pct)}
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
                    <ChevronDown
                      className={cn(
                        "size-4 text-muted-foreground transition-transform",
                        isExpanded && "rotate-180",
                      )}
                      aria-hidden="true"
                    />
                  </TableCell>
                </TableRow>

                {/* Expanded detail row */}
                {isExpanded && (
                  <TableRow className="border-t-0 bg-muted/30">
                    <TableCell colSpan={11} className="px-6 py-4">
                      <div
                        className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4"
                        role="group"
                        aria-label={`${row.team_name} дэлгэрэнгүй статистик`}
                      >
                        <div>
                          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                            Оноо тавьсан
                          </p>
                          <p className="mt-1 font-semibold tabular-nums">
                            {row.points_for ?? "—"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                            Оноо алдсан
                          </p>
                          <p className="mt-1 font-semibold tabular-nums">
                            {row.points_against ?? "—"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                            Гэрт
                          </p>
                          <p className="mt-1 font-semibold tabular-nums">
                            {row.home_record ?? "—"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                            Зочилсон
                          </p>
                          <p className="mt-1 font-semibold tabular-nums">
                            {row.away_record ?? "—"}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </Fragment>
              {/* Playoff line separator */}
              {index === playoffLineAfter - 1 && index < rows.length - 1 && (
                <TableRow className="pointer-events-none border-t-0" key={`playoff-${index}`}>
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
              </>
            );
        })}
        </TableBody>
      </Table>
    </div>
      <div className="md:hidden flex flex-col gap-3">
        {rows.map((row, index) => {
          const isExpanded = expandedId === row.team_season_id;

          return (
            <Fragment key={row.team_season_id}>
              <button
                type="button"
                onClick={() => toggleRow(row.team_season_id)}
                className={cn(
                  "flex items-center gap-3 rounded-xl border bg-card p-4 text-left cursor-pointer transition-colors hover:bg-accent/50",
                  isExpanded && "bg-muted/50",
                )}
                style={
                  row.team_primary_color
                    ? { borderLeft: `3px solid ${row.team_primary_color}` }
                    : undefined
                }
                aria-expanded={isExpanded}
                aria-label={`${row.team_name} — ${row.w} ялалт, ${row.l} хожигдол`}
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
                <ChevronDown
                  className={cn(
                    "size-4 text-muted-foreground transition-transform",
                    isExpanded && "rotate-180",
                  )}
                  aria-hidden="true"
                />
              </button>
              {isExpanded && (
                <div
                  className="grid grid-cols-2 gap-3 p-4 text-sm bg-muted/30 rounded-xl"
                  role="group"
                  aria-label={`${row.team_name} дэлгэрэнгүй статистик`}
                >
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Оноо тавьсан
                    </p>
                    <p className="mt-1 font-semibold tabular-nums">
                      {row.points_for ?? "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Оноо алдсан
                    </p>
                    <p className="mt-1 font-semibold tabular-nums">
                      {row.points_against ?? "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Гэрт
                    </p>
                    <p className="mt-1 font-semibold tabular-nums">
                      {row.home_record ?? "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Зочилсон
                    </p>
                    <p className="mt-1 font-semibold tabular-nums">
                      {row.away_record ?? "—"}
                    </p>
                  </div>
                </div>
              )}
              {index === playoffLineAfter - 1 && index < rows.length - 1 && (
                <div className="flex items-center gap-3 py-1">
                  <div className="h-px flex-1 border-t border-dashed border-muted-foreground/30" />
                  <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground/60">
                    Плэйоффийн шугам
                  </span>
                  <div className="h-px flex-1 border-t border-dashed border-muted-foreground/30" />
                </div>
              )}
            </Fragment>
          );
        })}
      </div>
    </>
  );
}
