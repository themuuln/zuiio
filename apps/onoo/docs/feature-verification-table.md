# Onoo — Feature Verification Matrix

> **Status as of:** 2026-07-26
> **Methodology:** Verified against actual codebase (routes, tests, DB schema), Supabase live schema, and documented phase definitions in ROADMAP.md.
> **Scoring:** ✅ = Full coverage | 🟡 = Partial/incomplete | ⬜ = Not done | ❌ = Missing/blocked

---

## Horizon A — League Paid Proof (Phases 1–7)

### Phase 1: Trusted Data Foundation

| Feature | Implemented | Routes/Pages | DB Schema | Unit Tests | Integration Tests | E2E Tests | Error/ Loading | SEO/ Metadata | Prod Ready |
|---|---|---|---|---|---|---|---|---|---|
| stat_events journal (append-only) | ✅ | tracker/[gameId] | ✅ stat_events (38 rows) | ✅ core/events test | ✅ commands.integration | ⬜ | 🟡 tracker pages | ⬜ no metadata | 🟡 |
| Ruleset-bound vocabulary | ✅ | — | ✅ basketball_rulesets (2) | ✅ core/events test | ✅ commands.integration | ⬜ | — | — | ✅ |
| Submission review UI | ✅ | admin/games/[id] | ✅ source_submissions (31) | ⬜ | ✅ admin-operations.integration | ⬜ | 🟡 | ⬜ | 🟡 |
| Projection rebuild command | ✅ | API only | ✅ cmd_rebuild_projection | ✅ core/derive test | ✅ commands.integration | ⬜ | — | — | ✅ |
| Authorization cutover | ✅ | RLS on all tables | ✅ 66 tables RLS | ⬜ | ✅ auth-rls.integration | ⬜ | — | — | ✅ |
| Journal durability tests | ✅ | — | — | ✅ core/durability, queue, chaos | ✅ commands.integration | ⬜ | — | — | ✅ |
| Handoff UI | ✅ | tracker endpoints | ✅ tracker_sessions | ⬜ | ✅ (bash integration-test.sh) | ⬜ | 🟡 | ⬜ | 🟡 |
| Ops console | ✅ | admin/ops | ✅ audit_log | ⬜ | ✅ admin-operations.integration | ⬜ | 🟡 | ⬜ | 🟡 |
| Venues CRUD | ✅ | admin/venues | ✅ venues (11 rows) | 🟡 | ⬜ | ⬜ | 🟡 | ⬜ | 🟡 |
| Seasons CRUD | ✅ | admin/seasons | ✅ seasons (3 rows) | 🟡 | ⬜ | ⬜ | 🟡 | ⬜ | 🟡 |

### Phase 2: Player Profile as Showcase

| Feature | Implemented | Routes/Pages | DB Schema | Unit Tests | Integration Tests | E2E Tests | Error/ Loading | SEO/ Metadata | Prod Ready |
|---|---|---|---|---|---|---|---|---|---|
| Roster onboarding kit | ✅ | admin/teams/roster | ✅ roster_entries (166), players (166) | ⬜ | ✅ roster-snapshots.integration | 🟡 public-pages | 🟡 | 🟡 | 🟡 |
| Consent & takedown | ✅ | admin/org/consent | ✅ consent_policies | ⬜ | ✅ org-identity.integration | ⬜ | 🟡 | ⬜ | 🟡 |
| Hero identity card | ✅ | players/[id] | ✅ players + profiles | ✅ hero-card-social.test.tsx | ⬜ | 🟡 public-pages | ✅ loading | ✅ metadata | 🟡 |
| Season story arc (charts) | ✅ | players/[id] | ✅ season_player_stats (102) | 🟡 | ⬜ | 🟡 public-pages | ✅ loading, error | ✅ metadata | 🟡 |
| Shooting profile | ✅ | players/[id] | ✅ v_public_shot_zones | 🟡 | ⬜ | 🟡 public-pages | ✅ loading, error | ✅ metadata | 🟡 |
| Career highs & milestones | ✅ | players/[id] | ✅ via data.ts derivation | ✅ career highs tests | ⬜ | 🟡 public-pages | ✅ loading, error | ✅ metadata | 🟡 |
| Radar vs league avg | ✅ | players/[id] | ✅ via data.ts | 🟡 | ⬜ | 🟡 public-pages | ✅ loading, error | ✅ metadata | 🟡 |
| Recent games strip | ✅ | players/[id] | ✅ game_player_stats (339) | 🟡 | ⬜ | 🟡 public-pages | ✅ loading, error | ✅ metadata | 🟡 |
| Plain-language summaries | ✅ | players/[id] | ✅ via data.ts | ✅ summaries.test.ts | ⬜ | 🟡 public-pages | ✅ loading, error | ✅ metadata | 🟡 |
| Report-error intake | ✅ | admin/ops | ✅ public_error_reports | ✅ report-error-dialog.test.tsx | ⬜ | ⬜ | 🟡 | ⬜ | 🟡 |
| Season selector & career view | ✅ | players/[id] | ✅ season_player_stats | ✅ season-selector.test.ts | ⬜ | 🟡 public-pages | ✅ loading, error | ✅ metadata | 🟡 |
| Box score below fold | ✅ | players/[id] | ✅ game_player_stats | ⬜ | ⬜ | 🟡 public-pages | ✅ loading, error | ✅ metadata | 🟡 |
| Social links for entities | ✅ | teams/[slug], players/[id] | ✅ teams.social_links | 🟡 | ⬜ | ⬜ | 🟡 | 🟡 | 🟡 |

