# Player Page — Creative Analytics & Visualization Upgrade

> Date: 2026-07-19
> Status: Research complete, ready for implementation
> Decision: **Keep Recharts + add Framer Motion + custom SVG enhancements**

---

## Current State Audit

### Existing Components (14)

| Component | Type | Library | Quality |
|---|---|---|---|
| HeroCard | Identity + averages | Server component | Good |
| StatCard | Shareable stat card | Canvas API | Unique |
| RecentGames | Last 5 games strip | Tailwind snap scroll | Good |
| SeasonArc | PTS/REB/AST area chart | Recharts | Good |
| ShootingProfile | Radial gauges + breakdown | Recharts | Good |
| FormTrends | EFF scatter + rolling avg | Recharts | Good |
| SkillRadar | Radar vs league average | Recharts | Good |
| ShotChart | SVG half-court heatmap | Custom SVG | Unique |
| Milestones | Career highs, 20+ games | Tailwind badges | Good |
| AwardsShelf | MVP, top scorer | Tailwind badges | Good |
| StatFlipCard | 3D CSS flip card | CSS 3D transforms | Good |
| LiveCourt | Animated live indicator | CSS keyframes | Good |
| StatNumber | Animated counter | requestAnimationFrame | Good |
| SeasonSelector | Competition picker | shadcn Select | Good |

### Current Tech Stack for Visualization
- **Recharts v3.9.2** — area, radar, radial bar, scatter
- **Custom SVG** — court heatmap (hand-drawn, 600×550 viewBox)
- **Canvas** — StatCard download rendering
- **CSS animations** — StatFlipCard, LiveCourt, stat-flip

---

## Gap Analysis vs Competitors

### NBA.com Player Profile
- ✅ Shot zones with efficiency — **we have this**
- ❌ Individual shot dots (scatter overlay on court)
- ❌ Shot type breakdown (layup / jump / dunk / tip-in)
- ❌ Play-by-play event timeline
- ❌ Game-by-game box score expansion
- ❌ Video highlights integration

### Basketball Analytics Tools (ShotIQ, NBA Player Shots)
- ❌ Expected vs actual FG% by zone (xFG%, SMOE)
- ❌ Shot difficulty overlay
- ❌ Season-over-season trend comparison
- ❌ Multi-season career trajectory charts

### Advanced Sports Dashboards
- ❌ Home/away splits
- ❌ Quarter-by-quarter scoring breakdown
- ❌ Possession-based advanced stats
- ❌ Staggered entrance animations
- ❌ Scroll-triggered reveals
- ❌ Animated count-up numbers on card entrance
- ❌ Interactive court with individual shot hover/click
- ❌ Player "fingerprint" (unique stat signature visualization)
- ❌ On-page player comparison (micro — mini radar overlay)

---

## Library Decision: Keep Recharts

### Why Recharts is Still the Right Choice

| Factor | Recharts | visx | Nivo | Chart.js | ECharts |
|---|---|---|---|---|---|
| **Bundle size** | ~370KB | ~50KB (per primitive) | ~800KB | ~200KB (Canvas) | ~800KB+ |
| **React-first** | ✅ JSX API | ✅ Low-level | ✅ JSX API | ❌ Wrapper | ❌ Framework-agnostic |
| **SSR/App Router** | ✅ SVG, SSR-safe | ✅ SVG | ⚠️ Some RSC caveats | ❌ Canvas only | ❌ Canvas/SSR issues |
| **shadcn/ui integration** | ✅ Built-in chart.tsx | ❌ Manual | ❌ Manual | ❌ Manual | ❌ Manual |
| **Developer velocity** | High | Low (D3 primitives) | Medium | High | Medium |
| **Onoo data size** | ~20 games max | — | — | — | — |

**Verdict**: Recharts handles our data scale (≤5K points easily), integrates with shadcn/ui's `ChartContainer`, and is SSR-safe for App Router. The custom SVG court heatmap is already hand-built and doesn't need a chart library. No reason to switch.

### What to Add: `framer-motion`

The biggest UX gap isn't the charts — it's the **motion**. The page currently has zero entrance animations, zero scroll reveals, and zero micro-interactions beyond the CSS flip card. Adding `framer-motion` will:

1. **Animated stat counters** — count up from 0 on card entrance (PTS, REB, AST)
2. **Staggered card reveals** — cards slide up with delay cascade
3. **Scroll-triggered sections** — metrics animate in as they enter viewport
4. **Hover micro-interactions** — stat cards lift, badges pulse
5. **Page transitions** — season switch animates stat values

---

## Recommended New Features (Priority Order)

### Tier 1 — High Impact, Medium Effort

#### 1. Animated Stat Counters
- Hero card stats count up from 0 with easing
- Use `framer-motion` `useSpring` + `useMotionValue`
- Trigger on intersection (scroll into view)
- **Impact**: Immediately makes the page feel premium

