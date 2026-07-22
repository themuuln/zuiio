/**
 * Top performers — podium cards.
 *
 * Renders the top-3 performers by the existing weighted formula
 * (pts + reb*1.2 + ast*1.5) as podium cards (1st/2nd/3rd) in a
 * Card container ready to drop into a grid column.
 *
 * Also exports PlayerHighlights for the detailed highlight cards.
 *
 * Server component — no client hooks or browser APIs.
 */

import Link from "next/link";
import { PlayerAvatar } from "@/components/player-avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui";
import { cn } from "@/lib/utils";
import type { BoxScoreRow } from "../../../lib/shared";
import { generatePlayerGameSummary } from "../../../lib/summaries";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TopPerformersProps {
  rows: BoxScoreRow[];
  homeTeamSeasonId: string;
  homeTeamPrimaryColor: string | null;
  awayTeamPrimaryColor: string | null;
}

export interface PlayerHighlightsProps {
  rows: BoxScoreRow[];
  homeTeamSeasonId: string;
  awayTeamSeasonId: string;
  homeWon: boolean;
  homeScore: number;
  awayScore: number;
  homeTeamShortCode: string;
  awayTeamShortCode: string;
  homeTeamPrimaryColor: string | null;
  awayTeamPrimaryColor: string | null;
}

// ---------------------------------------------------------------------------
// Data helpers (shared between the two exports)
// ---------------------------------------------------------------------------

/** Weighted performance score matching the existing page formula. */
function calculateWeightedScore(row: BoxScoreRow): number {
  return row.pts + (row.oreb + row.dreb) * 1.2 + row.ast * 1.5;
}

/** Sort a box score by weighted score, return top 3. */
export function getTopPodium(rows: BoxScoreRow[]): BoxScoreRow[] {
  return [...rows]
    .sort((a, b) => calculateWeightedScore(b) - calculateWeightedScore(a))
    .slice(0, 3);
}

/** Player result string needed by generatePlayerGameSummary. */
function playerResult(
  player: BoxScoreRow,
  homeTeamSeasonId: string,
  homeWon: boolean,
): "W" | "L" {
  if (player.team_season_id === homeTeamSeasonId) {
    return homeWon ? "W" : "L";
  }
  return homeWon ? "L" : "W";
}

// ---------------------------------------------------------------------------
// Podium card sub-component
// ---------------------------------------------------------------------------

interface PodiumCardProps {
  player: BoxScoreRow;
  place: 1 | 2 | 3;
  homeTeamSeasonId: string;
  homeTeamPrimaryColor: string | null;
  awayTeamPrimaryColor: string | null;
}

