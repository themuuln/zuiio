# Phase 5 — Live experience (execution spec)

Prereq reading: `docs/plans/00-conventions.md`. Depends on Phase 1 complete (journal, commands) and Task 3.1 (homepage cards). Existing pieces: `src/app/games/[id]/components/live-game-center.tsx` (client), `getPlayByPlay` in `src/app/lib/data.ts`.

## Task 5.1 — Public visibility for provisional games

**Goal:** Live and just-finished games are publicly visible with an explicit provisional marker. Today `v_public_games` exposes only `league_verified|official`, which makes live scores and <5-minute recaps impossible — this view closes that gap deliberately; it is not a leak.
**Touches:** new migration; `src/app/lib/data.ts` (`getLiveGames`, `getGamesByDate` — inspect what they read today and migrate them to the new view).
**Steps:**
1. Migration: `CREATE VIEW v_public_live_games` — games with status ∈ (`scheduled`,`live_provisional`,`final_pending_review`) plus the columns `v_public_games` exposes, and `is_provisional boolean` = status <> 'scheduled'. Current score for live games comes from the same source the tracker maintains (inspect `20260712010000_paid_pilot_publication.sql` for how live score is projected; if live score lives only in unapproved `stat_events`, aggregate made-shot events for the game in the view). **Never** expose event-level provenance, submitter identity, or hidden-player names (mask per Task 2.2).
2. `getLiveGames`/`getGamesByDate` read: verified+official from `v_public_games`, others from `v_public_live_games`, merged with `is_provisional` false/true respectively.
3. UI rule: every surface showing a provisional game/score must render the "Урьдчилсан" badge (amber). Add it to `GameCard`, `LiveScoreCard`, game page header, recap header (Task 4.3 unblocks here — remove its `TODO(5.1)`).
**Done when:** a seeded `live_provisional` game appears on the homepage with badge; its box score page shows provisional; a `scheduled` game shows no score; role-matrix script still passes (anon can select the new view, nothing else changed).

## Task 5.2 — Realtime live game center

**Goal:** Score and play-by-play update without reload during live games.
**Touches:** new migration (realtime publication); `src/app/games/[id]/components/live-game-center.tsx`; `src/app/api/live/route.ts` (Task 3.1) stays as fallback.
**Steps:**
1. Migration: `ALTER PUBLICATION supabase_realtime ADD TABLE public.games;` — payloads are **signals only**; RLS may strip columns and that is fine.
2. Client: `supabase.channel('game-<id>').on('postgres_changes', {event: 'UPDATE', schema: 'public', table: 'games', filter: 'id=eq.<id>'}, refetch)` where `refetch` invalidates the TanStack Query that reads a route handler returning the curated view data (`src/app/api/games/[id]/live/route.ts` — new, returns `v_public_live_games` row + latest play-by-play page). Data always comes from views; the socket only tells us *when* to refetch.
3. Fallback: if the channel doesn't reach `SUBSCRIBED` within 5s or errors, fall back to 15s polling of the same route (single shared hook `src/lib/hooks/use-live-game.ts` encapsulates subscribe-else-poll; the homepage live cards from Task 3.1 migrate to this hook).
4. On-fire indicator: player has scored ≥8 points in the current quarter (compute client-side from play-by-play; flame icon from lucide next to their name in the feed).
5. Play-by-play feed: newest first, each row via `describeEvent` from `@onoo/core`, auto-prepend on refetch with a subtle highlight animation (CSS only).
**Done when:** with the local stack, recording events through the tracker in one window updates score + feed in a second window within ~2s (or 15s on the polling path); disconnecting the socket flips to polling without user-visible errors.

## Task 5.3 — Live player stat lines

**Goal:** Player stat lines tick up during the game.
**Touches:** `src/app/games/[id]/components/live-box-score.tsx` (new or extend existing box score section); reuses `use-live-game.ts`.
**Steps:** live box-score table driven by the same refetch signal; changed cells flash (CSS transition on a `data-changed` attribute, compare previous snapshot in the hook); provisional badge pinned above the table. Sort by points desc, re-sorting animated only with CSS order — no layout thrash on every event.
**Done when:** a recorded 3-pointer updates the shooter's PTS cell with a flash in the second window; final whistle (status → `final_pending_review`) swaps the header to the recap view from Task 4.3 without reload.