#### 2. Staggered Card Entrance
- All cards in Summary tab slide up + fade in with 50ms stagger
- Uses `framer-motion` `stagger` variants
- Respects `prefers-reduced-motion`
- **Impact**: Transforms a static page into a dynamic experience

#### 3. Enhanced Shot Chart — Scatter Overlay
- Add individual shot dots on top of existing zone heatmap
- Color by made (green) / missed (red), size by shot type
- Click a dot to show shot details (quarter, defender, result)
- Requires: `shot_events` table with x/y coordinates per event
- **Implementation**: Extend existing `CourtHeatmap` SVG with scatter layer
- **Impact**: Matches NBA.com shot chart quality

#### 4. Home/Away Splits Card
- Split stats: HOME vs AWAY with side-by-side comparison bars
- Uses existing `playerGameLog` data (has `result` and can derive home/away from `team_score` vs `opponent_score` + game location)
- Horizontal bar chart with Recharts `BarChart`
- **Impact**: Standard advanced analytics feature, every competitor has it

### Tier 2 — Medium Impact, Medium Effort

#### 5. Quarter-by-Quarter Scoring
- Stacked bar chart showing which quarters the player scores most
- Per-game stacked bars (Q1/Q2/Q3/Q4) with average line
- Uses `playerGameLog` if quarter data is available (may need DB schema extension)
- **Impact**: Reveals clutch performance patterns

#### 6. Shot Type Breakdown
- Donut/pie chart: Layup vs Dunk vs Jump Shot vs Free Throw
- Add to ShotChart card alongside existing efficiency grid
- Data from `shot_events` or derived from `shooting_profile`
- **Impact**: Shows scoring style at a glance

#### 7. Player "Fingerprint" Visualization
- Unique spiral/radial pattern where each spoke = a stat category
- Normalized 0-100, colored gradient from weak to strong
- Creates an instantly recognizable player shape
- **Custom SVG** component (no library needed)
- **Impact**: Visual identity, very shareable on social

#### 8. On-Page Micro Comparison
- Small overlay showing player vs league average on key stats
- Toggle on/off per stat line in the game log
- Horizontal bar: player bar + league average marker
- Reuses existing `leagueAverages` data
- **Impact**: Quick reference without leaving the page

### Tier 3 — Lower Impact, Lower Effort

#### 9. Scroll-Triggered Section Headers
- Section headings animate in with left-to-right line draw
- Uses `framer-motion` `useInView` + SVG path animation
- **Impact**: Subtle polish

#### 10. Hover Card Lifts
- Stat cards slightly lift (translateY -2px) + shadow increases on hover
- Badge awards pulse once on hover
- Uses `framer-motion` `whileHover` + `whileTap`
- **Impact**: Tactile feel, micro-delight

#### 11. Season Comparison Sparkline
- Small inline sparkline in SeasonSelector dropdown
- Shows last 5 games trend per season option
- Tiny SVG, no library needed
- **Impact**: Helps users pick the right season

---

## Implementation Plan

### Phase 1: Motion Foundation
- Install `framer-motion`
- Add `AnimatedCounter` utility component
- Add `StaggerContainer` + `StaggerItem` wrapper components
- Add `ScrollReveal` wrapper component
- All respect `prefers-reduced-motion`

### Phase 2: Upgrade Existing Components
- Hero card: animated stat counters
- Summary tab: staggered card entrance
- SeasonArc: scroll-triggered reveal
- FormTrends: scroll-triggered reveal

### Phase 3: New Visual Features
- Home/away splits card
- Enhanced shot chart scatter overlay
- Player fingerprint visualization
- On-page micro comparison

### Phase 4: Polish
- Hover micro-interactions
- Season comparison sparkline
- Scroll-triggered section headers
- Mobile touch feedback

---

## Dependencies to Add

| Package | Purpose | Size | Install |
|---|---|---|---|
| `framer-motion` | Animations, scroll triggers, hover states | ~30KB gzip | `pnpm add framer-motion` |

**No chart library changes needed.** Recharts stays. Framer-motion handles everything Recharts doesn't — entrance animations, scroll reveals, and micro-interactions.

---

## Risk Assessment

- **Bundle size**: +30KB gzip for framer-motion is acceptable
- **SSR**: framer-motion v11+ supports React 19 + App Router SSR
- **Performance**: Intersection-based triggers avoid layout thrashing
- **Accessibility**: `prefers-reduced-motion` support required for every animation
- **Data availability**: Some features (shot scatter, shot type breakdown) need shot-level event data — check `stat_events` schema first

---

## Sources

1. NBA.com player profiles — shot charts, stat tabs, game logs
2. NBA ShotIQ — xFG%, SMOE, shot difficulty visualization
3. Recharts 2026 comparison (LogRocket, Usedatabrain, FusionCharts) — library landscape
4. visx docs (airbnb.tech) — low-level React+D3 primitives
5. @basketball-ceo/charts — React basketball court components
6. framer-motion + Recharts dashboards (Craft, data-viz-dashboard) — animation patterns
