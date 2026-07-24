# Parallel Implementation — Phase 4-5 Remaining Tasks

## Task 1: Embeds (T-4.4)
Create embed routes for iframe widgets.
- `src/app/embed/layout.tsx` — bare layout, no nav, transparent bg
- `src/app/embed/game/[id]/page.tsx` — compact GameCard widget
- `src/app/embed/player/[id]/page.tsx` — mini hero card widget
- `next.config.ts` — add frame-ancestors * for /embed/
- Tests: `src/app/embed/__tests__/page.test.tsx`
- No shared files with other tasks.

## Task 2: Audience Dashboard (T-4.6)
View tracking and audience admin page.
- Migration: `daily_page_views` table + `cmd_increment_page_view` function
- `src/components/view-beacon.tsx` — client beacon component
- `src/app/api/track/route.ts` — tracking endpoint
- `src/app/admin/audience/page.tsx` — audience dashboard
- `src/app/admin/api/audience/route.ts` — audience data API
- Mount ViewBeacon on player, game, team, home, leaders, standings pages
- Test: `src/app/admin/__tests__/audience-page.test.tsx`
- No shared files with other tasks.

## Task 3: Sponsor Admin CRUD (T-4.5)
Admin CRUD for sponsor placements.
- Migration: `sponsors` + `sponsor_placements` tables, bucket, commands
- `src/app/admin/sponsors/page.tsx` — sponsor management page
- `src/app/admin/api/sponsors/route.ts` — sponsor API
- Test: `src/app/admin/__tests__/sponsors-page.test.tsx`
- No shared files with other tasks.

## Task 4: OG Image Shared Utilities (T-4.1)
Extract shared OG helpers, ensure game OG image works, add tests.
- `src/lib/og/theme.ts` — shared colors/fonts config
- `src/lib/og/load-fonts.ts` — shared font loader
- Refactor `src/app/players/[id]/opengraph-image.tsx` and `src/app/teams/[slug]/opengraph-image.tsx` and `src/app/games/[id]/opengraph-image.tsx` to use shared helpers
- `src/app/games/[id]/opengraph-image.tsx` — game OG image (already exists, verify)
- Test: `src/lib/og/__tests__/og.test.tsx`
- No shared files with other tasks.

## Task 5: Live Game Center Hook + Migration (T-5.2 foundation)
Create shared live game hook and Supabase Realtime publication.
- Migration: ALTER PUBLICATION supabase_realtime ADD TABLE public.games
- `src/lib/hooks/use-live-game.ts` — shared hook (subscribe-else-poll pattern)
- `src/app/api/games/[id]/live/route.ts` — curated live data API
- Test: `src/lib/hooks/__tests__/use-live-game.test.ts`
- No shared files with other tasks.

## Task 6: Phase 3 Test Coverage
Write tests for Phase 3 features that exist but are untested.
- `src/app/awards/__tests__/awards-page.test.tsx` — awards page test
- `src/app/awards/components/__tests__/award-card.test.tsx` — award card test
- `src/app/leaders/components/__tests__/mvp-race.test.tsx` — mvp race test
- `src/app/players/compare/__tests__/compare-page.test.tsx` — compare test
- `src/app/search/__tests__/search-page.test.tsx` — search test
- `src/app/admin/awards/__tests__/admin-awards.test.tsx` — admin awards test
- No shared files with other tasks.

## Sequential (after parallel tasks complete):

### Task 7: Mount LiveGameCenter + Live Box Score (T-5.2 finish + T-5.3)
Modify game detail page to mount LiveGameCenter and create live box score component.
- Depends on Task 5 (use-live-game hook)
- `src/app/games/[id]/page.tsx` — mount LiveGameCenter for live games
- `src/app/games/[id]/components/live-box-score.tsx` — live stat lines
- Test: live center test files

### Task 8: Extract Game Recap Components (T-4.3)
Extract inline recap into testable components.
- Depends on Task 7 (same page.tsx file)
- `src/app/games/[id]/components/recap-header.tsx`
- `src/app/games/[id]/components/top-performers.tsx`
- `src/app/games/[id]/components/score-worm.tsx`
- Update `src/app/games/[id]/page.tsx`
- Tests for each component

### Task 9: English Profile Export (T-4.7)
- `src/app/api/export/pdf/route.ts` — English PDF export
- Player page lang toggle already exists
- Test: export test
