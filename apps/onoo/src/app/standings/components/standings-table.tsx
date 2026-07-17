"use client";

import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { Fragment, useState } from "react";
import { TeamLogo } from "@/components/team-logo";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
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

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Interactive standings table with collapsible detail rows.
 *
 * Click a team row to expand additional stats (home/away record,
 * points for/against, point difference breakdown).
 * Respects prefers-reduced-motion.
 */
export function StandingsTable({ rows, className }: StandingsTableProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  function toggleRow(id: string) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  return (
    <div className={cn("overflow-x-auto", className)}>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">#</TableHead>
            <TableHead>Баг</TableHead>
            <TableHead className="text-center">Я</TableHead>
            <TableHead className="text-center">Х</TableHead>
            <TableHead className="text-center">Хувь</TableHead>
            <TableHead className="text-center">GB</TableHead>
            <TableHead className="text-center">Цуврал</TableHead>
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
              <Fragment key={row.team_season_id}>
                <TableRow
                  className={cn(
                    "cursor-pointer transition-colors",
                    isExpanded && "bg-muted/50",
                  )}
                  onClick={() => toggleRow(row.team_season_id)}
                  aria-expanded={isExpanded}
                >
                  <TableCell className="font-semibold tabular-nums text-muted-foreground">
                    {index + 1}
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
                  <TableCell className="text-center tabular-nums">
                    {row.last10 ?? "—"}
                  </TableCell>
                  <TableCell className="text-right font-semibold tabular-nums">
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
                    <TableCell colSpan={10} className="px-6 py-4">
                      <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
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
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
