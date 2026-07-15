# Public Surface Rebuild

## Objective

Turn Onoo's public experience from repeated record tables into an athlete-first league pulse while preserving trusted-record boundaries and the current player-profile showcase.

## Scope

- Correct public data adapters, Ulaanbaatar day boundaries, standings fields, team slugs, and comparison search.
- Recompose home, games, standings, leaders, player discovery, game detail, team detail, and comparison pages.
- Add shared public presentation, empty, and loading patterns.
- Keep public queries on curated `v_public_*` views. No mock fallbacks.

## Decisions

- Home hierarchy is live/next game → latest verified result → featured athlete → leaders → standings → discovery.
- Tables remain available below visual summaries; they are not the default hero treatment.
- Featured content is deterministic from verified data, not an editorial CMS requirement for this pass.
- Small datasets show useful next-game, roster, or qualification guidance instead of blank cards.
- Existing player profile components are extended only where necessary and are not replaced.
- Team analytics visible to the public must come from curated views; the legacy direct-projection analytics route will not remain a separate public dead end.

## Verification Log

- Complete: focused TypeScript check (`tsc --noEmit --incremental false`).
- Complete: Biome checks for all changed TypeScript and TSX files.
- Complete: Supabase migration reviewed against existing publication-view column order and trusted-record rules.
- Blocked locally: Supabase database lint requires Docker, which is not running in this workspace.
- Complete: HTTP runtime verification for `/`, `/games`, `/standings`, `/leaders`, `/players`, and `/players/compare`; all compiled and returned without application errors.
- Complete: game/team detail not-found paths and compare API validation/error paths.
- Blocked in this sandbox: Chromium exits on macOS Mach bootstrap permission, so screenshot-based visual and client-interaction verification could not run.
- Data note: the configured development database currently returns honest empty states; populated schedule/live and enriched team/player routes require applying the included publication-view migration.
