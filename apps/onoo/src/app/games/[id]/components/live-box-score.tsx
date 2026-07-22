"use client";

import { useEffect, useRef } from "react";
import {
  Badge,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface LiveBoxScoreRow {
  playerId: string;
  playerName: string;
  teamSeasonId: string;
  pts: number;
  fgm: number;
  fga: number;
  tpm: number;
  tpa: number;
  ftm: number;
  fta: number;
  oreb: number;
  dreb: number;
  ast: number;
  stl: number;
  blk: number;
  tov: number;
  pf: number;
}

export interface LiveBoxScoreProps {
  homeTeamName: string;
  awayTeamName: string;
  homeTeamSeasonId: string;
  awayTeamSeasonId: string;
  rows: LiveBoxScoreRow[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fieldStats(row: LiveBoxScoreRow): {
  fgm: number;
  fga: number;
  pct: string;
} {
  return {
    fgm: row.fgm,
    fga: row.fga,
    pct: row.fga > 0 ? ((row.fgm / row.fga) * 100).toFixed(1) : "-",
  };
}

// ---------------------------------------------------------------------------
// Flash cell — wraps a stat value and flashes briefly on change
// ---------------------------------------------------------------------------

function FlashCell({
  value,
  className,
}: {
  value: string | number;
  className?: string;
}) {
  const ref = useRef<HTMLTableCellElement>(null);
  const prev = useRef(value);

  useEffect(() => {
    if (ref.current && prev.current !== value) {
      ref.current.setAttribute("data-changed", "true");
      const timer = setTimeout(() => {
        ref.current?.removeAttribute("data-changed");
      }, 1200);
      prev.current = value;
      return () => clearTimeout(timer);
    }
    prev.current = value;
  }, [value]);

  return (
    <TableCell
      ref={ref}
      className={cn("tabular-nums transition-all duration-700", className)}
    >
      {value}
    </TableCell>
  );
}

// ---------------------------------------------------------------------------
// Team section
// ---------------------------------------------------------------------------

function TeamBoxScore({
  teamName,
  rows,
}: {
  teamName: string;
  rows: LiveBoxScoreRow[];
}) {
  // Sort by points descending
  const sorted = [...rows].sort((a, b) => b.pts - a.pts);

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-muted-foreground">
        {teamName}
      </h3>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Тоглогч</TableHead>
              <TableHead className="text-right">Оноо</TableHead>
              <TableHead className="text-right">2О</TableHead>
              <TableHead className="text-right">3О</TableHead>
              <TableHead className="text-right">ЧШ</TableHead>
              <TableHead className="text-right">Сам</TableHead>
              <TableHead className="text-right">Дам</TableHead>
              <TableHead className="text-right">Тас</TableHead>
              <TableHead className="text-right">Хаа</TableHead>
              <TableHead className="text-right">Алд</TableHead>
              <TableHead className="text-right">F</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((row) => {
              const fg = fieldStats(row);
              return (
                <TableRow key={row.playerId}>
                  <TableCell className="font-medium">
                    {row.playerName}
                  </TableCell>
                  <FlashCell value={row.pts} className="font-semibold" />
                  <FlashCell value={`${fg.fgm}/${fg.fga}`} />
                  <FlashCell value={`${row.tpm}/${row.tpa}`} />
                  <FlashCell value={`${row.ftm}/${row.fta}`} />
                  <FlashCell value={row.oreb + row.dreb} />
                  <FlashCell value={row.ast} />
                  <FlashCell value={row.stl} />
                  <FlashCell value={row.blk} />
                  <FlashCell value={row.tov} />
                  <FlashCell value={row.pf} />
                </TableRow>
              );
            })}
            {sorted.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={11}
                  className="py-6 text-center text-sm text-muted-foreground"
                >
                  Тоглогчийн мөр хараахан гараагүй байна
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function LiveBoxScore({
  homeTeamName,
  awayTeamName,
  homeTeamSeasonId,
  awayTeamSeasonId,
  rows,
}: LiveBoxScoreProps) {
  const homeRows = rows.filter((r) => r.teamSeasonId === homeTeamSeasonId);
  const awayRows = rows.filter((r) => r.teamSeasonId === awayTeamSeasonId);

  return (
    <section aria-labelledby="live-box-score-heading" className="space-y-6">
      <div className="flex items-center gap-3">
        <h2
          id="live-box-score-heading"
          className="text-lg font-semibold tracking-tight"
        >
          Box Score
        </h2>
        <Badge variant="outline" className="text-xs">
          Урьдчилсан
        </Badge>
      </div>
      <TeamBoxScore teamName={homeTeamName} rows={homeRows} />
      <TeamBoxScore teamName={awayTeamName} rows={awayRows} />
    </section>
  );
}
