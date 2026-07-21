# Onoo — Task Queue

> **Agent instructions:** This is your primary task queue. Read first to find work.
> - **Ready** tasks (⬜ + dependencies satisfied) are fair game. Pick highest-priority first (P0 > P1 > P2 > P3).
> - **Check `Status` column** for current state. **Read `Spec` column** for full implementation details.
> - When you start a task, update its status to `🟡`. When done, update to `✅`, tick the ROADMAP.md checkbox, and update EXECUTION-STATUS.md in the same commit.
> - Under `Notes`, `🔴 = blocked` tasks explain the blocker. Unblock them if you can.

---

## Legend

| Indicator | Meaning |
|-----------|---------|
| `✅` | Done & verified per spec done-when |
| `🟡` | In progress (code being written) |
| `⬜` | Not started |
| `🔴` | Blocked |
| `P0` | Blocker / system broken — highest priority |
| `P1` | Core work — ship this |
| `P2` | Valuable — next after P1 |
| `P3` | Someday — reference only |
| `XS` | < 1 hour |
| `S` | 2-4 hours |
| `M` | 1-2 days |
| `L` | 3-5 days |
| `XL` | 1-2 weeks |

---

## Available Work (Ready to Start)

_Tasks with ⬜ status and no unresolved blockers. Pick from here._

| ID | Task | Priority | Effort | Depends On |
|----|------|----------|--------|------------|
| T-1.4 | Projection rebuild command | P1 | M | T-1.3 |
| T-1.5 | Authorization cutover | P1 | M | T-1.4 |
| T-1.10 | Integration + chaos tests | P1 | M | T-1.4, T-1.6 |
| T-2.1 | Roster onboarding kit | P1 | L | — |
| T-2.2 | Consent & takedown | P1 | M | T-2.1 |
| T-3.1 | Home: tonight's games | P1 | M | T-2.1 |
| T-3.2 | Standings redesign | P1 | M | T-2.1 |
| T-3.3 | Leaders redesign | P1 | M | T-2.1 |
| T-3.4 | Qualification rules | P2 | M | — |
| T-3.5 | Awards & MVP races | P2 | L | T-2.1 |
| T-3.6 | Player comparison upgrade | P2 | M | T-2.1, T-2.4 |
| T-3.7 | Team pages | P2 | M | T-2.1 |
| T-3.8 | Search & browse | P2 | M | T-2.2 |
| T-4.1 | OG images | P2 | M | T-2.1 |
| T-4.2 | Shareable stat cards | P2 | M | T-2.9, T-4.5 |
| T-4.3 | Game recap pages | P2 | L | T-3.1, T-5.1 |
| T-4.4 | Embeds | P3 | S | T-2.1 |
| T-4.5 | Sponsor placements | P2 | L | T-2.1 |
| T-4.6 | Audience dashboard | P3 | L | — |
| T-4.7 | English profile view/export | P3 | S | T-2.6, T-2.9 |
| T-4.8 | SEO basics | P2 | S | T-2.2, T-3.8 |
| T-5.1 | Public visibility for provisional games | P1 | M | Phase 1 |
| T-5.2 | Realtime live game center | P2 | XL | T-5.1, T-3.1 |
| T-5.3 | Live player stat lines | P2 | M | T-5.2 |

## In Progress

| ID | Task | Priority | Assignee | Started | Notes |
|----|------|----------|----------|---------|-------|
| T-1.2 | Ruleset-bound vocabulary | 🟡 P1 | — | — | Core tests done 🟡 RPC-side unverified — blocked on Docker |
| T-1.7 | Handoff UI | 🟡 P1 | — | — | Dialog written 🟡 needs integration verification |
| T-1.9 | Ops console | 🟡 P1 | — | — | Page built 🟡 needs integration verification |

## Blocked

| ID | Task | Priority | Blocker | Since |
|----|------|----------|---------|-------|
| T-1.1 | Local stack proof | 🔴 P1 | Docker not available locally | 2026-07-15 |

## Done

