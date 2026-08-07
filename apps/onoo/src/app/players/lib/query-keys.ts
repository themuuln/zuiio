/**
 * React Query cache keys for the Onoo public pages.
 *
 * Co-locate all player-directory related keys here so both the
 * server-side prefetch (page.tsx) and client consumers stay in sync.
 */
export const QueryKeys = {
  playerDirectory: (searchQuery: string) =>
    ["players-directory", searchQuery] as const,
} as const;
