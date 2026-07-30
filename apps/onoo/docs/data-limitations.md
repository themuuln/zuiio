# Оноо — Data Limitations & Temporarily Disabled Features

> **Клиентэд зориулсан тэмдэглэл:** Энэ баримт бичигт ямар feature-үүд өгөгдлийн хязгаарлалтаас шалтгаалан түр идэвхгүй болсныг харуулна. Зарим UI бүрэлдэхүүн хэсгүүд харагдах боловч өгөгдөл байхгүй тул "Тун удахгүй" төлөвтэй байна.
> **For clients:** This document explains which features are temporarily unavailable due to data limitations. Some UI components are visible but show "Coming Soon" overlays because the required data is not yet collected.

---

## 📋 Quick Overview

| Status | Count | Description |
|--------|-------|-------------|
| ⛔ **Blocked — data not collected** | 2 | Schema supports it, but data capture is impractical today |
| ⏸️ **Coming Soon — needs derivation** | 2 | UI exists with blur overlay; data exists but no derivation pipeline |
| 🟡 **Limited adoption** | 2 | Features work but have zero data because no admin population flow exists |
| ⬜ **Not started** | 6 | Planned but not implemented |
| ✅ **Ready to build** | 13+ | Data exists, feature just needs frontend work |

---

## ⛔ Blocked: Data Not Collected

These features have **full schema support** and **working UI components**, but the underlying data isn't captured by the current game-day workflow.

### 1. Shot Location Data (Court Heatmap & Shot Chart Zones)

| Property | Detail |
|----------|--------|
| **Files** | `court-heatmap.tsx`, `shot-chart.tsx`, `court-zones.ts`, `shot-marker-layer.tsx`, `HalfCourtSVG` |
| **Current UI** | `ShotChart` shows: *"Шидэлтийн байршил бүртгэгдээгүй / Shot locations not tracked"* |
| **Data needed** | Per-shot `x, y` coordinates on a 600×550 court viewBox for every shot attempt |
| **Where it lives** | `stat_events.payload.x`, `stat_events.payload.y` — optional fields in `ShotMadePayload`/`ShotMissedPayload` |
| **Why blocked** | The tracker **does** have shot location capture (interactive SVG court), but it requires **5 taps per shot**: (1) select player, (2) select shot type, (3) tap court location, (4) click Confirm, (5) assign assist. With ~60 FGA per game, that's 300 extra taps. Scorekeepers skip it under time pressure. |
| **What's needed** | A simplified "quick shot" mode (e.g., pre-assign zone by button) to reduce taps from 5 → 2 |
| **Unblocks** | Court heatmap with real zone data, shot scatter dots, per-zone FG%, shooting efficiency by zone |

### 2. Full Live Court Animation

