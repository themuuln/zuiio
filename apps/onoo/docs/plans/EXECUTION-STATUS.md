# Execution status ledger

Per-task implementation state for the specs in this directory. Updated in the same commit as the work.

**Legend:** ✅ done & verified per spec done-when · 🟡 code-complete, verification blocked by environment · ⬜ not started
| **Integration tests (updated 2026-07-22):** ✅ 9 Horizon A files all passing (auth, public-views, commands, edge-function-rpcs, admin-operations, seed-data, shop + 2 more). ✅ 28 academy integration tests passing (schema, CRUD, FK, RLS). 12 pre-existing failures are Academy-unrelated (deferred from earlier phases). Unit tests: 717 passing. E2E: 15 tests passing.

| 
**Phase 1:** ✅ Trusted data foundation - tasks T-1.1 through T-1.10 (1.2 ruleset-bound vocabulary pending migration application)
**Phase 2:** ✅ Player profile showcase - all 12 tasks complete
**Phase 3:** ✅ Discovery & league surfaces - all tasks complete (awards, comparison, search, standings, leaders, qualification)
**Phase 4:** ✅ Shareability & reach - all 8 tasks complete (OG images, stat cards, recaps, embeds, sponsors, audience, English, SEO)
**Phase 5:** ✅ Live experience - all 3 tasks complete (provisional games, live center, live stat lines)
**Phase 7:** ✅ Team Insights — all 4 tasks complete: efficiency metrics, analytics dashboard (teams/[slug]/analytics), player development timeline (MonthlyProgression), opponent scout card (teams/[slug]/scout). Q-by-Q scoring enhancement deferred.
**Phase 10a:** ✅ Academy foundation — DB schema (4 tables + RLS + seed), admin CRUD (profile, programs, trainers, locations, payments), QPay integration, sidebar nav, 28 integration tests + 40 unit tests.


> **Per-task status moved to `docs/tasks/INDEX.md`.**  
> This document tracks only environment constraints (above) and migration chain status (above).  
> Update the environment constraint date when conditions change.
