# UI Research: NBA.com-style Scorebar for Onoo

## Executive Summary

A persistent horizontally scrollable scorebar — patterned after NBA.com's top-of-page
game strip and Sofascore's compact match ticker — for the Onoo basketball platform.
The scorebar shows all games for a selected date with live scores, final results,
and upcoming match times. It replaces the current homepage-only "tonight's games"
ticker with a site-wide navigation element.

**Recommendation**: Build with CSS `overflow-x: auto` flexbox (same pattern as existing
homepage ticker). Two-row layout: date pills (top) + game cards (bottom). Dark
background for visual contrast. Zero new dependencies.

## 1. Scope & Constraints

| Dimension | Value |
|-----------|-------|
| **Task type** | New UI (component) |
| **Brand tokens** | `@zuiio/branding` — sidebar, surface-1/2/3, warning/amber accent, card, border. See `DESIGN.md`. |
| **Component library** | shadcn/ui new-york, Tailwind v4 |
| **Platform** | Web (Next.js 16 App Router) |
| **Stack** | Server Components by default, minimal client islands |
| **Accessibility** | WCAG AA |
| **Responsive** | 360px mobile-first → `sm` → `md` → `lg` |
| **In scope** | Layout, states (live/final/scheduled/empty), date navigation, responsive behavior, interaction patterns |
| **Out of scope** | Real-time polling (Phase 5 deferred), marquee auto-scroll, admin/authenticated variants |

## 2. Discovered Competitors

| Competitor | Type | Why included |
|------------|------|-------------|
| **NBA.com** | Direct | The primary reference — exactly the pattern the user wants |
| **Sofascore** | Direct | Leading sports scores platform, proven mobile-first scorebar pattern |
| **Sportradar Score Ticker** | Adjacent | Widget-based approach, shows compact/auto-sport patterns |
| **ESPN (via LiveScoreboard OSS)** | Adjacent | React-based real-time score ticker, proven architecture |
| **ljmakaronica/NBAScoresWebsite** | Aspirational | OSS Next.js NBA scores site with horizontal scrollable calendar + game cards |

## 3. Evidence Acquisition

### Evidence IDs

| ID | Source | Kind | Confidence |
|----|--------|------|------------|
| E1 | NBA.com `/games` (live page) | Observed | High |
| E2 | NBA.com "sticky top scorebar" (web research) | Third-party (Muffin Group) | Medium |
| E3 | Sofascore NBA page (live page) | Observed | High |
| E4 | ljmakaronica/NBAScoresWebsite (GitHub) | Observed (source code) | High |
| E5 | Sportradar Score Ticker docs | Vendor-stated | Medium |
| E6 | Onoo homepage current ticker (lines 203-265) | Observed | High |
| E7 | Onoo existing GameCard component | Observed | High |
| E8 | Onoo data layer (getGamesByDate, getLiveGames) | Observed | High |

### Captures

#### NBA.com Games Page (E1)

**Structure**:
```
[Top Nav — dark sticky bar]
[HIDE SCORES toggle | Month/Year | ◀ Sun19 Mon20 Tue21 Wed22 Thu23 Fri24 Sat25 ▶]
[Month calendar grid showing game counts per day]
[TODAY button — quick jump]
[Game cards — vertical list with: competition badge, team logos, scores, status]
```

**Scorebar observations**:
- Day pills (Sun19–Sat25) form a horizontal scrollable strip
- Each pill: day abbreviation + date number
- Arrows shift week range
- "HIDE SCORES" toggle controls score visibility
- Game cards show: team logo + abbreviation, score or "FINAL"/time
- Competition context shown ("2026 NBA Summer League — Consolation/Championship")
- Color: team logos on white/grey cards with bordered containment

**Key UX decisions**:
- HIDE SCORES respects users who don't want spoilers — particularly useful for
  fans who can't watch live
- Date pills default to current week, not calendar month — focused on "what's
  happening now"
- Scores shown prominently on cards, status as a badge overlay

#### Onoo Current Homepage Ticker (E6)

**Structure**:
```
[Өнөө орой · N тоглолт] [Бүгд →]
[← team logo | team name · time | vs | team name | team logo →] xN
```

**Current limitations**:
1. Homepage-only — not site-wide
2. No scores shown — only times
3. No date navigation — "tonight" only
4. No live indicator
5. No game status badges (scheduled/live/final)

#### Onoo Existing GameCard Component (E7)

Full card with team logos, names, scores, venue, status. Shows the data model
supports everything the scorebar needs — just needs a compact variant.

## 4. Analysis

### 4.1 Information Architecture

