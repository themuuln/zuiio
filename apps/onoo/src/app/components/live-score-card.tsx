"use client";

import { Radio } from "lucide-react";
import { useEffect, useState } from "react";
import type { GameWithTeams } from "@/app/lib/shared";
import { GameCard } from "./game-card";

/**
 * Client component that polls /api/live every 20s for live game updates.
 *
 * Renders a list of live GameCards with a "Шууд" section header.
 * Renders nothing when no games are live.
 *
 * TODO(5.1): Replace polling with realtime subscription.
 */
export function LiveScoreCard() {
  const [games, setGames] = useState<GameWithTeams[]>([]);
  const [error, setError] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function fetchLive() {
      try {
        const res = await fetch("/api/live");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as GameWithTeams[];
        if (mounted) {
          setGames(data);
          setError(false);
        }
      } catch {
        if (mounted) setError(true);
      }
    }

    fetchLive();
    const interval = setInterval(fetchLive, 20_000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  if (games.length === 0 && !error) return null;

  return (
    <section aria-labelledby="live-heading">
      <div className="mb-4 flex items-center gap-2">
        <Radio
          className="size-4 animate-pulse text-destructive"
          aria-hidden="true"
        />
        <h2
          id="live-heading"
          className="text-sm font-semibold uppercase tracking-wider text-destructive"
        >
          Шууд тоглолтууд
        </h2>
      </div>
      <div className="grid gap-3">
        {games.map((game) => (
          <GameCard key={game.id} game={game} showWinner={false} />
        ))}
      </div>
      {error && (
        <p className="mt-2 text-xs text-muted-foreground">
          Шууд тоглолтыг ачаалахад алдаа гарлаа
        </p>
      )}
    </section>
  );
}
