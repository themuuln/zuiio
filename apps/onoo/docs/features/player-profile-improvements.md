# Player Profile — Feature Gap Analysis & Improvement Roadmap

> Generated: 2026-07-21 via `feature-research` skill.
> Status: Research complete. All recommendations are **Build** (own data, own stack).

---

## 1. Current State

### Inventory of what's already built on `players/[id]`

| Feature | Component(s) | Status |
|---|---|---|
| Hero identity card (jersey, position, team, season averages) | `hero-card.tsx` | ✅ Live |
| Season story arc (PTS/REB/AST trends) | `season-arc.tsx` via `SeasonArc` | ✅ Live |
| Shooting profile (FG/3P/FT splits) | `shooting-profile.tsx` via `ShootingProfile` | ✅ Live |
| Career highs & milestones | `milestones.tsx` | ✅ Live |
| Radar/spider chart (player vs league avg) | `skill-radar.tsx` via `SkillRadar` | ✅ Live |
| Recent games strip (last 5) | `recent-games.tsx` | ✅ Live |
| Plain-language game summaries | `lib/summaries.ts` via `generatePlayerGameSummary` | ✅ Live |
| Report stat error button | `report-error-dialog` | ✅ Live |
| Season selector & career view | `season-selector.tsx` | ✅ Live |
| Game log table (full box score history) | Inline in `page.tsx` | ✅ Live |
| Form & trends (efficiency chart) | `form-trends.tsx` via `FormTrends` | ✅ Live |
| Home/away splits | `home-away-splits.tsx` via `HomeAwaySplits` | ✅ Live |
| Shot chart + court heatmap | `shot-chart.tsx`, `court-heatmap.tsx` | ✅ Live |
| Awards shelf | `awards-shelf.tsx` | ✅ Live |
| Shareable stat card (canvas export) | `stat-card.tsx` | ✅ Live |
| Motion/animation wrapper | `motion-wrapper.tsx` — `ScrollReveal`, `StaggerContainer` | ✅ Live |
| English/Mongolian toggle | `language-toggle` | ✅ Live |
| Compare players (radar + bars + drag) | `compare/` — `compare-radar.tsx`, `compare-bars.tsx`, `drag-compare-zone.tsx` | ✅ Live |
| OpenGraph images | `opengraph-image.tsx` | ✅ Live |
| JSON-LD structured data | Inline in `page.tsx` | ✅ Live |
| Loading skeleton | `loading.tsx` | ✅ Live |
| Error boundary | `error.tsx` | ✅ Live |

### Already-built but NOT wired

| Component | Exists at | What it does | Gap |
|---|---|---|---|
| `advanced-stats-table.tsx` | `[id]/components/` | eFG%, TS%, USG%, AST/TO, PER-style Game Score — **completely built including league avg comparison** | **Never imported in page.tsx** — zero render |
| `clutch-stats.tsx` | `[id]/components/` | Close-game PPG, record, win% with locked empty state | **Hardcoded `available: false`** — needs PBP data to unlock |
| `_advanced-helpers.ts` | `[id]/components/` | `computeSeasonAdvancedStats()`, `computeHomeAwaySplits()` — pure function stat calculations | Used by advanced-stats-table, but that table isn't rendered |
| `stat-flip-card.tsx` | `[id]/components/` | Flip-card animation on stat tiles | Status unclear — may be used inside HeroCard |
| `live-court.tsx` | `[id]/components/` | Live court visualization | Phase 5 feature, not yet wired |

---

## 2. Competitive Landscape

### Competitor Feature Matrix

