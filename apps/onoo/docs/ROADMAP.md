# Onoo — Feature Roadmap & Implementation Status

> Auto-generated checklist. Mark items done as features complete.
> Last updated: 2026-07-09

## Implementation Phases

### Phase 0 — Foundation ✅ Complete

| Task | Status | Description |
|------|--------|-------------|
| T-001 | ✅ | Workspace structure (`apps/onoo`, `packages/core`) |
| T-002 | ✅ | `@onoo/core` package scaffolded |
| T-003 | ✅ | Next.js app scaffolded |
| T-004 | ✅ | Database migrations 001-004 |
| T-005 | ✅ | RLS migration 005 |
| T-006 | ✅ | Rollups + storage migration 006 |
| T-007 | ✅ | TypeScript types generated |

### Phase 1 — Core Engine ✅ Complete

| Task | Status | Description |
|------|--------|-------------|
| T-008 | ✅ | Events dictionary + payload schemas |
| T-009 | ✅ | Box score derivation engine |
| T-010 | ✅ | Sync queue (IndexedDB adapter) |
| T-011 | ✅ | Format + i18n |
| T-012 | ✅ | Supabase clients + auth |
| T-013 | ✅ | Admin CRUD pages |
| T-014 | ✅ | Public pages |
| T-015 | ✅ | Manual box entry Edge Function |
| T-016 | ✅ | Migration 006b fix |
| T-017 | ✅ | Migration 007 apply_derived_stats RPC |
| T-018 | ✅ | Edge Function derive-game |

### Phase 2 — Tracker + Live ✅ Complete

| Task | Status | Description |
|------|--------|-------------|
| T-019 | ✅ | Tracker: IndexedDB adapter |
| T-020 | ✅ | Tracker UI: setup flow |
| T-021 | ✅ | Tracker UI: player rails + action grid |
| T-022 | ✅ | Tracker: subs, timeouts, period transitions |
| T-023 | ✅ | Finish flow |
| T-024 | ✅ | Live game center with Realtime |
| T-025 | ✅ | Verification (admin verify button) |
| T-026 | ✅ | PWA manifest |
| T-027 | ✅ | Home page live section |
| T-028 | ✅ | Undo functionality |

### Phase 3 — Mobile + Depth 🔄 In Progress

| Task | Status | Description |
|------|--------|-------------|
| T-030 | ✅ | Scaffold `apps/onoo-app` (Expo) |
| T-031 | ✅ | Mobile screens (home, game, standings, leaders, team, player) |
| T-032 | ✅ | Follows + push notifications |
| T-033 | 🔲 | Auth phone OTP + athlete claim flow |
| T-034 | 🔲 | Advanced stats module + shot chart input |
| T-035 | 🔲 | Exports (PDF box score, CSV endpoints) |

---

## Feature Checklist

### Database Schema

| Feature | Status | Table(s) |
|---------|--------|----------|
| Sports registry | ✅ | `sports` |
| Organizations | ✅ | `organizations` |
| Leagues | ✅ | `leagues` |
| Seasons | ✅ | `seasons` |
| Competitions | ✅ | `competitions` |
| Venues | ✅ | `venues` |
| Teams | ✅ | `teams` |
| Team seasons | ✅ | `team_seasons` |
| Players | ✅ | `players` |
| Roster entries | ✅ | `roster_entries` |
| Games | ✅ | `games` |
| Game rosters | ✅ | `game_rosters` |
| Game team stats | ✅ | `game_team_stats` |
| Game player stats | ✅ | `game_player_stats` |
| Stat events | ✅ | `stat_events` |
| Stat event types | ✅ | `stat_event_types` |
| Standings | ✅ | `standings` |
| Season player stats | ✅ | `season_player_stats` |
| Profiles | ✅ | `profiles` |
| Memberships | ✅ | `memberships` |
| Game assignments | ✅ | `game_assignments` |
| Audit log | ✅ | `audit_log` |

### Edge Functions

| Function | Status | Description |
|----------|--------|-------------|
| derive-game | ✅ | Derives box score from stat events |
| manual-box-entry | ✅ | Manual stat entry with validation |

### Core Package (@onoo/core)

| Feature | Status | File(s) |
|---------|--------|---------|
| Events dictionary | ✅ | `events/dictionary.ts` |
| Event ordering | ✅ | `events/ordering.ts` |
| Event payloads | ✅ | `events/payloads.ts` |
| Box score derivation | ✅ | `stats/derive.ts` |
| Format utilities | ✅ | `format/index.ts` |
| i18n (Mongolian) | ✅ | `i18n/stats.ts` |
| Sync queue | ✅ | `sync/index.ts` |
| TypeScript types | ✅ | `types.ts` |

### Frontend — Public Pages

| Page | Status | Route |
|------|--------|-------|
| Home | ✅ | `/` |
| Games list | ✅ | `/games` |
| Game detail | ✅ | `/games/[id]` |
| Team page | ✅ | `/teams/[slug]` |
| Player page | ✅ | `/players/[id]` |
| Standings | ✅ | `/standings` |
| Leaders | ✅ | `/leaders` |
| Live tracker | ✅ | `/tracker/[gameId]` |

### Frontend — Admin Pages

| Page | Status | Route |
|------|--------|-------|
| Login | ✅ | `/admin/login` |
| Dashboard | ✅ | `/admin` |
| Games list | ✅ | `/admin/games` |
| Game detail | ✅ | `/admin/games/[id]` |
| Manual box entry | ✅ | `/admin/games/[id]/box-entry` |
| Teams CRUD | ✅ | `/admin/teams` |
| Players CRUD | ✅ | `/admin/players` |
| Leagues CRUD | ✅ | `/admin/leagues` |
| Seasons CRUD | ✅ | `/admin/seasons` |

### Frontend — Components

| Component | Status | Location |
|-----------|--------|----------|
| Live game center | ✅ | `games/[id]/components/live-game-center.tsx` |
| Site nav | ✅ | `components/site-nav.tsx` |
| Site footer | ✅ | `components/site-footer.tsx` |
| UI primitives | ✅ | `components/ui/` |

### Testing

| Test Suite | Status | Tests |
|------------|--------|-------|
| Events | ✅ | 15 tests |
| Derivation | ✅ | 25 tests |
| Format | ✅ | 12 tests |
| i18n | ✅ | 9 tests |
| **Total** | ✅ | **61 tests** |

---

## Remaining Work

### Phase 3 — Mobile App (T-030 to T-035)

- [x] T-030: Scaffold Expo app with tab navigation
- [ ] T-031: Mobile screens (reuse `@onoo/core` derive)
- [x] T-032: Follows table + push notifications
- [ ] T-033: Phone OTP auth + athlete claim
- [ ] T-034: Advanced stats + shot chart
- [ ] T-035: PDF/CSV exports

### Future Enhancements

- [ ] Shot chart visualization (x,y coordinates on court)
- [ ] Advanced stats (PER, usage rate, true shooting %)
- [ ] Season-over-season comparisons
- [ ] Team analytics dashboard
- [ ] Player comparison tool
- [ ] Historical data import
- [ ] Multi-language support (English)
- [ ] Real-time notifications (web push)
- [ ] Offline mode (PWA service worker)
- [ ] Data export (CSV, PDF)

---

## Update Log

| Date | Change |
|------|--------|
| 2026-07-09 | Initial roadmap created |