| Dimension | NBA.com | Onoo Current | Recommendation |
|-----------|---------|-------------|----------------|
| **Position** | Below nav, site-wide | Homepage only | Below SiteNav, all public pages |
| **Day navigation** | Horizontal pills + calendar modal | DateNav on /games page | Horizontal pill strip (8 days) |
| **Game ordering** | Not observed clearly | By status | Live → Scheduled → Final |
| **Score visibility** | Show/Hide toggle | No scores in ticker | Show by default, no toggle for V1 |
| **Live indicator** | Not visible (off-season) | None | Pulsing red dot on live games |
| **Status labels** | "FINAL" badge | None on ticker | "FINAL" / "LIVE" / time badges |

### 4.2 Layout & Spacing

**NBA.com pattern**:
- Day pills: ~56px tall, compact text, tight packing
- Game cards: ~48-56px tall team logos + abbreviations + scores
- Gap between pills and cards: minimal (4-8px)

**Recommended for Onoo**:
- Overall scorebar height: ~88-96px (two rows with 4px gap)
- Date pills: 32-36px height, `text-xs`/`text-sm`
- Game cards: 44-48px height, min-width 160-200px
- Gap between cards: 8px
- Padding: 8-12px vertical, 16px horizontal

### 4.3 Color & Theming

**NBA.com**: Dark grey/black background for the scorebar, white text, team logos
provide color

**Sofascore**: Dark navy (`#2a3543`) background, white text, team-colored accents

**Recommendation for Onoo**:
- Background: `bg-sidebar text-sidebar-foreground` — the existing dark sidebar
  palette is perfect for a scorebar. Aligns with the existing hero section
  (`player-showcase-hero`) pattern.
- Live indicator: amber/warning (`text-warning`) with CSS pulse animation
- Date pills: Today pill gets `bg-warning/20 text-warning ring-warning/30`
- Game cards: border-only on dark background (`border-sidebar-border`)
- Final games: dimmed text (`text-sidebar-foreground/60`)
- Hover: `hover:bg-sidebar-accent` for interactive cards
- Focus: `focus-visible:ring-sidebar-ring`

### 4.4 Typography

| Element | Size | Weight | Font |
|---------|------|--------|------|
| Date pill weekday | `text-[10px]` | 500 | Geist Sans |
| Date pill number | `text-xs` | 700 | Geist Sans tabular |
| Team name | `text-xs` | 600 | Geist Sans truncate |
| Score | `text-sm` | 800 tabular | Geist Sans |
| Status/label | `text-[10px]` | 500 | Geist Sans |
| Game count on pill | `text-[10px]` | 400 | Geist Sans |

### 4.5 States

**Live game**:
```
[team-logo] [name] [score] [score] [name] [team-logo]
                        ● Шууд
```
- Pulsing red dot via CSS animation (`animate-pulse`)
- Scores rendered in amber (`text-warning`)
- Bold font weight

**Final game**:
```
[team-logo] [name] [89] [72] [name] [team-logo]
                       Дуусгавар
```
- Scores in `text-sidebar-foreground`
- Muted label

**Scheduled game**:
```
[team-logo] [name] [20:00] [name] [team-logo]
```
- Time shown in `text-sidebar-foreground/60`
- No scores
- Dashed separator or muted divider

**Empty state (no games)**:
```
Өнөөдөр тоглолт алга
```
- Centered muted text
- Date pills still visible and interactive

**Responsive (360px)**:
```
[LIONS]
  89-85    ← compact: scores stacked vertically
[EAGLES]
  ● Шууд
```
- Cards narrower (~140px min-width)
- Team names hidden, only short code shown
- Score prominent, status as icon only

### 4.6 Accessibility

- All game cards are `<a>` or `<Link>` elements with semantic text
- Date pills are `<button>` or `<a>` with `aria-label` (e.g., "2026-07-22, мягмар")
- Live indicator uses `aria-live="polite"` if auto-updating (V1: static is fine)
- Focus-visible ring on all interactive elements
- Color not the only differentiator: labels accompany status
- Reduced-motion: respect `prefers-reduced-motion` for pulse animation

### 4.7 Heuristic Evaluation

| Heuristic | Current Onoo | Scorebar will |
|-----------|-------------|---------------|
| Visibility of system status | ⚠️ Partial (homepage only) | ✅ Full (site-wide) |
| Match system & real world | ✅ Mongolian labels | ✅ Same |
| User control & freedom | ❌ No day navigation | ✅ Date pills |
| Consistency & standards | ⚠️ Ticker only homepage | ✅ Site-wide pattern |
| Error prevention | ✅ Server-rendered | ✅ Server-rendered |
| Recognition vs recall | ⚠️ Must visit homepage | ✅ Visible everywhere |
| Aesthetic & minimal | ✅ Current is clean | ✅ Compact cards |

