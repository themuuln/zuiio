---
**ID:** `G-09`
**Name:** Tournament Bracket Visualization
**Priority:** `P1`
**Status:** `⬜`
**Effort:** `M` (1-2d)
**Tags:** `frontend`, `svg`, `tournament`, `visualization`
**DB Readiness:** `⚠️` Partial — needs bracket positioning data or computed from game ordering

---

## Goal

SVG-based bracket showing knockout round matchups with scores, team logos, and advancement lines. Include classification rounds (9-12, 13-16) following FIBA's model. The bracket visualizes the tournament knockout stage in an immediately recognizable format.

## Why

The bracket is the universal language of tournament progression. Every basketball fan immediately understands a bracket — it tells the story of how teams advanced, which games were close, and where upsets happened. A text-based round list doesn't communicate this. FIBA and every major competition use visual brackets for their knockout stages.

## Technical Approach

### SVG Bracket Architecture

The bracket is a pure SVG component — no canvas, no third-party library. SVG handles text, lines, responsive scaling, and hover states natively.

```
Round of 8       Quarterfinals      Semifinals       Final
┌─────────────┐
│ Team A 78   │
│ Team H 65   │──┐
└─────────────┘  │  ┌─────────────┐
                 ├──│ Team A 72   │
┌─────────────┐  │  │ Team C 68   │──┐
│ Team C 70   │──┘  └─────────────┘  │  ┌─────────────┐
│ Team F 55   │                      ├──│ Team A 80   │──┐
└─────────────┘                      │  │ Team D 65   │  │  ┌─────────────┐
                                     │  └─────────────┘  ├──│ Team A 85   │
┌─────────────┐                      │                  │  │ Team B 79   │
│ Team B 82   │──┐                   │                  │  └─────────────┘
│ Team G 60   │  │  ┌─────────────┐  │                  │
└─────────────┘  ├──│ Team B 68   │──┘                  │
                 │  │ Team D 71   │                     │
┌─────────────┐  │  └─────────────┘                     │
│ Team D 74   │──┘                                      │
│ Team E 66   │                                         │
└─────────────┘                                         │
                                                        │
                              ┌─────────────┐           │
                              │ Team A E   ──┘
                              │ Team B     │
                              └─────────────┘
```

### Component Structure

```
<TournamentBracket>
  └─ <svg viewBox="0 0 1200 600">
      ├─ <BracketRound round={1} title="Quarterfinals" games={...}>
      │   ├─ <BracketMatchup game={...} side="top" />
      │   ├─ <BracketConnector from={...} to={...} />
      │   └─ <BracketMatchup game={...} side="bottom" />
      ├─ <BracketRound round={2} title="Semifinals" ...>
      └─ <BracketRound round={3} title="Final" ...>
```

### Key SVG Elements

1. **Matchup cards:**
   - `<rect>` with `rx=4` for team card background
   - `<text>` for team name, score (winner bold)
   - Winner highlighted (green left border or bold)
   - Hover: scale(1.02) with shadow

2. **Connecting lines:**
   - `<path>` with `d="M x1 y1 L x2 y2 L x3 y3"` for bracket arms
   - `stroke="var(--muted-foreground)"`, `stroke-width=2`, `fill=none`

3. **Round labels:**
   - `<text>` above each round column
   - `text-anchor="middle"`, `font-weight="bold"`

### Classification Rounds

- Following FIBA: 9-12 place classification and 13-16 place classification
- Rendered below the main bracket with the same SVG pattern but smaller scale
- Connected by dotted lines to indicate consolation bracket

### Data Shape

```ts
interface BracketGame {
  id: string;
  round: number;        // 1 = first round, 2 = quarterfinals, etc.
  position: number;     // position within round (0-indexed, top to bottom)
  teamA: { id: string; name: string; score?: number; logo?: string; isWinner?: boolean };
  teamB: { id: string; name: string; score?: number; logo?: string; isWinner?: boolean };
  scheduledAt?: string;
  status: 'scheduled' | 'live' | 'final';
}
```

### Data Source

- Games with round/bracket metadata from `games` table
- If no explicit bracket position, compute from game ordering and round labels
- First implementation: positional assignment via `round` and `position` integers

## Data Dependencies

| Entity | Access | Purpose |
|--------|--------|---------|
| `games` | Read | Filtered by round/bracket phase, team info |

## Implementation Steps

1. **Define bracket data model:**
   - Add `round` and `position` columns to the games query (or compute from ordering)
   - Create `BracketGame` TypeScript type
   - Data fetcher: `getCompetitionBracket(competitionId) → BracketGame[]`

2. **Create `BracketMatchup` component:**
   - SVG group (`<g>`) for a single game matchup
   - Two team cards with scores, winner highlight
   - Hover state with scale animation

3. **Create `BracketConnector` component:**
   - SVG `<path>` for the bracket arm lines
   - Computed from matchup positions

4. **Create `BracketRound` component:**
   - Renders all matchups for a round with connectors
   - Round title label

5. **Create `TournamentBracket` main component:**
   - Lays out rounds left-to-right
   - Responsive: horizontal scroll on mobile, centered on desktop
   - Classification bracket section

6. **Integrate into tournament hub:**
   - Add to `/tournaments/[id]/bracket`
   - Link from hub overview
   - Add as a tab on the hub page

## Implementation Complexity & Effort

**Complexity:** Medium. ~300 lines for bracket component. The SVG layout math (positioning matchups and connectors) is the hardest part.

**Effort:** M (1-2 days)
- Data model + fetcher: 1h
- Bracket SVG layout math: 2-3h
- Connector paths: 1-2h
- Responsive + hover states: 1h
- Integration + testing: 1h

## Dependencies / Prereqs

**Blocked by:** G-08 Tournament Hub Pages (bracket is a sub-page of the hub)
**Prereqs:** Games linked to competitions with round/position data.

## Design Decisions

- **Pure SVG, not a chart library.** SVG gives full control over layout, animation, and responsive behavior without adding a dependency.
- **Winner highlighted with green left border** — immediate visual scan of who advanced.
- **Left-to-right layout** (western reading direction). Traditional bracket layout.
- **Classification bracket below main bracket** with scaled-down matchups and dotted connectors.
- **Horizontal scroll on mobile** — the bracket is naturally wide. Full responsive layout would be too cramped.

## Risks & Gotchas

- **Bracket position computation** is the hardest part. If `round` and `position` aren't in the data, compute from: (1) all games with `type='knockout'` grouped by round, (2) sorted by game order, (3) alternating top/bottom seeding. Fall back to "unseeded" layout (just list matchups by round).
- **SVG text rendering:** Team name lengths vary. Truncate long names with `...` for names exceeding 12 characters.
- **Many empty future matchups** (tournament not yet played). Show "TBD" cards with dashed borders.
- **Responsive: SVG scales down** but text becomes illegible below ~400px. Use `min-width` on the bracket container with horizontal scroll.

## Verification

```bash
# Type check
pnpm exec tsc --noEmit

# Build
pnpm build
```

### Done When

- [ ] SVG bracket renders with matchups and connecting lines
- [ ] Each matchup shows team names and scores (winner highlighted)
- [ ] Classification bracket (9-12, 13-16) rendered below main bracket
- [ ] Future matchups show "TBD" with dashed border
- [ ] Hover state on matchups shows scale effect
- [ ] Horizontal scroll on mobile
- [ ] Integrated into tournament hub at `/tournaments/[id]/bracket`
- [ ] TypeScript compilation passes

---

_Last updated: 2026-07-21 | Status: ⬜_