function PodiumCard({
  player,
  place,
  homeTeamSeasonId,
  homeTeamPrimaryColor,
  awayTeamPrimaryColor,
}: PodiumCardProps) {
  const isFirst = place === 1;
  const avatarSize: "lg" | "md" = isFirst ? "lg" : "md";
  const primaryColor =
    player.team_season_id === homeTeamSeasonId
      ? homeTeamPrimaryColor
      : awayTeamPrimaryColor;

  return (
    <Link
      href={`/players/${player.player_id}`}
      aria-label={`${player.player_name} — ${place}-р байр`}
      className={cn(
        "flex flex-col items-center gap-2 rounded-xl p-2 transition-[background-color,transform] hover:bg-accent active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none",
        isFirst ? "w-24 sm:w-28" : "w-20 sm:w-24",
      )}
    >
      <PlayerAvatar
        name={player.player_name}
        photoUrl={null}
        size={avatarSize}
        primaryColor={primaryColor}
      />
      <span
        className={cn(
          "w-full truncate text-center",
          isFirst ? "text-sm font-bold" : "text-xs font-semibold",
        )}
      >
        {player.player_name}
      </span>
      <span
        className={cn(
          "font-black tabular-nums",
          isFirst ? "text-2xl" : "text-lg",
        )}
      >
        {player.pts}
      </span>
      <span
        className={cn(
          "flex w-full items-center justify-center rounded-t-lg text-xs font-bold",
          isFirst
            ? "h-24 bg-primary text-sm text-primary-foreground"
            : "h-16 bg-muted text-muted-foreground",
        )}
      >
        {place}
      </span>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Main component — podium card (drops into a grid column)
// ---------------------------------------------------------------------------

export function TopPerformers({
  rows,
  homeTeamSeasonId,
  homeTeamPrimaryColor,
  awayTeamPrimaryColor,
}: TopPerformersProps) {
  const podiumPerformers = getTopPodium(rows);

  return (
    <Card className="shadow-none lg:col-span-5">
      <CardHeader>
        <CardTitle>Шилдэг тоглогчид</CardTitle>
        <CardDescription>
          Нэгдүгээр, хоёрдугаар, гуравдугаар байр
        </CardDescription>
      </CardHeader>
      <CardContent>
        {podiumPerformers.length > 0 ? (
          <div className="flex items-end justify-center gap-3 pt-4">
            {/* 2nd place — left */}
            {podiumPerformers[1] ? (
              <PodiumCard
                player={podiumPerformers[1]}
                place={2}
                homeTeamSeasonId={homeTeamSeasonId}
                homeTeamPrimaryColor={homeTeamPrimaryColor}
                awayTeamPrimaryColor={awayTeamPrimaryColor}
              />
            ) : null}

            {/* 1st place — center, taller */}
            {podiumPerformers[0] ? (
              <PodiumCard
                player={podiumPerformers[0]}
                place={1}
                homeTeamSeasonId={homeTeamSeasonId}
                homeTeamPrimaryColor={homeTeamPrimaryColor}
                awayTeamPrimaryColor={awayTeamPrimaryColor}
              />
            ) : null}

            {/* 3rd place — right */}
            {podiumPerformers[2] ? (
              <PodiumCard
                player={podiumPerformers[2]}
                place={3}
                homeTeamSeasonId={homeTeamSeasonId}
                homeTeamPrimaryColor={homeTeamPrimaryColor}
                awayTeamPrimaryColor={awayTeamPrimaryColor}
              />
            ) : null}
          </div>
        ) : (
          <p className="text-sm leading-relaxed text-muted-foreground">
            Тоглогчийн мөр хараахан нийтлэгдээгүй байна.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Player highlights section (used below the grid)
// ---------------------------------------------------------------------------

export function PlayerHighlights({
  rows,
  homeTeamSeasonId,
  awayTeamSeasonId,
  homeWon,
  homeScore,
  awayScore,
  homeTeamShortCode,
  awayTeamShortCode,
  homeTeamPrimaryColor,
  awayTeamPrimaryColor,
}: PlayerHighlightsProps) {
  const podiumPerformers = getTopPodium(rows);

  if (podiumPerformers.length === 0) return null;

  return (
    <section
      aria-labelledby="player-highlights-heading"
      className="flex flex-col gap-4"
    >
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Тоглогчдын онцлох үе
        </p>
        <h2
          id="player-highlights-heading"
          className="mt-1 text-2xl font-bold tracking-tight"
        >
          Тоглогчдын онцлох үе
        </h2>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {podiumPerformers.map((player) => (
          <Card key={player.player_id} className="shadow-none">
            <CardContent className="flex items-start gap-3 pt-6">
              <PlayerAvatar
                name={player.player_name}
                photoUrl={null}
                size="md"
                primaryColor={
                  player.team_season_id === homeTeamSeasonId
                    ? homeTeamPrimaryColor
                    : awayTeamPrimaryColor
                }
              />
              <div className="min-w-0 flex-1">
                <Link
                  href={`/players/${player.player_id}`}
                  className="block truncate font-semibold hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {player.player_name}
                </Link>
                <p className="text-xs text-muted-foreground">
                  {player.team_name}
                </p>
                <p className="mt-1 text-sm leading-relaxed italic text-muted-foreground">
                  {generatePlayerGameSummary({
                    player_name: player.player_name,
                    pts: player.pts,
                    reb: player.oreb + player.dreb,
                    ast: player.ast,
                    stl: player.stl,
                    blk: player.blk,
                    fgm: player.fgm,
                    fga: player.fga,
                    result: playerResult(player, homeTeamSeasonId, homeWon),
                    team_score:
                      player.team_season_id === homeTeamSeasonId
                        ? homeScore
                        : awayScore,
                    opponent_score:
                      player.team_season_id === homeTeamSeasonId
                        ? awayScore
                        : homeScore,
                    opponent_short_code:
                      player.team_season_id === homeTeamSeasonId
                        ? awayTeamShortCode
                        : homeTeamShortCode,
                  })}
                </p>
                <p className="mt-1 text-xs tabular-nums text-muted-foreground">
                  {player.pts} оноо · {player.oreb + player.dreb} самбар ·{" "}
                  {player.ast} дамжуулалт · {player.stl} таслалт · {player.blk}{" "}
                  хаалт
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
