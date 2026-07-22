/**
 * Recap header — narrative game summary with top performers by EFF.
 *
 * Renders the final score narrative, provisional status badge, and
 * top-3 performers ranked by EFF (pts + reb + ast + stl + blk - tov)
 * alongside their PlayerAvatar and stat line.
 *
 * Server component — no client hooks or browser APIs.
 */

import { Trophy } from "lucide-react";
import Link from "next/link";
import { PlayerAvatar } from "@/components/player-avatar";
import {
  Badge,
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui";
import type { BoxScoreRow, GameWithTeams } from "../../../lib/shared";

// ---------------------------------------------------------------------------
// EFF formula: pts + reb + ast + stl + blk - tov
// ---------------------------------------------------------------------------
function calculateEFF(row: BoxScoreRow): number {
  return (
    row.pts + (row.oreb + row.dreb) + row.ast + row.stl + row.blk - row.tov
  );
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RecapHeaderProps {
  game: GameWithTeams;
  boxScore: BoxScoreRow[];
  leadChanges: number;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function RecapHeader({ game, boxScore, leadChanges }: RecapHeaderProps) {
  const homeScore = game.home_score ?? 0;
  const awayScore = game.away_score ?? 0;
  const homeWon = homeScore > awayScore;
  const margin = Math.abs(homeScore - awayScore);
  const winnerName = homeWon ? game.home_team_name : game.away_team_name;

  // Top 3 by EFF
  const topPerformers = [...boxScore]
    .sort((a, b) => calculateEFF(b) - calculateEFF(a))
    .slice(0, 3);

  const topScorer = topPerformers[0] ?? null;

  return (
    <Card className="shadow-none lg:col-span-7">
      <CardHeader>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Тоглолтын өгүүлэмж
          </p>
          <div className="mt-1 flex items-center gap-2">
            <CardTitle className="text-2xl tracking-tight">
              Товч дүгнэлт
            </CardTitle>
            {game.status === "final_pending_review" ? (
              <Badge variant="provisional">Урьдчилсан</Badge>
            ) : null}
          </div>
        </div>
        <CardAction>
          <Trophy aria-hidden="true" />
        </CardAction>
      </CardHeader>
      <CardContent>
        <p className="font-display text-2xl leading-relaxed tracking-tight sm:text-3xl">
          {winnerName} {margin} онооны зөрүүгээр ялалт байгууллаа.
          {topScorer
            ? ` ${topScorer.player_name} ${topScorer.pts} оноогоор тоглолтыг тэргүүлэв.`
            : ""}
        </p>
        {leadChanges > 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            Тоглолтын явцад {leadChanges} удаа илүү ээлж солигдлоо.
          </p>
        ) : null}

        {topPerformers.length > 0 ? (
          <div className="mt-5 grid gap-2 sm:grid-cols-3">
            {topPerformers.map((player, i) => {
              const eff = calculateEFF(player);
              return (
                <Link
                  key={player.player_id}
                  href={`/players/${player.player_id}`}
                  className="flex items-center gap-3 rounded-lg border p-3 transition-[background-color,transform] hover:bg-accent active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none"
                >
                  <PlayerAvatar
                    name={player.player_name}
                    photoUrl={null}
                    size="sm"
                    primaryColor={
                      player.team_season_id === game.home_team_season_id
                        ? game.home_team_primary_color
                        : game.away_team_primary_color
                    }
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">
                      {player.player_name}
                    </p>
                    <p className="text-xs tabular-nums text-muted-foreground">
                      {player.pts} PTS · {player.oreb + player.dreb} REB ·{" "}
                      {player.ast} AST · {player.stl} STL · {player.blk} BLK
                    </p>
                    <p className="text-xs text-muted-foreground">EFF: {eff}</p>
                  </div>
                  <span className="text-lg font-black tabular-nums text-muted-foreground">
                    #{i + 1}
                  </span>
                </Link>
              );
            })}
          </div>
        ) : null}

        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          Энэ дүгнэлт зөвхөн лигийн баталгаажсан оноо болон box score-д
          тулгуурласан.
        </p>
      </CardContent>
    </Card>
  );
}
