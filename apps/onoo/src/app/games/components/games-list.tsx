import { CalendarDays, Radio } from "lucide-react";
import { Suspense } from "react";
import { Badge } from "@/components/ui";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { PublicEmptyState } from "../../components/public-empty-state";
import { SwipeableGameCard } from "../../components/swipeable-game-card";
import {
  formatDate,
  type GameWithTeams,
  getGamesByDate,
  getUlaanbaatarDate,
} from "../../lib/data";

function isFinal(game: GameWithTeams): boolean {
  return (
    game.status === "final_pending_review" ||
    game.status === "league_verified" ||
    game.status === "official"
  );
}

interface GamesListProps {
  dateStr?: string;
}

/**
 * Fetches and renders games for a given date.
 * Wrapped in Suspense so the games content streams independently
 * while the layout shell is served from CDN cache.
 */
export function GamesList({ dateStr }: GamesListProps) {
  return (
    <Suspense fallback={<GamesListSkeleton />}>
      <GamesListInner dateStr={dateStr} />
    </Suspense>
  );
}

async function GamesListInner({ dateStr: override }: GamesListProps) {
  const dateStr = override ?? await getUlaanbaatarDate();
  const games = await getGamesByDate(dateStr);
  const liveGames = games.filter((g) => g.status === "live_provisional");
  const upcomingGames = games.filter(
    (g) =>
      g.status === "scheduled" ||
      g.status === "postponed" ||
      g.status === "cancelled",
  );
  const completedGames = games.filter(isFinal);

  if (games.length === 0) {
    return (
      <PublicEmptyState
        icon={CalendarDays}
        title="Энэ өдөр тоглолт байхгүй"
        description="Тухайн өдрийн тоглолтын хуваарь гараагүй байна. Өөр өдөр сонгох эсвэл буцаж үзээрэй."
      />
    );
  }

  return (
    <>
      {liveGames.length > 0 && (
        <GameGroup
          id="live"
          eyebrow="Шууд"
          title="Шууд тоглолтууд"
          games={liveGames}
          live
        />
      )}
      {upcomingGames.length > 0 && (
        <GameGroup
          id="upcoming"
          eyebrow="Хуваарь"
          title="Товлогдсон тоглолтууд"
          games={upcomingGames}
        />
      )}
      {completedGames.length > 0 && (
        <GameGroup
          id="completed"
          eyebrow="Үр дүн"
          title="Дууссан тоглолтууд"
          games={completedGames}
        />
      )}
    </>
  );
}

interface GameGroupProps {
  id: string;
  eyebrow: string;
  title: string;
  games: GameWithTeams[];
  live?: boolean;
}

function GameGroup({ id, eyebrow, title, games, live = false }: GameGroupProps) {
  return (
    <section aria-labelledby={`${id}-heading`}>
      <div className="mb-4 flex flex-col gap-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {eyebrow}
        </p>
        <div className="flex items-center justify-between">
          <h2
            id={`${id}-heading`}
            className="flex items-center gap-2 text-xl font-bold tracking-tight sm:text-2xl"
          >
            {title}
            {live && (
              <Badge
                variant="destructive"
                className="animate-pulse gap-1.5 text-xs"
              >
                <Radio className="size-3" aria-hidden="true" />
                LIVE
              </Badge>
            )}
          </h2>
          <p className="text-sm text-muted-foreground">
            {games.length} тоглолт
          </p>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {games.map((game) => (
          <SwipeableGameCard key={game.id} game={game} />
        ))}
      </div>
    </section>
  );
}

function GamesListSkeleton() {
  return (
    <div className="flex flex-col gap-8">
      {[1, 2, 3].map((group) => (
        <div key={group} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-7 w-48" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((card) => (
              <div
                key={card}
                className="flex flex-col gap-3 rounded-xl border p-4"
              >
                <Skeleton className="h-4 w-24" />
                <div className="flex items-center gap-3">
                  <Skeleton className="size-10 rounded-full" />
                  <Skeleton className="h-4 flex-1" />
                  <Skeleton className="h-6 w-8" />
                </div>
                <Skeleton className="mx-auto h-3 w-6" />
                <div className="flex items-center gap-3">
                  <Skeleton className="size-10 rounded-full" />
                  <Skeleton className="h-4 flex-1" />
                  <Skeleton className="h-6 w-8" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
