import Link from "next/link";
import { TeamLogo } from "@/components/team-logo";
import { cn } from "@/lib/utils";
import type { GameWithTeams } from "../lib/shared";
import { formatGameTime } from "../lib/shared";
import { GameStatusBadge } from "./game-status-badge";

interface ScorebarGameProps {
  game: GameWithTeams;
}

/**
 * NBA-inspired scorestrip game tile.
 *
 * Single horizontal row — compact enough for a scrollable ticker, with scores
 * as the visual anchor. Power resides in the numbers: team codes are subdued,
 * scores are bold, live games glow red.
 *
 * Layout:  [Logo]  CODE  SCORE – SCORE  CODE  [Logo]  │  STATUS
 */
export function ScorebarGame({ game }: ScorebarGameProps) {
  const isLive = game.status === "live_provisional";
  const showTime = game.status === "scheduled";
  const showScore =
    !showTime && game.home_score !== null && game.away_score !== null;
  const homeWon = showScore && (game.home_score ?? 0) > (game.away_score ?? 0);
  const awayWon = showScore && (game.away_score ?? 0) > (game.home_score ?? 0);
  const dimHome = showScore && !isLive && !homeWon;
  const dimAway = showScore && !isLive && !awayWon;

  return (
    <Link
      href={`/games/${game.id}`}
      aria-label={
        showScore
          ? `${game.home_team_name} ${game.home_score}, ${game.away_team_name} ${game.away_score}`
          : `${game.home_team_name} — ${game.away_team_name}, ${formatGameTime(game.scheduled_at)}`
      }
      className={cn(
        "flex shrink-0 items-center gap-1 rounded-lg border border-sidebar-border bg-sidebar px-2.5 py-1 text-xs font-semibold transition-colors duration-150 hover:bg-sidebar-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
        isLive && "ring-1 ring-red-500/25",
      )}
    >
      {/* ── Home team ── */}
      <TeamLogo
        logoUrl={game.home_team_logo_url}
        shortCode={game.home_team_short_code}
        primaryColor={game.home_team_primary_color}
        size="sm"
      />
      <span className={cn("ml-0.5", dimHome && "text-sidebar-foreground/50")}>
        {game.home_team_short_code}
      </span>

      {/* ── Scores (focal point) ── */}
      <span
        className={cn(
          "ml-0.5 text-sm font-black tabular-nums leading-none",
          isLive ? "text-warning" : dimHome && "text-sidebar-foreground/50",
        )}
      >
        {showScore ? game.home_score : "—"}
      </span>
      <span className="text-[10px] font-medium text-sidebar-foreground/30">
        –
      </span>
      <span
        className={cn(
          "text-sm font-black tabular-nums leading-none",
          isLive ? "text-warning" : dimAway && "text-sidebar-foreground/50",
        )}
      >
        {showScore ? game.away_score : "—"}
      </span>

      {/* ── Away team ── */}
      <span className={cn("mr-0.5", dimAway && "text-sidebar-foreground/50")}>
        {game.away_team_short_code}
      </span>
      <TeamLogo
        logoUrl={game.away_team_logo_url}
        shortCode={game.away_team_short_code}
        primaryColor={game.away_team_primary_color}
        size="sm"
      />

      {/* ── Status / time (hairline separator) ── */}
      <span className="ml-1 border-l border-sidebar-border pl-1.5 text-[10px] font-medium uppercase tracking-wide tabular-nums text-sidebar-foreground/50 max-sm:hidden">
        {showTime ? (
          formatGameTime(game.scheduled_at)
        ) : (
          <GameStatusBadge
            game={game}
            className="h-3 border-0 bg-transparent px-0 text-[10px] uppercase tracking-wide"
          />
        )}
      </span>
    </Link>
  );
}
