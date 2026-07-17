---
title: Tamga Feature Roadmap — Master Plan
description: Consolidated research for 7 features. 22 person-days, 4 workstreams.
---

# Tamga Feature Roadmap — Master Plan

> From 3 parallel research tracks. 7 features, 22 person-days total.

---

## Executive Summary

Tamga's next phase adds a web dashboard, analytics, AI-powered breeding advice, GPS herd tracking, multi-user teams, premium tier gating, and a public organizer API. These seven features collectively unlock the Stable tier (₮49,900/mo), open a B2B revenue stream, and close the gap between the Flutter mobile app and the broader ecosystem. With three parallel developers, the critical path is 8 calendar days. The smallest feature (Premium Tier Gating, 2 days) enables revenue immediately; the largest (Web Dashboard, 5 days) gives breeders and stables a desktop-grade management surface. Total estimated effort is 22 person-days across 4 workstreams.

---

## Feature Overview Table

| # | Feature | Effort | Track | Dependencies | Priority |
|---|---------|--------|-------|-------------|----------|
| 1 | Web Dashboard | 5 days | Web | None | P0 |
| 2 | Analytics Dashboard | 3 days | Web | #1 (analytics shell from Day 5) | P1 |
| 3 | AI Breeding Advisor (Gemini) | 3 days | AI/Mobile | None | P1 |
| 4 | GPS Herd Tracking | 3 days | AI/Mobile | None | P1 |
| 5 | Multi-user Teams | 3 days | Platform | None | P0 |
| 6 | Premium Tier Gating | 2 days | Platform | None | P0 |
| 7 | Organizer API | 3 days | Platform | #6 (tier enforcement) | P2 |

---

## Workstream Timeline

```
Calendar Day:    1    2    3    4    5    6    7    8
                ─────┼────┼────┼────┼────┼────┼────┼────

Track Web ────── Web Dashboard (5d) ────── Analytics (3d) ────
                 ████ ████ ████ ████ ████ ████ ████ ████

Track AI/Mobile ── AI Breeding (3d) ── GPS Tracking (3d) ──────
                   ████ ████ ████ ████ ████ ████

Track Platform ── Gating (2d) ── Teams (3d) ─── API (3d) ──────
                   ████ ████ ████ ████ ████ ████ ████ ████

Legend:  ████ = active development day
```

**Critical path:** 8 calendar days with 3 parallel developers.

| Calendar Day | Track Web | Track AI/Mobile | Track Platform |
|---|---|---|---|
| Day 1 | Web Dashboard scaffold + auth | AI Breeding Edge Function | Premium Gating schema |
| Day 2 | Horse list + detail | Client integration + caching | UI gating + feature matrix |
| Day 3 | Health timeline + breeding | Polish + testing | Multi-user Teams migration + RLS |
| Day 4 | Marketplace management | GPS background tracking + offline | Teams real-time + team-horse |
| Day 5 | Analytics shell + polish | Real-time map + multi-horse | Teams audit log + testing |
| Day 6 | Analytics schema + aggregation | Pasture zones + Spotter stub | API DB + auth + core CRUD |
| Day 7 | Chart components | (track complete) | API results + bulk + docs |
| Day 8 | Dashboard pages + tier gating | (track complete) | Flutter settings + quickstart |

---

## Feature Details

### Feature 1: Web Dashboard (5 days)

**Decision:** Standalone Next.js 16 app at `apps/tamga-web`. Phone OTP via Supabase Auth, server-side rendering with Supabase SSR, shadcn/ui + Tailwind v4 with Tamga earth-tone tokens. The web dashboard reads directly from Supabase — no offline-first complexity. Different users (Mongolian herders vs. Zer/Tolom business operators), different auth flow (phone OTP vs. email/password), independent deploy target (`tamga.mn`).

**Key technical approach:**
- Supabase SSR with `createServerClient` — same RLS policies as Flutter app, zero data duplication
- Server Components for initial data load, TanStack Query for client-side interactivity
- shadcn/ui with custom `components.json` pointing at Tamga oklch tokens for brand consistency