| Feature | Onoo | STAT.mn | Basketball-Reference | Viziball | NBA.com |
|---|---|---|---|---|---|
| Hero/identity card | ✅ | ✅ | ✅ | ✅ | ✅ |
| Season averages | ✅ | ✅ | ✅ | ✅ | ✅ |
| Game log table | ✅ | ✅ | ✅ | ✅ | ✅ |
| Season selector | ✅ | ✅ | ✅ | ✅ | ✅ |
| Shooting splits | ✅ | ❌ | ✅ | ✅ | ✅ |
| Radar/spider chart | ✅ | ❌ | ❌ | ✅ (core) | ❌ |
| Shot chart/heatmap | ✅ (zone-based) | ❌ | ❌ | ❌ | ✅ |
| Season trend chart | ✅ | ❌ | ✅ (tables) | ❌ | ✅ (some) |
| Recent games strip | ✅ | ❌ | ❌ | ✅ | ❌ |
| Player awards | ✅ | ✅ | ✅ | ❌ | ✅ |
| Career highs | ✅ | ✅ | ✅ | ❌ | ✅ |
| Language toggle (MN/EN) | ✅ | ❌ | N/A | N/A | N/A |
| Shareable stat cards | ✅ | ❌ | ❌ | ❌ | ❌ |
| Home/away splits | ✅ | ❌ | ✅ | ✅ | ❌ |
| Form/trends charts | ✅ | ❌ | ❌ | ❌ | ❌ |
| Advanced stats (eFG%, TS%, USG%) | 🟡 (unwired) | ❌ | ✅ | ✅ | ✅ |
| Mobile app | ❌ | ✅ (iOS) | ❌ | ❌ | ✅ |
| Per-opponent splits | ❌ | ❌ | ✅ | ❌ | ✅ |
| Month-by-month breakdown | ❌ | ❌ | ✅ | ❌ | ❌ |
| Clutch stats | 🟡 (locked) | ❌ | ✅ | ✅ | ❌ |
| Season-over-season table | ❌ | ✅ | ✅ | ❌ | ✅ |
| "Similar players" | ❌ | ❌ | ✅ | ❌ | ❌ |
| Per-36 stats | ❌ | ❌ | ✅ | ✅ | ✅ |
| Position rank | ❌ | ❌ | ❌ | ✅ | ✅ |
| Per-quarter splits | ❌ | ❌ | ✅ | ✅ | ✅ |
| On/Off court stats | ❌ | ❌ | ✅ | ✅ | ❌ |
| Print/PDF export | ❌ | ❌ | ❌ | ❌ | ❌ |
| Streaks display | ❌ | ❌ | ✅ | ❌ | ❌ |
| Scoring breakdown (by type) | ❌ | ❌ | ✅ | ✅ | ❌ |
| Best/worst game cards | ❌ | ❌ | ❌ | ❌ | ❌ |

### Key Competitor Details

