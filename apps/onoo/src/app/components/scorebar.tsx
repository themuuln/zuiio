import { cn } from "@/lib/utils";
import { getScorebarGames } from "../lib/data";
import { getUlaanbaatarDate } from "../lib/shared";
import { ScorebarGame } from "./scorebar-game";

// Shared min-height so the layout's Suspense fallback reserves the same space
// and the bar doesn't shift when it streams in.
export const SCOREBAR_MIN_HEIGHT = "min-h-[48px]";

// Compact numeric label (e.g. "Ба, 7/17") for the fallback day, kept short so
// it doesn't crowd the games in the ticker.
function shortDateLabel(dateStr: string): string {
  const d = new Date(`${dateStr}T12:00:00`);
  return d.toLocaleDateString("mn-MN", {
    weekday: "short",
    month: "numeric",
    day: "numeric",
    timeZone: "Asia/Ulaanbaatar",
  });
}

const getTodayDate = (): string => getUlaanbaatarDate();

/**
 * Site-wide horizontally scrollable score ticker rendered below the SiteNav.
 * Server Component — fetches the day's games at request time. NBA-inspired
 * compact strip: single horizontal row, tight spacing, scores as the focal
 * point.
 */
export async function Scorebar() {
  const today = await getTodayDate();
  const { games, activeDate, isFallback } = await getScorebarGames(today);

  return (
    <section
      aria-label="Тоглолтын мэдээ"
      className="border-b border-sidebar-border bg-sidebar text-sidebar-foreground"
    >
      <div
        className={cn(
          // NBA-inspired compact strip: single row, centred, tight gutter.
          "mx-auto flex max-w-7xl items-center gap-1.5 overflow-x-auto px-3 py-1.5 scrollbar-none sm:px-6 lg:px-8",
          SCOREBAR_MIN_HEIGHT,
        )}
      >
        {games.length > 0 ? (
          <>
            {isFallback && (
              <span className="shrink-0 self-center pr-1 text-[10px] font-medium uppercase tracking-wide text-sidebar-foreground/40">
                {shortDateLabel(activeDate)}
              </span>
            )}
            {games.map((game) => (
              <ScorebarGame key={game.id} game={game} />
            ))}
          </>
        ) : (
          <p className="text-xs text-sidebar-foreground/40">
            Өнөөдөр тоглолт алга
          </p>
        )}
      </div>
    </section>
  );
}