| Day | Focus | Deliverable |
|-----|-------|-------------|
| Day 1 | Scaffold + Auth + Dashboard Shell | Working login → herd overview with real data |
| Day 2 | Horse List + Horse Detail | Browse and view full horse profiles |
| Day 3 | Health Timeline + Breeding Tracker | Health management and breeding tracking on web |
| Day 4 | Marketplace Management | Complete listing CRUD with image upload |
| Day 5 | Analytics Shell + Polish | MVP deployed to Vercel preview |

**Top risks:**
- Supabase type generation mismatch — generate from same project as Flutter app, verify immediately
- Phone OTP UX on desktop — ensure large input, auto-advance, paste support; consider email fallback
- Mongolian font rendering — test Cyrillic text early with system fonts (SF Pro/Roboto)

---

### Feature 2: Analytics Dashboard (3 days)

**Decision:** Recharts on web (shadcn Chart component, zero integration work), fl_chart on Flutter mobile. Server-side aggregation via Postgres views + Supabase RPC for web; client-side computation from Isar on mobile. Tier-gated KPIs — Free gets basic herd/health stats, Pro unlocks timeline/costs, Breeder gets breeding/financial, Stable gets predictive + multi-user analytics. Show locked charts with upgrade CTAs (Endowment Effect).

**Key technical approach:**
- Postgres views (`herd_stats`, `health_cost_monthly`, `breeding_stats`, `marketplace_stats`) + `get_dashboard_stats` RPC function
- TanStack Query with Supabase Realtime subscriptions for live data updates
- Dynamic `next/dynamic` imports for chart components to avoid bundle bloat

| Day | Focus | Deliverable |
|-----|-------|-------------|
| Day 1 | Postgres views + RPC + server-side aggregation | Data flowing to Next.js from analytics views |
| Day 2 | Chart components (Recharts) | Interactive herd, health, financial, breeding charts |
| Day 3 | Export (CSV/PDF) + tier gating UI + mobile fl_chart | Complete analytics dashboard with locked premium cards |

**Top risks:**
- Recharts bundle size — use dynamic imports, charts load after page shell
- Mobile-web analytics divergence — same Supabase source, different computation paths; document any differences
- Tier bypass via API — server-side RPC tier check is authoritative; UI is cosmetic only

---

### Feature 3: AI Breeding Advisor — Gemini (3 days)

**Decision:** Gemini 2.5 Flash ($0.30/M input, $2.50/M output) via Supabase Edge Function. Structured JSON responses validated against a schema. Cache results in `ai_breeding_cache` table, rate-limit per user per tier. Route all calls server-side — API key never reaches Flutter client. At 1,000 users, estimated monthly cost is ~$92 (2.1% of blended revenue).

**Key technical approach:**
- Edge Function (`supabase/functions/ai-breeding/`) with Gemini SDK — auth check → quota check → fetch horse/pedigree data → build prompt → call Gemini → validate → cache → respond
- Bilingual prompt engineering (Mongolian + English) with breeding expert persona
- Cache keyed on sire+dam+model version; health record changes invalidate cache

| Day | Focus | Deliverable |
|-----|-------|-------------|
| Day 1 | Edge Function + Gemini client + JSON schema | Working function: sire+dam → validated `BreedingAdvice` JSON |
| Day 2 | Client integration + caching + error handling | End-to-end flow with offline cache hits |
| Day 3 | Mongolian prompts + edge cases + offline fallback | Production-ready advisor with bilingual output |

**Top risks:**
- Edge Function 60s timeout — keep prompts concise, optimize pedigree queries, aggressive caching
- AI gives wrong breeding advice — mandatory disclaimer ("informational, not veterinary advice"), confidence scores on every response
- Prompt injection via horse names — sanitize all user-generated text before prompt insertion

---

### Feature 4: GPS Herd Tracking (3 days)

**Decision:** Hybrid — smartphone background GPS (Geolocator) for Free/Pro tiers, Spotter satellite collars (Globalstar, 12,000+ deployed in Mongolia) for Breeder/Stable tiers. Both feed `horse_locations` table via the same Realtime streaming pipeline. Adaptive tracking intervals (100–500m distance filter) to manage battery. 90-day data retention with daily aggregation to control storage growth (~4.8 GB/month at 1,000 users).

