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

_All Horizon A tasks (Phases 1–7) are complete. Academy Phase 10a foundation is also complete (DB schema, admin CRUD, QPay payments, sidebar nav). Phase 8+ are Horizon B._

---

## All Tasks (By Phase)

### Phase 1 — Trusted data foundation

| ID | Task | Priority | Status | Effort | Deps | Spec |
|----|------|----------|--------|--------|------|------|
| T-1.1 | Local stack proof | P1 | ✅ | M | — | [spec](../plans/phase-1-trusted-foundation.md#task-11--local-stack-proof) |
| T-1.2 | Ruleset-bound vocabulary | P1 | ✅ | M | T-1.1 | [spec](../plans/phase-1-trusted-foundation.md#task-12--ruleset-bound-event-vocabulary) |
| T-1.3 | Submission review UI | P1 | ✅ | L | T-1.2 | [spec](../plans/phase-1-trusted-foundation.md#task-13--submission-review-ui-approval-workflow) |
| T-1.4 | Projection rebuild command | P1 | ✅ | M | T-1.3 | [spec](../plans/phase-1-trusted-foundation.md#task-14--projection-rebuild-command) |
| T-1.5 | Authorization cutover | P1 | ✅ | M | T-1.4 | [spec](../plans/phase-1-trusted-foundation.md#task-15--authorization-cutover-retire-legacy-write-paths) |
| T-1.6 | Journal durability tests | P1 | ✅ | S | — | [spec](../plans/phase-1-trusted-foundation.md#task-16--journal-durability-verification) |
| T-1.7 | Handoff UI | P1 | ✅ | M | T-1.1 | [spec](../plans/phase-1-trusted-foundation.md#task-17--lead-to-backup-scorer-handoff-ui) |
| T-1.8 | Runbook + paper fallback | P1 | ✅ | S | — | [spec](../plans/phase-1-trusted-foundation.md#task-18--game-day-runbook--paper-fallback) |
| T-1.9 | Ops console | P1 | ✅ | M | T-1.3 | [spec](../plans/phase-1-trusted-foundation.md#task-19--ops-console) |
| T-1.10 | Integration + chaos tests | P1 | ✅ | M | T-1.4, T-1.6 | [spec](../plans/phase-1-trusted-foundation.md#task-110--integration--chaos-tests) |

### Phase 2 — Player profile as showcase

| ID | Task | Priority | Status | Effort | Deps | Spec |
|----|------|----------|--------|--------|------|------|
| T-2.1 | Roster onboarding kit | P1 | ✅ | L | — | [spec](../plans/phase-2-player-showcase.md#task-21--roster-onboarding-kit-photos-logos-placeholder-identity) |
| T-2.2 | Consent & takedown | P1 | ✅ | M | T-2.1 | [spec](../plans/phase-2-player-showcase.md#task-22--consent--takedown) |
| T-2.3 | Hero identity card | P1 | ✅ | M | T-2.1, T-2.2 | [spec](../plans/phase-2-player-showcase.md#task-23--hero-identity-card) |
| T-2.4 | Season story arc | P1 | ✅ | M | T-2.1, T-2.2 | [spec](../plans/phase-2-player-showcase.md#task-24--season-story-arc-chart-installs-charts) |
| T-2.5 | Shooting profile | P1 | ✅ | M | T-2.1, T-2.2 | [spec](../plans/phase-2-player-showcase.md#task-25--shooting-profile) |
| T-2.6 | Career highs & milestones | P1 | ✅ | M | — | [spec](../plans/phase-2-player-showcase.md#task-26--career-highs--milestones) |
| T-2.7 | Radar vs league average | P1 | ✅ | M | T-2.4, T-3.4 | [spec](../plans/phase-2-player-showcase.md#task-27--radar-chart-vs-league-average) |
| T-2.8 | Recent games strip | P1 | ✅ | S | T-2.1 | [spec](../plans/phase-2-player-showcase.md#task-28--recent-games-strip) |
| T-2.9 | Plain-language summaries | P1 | ✅ | S | — | [spec](../plans/phase-2-player-showcase.md#task-29--plain-language-game-summaries) |
| T-2.10 | Report-error intake | P1 | ✅ | M | T-1.9 | [spec](../plans/phase-2-player-showcase.md#task-210--report-a-stat-error-intake) |
| T-2.11 | Season selector & career | P1 | ✅ | M | T-2.1 | [spec](../plans/phase-2-player-showcase.md#task-211--season-selector--career-view) |
| T-2.12 | Box score below fold | P1 | ✅ | S | — | [spec](../plans/phase-2-player-showcase.md#task-212--box-score-history-below-the-fold) |

### Phase 3 — Final-Whistle Pack

| ID | Task | Priority | Status | Effort | Deps | Spec |
|----|------|----------|--------|--------|------|------|
| T-3.1 | Game recap pages | P2 | ✅ | L | T-2.1 | [spec](../plans/phase-4-shareability-reach.md#task-43--game-recap-pages) |
| T-3.2 | Shareable stat cards | P2 | ✅ | M | T-2.9, T-4.5 | [spec](../plans/phase-4-shareability-reach.md#task-42--shareable-stat-cards-download) |
| T-3.3 | Sponsor placements | P2 | ✅ | L | T-2.1 | [spec](../plans/phase-4-shareability-reach.md#task-45--sponsor-placements) |
| T-3.4 | Awards & MVP races | P2 | ✅ | L | T-2.1 | [spec](../plans/phase-3-discovery-league.md#task-35--awards--mvp-races) |
| T-3.5 | Provisional-final publication | P1 | ✅ | M | Phase 1 done | [spec](../plans/phase-5-live-experience.md#task-51--public-visibility-for-provisional-games) |
| T-3.6 | Auto Mongolian recap text | P2 | ✅ | S | T-2.9 | Inline in recap components |
| T-3.7 | One-click share/download | P2 | ✅ | S | T-4.2 | StatCard download button |

### Phase 4 — League proof & renewal

| ID | Task | Priority | Status | Effort | Deps | Spec |
|----|------|----------|--------|--------|------|------|
| T-4.1 | OG images | P2 | ✅ | M | T-2.1 | [spec](../plans/phase-4-shareability-reach.md#task-41--og-images) |
| T-4.2 | Shareable stat cards | P2 | ✅ | M | T-2.9, T-4.5 | [spec](../plans/phase-4-shareability-reach.md#task-42--shareable-stat-cards-download) |
| T-4.3 | Game recap pages | P2 | ✅ | L | T-3.1, T-5.1 | [spec](../plans/phase-4-shareability-reach.md#task-43--game-recap-pages) |
| T-4.4 | Embeds | P3 | ✅ | S | T-2.1 | [spec](../plans/phase-4-shareability-reach.md#task-44--embeds) |
| T-4.5 | Sponsor placements | P2 | ✅ | L | T-2.1 | [spec](../plans/phase-4-shareability-reach.md#task-45--sponsor-placements) |
| T-4.6 | Audience dashboard | P3 | ✅ | L | — | [spec](../plans/phase-4-shareability-reach.md#task-46--league-audience-dashboard) |
| T-4.7 | English profile view/export | P3 | ✅ | S | T-2.6, T-2.9 | [spec](../plans/phase-4-shareability-reach.md#task-47--english-profile-viewexport) |
| T-4.8 | SEO basics | P2 | ✅ | S | T-2.2, T-3.8 | [spec](../plans/phase-4-shareability-reach.md#task-48--seo-basics) |

### Phase 5 — Discovery & organic growth

| ID | Task | Priority | Status | Effort | Deps | Spec |
|----|------|----------|--------|--------|------|------|
| T-5.1 | Standings redesign | P1 | ✅ | M | T-2.1 | [spec](../plans/phase-3-discovery-league.md#task-32--standings-redesign) |
| T-5.2 | Leaders redesign | P1 | ✅ | M | T-2.1 | [spec](../plans/phase-3-discovery-league.md#task-33--leaders-redesign) |
| T-5.3 | Qualification rules | P2 | ✅ | M | — | [spec](../plans/phase-3-discovery-league.md#task-34--leaderboard-qualification-rules) |
| T-5.4 | Home: tonight's games | P1 | ✅ | M | T-2.1 | [spec](../plans/phase-3-discovery-league.md#task-31--home-tonights-games) |
| T-5.5 | Team pages | P2 | ✅ | M | T-2.1 | [spec](../plans/phase-3-discovery-league.md#task-37--team-pages) |
| T-5.6 | Search & browse | P2 | ✅ | M | T-2.2 | [spec](../plans/phase-3-discovery-league.md#task-38--search--browse) |
| T-5.7 | SEO basics | P2 | ✅ | S | T-2.2, T-5.6 | [spec](../plans/phase-4-shareability-reach.md#task-48--seo-basics) |

### Phase 6 — Live experience

| ID | Task | Priority | Status | Effort | Deps | Spec |
|----|------|----------|--------|--------|------|------|
| T-6.1 | Public visibility for provisional games | P1 | ✅ | M | Phase 1 done | [spec](../plans/phase-5-live-experience.md#task-51--public-visibility-for-provisional-games) |
| T-6.2 | Realtime live game center | P2 | ✅ | XL | T-6.1, T-5.4 | [spec](../plans/phase-5-live-experience.md#task-52--realtime-live-game-center) |
| T-6.3 | Live player stat lines | P2 | ✅ | M | T-6.2 | [spec](../plans/phase-5-live-experience.md#task-53--live-player-stat-lines) |

### Phase 7 — Team insights (design-partner beta)

| ID | Task | Priority | Status | Effort | Deps | Spec |
|----|------|----------|--------|--------|------|------|
| T-7.1 | Efficiency metrics | P2 | ✅ | M | Phase 2 done | `packages/core/src/stats/team-advanced.ts` — ORtg, DRtg, NETRTG, PIE, Four Factors, pace |
| T-7.2 | Team performance dashboard | P2 | ✅ | L | T-7.1 | `teams/[slug]/analytics/` — efficiency chart, Four Factors, per-game table, stat summary |
| T-7.3 | Player development timeline | P2 | ✅ | M | — | `MonthlyProgression` on player page — month-over-month stat chart |
| T-7.4 | Opponent scout card | P2 | ✅ | S | — | `teams/[slug]/scout/` — VS header, stat duel, opponent players, recent form |

---

### Phase 8 — Shared basketball organization foundation

| ID | Task | Priority | Status | Effort | Deps | Spec |
|----|------|----------|--------|--------|------|------|
| T-8.1 | Canonical org identity | P1 | ⬜ | L | — | Organizations, memberships, roles |
| T-8.2 | Roster snapshots & eligibility | P2 | ⬜ | M | T-8.1 | Official rosters, transfers |
| T-8.3 | Least-privilege org roles | P1 | ⬜ | M | T-8.1 | Role-based access |
| T-8.4 | Private storage & audit | P2 | ⬜ | M | T-8.1 | Tenant-isolated storage |
| T-8.5 | Consent & retention | P2 | ⬜ | S | T-8.1 | Data retention policies |
| T-8.6 | Break-glass support | P3 | ⬜ | S | T-8.1 | Emergency access |

### Phase 9 — Team operations

| ID | Task | Priority | Status | Effort | Deps | Spec |
|----|------|----------|--------|--------|------|------|
| T-9.1 | Staff roles | P2 | ⬜ | M | Phase 8 | Coach, manager, finance roles |
| T-9.2 | Roster intent & availability | P3 | ⬜ | L | T-9.1 | Availability scheduling |
| T-9.3 | Training schedule | P3 | ⬜ | M | T-9.1 | Session planning |
| T-9.4 | Team dues & expenses | P3 | ⬜ | M | T-9.1 | Payment workflows |
| T-9.5 | Opponent prep tools | P3 | ⬜ | S | T-9.1 | Scout card integration |

### Phase 10 — Academy operations

| ID | Task | Priority | Status | Effort | Deps | Spec |
|----|------|----------|--------|--------|------|------|
| T-10a.1 | Academy profiles DB schema + migration | P1 | ✅ | M | — | `supabase/migrations/` + RLS + seed |
| T-10a.2 | Academy admin CRUD (profile, programs, trainers, locations) | P1 | ✅ | L | T-10a.1 | Admin pages + API routes |
| T-10a.3 | Academy payments (QPay) | P1 | ✅ | M | T-10a.2 | QPay invoice → QR → poll |
| T-10a.4 | Academy sidebar nav | P1 | ✅ | S | T-10a.2 | Admin sidebar group |
| T-10a.5 | Academy tests (28 integration + 40 unit) | P1 | ✅ | L | T-10a.1–4 | Schema, CRUD, payments, RLS |
| T-10b.1 | Student profiles with guardian info | P2 | ⬜ | L | Phase 8 | Student records, photo upload, medical |
| T-10b.2 | Enrollment management | P2 | ⬜ | L | T-10b.1 | Registration, program assignment, dates |
| T-10b.3 | Attendance tracking | P2 | ⬜ | M | T-10b.2 | Present/absent/late states |
| T-10b.4 | Consent & waivers | P2 | ⬜ | M | T-10b.1 | Signed templates, withdrawal |
| T-10b.5 | CSV import/export | P3 | ⬜ | S | T-10b.1 | Batch roster operations |
| T-10c.1 | Offline-safe attendance with IndexedDB | P3 | ⬜ | L | T-10b.3 | Queue + replay |
| T-10c.2 | Attendance reports | P3 | ⬜ | M | T-10c.1 | Student, offering, coach, date range |
| T-10c.3 | Payment history & receipts | P3 | ⬜ | L | T-10a.3 | Per-student ledger |
| T-10c.4 | Ordered waitlists | P3 | ⬜ | S | T-10b.2 | Promotion rules |
| T-10d.1 | Guardian OTP & multi-child dashboard | P3 | ⬜ | L | Phase 11 | Phone auth |
| T-10d.2 | Verified QPay callbacks | P3 | ⬜ | M | T-10a.3 | Server-side verification |
| T-10d.3 | Multi-location scheduling | P3 | ⬜ | M | T-10b.2 | Location-aware offerings |
| T-10d.4 | Extended reporting | P3 | ⬜ | M | T-10c.2 | Financial + attendance analytics |

### Phase 11 — Guardian self-service

| ID | Task | Priority | Status | Effort | Deps | Spec |
|----|------|----------|--------|--------|------|------|
| T-11.1 | Multi-child dashboard | P3 | ⬜ | L | Phase 8 | Guardian view of all children |
| T-11.2 | Invoice/payment history & receipts | P3 | ⬜ | M | T-10a.3 | Self-service billing |
| T-11.3 | Registration & consent management | P3 | ⬜ | M | T-10b.4 | Self-service consent |
| T-11.4 | Announcements & reminders | P3 | ⬜ | S | T-11.1 | Notifications |


_Last updated: 2026-07-22_

_Last updated: 2026-07-22_