| ID | Task | Priority | Completed |
|----|------|----------|-----------|
| T-1.3 | Submission review UI | ✅ P1 | 2026-07-18 |
| T-1.6 | Journal durability tests | ✅ P1 | 2026-07-18 |
| T-1.8 | Runbook + paper fallback | ✅ P1 | 2026-07-18 |
| T-2.3 | Hero identity card | ✅ P1 | 2026-07-18 |
| T-2.4 | Season story arc | ✅ P1 | 2026-07-18 |
| T-2.5 | Shooting profile | ✅ P1 | 2026-07-18 |
| T-2.6 | Career highs & milestones | ✅ P1 | 2026-07-18 |
| T-2.7 | Radar vs league average | ✅ P1 | 2026-07-18 |
| T-2.8 | Recent games strip | ✅ P1 | 2026-07-18 |
| T-2.9 | Plain-language summaries | ✅ P1 | 2026-07-18 |
| T-2.10 | Report-error intake | ✅ P1 | 2026-07-18 |
| T-2.11 | Season selector & career | ✅ P1 | 2026-07-18 |
| T-2.12 | Box score below fold | ✅ P1 | 2026-07-18 |

---

## Phase Summary

| Phase | Status | Done | In Progress | Blocked | Not Started |
|-------|--------|------|-------------|---------|-------------|
| 1 — Trusted data foundation | 🟡 In progress | 3 | 3 | 1 | 3 |
| 2 — Player profile as showcase | ✅ Mostly done | 10 | 0 | 0 | 2 |
| 3 — Discovery & league surfaces | ⬜ Not started | 1* | 0 | 0 | 7 |
| 4 — Shareability & reach | ⬜ Not started | 0 | 0 | 0 | 8 |
| 5 — Live experience | ⬜ Not started | 0 | 0 | 0 | 3 |

*Phase 3 task 3.1 is partially implemented (homepage data fetchers exist per spec header)

---

## All Tasks (By Phase)

### Phase 1 — Trusted data foundation