**Key technical approach:**
- `HerdTrackingService` with background location streaming, `IsarQueuedLocation` schema for offline queue, batch sync on connectivity restoration
- MapLibre GL with GeoJSON layers, marker clustering, movement trail polylines
- Spotter API integration via Edge Function polling for satellite-tracked horses

| Day | Focus | Deliverable |
|-----|-------|-------------|
| Day 1 | Background tracking + offline queue + MapRepository extension | Single horse tracked via smartphone, offline→online sync |
| Day 2 | Real-time map + multi-horse dashboard + movement trails | Herd map with cohesion alerts and proximity warnings |
| Day 3 | Pasture zones + movement heatmaps + Spotter API stub + tier limits | Complete tracking with privacy controls and data export |

**Top risks:**
- Battery drain from background tracking — adaptive intervals, battery budget engine, low-battery mode fallback
- Offline data loss — Isar FIFO queue with max size, sync-on-reconnect with conflict resolution
- Storage growth exceeding Supabase limits — 90-day retention + daily aggregation; critical to implement by month 2

---

### Feature 5: Multi-user Teams (3 days)

**Decision:** Existing code is 90% complete. Domain models (`Team`, `TeamMember`, `TeamInvitation`), repository interfaces, Supabase + Isar implementations, providers, and 55KB+ of UI screens all exist. Missing: database tables in schema docs, RLS policies, real-time subscriptions, team-horse association, and audit log. Roles are well-designed: owner → all permissions, manager → manage + add, vet → view health + add health logs, groom → add health + training, viewer → read-only.

**Key technical approach:**
- DB migration for `teams`, `team_members`, `team_invitations`, `team_horses`, `team_activity_log` tables
- Team-scoped RLS using `SECURITY DEFINER` helper functions to avoid subquery performance issues
- Supabase Realtime broadcast channels for live team member presence and activity

| Day | Focus | Deliverable |
|-----|-------|-------------|
| Day 1 | DB migration + RLS policies + team-horse association | Team-scoped data isolation working at SQL level |
| Day 2 | Real-time subscriptions + team activity feed | Live team updates, horse assignment to teams |
| Day 3 | Audit log + integration testing | Full team flow: create → invite → accept → add horse → audit |

**Top risks:**
- RLS performance — team membership subqueries on every query; use `SECURITY DEFINER` helpers, materialize with views if needed
- Offline sync conflicts — concurrent team edits by different members; last-write-wins with timestamp, conflict resolution UI for critical data
- Team data isolation — accidental cross-team leakage via RLS gap; comprehensive SQL-level RLS test suite required

---

### Feature 6: Premium Tier Gating (2 days)

**Decision:** Hybrid client + server enforcement. Client-side `GateCheck` providers (7 exist) handle UI gating (hide/disable premium buttons) for offline-first UX. Server-side RLS with `user_meets_tier()` SQL function enforces data access. Subscription lifecycle Edge Function handles expiry with 7-day grace period. Fix price discrepancy: Breeder tier ₮29,900 in code → ₮24,900 to match published `pricing.md`.

**Key technical approach:**
- `user_meets_tier(min_tier)` SECURITY DEFINER SQL function + additive RLS policies on gated tables
- `subscription_history` table for audit trail; `profiles` columns for `subscription_expires_at`, `grace_period_ends_at`
- Cron Edge Function to expire subscriptions, trigger grace period, downgrade to Free after grace

| Day | Focus | Deliverable |
|-----|-------|-------------|
| Day 1 | Schema migration + `subscription_history` + expiry cron + `TierLimits` expansion | Server-side tier enforcement + subscription lifecycle |
| Day 2 | Subscription management UI screen + complete feature matrix + all gate providers wired | Upgrade/downgrade flow, all ungated features locked |

**Top risks:**
- Subscription expiry during offline — 7-day grace period; sync tier on reconnect; never delete user data on expiry
- Mongolian payment integration — SocialPay/bank APIs uncertain; manual bank transfer + RevenueCat as v1 path
- Missing tier flags — `TierLimits` lacks fields for health log level, competition access, listing creation, transfer capabilities; must expand

---

### Feature 7: Organizer API (3 days)