**STAT.mn** (direct local competitor)
- Established Mongolian platform with multiple seasons
- Has iOS/Android app (Onoo doesn't)
- Feature set is basic: tables, no charts, no visualizations
- **Advantage to beat**: Onoo already has vastly superior visuals and more features despite being newer
- **Gap to close**: Mobile app, season-over-season table, broader league inventory

**Basketball-Reference** (gold standard for depth)
- Every stat you can imagine, but all in tables — zero visual design
- Unmatched depth: career tables, similarity scores, per-36, advanced stats
- **Pattern to adopt**: Per-opponent splits, month-by-month, season-over-season tables, similarity finder

**Viziball** (gold standard for visualization)
- Radar chart as centerpiece, per-shot sliders, deep advanced stats
- Customizable period ranges (season/month/week)
- **Pattern to adopt**: Customizable date ranges, comparative radar

---

## 3. Gap Analysis — Prioritized

### P0 — Free impact (wire existing code)

| # | Gap | Effort | Impact | Details |
|---|---|---|---|---|
| 1 | **Wire Advanced Stats Table** | ~15 min | High | `advanced-stats-table.tsx` 100% built. Import it in `page.tsx`, pass computed stats from `computeSeasonAdvancedStats()` in `_advanced-helpers.ts`. eFG%, TS%, USG%, AST/TO appear with league avg comparison. |
| 2 | **Wire Streaks to display** | ~30 min | Medium | `form-trends.tsx` already has rolling avg. Add streak display (current W/L streak, longest scoring streak). Data exists in game log, just not aggregated. |

### P1 — High value, achievable now

| # | Gap | Effort | Impact | Details |
|---|---|---|---|---|
| 3 | **Scoring Breakdown visualization** | 2-4 hrs | High | Points-by-type donut or stacked bar (2PT / 3PT / FT). Data available from `shootingProfile` (fgm/fga, tpm/tpa, ftm/fta). Everyone does this — BBRef, NBA, Viziball. Onoo has the data, just needs the viz. |
| 4 | **Best/Worst Game cards** | 2-3 hrs | High | Auto-detect player's best and worst game of the season by Game Score. Show as highlighted cards with stat line, opponent, date. Uses existing game log data + `calcGameScore()` from `_advanced-helpers.ts`. Strong social share hook. |
| 5 | **Per-opponent Splits** | 4-6 hrs | Medium | Aggregate stats by opponent team. Show as expandable table or sorted card list. Data available from game log (`opponent_short_code`). BBRef and NBA.com both do this. Gives useful context ("averages 25pts vs Xac Broncos"). |

### P2 — Depth & differentiation

| # | Gap | Effort | Impact | Details |
|---|---|---|---|---|
| 6 | **Position Rank Badges** | 2-4 hrs | Medium | Show "3rd in scoring among guards" on HeroCard. Needs position-aware rank query in data layer. Strong engagement hook for players. |
| 7 | **Quarter-by-quarter splits** | 3-5 hrs | Medium | Per-period (Q1/Q2/Q3/Q4/OT) stat breakdown. Requires period-level aggregation from `stat_events`. 3 of 4 major competitors do this. Great for comeback stories. |
| 8 | **Season-over-season comparison** | 4-6 hrs | Medium | Side-by-side table comparing current season to previous. Needs multi-season data in query. STAT.mn already does this. Important for career tracking. |
| 9 | **Advanced stats in compare page** | 1-2 hrs | Medium | Add eFG%, TS% to the mirrored bar comparison. Backend API likely returns enough data, just needs UI. |
| 10 | **Per-36 minute stats** | 1-2 hrs | Low | Per-game / per-36 toggle on stat table. Simple arithmetic on existing data. |

### P3 — Future / polish

| # | Gap | Effort | Impact | Details |
|---|---|---|---|---|
| 11 | **Season arc brush selection** | 4-6 hrs | Medium | Interactive date range brush on trend chart. Recharts brush component + recalc displayed stats. From `docs/gaps.md`. |
| 12 | **Similar players** | 8-16 hrs | Low | Statistical similarity algorithm. BBRef's signature feature. Complex to get right. |
| 13 | **Game log search/filter** | 2-3 hrs | Low | Filter game log by opponent, result, date range. |
| 14 | **Player grid filters** | 3-5 hrs | Low | Position/team filter on the players list page. |
| 15 | **Print/PDF export** | 4-8 hrs | Low | Printable stat sheet for scouts. Canvas-based like existing StatCard. |
| 16 | **Mobile app** | Major | High | STAT.mn has iOS app. Onoo is web-first. Roadmap defers mobile to post-paid-pilot. |

---

## 4. Evaluation

### Recommendation: **Build** (all gaps)

**Rationale:** Every gap above sits on Onoo's own data. There is no third-party dependency that makes buy/OSS the better choice:

- **Advanced stats** — formulas are standard (`calcTsPct`, `calcEfgPct`, `calcGameScore`), already written in `_advanced-helpers.ts`. Just wire the component.
- **Scoring breakdown** — pure projection of existing shooting profile data. Built-in.
- **Per-opponent splits** — aggregation of existing game log. Add query, no schema change.
- **Season-over-season** — multi-season query on existing schema.

| Option | Verdict | Why |
|---|---|---|
| **Build** | ✅ Recommended | Own data, own IP, differentiation from STAT.mn |
| **Adopt OSS** | ❌ Not needed | All features are UI/data projections on owned data |
| **Buy** | ❌ Not viable | No Mongolian basketball data-as-a-service exists |
| **Defer** | ⚠️ For mobile | Roadmap correctly defers mobile to post-pilot |

### OSS evaluation (shot chart)

`@basketball-ceo/charts` (MIT, recent v0.2.1, TypeScript, React) — excellent OSS basketball viz library. Onoo already has a custom court heatmap (`court-heatmap.tsx`). Worth evaluating as a replacement if the current SVG court needs more features (hexbin, team themes, animations). **Low priority** — current implementation works.

---

## 5. Red-Team Review

### What could make this recommendation wrong?

1. **Data volume is too low for advanced features** — If teams only play 10-game seasons (common in Mongolian leagues), per-opponent splits and streaks have tiny sample sizes. Mitigation: show "based on N games" labels, hide splits below threshold.
2. **Users don't care about advanced stats** — Mongolian basketball fans are used to basic scoring tables (STAT.mn's model). Onoo's differentiator might be mobile-first basic stats, not notebook-deep analytics. Mitigation: keep advanced stats behind a toggle/secondary tab, don't bloat the hero section.
3. **Performance on mobile data** — Adding charts and stats increases JS bundle. Mitigation: code-split charts (already done via `dynamic()` imports in `chart-sections.tsx`).