| ID | Task | Priority | Status | Effort | Deps | Spec |
|----|------|----------|--------|--------|------|------|
| T-1.1 | Local stack proof | P1 | 🔴 | M | — | [spec](../plans/phase-1-trusted-foundation.md#task-11--local-stack-proof) |
| T-1.2 | Ruleset-bound vocabulary | P1 | 🟡 | M | T-1.1 | [spec](../plans/phase-1-trusted-foundation.md#task-12--ruleset-bound-event-vocabulary) |
| T-1.3 | Submission review UI | P1 | ✅ | L | T-1.2 | [spec](../plans/phase-1-trusted-foundation.md#task-13--submission-review-ui-approval-workflow) |
| T-1.4 | Projection rebuild command | P1 | ⬜ | M | T-1.3 | [spec](../plans/phase-1-trusted-foundation.md#task-14--projection-rebuild-command) |
| T-1.5 | Authorization cutover | P1 | ⬜ | M | T-1.4 | [spec](../plans/phase-1-trusted-foundation.md#task-15--authorization-cutover-retire-legacy-write-paths) |
| T-1.6 | Journal durability tests | P1 | ✅ | S | — | [spec](../plans/phase-1-trusted-foundation.md#task-16--journal-durability-verification) |
| T-1.7 | Handoff UI | P1 | 🟡 | M | T-1.1 | [spec](../plans/phase-1-trusted-foundation.md#task-17--lead-to-backup-scorer-handoff-ui) |
| T-1.8 | Runbook + paper fallback | P1 | ✅ | S | — | [spec](../plans/phase-1-trusted-foundation.md#task-18--game-day-runbook--paper-fallback) |
| T-1.9 | Ops console | P1 | 🟡 | M | T-1.3 | [spec](../plans/phase-1-trusted-foundation.md#task-19--ops-console) |
| T-1.10 | Integration + chaos tests | P1 | ⬜ | M | T-1.4, T-1.6 | [spec](../plans/phase-1-trusted-foundation.md#task-110--integration--chaos-tests) |

### Phase 2 — Player profile as showcase

| ID | Task | Priority | Status | Effort | Deps | Spec |
|----|------|----------|--------|--------|------|------|
| T-2.1 | Roster onboarding kit | P1 | ⬜ | L | — | [spec](../plans/phase-2-player-showcase.md#task-21--roster-onboarding-kit-photos-logos-placeholder-identity) |
| T-2.2 | Consent & takedown | P1 | ⬜ | M | T-2.1 | [spec](../plans/phase-2-player-showcase.md#task-22--consent--takedown) |
| T-2.3 | Hero identity card | P1 | ✅ | M | T-2.1, T-2.2 | [spec](../plans/phase-2-player-showcase.md#task-23--hero-identity-card) |
| T-2.4 | Season story arc | P1 | ✅ | M | T-2.1, T-2.2 | [spec](../plans/phase-2-player-showcase.md#task-24--season-story-arc-chart-installs-charts) |
| T-2.5 | Shooting profile | P1 | ✅ | M | T-2.4 | [spec](../plans/phase-2-player-showcase.md#task-25--shooting-profile) |
| T-2.6 | Career highs & milestones | P1 | ✅ | M | — | [spec](../plans/phase-2-player-showcase.md#task-26--career-highs--milestones) |
| T-2.7 | Radar vs league average | P1 | ✅ | M | T-2.4, T-3.4 | [spec](../plans/phase-2-player-showcase.md#task-27--radar-chart-vs-league-average) |
| T-2.8 | Recent games strip | P1 | ✅ | S | T-2.1 | [spec](../plans/phase-2-player-showcase.md#task-28--recent-games-strip) |
| T-2.9 | Plain-language summaries | P1 | ✅ | S | — | [spec](../plans/phase-2-player-showcase.md#task-29--plain-language-game-summaries) |
| T-2.10 | Report-error intake | P1 | ✅ | M | T-1.9 | [spec](../plans/phase-2-player-showcase.md#task-210--report-a-stat-error-intake) |
| T-2.11 | Season selector & career | P1 | ✅ | M | T-2.1 | [spec](../plans/phase-2-player-showcase.md#task-211--season-selector--career-view) |
| T-2.12 | Box score below fold | P1 | ✅ | S | — | [spec](../plans/phase-2-player-showcase.md#task-212--box-score-history-below-the-fold) |

### Phase 3 — Discovery & league surfaces

| ID | Task | Priority | Status | Effort | Deps | Spec |
|----|------|----------|--------|--------|------|------|
| T-3.1 | Home: tonight's games | P1 | ⬜ | M | T-2.1 | [spec](../plans/phase-3-discovery-league.md#task-31--home-tonights-games) |
| T-3.2 | Standings redesign | P1 | ⬜ | M | T-2.1 | [spec](../plans/phase-3-discovery-league.md#task-32--standings-redesign) |
| T-3.3 | Leaders redesign | P1 | ⬜ | M | T-2.1 | [spec](../plans/phase-3-discovery-league.md#task-33--leaders-redesign) |
| T-3.4 | Qualification rules | P2 | ⬜ | M | — | [spec](../plans/phase-3-discovery-league.md#task-34--leaderboard-qualification-rules) |
| T-3.5 | Awards & MVP races | P2 | ⬜ | L | T-2.1 | [spec](../plans/phase-3-discovery-league.md#task-35--awards--mvp-races) |
| T-3.6 | Player comparison upgrade | P2 | ⬜ | M | T-2.1, T-2.4 | [spec](../plans/phase-3-discovery-league.md#task-36--player-comparison-upgrade) |
| T-3.7 | Team pages | P2 | ⬜ | M | T-2.1 | [spec](../plans/phase-3-discovery-league.md#task-37--team-pages) |
| T-3.8 | Search & browse | P2 | ⬜ | M | T-2.2 | [spec](../plans/phase-3-discovery-league.md#task-38--search--browse) |

### Phase 4 — Shareability & reach

| ID | Task | Priority | Status | Effort | Deps | Spec |
|----|------|----------|--------|--------|------|------|
| T-4.1 | OG images | P2 | ⬜ | M | T-2.1 | [spec](../plans/phase-4-shareability-reach.md#task-41--og-images) |
| T-4.2 | Shareable stat cards | P2 | ⬜ | M | T-2.9, T-4.5 | [spec](../plans/phase-4-shareability-reach.md#task-42--shareable-stat-cards-download) |
| T-4.3 | Game recap pages | P2 | ⬜ | L | T-3.1, T-5.1 | [spec](../plans/phase-4-shareability-reach.md#task-43--game-recap-pages) |
| T-4.4 | Embeds | P3 | ⬜ | S | T-2.1 | [spec](../plans/phase-4-shareability-reach.md#task-44--embeds) |
| T-4.5 | Sponsor placements | P2 | ⬜ | L | T-2.1 | [spec](../plans/phase-4-shareability-reach.md#task-45--sponsor-placements) |
| T-4.6 | Audience dashboard | P3 | ⬜ | L | — | [spec](../plans/phase-4-shareability-reach.md#task-46--league-audience-dashboard) |
| T-4.7 | English profile view/export | P3 | ⬜ | S | T-2.6, T-2.9 | [spec](../plans/phase-4-shareability-reach.md#task-47--english-profile-viewexport) |
| T-4.8 | SEO basics | P2 | ⬜ | S | T-2.2, T-3.8 | [spec](../plans/phase-4-shareability-reach.md#task-48--seo-basics) |

### Phase 5 — Live experience

| ID | Task | Priority | Status | Effort | Deps | Spec |
|----|------|----------|--------|--------|------|------|
| T-5.1 | Public visibility for provisional games | P1 | ⬜ | M | Phase 1 done | [spec](../plans/phase-5-live-experience.md#task-51--public-visibility-for-provisional-games) |
| T-5.2 | Realtime live game center | P2 | ⬜ | XL | T-5.1, T-3.1 | [spec](../plans/phase-5-live-experience.md#task-52--realtime-live-game-center) |
| T-5.3 | Live player stat lines | P2 | ⬜ | M | T-5.2 | [spec](../plans/phase-5-live-experience.md#task-53--live-player-stat-lines) |

---

## Feature Gaps (from gaps.md)

_Enhancement ideas with no assigned phase. Priority per gaps.md analysis._

| ID | Feature | Priority | Effort | DB Ready | Frontend Only |
|----|---------|----------|--------|----------|---------------|
| G-01 | Score flip animation | P0 | S | ✅ | ✅ |
| G-02 | Skill radar league overlay | P0 | S | ✅ | ✅ |
| G-03 | Season arc brush selection | P0 | S | ✅ | ✅ |
| G-04 | Multi-category leaderboard strip | P0 | S | ✅ | ✅ |
| G-05 | Standings row expansion | P1 | S | ✅ | ✅ |
| G-06 | Card flip stats | P1 | S | ✅ | ✅ |
| G-07 | Drag-to-compare players | P1 | M | ✅ | ⚠️ (needs @dnd-kit) |
| G-08 | Tournament hub pages | P1 | M | ⚠️ | ✅ |
| G-09 | Tournament bracket visualization | P1 | M | ⚠️ | ✅ |
| G-10 | Swipeable game cards | P2 | S | ✅ | ✅ |
| G-11 | Drag-to-reorder leader categories | P2 | S | ✅ | ✅ (needs @dnd-kit) |
| G-12 | Court heatmap | P2 | M | ⚠️ | ✅ |
| G-13 | Season/competition selector | P2 | S | ✅ | ✅ |
| G-14 | Countdown timer for next game | P2 | S | ✅ | ✅ |
| G-15 | Shareable stat cards | P3 | M | ✅ | ⚠️ (needs @vercel/og) |
| G-16 | Live court animation | P3 | XL | ⚠️ | ⚠️ |

See [`docs/gaps.md`](../gaps.md) for full analysis of each feature.

---

## How to Use This Queue

### For Agents

1. **Start here.** Read `INDEX.md` first to see what's available.
2. **Check "Available Work"** section — those tasks have ⬜ status and no blockers.
3. **Pick highest priority** (P0 → P1 → P2 → P3). Within priority, tasks are listed in recommended order.
4. **Read the task file** at `docs/tasks/T-<ID>-<name>.md` for full details.
5. **Read conventions** at `docs/plans/00-conventions.md` before writing code.
6. **Update as you go:** Change status to `🟡` when you start, `✅` when done. Tick ROADMAP.md checkbox. Update EXECUTION-STATUS.md.
7. **Verify** against the task's _Done When_ criteria before marking complete.

### For Humans

1. **Review completed tasks** by checking the task file + ROADMAP.md.
2. **Add new tasks** by copying `TEMPLATE.md` and creating a new file in `docs/tasks/`.
3. **Update status** in this INDEX and in EXECUTION-STATUS.md.
4. **Resolve blockers** — if T-1.1 becomes unblocked (Docker available), move it to Available Work.

---

_Last updated: 2026-07-21_