**Decision:** REST API via Supabase Edge Functions. API key authentication (SHA-256 hashed, stored in `organizer_api_keys`). Breeder tier = read-only (30 req/min, 1 key); Stable tier = full access (60 req/min, 3 keys). OpenAPI 3.1 spec with Swagger UI hosted at the function endpoint. The API complements — does not replace — the existing Flutter Partner Dashboard.

**Key technical approach:**
- Edge Function (`organizer-api/`) with middleware: validate API key → check rate limit → log usage → dispatch to handler
- `organizer_events`, `organizer_registrations`, `organizer_results` tables — separate from personal `events` table
- API key management flow: generate once (raw key shown only at creation), store SHA-256 hash + prefix

| Day | Focus | Deliverable |
|-----|-------|-------------|
| Day 1 | DB migration (organizer tables + API keys + usage) + auth middleware + core CRUD endpoints | Working events CRUD with API key auth |
| Day 2 | Results submission + bulk registration + OpenAPI spec + rate limiting | Complete API surface with documentation |
| Day 3 | Flutter API settings screen + quickstart guide + cURL tests | Organizer can generate key and start integrating |

**Top risks:**
- API abuse — organizers sharing keys; rate limiting per key, key rotation, usage monitoring dashboard
- Scope creep — too many endpoints before real usage; start with CRUD + registration, add results/certificates from organizer feedback
- Partner dashboard sync — `organizer_events` and personal `events` are complementary; need sync bridge for organizers who also use the app

---

## Dependency Graph

```
Web Dashboard ──────────────────────→ Analytics Dashboard
                   (no hard dep; analytics shell built on Day 5)

AI Breeding Advisor ──────────────── (standalone)
GPS Herd Tracking ────────────────── (standalone)

Premium Tier Gating ────────────────→ Organizer API
                   (API needs tier enforcement for Stable access)

Multi-user Teams ─────────────────── (standalone)
```

**Critical insight:** Only one hard dependency exists — Organizer API depends on Premium Tier Gating being complete (for Stable-tier access control). All other features can start immediately. The Web → Analytics link is soft: Analytics builds on the shell scaffolded in Web Dashboard Day 5, but could be developed independently if needed.

---

## Recommended Implementation Order

### Priority P0 (Week 1): Revenue + Core Platform

| Order | Feature | Rationale |
|-------|---------|-----------|
| 1 | **Premium Tier Gating** | Enables revenue from all paid tiers. 2 days, unblocks everything else. Fix the ₮29,900 → ₮24,900 price discrepancy immediately. |
| 2 | **Multi-user Teams** | Unlocks Stable tier's core differentiator (10 users). Existing code is 90% done — fastest path to a major feature. |
| 3 | **Web Dashboard** scaffold | Begin the largest feature (5 days). Scaffold + auth on Day 1, then continues into Week 2. |

### Priority P1 (Week 2): Differentiators + Analytics

| Order | Feature | Rationale |
|-------|---------|-----------|
| 4 | **AI Breeding Advisor** | Differentiator for Breeder tier. Low cost ($92/mo at 1K users), high perceived value. |
| 5 | **GPS Herd Tracking** | Differentiator for Breeder/Stable tiers. Leverages existing map infrastructure. |
| 6 | **Analytics Dashboard** | Builds on Web Dashboard Days 6–8. Transforms data into actionable insights. |

### Priority P2 (Week 3): B2B Expansion

| Order | Feature | Rationale |
|-------|---------|-----------|
| 7 | **Organizer API** | B2B revenue stream. Depends on Tier Gating. Lower urgency than consumer features. |

---

## Consolidated Risk Matrix