## 5. Recommendations

### Layout (Adopt from NBA.com)
- **Two-row scorebar**: date pills row + game cards row
- **Dark background**: `bg-sidebar text-sidebar-foreground`
- **Sticky**: `sticky top-[var(--nav-height)] z-40`
- **Date range**: Past 2 days + today + next 5 days (8 total)
- **Implementation**: `src/app/components/scorebar.tsx` (Server Component)

### Game Cards (Adopt from NBA.com + Adapt for Onoo)
- **Compact card**: team short code + logo + score/time
- **State**: live (pulsing dot + "Шууд") / final ("Дуусгавар") / scheduled (time)
- **Link**: to `/games/${game.id}`
- **Implementation**: `src/app/components/scorebar-game.tsx` (Client Component
  for pulse animation only)

### Date Navigation (Adapt from NBA.com)
- **Horizontal pill strip**: scrollable with `overflow-x: auto`
- **Today pill**: highlighted with amber accent
- **Past days**: muted
- **Future days**: normal
- **Implementation**: inline in Scorebar component

### Interaction (Adopt from Onoo existing)
- **Click game card** → navigate to game detail
- **Click date pill** → navigate to `/games?date=YYYY-MM-DD`
- **Touch scroll** → native on flex container
- **Keyboard** → arrow keys navigate the scrollable strip

### Responsive (Adapt)
| Breakpoint | Cards | Date pills | Behavior |
|------------|-------|------------|----------|
| 360px | 140px wide, short codes | Compact day-only | Full-width scroll |
| 640px+ | 180px wide, full names | Show weekday + date | Centered within max-w-7xl |
| 1024px+ | 200px wide | Full format | Centered, more visible |

### What to Avoid
- ❌ **Marquee/auto-scroll** — NBA.com doesn't do this; users scrub manually
- ❌ **HIDE SCORES toggle** — defer to Phase 5 when live updates exist
- ❌ **Monthly calendar view** — defer; pills + /games page DateNav covers this
- ❌ **Carousel library** — unnecessary overhead for a continuous scroll strip

## 6. Implementation Mapping

| Component | File | Role | Why |
|-----------|------|------|-----|
| Scorebar | `src/app/components/scorebar.tsx` | Server Component | Fetches games, renders layout |
| ScorebarGame | `src/app/components/scorebar-game.tsx` | Client Component | Pulse animation only |
| — | `src/app/layout.tsx` | Import | Site-wide placement |
| — | `src/app/page.tsx` | Remove old ticker | Replace with site-wide Scorebar |

### Tokens Used

```css
/* Background */
bg-sidebar
text-sidebar-foreground

/* Date pills */
bg-sidebar-accent        /* default */
bg-warning/20            /* today selected */
text-warning              /* today text */

/* Game cards */
border-sidebar-border
hover:bg-sidebar-accent
focus-visible:ring-sidebar-ring

/* Status */
text-warning              /* live indicator */
text-sidebar-foreground/60 /* final games */
text-sidebar-foreground/40 /* empty state */
```

## 7. Evidence Ledger

| ID | Source | Observed | Method | Confidence |
|----|--------|----------|--------|------------|
| E1 | NBA.com games page | Day pills, score toggle, game cards | `read` URL | High |
| E2 | Muffin Group review | "persistent sticky top score ticker" | `web_search` | Medium |
| E3 | Sofascore NBA page | Tab navigation, compact match display | `read` URL | High |
| E4 | NBAScoresWebsite GitHub | Horizontal calendar + game cards in Next.js | `web_search` | High |
| E5 | Sportradar docs | Compact layout, auto-sport, date selectors | `web_search` | Medium |
| E6 | Onoo homepage current | Existing flexbox scroll ticker, no scores | `read` source | High |
| E7 | Onoo GameCard component | Full game display data model | `read` source | High |
| E8 | Onoo data layer | getGamesByDate returns scores | `read` source | High |

## 8. Open Questions

1. **Should the scorebar be present on admin/internal pages too?**
   → No, only on public surfaces. The layout.tsx wraps public pages.

2. **Should we show "old" games from yesterday if today has none?**
   → Yes, if today has 0 games, silently show yesterday's games instead.
   Otherwise the scorebar looks empty. Date pills would still highlight today.

3. **How aggressive with the sticky positioning?**
   → `sticky top-[var(--nav-height)]` (the nav is ~52px). On mobile, the
   scorebar should collapse to a single row if needed.

4. **Should we show live game counts on the date pills?**
   → Yes, small count badge on pills that have games. E.g., "22 ●3" means
   3 live games. This helps users quickly see which days have action.

---

_Last updated: 2026-07-22_
