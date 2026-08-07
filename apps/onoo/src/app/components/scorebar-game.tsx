import Link from "next/link";
import { TeamLogo } from "@/components/team-logo";
import { cn } from "@/lib/utils";
import type { GameWithTeams } from "../lib/shared";
import { formatGameTime } from "../lib/shared";
import { GameStatusBadge } from "./game-status-badge";

interface ScorebarGameProps {
  game: GameWithTeams;
}

interface TeamRowProps {
  logoUrl: string | null;
  shortCode: string;
  name: string;
  primaryColor: string | null;
  score: number | null;
  showScore: boolean;
  isWinner: boolean;
  isLive: boolean;
}

/**
 * One team. A single structure that morphs between the two scorebar layouts via
 * `group-data` variants (no duplicated markup, so score/em-dash text stays unique
 * for tests):
 *   - expanded (top / scroll-up): a full-width row — logo, team NAME, then the
 *     score pushed to the right edge (`ml-auto`), NBA scoreboard style.
 *   - compact (scroll-down): logo, short tricode, score, all inline and tight.
 * The name↔tricode swap is the only place two spans coexist; only one is visible.
 */
function TeamRow({
  logoUrl,
  shortCode,
  name,
  primaryColor,
  score,
  showScore,
  isWinner,
  isLive,
}: TeamRowProps) {
  const dimLoser = showScore && !isLive && !isWinner;
  return (
    <span className="flex flex-1 items-center gap-2 group-data-[compact=true]/scorebar:flex-none group-data-[compact=true]/scorebar:gap-1.5">
      <TeamLogo
        logoUrl={logoUrl}
        shortCode={shortCode}
        primaryColor={primaryColor}
        size="sm"
      />
      <span
        className={cn(
          "min-w-0 truncate text-sm font-semibold group-data-[compact=true]/scorebar:hidden",
          dimLoser && "text-sidebar-foreground/50",
        )}
      >
        {name}
      </span>
      <span
        className={cn(
          "hidden text-xs font-semibold uppercase group-data-[compact=true]/scorebar:inline",
          dimLoser && "text-sidebar-foreground/50",
        )}
      >
        {shortCode}
      </span>
      <span
        className={cn(
          "ml-auto text-lg font-black tabular-nums group-data-[compact=true]/scorebar:ml-0 group-data-[compact=true]/scorebar:text-sm",
          isLive ? "text-warning" : dimLoser && "text-sidebar-foreground/50",
        )}
      >
        {showScore ? score : "—"}
      </span>
    </span>
  );
}

// Site-wide score card for the ticker. Server Component — the live pulse is pure
// CSS. Layout is scroll-responsive via the `group/scorebar` wrapper: a taller
// NBA-style stacked "rectangle" at the top of the page, a compact inline row once
// scrolled. Height snaps (no size transition) to avoid a mid-scroll empty gap.
export function ScorebarGame({ game }: ScorebarGameProps) {
  const isLive = game.status === "live_provisional";
  const showTime = game.status === "scheduled";
  const showScore =
    !showTime && game.home_score !== null && game.away_score !== null;
  const homeWon = showScore && (game.home_score ?? 0) > (game.away_score ?? 0);
  const awayWon = showScore && (game.away_score ?? 0) > (game.home_score ?? 0);

  return (
    <Link
      href={`/games/${game.id}`}
      aria-label={
        showScore
          ? `${game.home_team_name} ${game.home_score}, ${game.away_team_name} ${game.away_score}`
          : `${game.home_team_name} — ${game.away_team_name}, ${formatGameTime(game.scheduled_at)}`
      }
      className={cn(
        // Expanded (default): vertical stack, wider so team rows can breathe.
        "flex shrink-0 min-w-[184px] flex-col justify-center gap-1.5 rounded-lg border border-sidebar-border bg-sidebar px-3 py-2 transition-colors duration-150 hover:bg-sidebar-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
        "group-data-[compact=true]/scorebar:min-w-0 group-data-[compact=true]/scorebar:flex-row group-data-[compact=true]/scorebar:items-center group-data-[compact=true]/scorebar:gap-2 group-data-[compact=true]/scorebar:px-2.5 group-data-[compact=true]/scorebar:py-1",
        isLive && "ring-1 ring-red-500/25",
      )}
    >
      <TeamRow
        logoUrl={game.home_team_logo_url}
        shortCode={game.home_team_short_code}
        name={game.home_team_name}
        primaryColor={game.home_team_primary_color}
        score={game.home_score}
        showScore={showScore}
        isWinner={homeWon}
        isLive={isLive}
      />
      {/* Team separator — compact row only. */}
      <span className="hidden text-[10px] font-medium text-sidebar-foreground/30 group-data-[compact=true]/scorebar:inline">
        –
      </span>
      <TeamRow
        logoUrl={game.away_team_logo_url}
        shortCode={game.away_team_short_code}
        name={game.away_team_name}
        primaryColor={game.away_team_primary_color}
        score={game.away_score}
        showScore={showScore}
        isWinner={awayWon}
        isLive={isLive}
      />
      {/* Status/time. DOM-last so it trails on the right when compact; lifted to
          the top-left of the rectangle (NBA style) via `order-first` + `self-start`
          when expanded. */}
      <span className="order-first flex items-center self-start group-data-[compact=true]/scorebar:order-none group-data-[compact=true]/scorebar:ml-0.5 group-data-[compact=true]/scorebar:self-auto group-data-[compact=true]/scorebar:border-l group-data-[compact=true]/scorebar:border-sidebar-border group-data-[compact=true]/scorebar:pl-2">
        {showTime ? (
          <span className="text-[10px] font-medium uppercase tracking-wide tabular-nums text-sidebar-foreground/50">
            {formatGameTime(game.scheduled_at)}
          </span>
        ) : (
          <GameStatusBadge
            game={game}
            className="h-4 border-0 bg-transparent px-0 text-[10px] uppercase tracking-wide"
          />
        )}
      </span>
    </Link>
  );
}