| Risk | Feature | Impact | Likelihood | Mitigation |
|------|---------|--------|------------|------------|
| **Battery drain** from background GPS tracking | GPS Tracking | High | High | Adaptive intervals, battery budget engine, low-battery mode, user-controlled tracking |
| **RLS performance** with team membership subqueries | Teams | High | Medium | `SECURITY DEFINER` helper functions; materialize with views if needed |
| **AI gives wrong breeding advice** | AI Breeding | High | Medium | Disclaimer text, confidence scores, "not veterinary advice" label on every response |
| **Offline data loss** during GPS tracking | GPS Tracking | High | Medium | Isar FIFO queue with max size, sync-on-reconnect, never drop un-uploaded points |
| **Subscription expiry during offline** | Tier Gating | Medium | Low | 7-day grace period, sync tier on reconnect, never delete user data on expiry |
| **Team data isolation** via RLS gap | Teams | High | Low | SQL-level RLS test suite required; no policy goes live without test coverage |
| **Gemini API key compromise** | AI Breeding | High | Low | Edge Function secret only, quarterly rotation, usage spike monitoring |
| **Edge Function 60s timeout** | AI Breeding | Medium | Medium | Concise prompts, aggressive caching, optimize pedigree queries |
| **Supabase type generation mismatch** | Web Dashboard | Medium | Medium | Generate from same Supabase project as Flutter app, verify immediately |
| **Storage growth exceeding Supabase limits** | GPS Tracking | Medium | Medium | 90-day retention + daily aggregation; implement before month 2 |
| **API abuse** — organizers sharing keys | Organizer API | Medium | Medium | Rate limiting per key, key rotation, usage monitoring dashboard |
| **Recharts bundle size** | Analytics | Medium | Medium | Dynamic `next/dynamic` imports; charts load after page shell |
| **Phone OTP UX on desktop** | Web Dashboard | Medium | Medium | Large input, auto-advance, paste support; consider email/password secondary auth |
| **Mongolian payment integration** | Tier Gating | Medium | Medium | Manual bank transfer + RevenueCat as v1; SocialPay research as follow-up |
| **Mobile-web analytics divergence** | Analytics | Medium | Medium | Same Supabase source, different computation; document any differences |

---

## Migration Requirements

All migrations apply to the shared Supabase project. Order matters — apply in sequence to avoid conflicts.

### 1. Teams Tables
```sql
-- Tables: teams, team_members, team_invitations, team_horses, team_activity_log
-- RLS: Team-scoped policies with SECURITY DEFINER helpers
-- Indexes: owner_id, team_id, email (invitations)
```

### 2. Subscription Lifecycle
```sql
-- Modify: profiles (add subscription_started_at, subscription_expires_at, trial_ends_at, grace_period_ends_at)
-- New tables: subscription_history
-- New function: user_active_tier(), user_meets_tier(min_tier)
-- Fix: Breeder price ₮29,900 → ₮24,900 in SubscriptionTier enum
```

### 3. AI Caching
```sql
-- New tables: ai_breeding_cache (sire_id + dam_id + model_version key), ai_usage_log
-- Indexes: cache key composite, user_id + created_at for usage
```

### 4. GPS Tracking
```sql
-- New tables: pasture_zones (GeoJSON polygons), horse_movement_summary (daily aggregates)
-- Enable: PostGIS extension for spatial queries
-- Retention: 90-day policy on raw horse_locations
```

### 5. Organizer API
```sql
-- New tables: organizer_events, organizer_registrations, organizer_results,
--             organizer_api_keys, organizer_api_usage
-- Indexes: organizer_id, event_id, key_hash, api_key_id + created_at
```

### 6. Analytics Views
```sql
-- Views: herd_stats, health_cost_monthly, breeding_stats, marketplace_stats
-- Functions: get_dashboard_stats(p_user_id UUID) with tier-gated response
```

---

## Detailed Research Documents

| Document | Features | Lines |
|----------|----------|-------|
| `web-dashboard-research.md` | Web Dashboard, Analytics Dashboard | ~970 |
| `ai-gps-research.md` | AI Breeding Advisor, GPS Herd Tracking | ~1,460 |
| `teams-gating-api-research.md` | Multi-user Teams, Premium Tier Gating, Organizer API | ~1,100 |

---

## Cost Summary (at 1,000 active users)

| Item | Monthly Cost |
|------|-------------|
| Supabase Pro plan | $25 |
| Gemini API (breeding advice) | ~$92 |
| Supabase storage (GPS data) | Included in Pro |
| Vercel hosting (tamga-web) | ~$0–20 (hobby/preview) |
| **Total incremental** | **~$137–157/month** |

Revenue offset: 1,000 users × blended ₮15,000/month = ₮15,000,000 (~$4,300 USD). Incremental costs represent ~3.5% of revenue. Highly sustainable.