### Phase 3: Final-Whistle Pack

| Feature | Implemented | Routes/Pages | DB Schema | Unit Tests | Integration Tests | E2E Tests | Error/ Loading | SEO/ Metadata | Prod Ready |
|---|---|---|---|---|---|---|---|---|---|
| Game recap pages | ✅ | games/[id] | ✅ games + game_player_stats | ✅ recap-header, score-worm, top-performers | ✅ public-views.integration | ✅ game-recap | ✅ loading, error | ✅ metadata | ✅ |
| Shareable stat cards | ✅ | games/[id], players/[id] | ✅ game_player_stats | 🟡 | ⬜ | ⬜ | 🟡 | ✅ OG images | 🟡 |
| Sponsor placements | ✅ | admin/sponsors | ✅ sponsors, sponsor_placements | ⬜ | ⬜ | ⬜ | 🟡 | ⬜ | 🟡 |
| Awards & MVP races | ✅ | awards, admin/awards | ✅ awards (0 rows) | ✅ award-card, mvp-race | ⬜ | ⬜ | ✅ loading, error | ✅ metadata | 🟡 |
| Provisional-final publication | ✅ | public views | ✅ v_public_games, v_public_live_games | ⬜ | ✅ public-views.integration | ⬜ | — | ⬜ | ✅ |
| Auto Mongolian recap text | ✅ | games/[id] | ✅ via core/i18n | ✅ summaries (core) | ⬜ | ✅ game-recap | 🟡 | 🟡 | 🟡 |
| One-click share/download | ✅ | games/[id], players/[id] | ✅ via html2canvas | 🟡 | ⬜ | ⬜ | 🟡 | — | 🟡 |

### Phase 4: League Proof & Renewal