### Key assumptions

| Assumption | Validation needed |
|---|---|
| Users want advanced stats (eFG%, TS%) | Real user testing or analytics |
| Per-opponent splits are meaningful | Check typical game count per team |
| Scoring breakdown is intuitive for Mongolian fans | Copy testing with local users |

### What to validate first

1. **Wire the Advanced Stats Table** (P0, <1hr) and monitor visibility
2. **Add usage analytics** to track which tabs/sections get engagement
3. **Talk to 1-2 players** — do they want to see their "best game" highlighted?

---

## 6. Implementation Priorities

### Sprint 1 (immediate, <4hrs total)
1. **Wire Advanced Stats Table** — import in `page.tsx`, compute from game log
2. **Scoring Breakdown viz** — new chart card showing points by type

### Sprint 2 (next, 6-10hrs)
3. **Best/Worst Game cards** — auto-detect via `calcGameScore()`
4. **Position Rank badges** — add rank computation to `getPlayerById`

### Sprint 3 (next, 8-12hrs)
5. **Per-opponent Splits** — new data query + UI section
6. **Season-over-season table** — multi-season query

### Backlog
7. Quarter-by-quarter splits
8. Season arc brush
9. Similar players
10. Print/export

---

## 7. References

### Competitors analyzed
- **STAT.mn** — stat.mn — Mongolian market leader, table-based
- **Basketball-Reference** — basketball-reference.com — industry gold standard
- **Viziball** — viziball.app — best visualization patterns
- **NBA.com/stats** — nba.com/stats — official league site
- **PBP Stats** — pbpstats.com — advanced analytics
- **Dunks & Threes** — dunksandthrees.com — EPM-based analytics

### OSS libraries evaluated
- `@basketball-ceo/charts` (MIT, React) — court heatmap, hexbin, zones
- `shotchart.d3.ts` (ISC, React+D3) — interactive shot charts
- **Recharts** (already in project) — for all non-court charts

### Internal docs
- `docs/ROADMAP.md` — Phase 2 checklist (mostly delivered but unchecked)
- `docs/gaps.md` — Interactive UI gaps (brush selection, score flip, radar overlay)
- `docs/plans/phase-2-player-showcase.md` — player profile execution spec
- `docs/plans/phase-3-discovery-league.md` — comparison upgrade spec