| Property | Detail |
|----------|--------|
| **File** | `live-court.tsx` |
| **Current UI** | Blurred court outline with **"Тун удахгүй / Coming Soon"** overlay |
| **Data needed** | (a) Per-shot `x,y` coordinates (same blocker as #1), (b) **player court positions** — requires a new data model not in schema |
| **Why blocked** | Twofold gap: shot coordinates aren't consistently captured, and player positions on the court (which players are on which side during a live game) require a new `player_court_positions` table or equivalent. Additionally, this feature needs **real-time** data via Supabase Realtime subscription during a live game — not compatible with post-game PDF import workflow. |
| **What's needed** | Shot capture UX improvement + new player position data model |
| **Unblocks** | Animated live court with pulsing dots, shot ripple rings, player positioning |

---

## ⏸️ Coming Soon: Needs Derivation Pipeline

These features have the **raw data available** but no derivation logic exists to transform it into the needed format.

### 3. Clutch Performance Stats

| Property | Detail |
|----------|--------|
| **File** | `clutch-stats.tsx` |
| **Current UI** | Blurred stat card with **"Тун удахгүй / Coming Soon"** overlay |
| **Data needed** | Close-game identification: "games where score margin was ≤ 5 points in the final 5 minutes" |
| **Available data** | ✅ `games.home_score` / `games.away_score` — final margin available |
| | ✅ `game_player_stats` — per-player per-game stat lines |
| | ✅ `v_public_play_by_play` — play-by-play with `clock_seconds`, `period`, `event_type` |
| **Why blocked** | No derivation pipeline exists to: (1) compute running score margin from play-by-play data, (2) identify periods where margin ≤ 5, (3) filter player stats to those games only. The data is there but no view or function computes "clutch" filtering. |
| **Difficulty** | Medium — requires a new SQL view or RPC function |
| **Unblocks** | Close-game PPG, clutch win/loss record, clutch win percentage display |

### 4. Lineup +/- Analysis

| Property | Detail |
|----------|--------|
| **File** | `packages/core/src/stats/lineup-analysis.ts` |
| **Current UI** | Not rendered on any page |
| **Data needed** | `pts_scored` / `pts_allowed` per lineup combination during game stretches |
| **Available data** | ✅ Substitution events tracked in `stat_events` |
| | ✅ `clock_seconds` and `period` for timing intervals |
| **Why blocked** | The `lineup-analysis.ts` derivation logic exists in code but the data layer doesn't populate `pts_scored`/`pts_allowed` for each lineup stretch. This is a gap in the derive-box-score pipeline — it computes per-player minutes but not per-lineup +/-. |
| **Difficulty** | Medium — requires extending `derive.ts` to track lineup-specific scoring |

---

## 🟡 Limited Adoption: Features with Zero Data

These features work but have no data in the database because no regular data-entry workflow exists for them.

### 5. Awards & MVP Races

| Property | Detail |
|----------|--------|
| **Files** | `app/awards/page.tsx`, `awards-shelf.tsx`, `mvp-race.tsx`, admin `cmd_grant_award` RPC |
| **Current UI** | Shows "No awards yet" / "Шагнал байхгүй" |
| **Data in DB** | **0 rows** in `awards` table |
| **Why empty** | The admin award-granting flow exists (`cmd_grant_award` SECURITY DEFINER function, admin awards page with Dialog) but there's no regular process to enter historical or current awards. No "Player of the Week/Month" automation. |
| **What's needed** | Manual admin data entry or automated award computation (e.g., "top scorer of the week") |
| **Unblocks** | Award shelf on player pages, MVP race leaderboard |

### 6. Opponent Scout Notes

| Property | Detail |
|----------|--------|
| **File** | `teams/[slug]/scout/page.tsx` |
| **Current UI** | Scout card works for stat comparisons; notes section is empty |
| **Data in DB** | **0 rows** in `opponent_notes` table |
| **Why empty** | Schema exists but no admin UI to create/edit opponent scouting notes. No automated pipeline to generate scouting reports. |
| **What's needed** | Admin form for entering opponent notes per game, or automated generation from game data |

---

## ⬜ Not Started (Planned for Future Phases)

| # | Feature | Task | Data Status | Notes |
|---|---------|------|-------------|-------|
| 7 | **Offline-safe Attendance** | T-10c.1 | Schema ready (`academy_attendance`) | Needs IndexedDB queue + sync. Critical for academy use in low-connectivity areas |
| 8 | **Guardian OTP & Multi-Child Dashboard** | T-10d.1 | Schema ready | Phone auth infrastructure + cross-child data access |
| 9 | **Verified QPay Callbacks** | T-10d.2 | Mock mode active | Server-side payment verification required for real money flow |
| 10 | **Multi-Location Scheduling** | T-10d.3 | Schema partially ready | Location-aware program offerings |
| 11 | **Extended Reporting** | T-10d.4 | Schema ready | Financial + attendance analytics dashboards |
| 12 | **Guardian Self-Service** | Phase 11 | Schema partially ready | Multi-child dashboard, registration, consent management |

---

## ✅ Ready to Build (Data Available)

These features from the interactive UI gaps list have **all required data available** and need only frontend implementation:

| Feature | Data Source | Effort |
|---------|------------|--------|
| Score Flip Animation | `games.home_score` / `away_score` | Low (CSS) |
| Skill Radar League Overlay | `leagueAverages` already passed to `SkillRadar` | Low (50 lines) |
| Season Arc Brush | `GameDataPoint[]` already loaded | Low (recharts Brush) |
| Standings Row Expansion | `v_public_standings` + `v_public_leaders` | Low (Collapsible) |
| Card Flip Stats | `season_player_stats` + leaderboard ranks | Low (CSS) |
| Swipeable Game Cards | `v_public_games` | Low (native touch) |
| Drag-to-Reorder Leaders | client-side localStorage | Low (@dnd-kit) |
| Drag-to-Compare Players | `/api/stats/compare-players` exists | Medium |
| Multi-Category Leaderboard | `v_public_leaders` | Low |
| Season Selector | `competitions` table | Low |
| Countdown Timer | `games.scheduled_at` | Low |
| Shareable Stat Cards | `game_player_stats` + `@vercel/og` | Medium |
| Period-by-Period Stats | `stat_events.period` | Low |
| Head-to-Head History | `games` + `game_player_stats` | Low |

---

## 🔑 Key Bottleneck

### Shot Location Capture — The Single Highest-Impact Improvement

The tracker already has shot location capture wired (`TrackerCourt` with `pendingShotLocation` flow), but it requires **5 taps per shot**:
1. Select player → 2. Select shot type → 3. Tap court location → 4. Click Confirm → 5. Optionally assign assist

With ~60 field-goal attempts per game, that's **300 extra scorekeeper taps**. Scorekeepers understandably skip it.

**A "Quick Shot" mode** — where the scorekeeper selects a pre-defined zone (paint, mid-range, 3PT corner, etc.) with one button tap instead of tapping an SVG court — would reduce this to **2 taps per shot** and dramatically increase adoption.

This single UX improvement would unblock:
- Court heatmap with real zone data (currently shows "not tracked")
- Shot scatter dots on player pages
- Per-zone FG% breakdowns
- Live court shot ripple animations

---

> **2026-07-29 audit update:** The tracker DOES have shot location capture wired (`TrackerCourt` component, `pendingShotLocation` flow in `tracker/[gameId]/page.tsx` lines 387-426). The `v_public_shot_zones` SQL view already derives zone aggregates from coordinates when present. The blocker is **not missing code** — it's capture friction (5 taps/shot).

---

## 📝 Update Log

| Date | Change |
|------|--------|
| 2026-07-29 | Initial document — cataloged 12 features with data limitations; added blur overlay + Coming Soon to LiveCourt and ClutchStats |
| 2026-07-29 | Full audit completed — found 15 undocumented features, corrected Phase 11 (guardian dashboard IS built), identified /teams/vs hub as disconnected static page |
