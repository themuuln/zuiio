import { ArrowDownNarrowWide, ArrowUpNarrowWide } from "lucide-react";
import type { PlayerGameLine } from "@/app/lib/shared";
import { formatMinutes } from "@/app/lib/shared";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

// Game Score formula (same as _advanced-helpers calcGameScore)
function gameScore(line: PlayerGameLine): number {
  return (
    line.pts +
    0.4 * line.fgm -
    0.7 * line.fga -
    0.4 * (line.fta - line.ftm) +
    0.7 * line.oreb +
    0.3 * line.dreb +
    line.stl +
    0.7 * line.ast +
    0.7 * line.blk -
    0.4 * line.pf -
    line.tov
  );
}

interface BestWorstGamesProps {
  gameLines: PlayerGameLine[];
  locale?: "mn" | "en";
  className?: string;
}

export function BestWorstGames({
  gameLines,
  locale = "mn",
  className,
}: BestWorstGamesProps) {
  const isEn = locale === "en";

  if (gameLines.length < 2) return null;

  const scored = gameLines.map((g) => ({ game: g, score: gameScore(g) }));
  scored.sort((a, b) => b.score - a.score);
  const best = scored[0]!;
  const worst = scored[scored.length - 1]!;

  // Skip if best and worst are the same or within 1 Game Score point
  if (best.game.game_id === worst.game.game_id || best.score - worst.score < 1)
    return null;
  return (
    <div className={cn("grid gap-6 lg:grid-cols-2", className)}>
      {/* Best game */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-success/10 text-success">
              <ArrowUpNarrowWide className="size-5" aria-hidden="true" />
            </span>
            <div>
              <CardTitle className="text-lg">
                {isEn ? "Best Game" : "Шилдэг тоглолт"}
              </CardTitle>
              <CardDescription className="mt-1">
                {isEn
                  ? `Game Score ${best.score.toFixed(1)}`
                  : `Тоглолтын үнэлгээ ${best.score.toFixed(1)}`}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <GameStatLine game={best.game} isEn={isEn} highlight="best" />
        </CardContent>
      </Card>

      {/* Worst game */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
              <ArrowDownNarrowWide className="size-5" aria-hidden="true" />
            </span>
            <div>
              <CardTitle className="text-lg">
                {isEn ? "Toughest Game" : "Хэцүү тоглолт"}
              </CardTitle>
              <CardDescription className="mt-1">
                {isEn
                  ? `Game Score ${worst.score.toFixed(1)}`
                  : `Тоглолтын үнэлгээ ${worst.score.toFixed(1)}`}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <GameStatLine game={worst.game} isEn={isEn} highlight="worst" />
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Stat line row
// ---------------------------------------------------------------------------

function GameStatLine({
  game,
  isEn,
  highlight,
}: {
  game: PlayerGameLine;
  isEn: boolean;
  highlight: "best" | "worst";
}) {
  const date = new Date(game.game_date).toLocaleDateString(
    isEn ? "en-US" : "mn-MN",
    { month: "short", day: "numeric" },
  );

  return (
    <div className="space-y-3">
      {/* Header: opponent, result, date */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">
            {game.opponent_short_code}
          </span>
          <span className="text-xs text-muted-foreground">
            {game.is_home ? "🏠" : "✈️"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={
              game.result === "W"
                ? "text-xs font-semibold text-success"
                : "text-xs font-semibold text-destructive"
            }
          >
            {game.result} {game.team_score}–{game.opponent_score}
          </span>
          <span className="text-xs text-muted-foreground">{date}</span>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-4 gap-2 rounded-lg bg-muted/30 p-3 sm:grid-cols-5">
        <StatItem label={isEn ? "PTS" : "ОНОО"} value={game.pts} />
        <StatItem label={isEn ? "REB" : "САМ"} value={game.oreb + game.dreb} />
        <StatItem label={isEn ? "AST" : "ДАМ"} value={game.ast} />
        <StatItem
          label={isEn ? "FG" : "ШИД"}
          value={`${game.fgm}/${game.fga}`}
        />
        <StatItem
          label={isEn ? "MIN" : "МИн"}
          value={formatMinutes(game.seconds_played)}
          className="hidden sm:block"
        />
      </div>

      {/* Highlight stat — the standout number */}
      <p className="text-xs text-muted-foreground">
        {highlight === "best"
          ? isEn
            ? bestHighlight(game)
            : bestHighlightMn(game)
          : isEn
            ? worstHighlight(game)
            : worstHighlightMn(game)}
      </p>
    </div>
  );
}

function StatItem({
  label,
  value,
  className,
}: {
  label: string;
  value: string | number;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center gap-0.5", className)}>
      <span className="text-lg font-bold tabular-nums leading-none">
        {value}
      </span>
      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Highlight text generators
// ---------------------------------------------------------------------------

function bestHighlight(game: PlayerGameLine): string {
  const highlights: string[] = [];
  if (game.pts >= 20) highlights.push(`${game.pts} points`);
  else if (game.pts >= 15) highlights.push(`${game.pts} points`);
  if (game.ast >= 8) highlights.push(`${game.ast} assists`);
  if (game.oreb + game.dreb >= 10)
    highlights.push(`${game.oreb + game.dreb} rebounds`);
  if (game.stl >= 3) highlights.push(`${game.stl} steals`);
  if (game.blk >= 3) highlights.push(`${game.blk} blocks`);
  if (highlights.length === 0)
    highlights.push(`${game.pts} pts · ${game.ast} ast`);
  return `Career performance: ${highlights.join(", ")}.`;
}

function bestHighlightMn(game: PlayerGameLine): string {
  const highlights: string[] = [];
  if (game.pts >= 20) highlights.push(`${game.pts} оноо`);
  else if (game.pts >= 15) highlights.push(`${game.pts} оноо`);
  if (game.ast >= 8) highlights.push(`${game.ast} дамжуулалт`);
  if (game.oreb + game.dreb >= 10)
    highlights.push(`${game.oreb + game.dreb} самбар`);
  if (game.stl >= 3) highlights.push(`${game.stl} булчилт`);
  if (game.blk >= 3) highlights.push(`${game.blk} хаалт`);
  if (highlights.length === 0) highlights.push(`${game.pts} о · ${game.ast} д`);
  return `Онцлох тоглолт: ${highlights.join(", ")}.`;
}

function worstHighlight(game: PlayerGameLine): string {
  const issues: string[] = [];
  if (game.pts <= 4) issues.push(`${game.pts} points`);
  if (game.tov >= 4) issues.push(`${game.tov} turnovers`);
  if (game.fga >= 5 && game.fgm / game.fga < 0.3)
    issues.push(`${game.fgm}/${game.fga} FG`);
  if (game.pf >= 4) issues.push(`${game.pf} fouls`);
  if (issues.length === 0)
    issues.push(`${game.pts} pts · ${game.fgm}/${game.fga} FG`);
  return `Struggled: ${issues.join(", ")}.`;
}

function worstHighlightMn(game: PlayerGameLine): string {
  const issues: string[] = [];
  if (game.pts <= 4) issues.push(`${game.pts} оноо`);
  if (game.tov >= 4) issues.push(`${game.tov} алдаа`);
  if (game.fga >= 5 && game.fgm / game.fga < 0.3)
    issues.push(`${game.fgm}/${game.fga} шидэлт`);
  if (game.pf >= 4) issues.push(`${game.pf} алдаа`);
  if (issues.length === 0)
    issues.push(`${game.pts} о · ${game.fgm}/${game.fga} Ш`);
  return `Хэцүү тоглолт: ${issues.join(", ")}.`;
}
