# T-5.1 — Public Visibility for Provisional Games

## Overview

Make live and just-finished games publicly visible with an explicit provisional marker. Today `v_public_games` exposes only `league_verified|official` games; all public read paths (`getGamesByDate`, `getGameById`, `getLiveGames`) read from that view exclusively, so live scores and <5-minute recaps are impossible.

A companion view `v_public_live_games` already exists (migration `20260715101048`) that covers `scheduled`, `live_provisional`, `final_pending_review`, `cancelled`, `postponed` — with `is_provisional boolean`. The data layer and UI haven't been wired to read from it yet.

## Key Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Build vs OSS vs Buy | **Build** | Commodity SQL+UI wiring; already designed in existing migrations |
| Data layer | **Two queries, unioned** | Supabase JS client doesn't support UNION in `.from()`. Query both views, merge results. Cheaper than creating an RPC. |
| Provisional status display | **Amber "provisional" variant** | Already exists in Badge component (`variant="provisional"` with `border-amber-500/30 bg-amber-500/10 text-amber-600`). `GameStatusBadge` already appends "· Урьдчилсан" when `is_provisional=true`. |
| GameCard status | **Use `GameStatusBadge` in GameCard** | Instead of duplicating provisional logic, migrate GameCard to use the shared `GameStatusBadge` component. |

## Competitor References

| Competitor | Pattern Observed |
|---|---|
| **Flashscore** | "LIVE" badge with pulsing dot; "FT" (final) badge; in-progress shows current minute. Provisional data labeled distinctly from final. |
| **Sofascore** | Score cards with team logos, "FT" badge for finished games. Live games show LV badge + score + period. Clear visual separation between provisional and final. |
| **Architecture best practice** | REST snapshot + push (WebSocket) for live updates; label provisional updates consistently; reconcile to final state. |

## Changes

### 1. Data layer — `src/app/lib/data.ts`

#### `getGamesByDate`
- Query `v_public_games` AND `v_public_live_games` separately, merge results, deduplicate by id (v_public_games wins for same id since it's the verified source)
- Preserve sorting by `scheduled_at`

#### `getGameById`
- Try `v_public_games` first, fall back to `v_public_live_games` if not found
- Return null if neither has the game

#### `getLiveGames`
- Simplify: now just calls `getGamesByDate` and filters for `live_provisional` (same as today, but data actually contains live games)

### 2. UI — `src/app/components/game-card.tsx`

- Import and use `GameStatusBadge` instead of inline status rendering
- When `game.is_provisional` is true, show `GameStatusBadge` (which appends "· Урьдчилсан")
- When `game.status === "live_provisional"`, keep the existing pulse + "Шууд" indicator
- When `game.status === "final_pending_review"` and game has scores, show score with amber badge

### 3. No migration needed

`v_public_live_games` already exists with correct schema and grants.

## Acceptance Criteria

1. A seeded `live_provisional` game appears on the homepage with "Шууд" badge
2. A seeded `scheduled` game shows no score (only time)
3. A seeded `final_pending_review` game shows score with amber "Урьдчилсан" badge
4. Game detail page (`/games/[id]`) renders for a `live_provisional` game (currently 404s)
5. Game detail page shows "Тоглолт үргэлжилж байна" for live games, box score for finalized
6. `GameCard` renders `GameStatusBadge` with amber styling for `is_provisional && final_pending_review`
7. `scripts/integration-test.sh` still passes
8. Role-matrix script still passes (anon can select `v_public_live_games`)

## Error Handling

| Error | Behavior |
|---|---|
| `v_public_live_games` returns null for revision fields | Safe — UI components never read revision fields from live games. `mapGameRow` casts via `unknown` which is runtime-unsafe but works because the accessed fields (`home_team_name`, `home_score`, etc.) are non-null in the view. |
| Live game deleted mid-fetch | `getGameById` returns null → `notFound()` |
| Both views return same game | `v_public_games` wins (verified data takes priority) |

## Testing

1. Seed: a `live_provisional` game with home_score=10, away_score=5 → verify HomePage hero shows game
2. Seed: a `final_pending_review` game with scores → verify GameCard shows amber badge
3. Unit: `getGamesByDate` returns merged results with correct `is_provisional` flag
4. Integration: anon can select from `v_public_live_games`
