import { Suspense } from "react";
import { getQueryClient } from "@/lib/query-client";
import { getPlayers } from "../../lib/data";
import type { LeaderRow } from "../../lib/shared";
import { QueryKeys } from "../lib/query-keys";
import { PlayerGrid, PlayerGridSkeleton } from "./player-grid";

/**
 * Fetches player data and renders the interactive grid.
 * Reads from the React Query cache (prefetched by the page) first,
 * falling back to a direct fetch if the cache hasn't populated yet.
 *
 * Separated so the parent page can stream it via Suspense
 * while the hero header renders immediately.
 */
export async function PlayerGridSection({
  searchQuery,
}: {
  searchQuery: string;
}) {
  const queryClient = getQueryClient();
  const players: LeaderRow[] | undefined =
    queryClient.getQueryData(QueryKeys.playerDirectory(searchQuery)) ??
    (await getPlayers(false, searchQuery || undefined));

  return <PlayerGrid players={players} initialSearch={searchQuery} />;
}

/**
 * Suspense wrapper — use in page.tsx so the grid streams independently.
 */
export function SuspendedPlayerGrid({ searchQuery }: { searchQuery: string }) {
  return (
    <Suspense fallback={<PlayerGridSkeleton />}>
      <PlayerGridSection searchQuery={searchQuery} />
    </Suspense>
  );
}