| Feature | Implemented | Routes/Pages | DB Schema | Unit Tests | Integration Tests | E2E Tests | Error/ Loading | SEO/ Metadata | Prod Ready |
|---|---|---|---|---|---|---|---|---|---|
| OG images | ✅ | api/og/* | ✅ auto-generated | ✅ og.test.ts | ⬜ | ✅ og-images | — | — | ✅ |
| Embeds | ✅ | embed/game/[id], embed/player/[id] | ✅ v_public_box_score | ⬜ | ⬜ | ✅ embeds | 🟡 | 🟡 | 🟡 |
| Sponsor placements (admin) | ✅ | admin/sponsors | ✅ sponsors, sponsor_placements | ⬜ | ⬜ | ⬜ | 🟡 | ⬜ | 🟡 |
| Audience dashboard | ✅ | admin/audience | ✅ daily_page_views | 🟡 | ⬜ | ⬜ | 🟡 | ⬜ | 🟡 |
| English profile view/export | ✅ | api/export | ✅ via core/i18n | ✅ export route test | ⬜ | ⬜ | 🟡 | 🟡 | 🟡 |
| SEO basics | ✅ | sitemap.ts, robots.ts | — | ⬜ | ⬜ | ⬜ | — | ✅ sitemap + robots | ✅ |

### Phase 5: Discovery & Organic Growth

| Feature | Implemented | Routes/Pages | DB Schema | Unit Tests | Integration Tests | E2E Tests | Error/ Loading | SEO/ Metadata | Prod Ready |
|---|---|---|---|---|---|---|---|---|---|
| Standings redesign | ✅ | standings | ✅ standings (14 rows) | ✅ standings-table | ⬜ | ✅ public-pages | ✅ loading, error | ✅ metadata | ✅ |
| Leaders redesign | ✅ | leaders | ✅ via data.ts derivation | ✅ leader-row, podium, unqualified, mvp-race | ⬜ | ✅ public-pages | ✅ loading, error | ✅ metadata | ✅ |
| Qualification rules | ✅ | leaders | ✅ leader_qualification_rules migration | ⬜ | ⬜ | ✅ public-pages | ✅ loading, error | ✅ metadata | 🟡 |
| Home: tonight's games | ✅ | / | ✅ v_public_live_games + v_public_games | ✅ game-card, home-date-nav, live-score-card | ✅ public-views.integration | ✅ public-pages | ✅ loading, error | 🟡 | ✅ |
| Team pages | ✅ | teams/[slug] | ✅ teams (18) + team_seasons | ✅ team-header, roster-grid | ⬜ | ✅ public-pages | ✅ loading | ✅ metadata | 🟡 |
| Search & browse | ✅ | search | ✅ via data.ts | ✅ search-page tests | ⬜ | ✅ public-pages | ✅ loading | ✅ metadata | 🟡 |

### Phase 6: Live Experience

| Feature | Implemented | Routes/Pages | DB Schema | Unit Tests | Integration Tests | E2E Tests | Error/ Loading | SEO/ Metadata | Prod Ready |
|---|---|---|---|---|---|---|---|---|---|
| Public visibility for provisional games | ✅ | games, games/[id] | ✅ v_public_live_games + v_public_games | ⬜ | ✅ public-views.integration | ✅ public-pages (has badge check) | ✅ loading, error | ✅ metadata | ✅ |
| Realtime live game center | ✅ | games/[id] (live mode) | ✅ Supabase Realtime channel | 🟡 | ⬜ | ✅ live-center | 🟡 | ✅ metadata | 🟡 |
| Live player stat lines | ✅ | games/[id] (live mode) | ✅ game_player_stats | 🟡 | ⬜ | 🟡 | 🟡 | ✅ metadata | 🟡 |

### Phase 7: Team Insights

| Feature | Implemented | Routes/Pages | DB Schema | Unit Tests | Integration Tests | E2E Tests | Error/ Loading | SEO/ Metadata | Prod Ready |
|---|---|---|---|---|---|---|---|---|---|
| Efficiency metrics (ORtg, DRtg, NETRTG, PIE, Four Factors) | ✅ | core package | ✅ via core/stats/team-advanced | ✅ team-advanced.test.ts (core) | ⬜ | ⬜ | — | — | 🟡 |
| Team performance dashboard | ✅ | teams/[slug]/analytics | ✅ via data.ts | ✅ team-stats-summary, efficiency-chart, four-factors-chart, per-game-table | ⬜ | ⬜ | 🟡 | 🟡 | 🟡 |
| Player development timeline | ✅ | players/[id] (MonthlyProgression) | ✅ season_player_stats | ✅ monthly-progression.test.tsx | ⬜ | 🟡 public-pages | ✅ loading, error | ✅ metadata | 🟡 |
| Opponent scout card | ✅ | teams/[slug]/scout | ✅ opponent_notes (0 rows) + via data.ts | 🟡 | ⬜ | ⬜ | 🟡 | 🟡 | 🟡 |

---

## Horizon B — Team & Academy Operations (Phases 8–11)

### Phase 8: Shared Basketball Organization Foundation

| Feature | Implemented | Routes/Pages | DB Schema | Unit Tests | Integration Tests | E2E Tests | Error/ Loading | SEO/ Metadata | Prod Ready |
|---|---|---|---|---|---|---|---|---|---|
| Canonical org identity | ✅ | admin/org | ✅ organizations (2), memberships (2) | ⬜ | ✅ org-identity.integration | ⬜ | 🟡 | ⬜ | 🟡 |
| Roster snapshots & eligibility | ✅ | admin/org/transfers | ✅ roster_snapshots, transfers | ⬜ | ✅ roster-snapshots.integration | ⬜ | 🟡 | ⬜ | 🟡 |
| Least-privilege org roles | ✅ | admin/org/members | ✅ roles (4), permissions (14), role_permissions (40) | ⬜ | ✅ org-roles.integration | ⬜ | 🟡 | ⬜ | 🟡 |
| Private storage & audit | ✅ | admin/org/storage | ✅ org_storage_buckets | ⬜ | ⬜ | ⬜ | 🟡 | ⬜ | 🟡 |
| Consent & retention | ✅ | admin/org/consent | ✅ consent_policies | ⬜ | ✅ (in org-identity) | ⬜ | 🟡 | ⬜ | 🟡 |
| Break-glass support | ✅ | admin/org/break-glass | ✅ break_glass_access | ⬜ | ⬜ | ⬜ | 🟡 | ⬜ | 🟡 |
| Dark theme design system | ✅ | — (global) | — | ⬜ | ⬜ | ⬜ | — | — | 🟡 |

### Phase 9: Team Operations

| Feature | Implemented | Routes/Pages | DB Schema | Unit Tests | Integration Tests | E2E Tests | Error/ Loading | SEO/ Metadata | Prod Ready |
|---|---|---|---|---|---|---|---|---|---|
| Staff roles | ✅ | admin/teams/staff | ✅ team_staff | ✅ staff test | ✅ team-ops.integration | ⬜ | 🟡 | ⬜ | 🟡 |
| Roster intent & availability | ✅ | admin/teams/roster, availability | ✅ roster_availability | ⬜ | ⬜ | ⬜ | 🟡 | ⬜ | 🟡 |
| Training schedule | ✅ | admin/teams/training | ✅ training_sessions | ⬜ | ⬜ | ⬜ | 🟡 | ⬜ | 🟡 |
| Team dues & expenses | ✅ | admin/teams/transactions | ✅ team_transactions | ⬜ | ⬜ | ⬜ | 🟡 | ⬜ | 🟡 |
| Opponent prep tools | ✅ | teams/[slug]/scout, admin/opponent-notes | ✅ opponent_notes | 🟡 | ⬜ | ⬜ | 🟡 | 🟡 | 🟡 |

### Phase 10: Academy Operations

| Feature | Implemented | Routes/Pages | DB Schema | Unit Tests | Integration Tests | E2E Tests | Error/ Loading | SEO/ Metadata | Prod Ready |
|---|---|---|---|---|---|---|---|---|---|
| Academy profiles (10a) | ✅ | admin/academy | ✅ academy_profiles, programs, trainers, locations | ✅ academy-pages tests | ✅ academy.integration | ⬜ | 🟡 | ⬜ | 🟡 |
| Academy QPay payments (10a) | ✅ | admin/academy/payments | ✅ academy_payment_ledger, products, orders | ✅ qpay-payment test | ✅ payments-waitlists.integration | ✅ shop | 🟡 | ⬜ | 🟡 |
| Student profiles (10b) | ✅ | admin/academy/students | ✅ academy_students, guardians, student_guardians | ⬜ | ✅ student-profiles.integration | ⬜ | 🟡 | ⬜ | 🟡 |
| Enrollment management (10b) | ✅ | admin/academy/enrollments | ✅ academy_enrollments | ⬜ | ✅ enrollment-attendance.integration | ⬜ | 🟡 | ⬜ | 🟡 |
| Attendance tracking (10b) | ✅ | admin/academy/attendance | ✅ academy_attendance | ⬜ | ✅ enrollment-attendance.integration | ⬜ | 🟡 | ⬜ | 🟡 |
| Consent & waivers (10b) | ✅ | admin/academy/consent | ✅ academy_consent_templates, records | ⬜ | ⬜ | ⬜ | 🟡 | ⬜ | 🟡 |
| CSV import/export (10b) | ✅ | admin/academy/students/csv | ✅ via api route | ⬜ | ⬜ | ⬜ | 🟡 | ⬜ | 🟡 |
| Offline-safe attendance (10c) | ⬜ | — | — | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| Payment history & receipts (10c) | ✅ | admin/academy/payments-ledger | ✅ academy_payment_ledger | ⬜ | ✅ payments-waitlists.integration | ⬜ | 🟡 | ⬜ | 🟡 |
| Ordered waitlists (10c) | ✅ | admin/academy/waitlists | ✅ academy_waitlists | ⬜ | ✅ payments-waitlists.integration | ⬜ | 🟡 | ⬜ | 🟡 |
| Guardian OTP (10d) | ⬜ | — | — | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| Verified QPay callbacks (10d) | ⬜ | — | — | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| Multi-location scheduling (10d) | ⬜ | — | — | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| Extended reporting (10d) | ⬜ | — | — | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |

### Phase 11: Guardian Self-Service

| Feature | Implemented | Routes/Pages | DB Schema | Unit Tests | Integration Tests | E2E Tests | Error/ Loading | SEO/ Metadata | Prod Ready |
|---|---|---|---|---|---|---|---|---|---|
| Multi-child dashboard | ⬜ | — | — | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| Registration & consent management | ⬜ | — | — | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| Announcements & reminders | ✅ | admin/academy/announcements | ✅ academy_announcements | ⬜ | ⬜ | ⬜ | 🟡 | ⬜ | 🟡 |

---

## Cross-Cutting Concerns

| Aspect | Finding | Status |
|---|---|---|
| **Error boundaries** | 12 error.tsx files across public pages; global admin error.tsx added | ✅ |
| **Loading states** | 10 loading.tsx files across public pages; 6 admin loading.tsx files added (admin/, teams/, games/, org/, academy/, plus subgroup loading) | ✅ |
| **Not found** | 1 global not-found.tsx | ✅ |
| **SEO metadata** | 10 public pages export metadata/generateMetadata; admin pages don't (expected) | 🟡 |
| **Sitemap** | sitemap.ts present | ✅ |
| **Robots** | robots.ts present | ✅ |
| **Content Security Policy** | Comprehensive CSP with self/supabase/sentry/vercel/embeds. Embedded routes keep frame-ancestors * | ✅ |
| **Rate limiting** | 200 req/60s sliding window per IP via proxy.ts, 429 responses with retry-after, rate-limit headers on all responses | ✅ |
| **Sentry error tracking** | sentry.*.config.ts + instrumentation.ts present | ✅ |
| **Vercel Speed Insights** | @vercel/speed-insights in dependencies | ✅ |
| **React Compiler** | reactCompiler: true in next.config.ts | ✅ |
| **Image optimization** | AVIF + WebP, remote patterns set, minCacheTTL: 31 days | ✅ |
| **Turbopack caching** | turbopackFileSystemCacheForBuild: true | ✅ |
| **Next.js 16 proxy** | proxy.ts with session refresh at edge | ✅ |
| **Package optimization** | Optimized imports for lucide-react, recharts, date-fns, TanStack Query | ✅ |
| **Bundle analysis** | @next/bundle-analyzer configured, gated on ANALYZE=true env var | ✅ |
| **Prefetch patterns** | Audited: all prefetch={false} uses appropriate (date nav, search results), prefetch={true} on logo correct. No redundant router.prefetch() calls | ✅ |
| **Demo seed data** | seed.sql (112KB), demo-data.sql (33KB), scripts/setup-demo.sh | ✅ |
| **Runbook** | docs/runbook.md present | ✅ |
| **PWA manifest** | manifest.json, icon-192, icon-512 present | ✅ |
| **Auth pattern** | proxy.ts edge session refresh + getSession() in route handlers | ✅ |
| **Integration test count** | 21 test files (added venues-seasons + team-insights, 34 new tests covering venues/seasons CRUD + Phase 7 analytics) | ✅ |
| **Unit/component test count** | 122 test files | ✅ |
| **Core package tests** | 12 test files (events, stats, format, i18n, sync) | ✅ |
| **E2E test count** | 7 spec files (added admin-pages.spec.ts with 27 tests covering login + 12 admin CRUD routes) | 🟡 |
| **Bash integration tests** | 1 comprehensive bash script (scripts/integration-test.sh) | 🟡 |

---
## Summary Statistics

| Metric | Value |
|--------|-------|
| Total features (ROADMAP) | ~100 |
| Implemented ✅ | ~92 |
| Not implemented ⬜ | ~6 |
| Unit/Component tests | 122 files |
| Integration tests | 21 files |
| E2E tests | 7 files (27 tests) |
| Core package tests | 12 files |
| Bash integration script | 1 |
| Public page routes | 27 |
| Admin page routes | 29 |
| API route files | 80+ |
| Database tables | 66 |
| Failed (data rows) | 0 |
| Pending (T-10c.1, T-10d.x, T-11.x) | 6 |

## Key Gaps

### ✅ Fixed in this pass

1. **Rate limiting** — 200 req/60s sliding window per IP via proxy.ts, 429 with retry-after, rate-limit headers
2. **Content Security Policy** — comprehensive CSP with supabase/sentry/vercel self, embed routes keep frame-ancestors *
3. **Admin loading states** — 6 loading.tsx files + global admin error boundary added
4. **Admin E2E tests** — e2e/admin-pages.spec.ts with 27 tests covering login + 12 admin CRUD routes
5. **Integration tests** — 2 new files (34 tests) covering venues/seasons CRUD + Phase 7 team analytics
6. **Bundle analyzer** — @next/bundle-analyzer config, gated on ANALYZE=true
7. **Prefetch audit** — all patterns verified correct, no redundant prefetching
8. **Demo data** — academy tables seeded (5 students, 3 programs, 2 trainers, 2 locations, 10 attendance records, 2 waitlists, 2 announcements)

### 🔴 Still outstanding

1. **Offline attendance** — T-10c.1 not started, critical for academy use case
2. **Guardian self-service (Phase 11)** — largely unimplemented, only announcements done
3. **Phase 10d items** — guardian OTP, verified QPay callbacks, multi-location scheduling, extended reporting not started
4. **Tracker page metadata** — /tracker/[gameId] and /tracker/paper pages lack metadata exports
