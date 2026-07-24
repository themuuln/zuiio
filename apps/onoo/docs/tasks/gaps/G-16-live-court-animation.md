---
**ID:** `G-16`
**Name:** Live Court Animation
**Priority:** `P3`
**Status:** `⬜`
**Effort:** `XL` (1-2w)
**Tags:** `frontend`, `animation`, `svg`, `realtime`, `tracker`, `visualization`
**DB Readiness:** `⚠️` Partial — shot coordinates exist in schema, player court positions need new data model

---

## Goal

A visual basketball court overlay on the tracker page and live game center where each scored event places a dot/pulse at the shot location. Players on court are shown as positioned dots that move on substitutions. Events animate in from the edge with scale + fade. The court updates in real-time as the tracker logs events.

## Why

This is the most visually impressive feature in the interactive suite — a live, animated court showing the game as it happens. It transforms the tracker from a data-entry tool into a broadcast-style visualization. The live court is the centerpiece of a "live game center" that fans, coaches, and scouts would watch remotely.

## Technical Approach

### Court Visualization Layer

A full SVG basketball court rendered as the background with animated overlays:

- **Court base:** SVG court outline (half-court or full-court, same design as G-12)
- **Shot markers:** Circles at `(x, y)` coordinates that animate in with a pulse effect
- **Player positions:** Colored dots representing on-court players, positioned by role
- **Event feed:** Scrolling sidebar showing events in real-time alongside the court

### Animation Effects

1. **Shot pulse:** When a shot_made/shot_missed event arrives:
   - Circle appears at the shot location with `scale(0) → scale(1)` over 300ms
   - `opacity: 1 → 0.3` fade after placement (marker persists for the game)
   - Color: green (make) or red (miss), with subtle glow

2. **Event entrance:** New events fly in from the right edge:
   - `transform: translateX(100px)` → `translateX(0)` with ease-out
   - `opacity: 0 → 1`
   - 400ms transition

3. **Player position animation:** On substitution events:
   - Player dot slides from sideline to court position
   - `transform: translateY(Npx)` ease-in-out
   - Subtle bounce via spring easing

### Player Position Model

**Challenge:** The current schema has no player position tracking. Two approaches:

**Approach A: Substitution-based (preferred)**
- Track active players on court by processing `substitution` event types from `stat_events`
- On game start: starting 5 from game roster
- On each substitution event (`player_in`, `player_out`): update active set
- Positions are nominal (PG, SG, SF, PF, C) mapped to approximate court locations
- No coordinate data needed — positions are derived from event sequence

**Approach B: New position model**
- Add `court_positions` table: `game_id, player_id, x, y, timestamp`
- Tracker UI would need to let scorekeepers place players on court
- Higher fidelity but significantly more complex

**Recommendation:** Approach A for v1. Sufficient for the visualization without new data entry burden.

### Real-time Updates

- Supabase Realtime subscription on `stat_events` for the current game
- On new event: animate into court + append to event feed sidebar
- Filter to current game only: `game_id = currentGameId`

### Component Architecture

```
<LiveCourtVisualization>
  ├─ <CourtSVG />                    {/* Static court outline */}
  ├─ <ShotMarkerLayer>               {/* Animated shot dots */}
  │   └─ <AnimatedShotMarker />      {/* Individual shot with pulse */}
  ├─ <PlayerPositionLayer>           {/* Active player dots */}
  │   └─ <PlayerDot />               {/* Positioned player */}
  ├─ <EventFeedSidebar>              {/* Scrolling play-by-play */}
  │   └─ <EventEntry />              {/* Single event line */}
  └─ <GameClockOverlay />            {/* Current period + clock */}
```

### State Management

```ts
interface LiveCourtState {
  gameId: string;
  homeScore: number;
  awayScore: number;
  currentPeriod: number;
  clock: string;
  shots: ShotMarker[];
  playersOnCourt: PlayerPosition[];
  events: GameEvent[];
  eventCount: number; // key for animation triggers
}
```

- State updated by Realtime subscription
- Animation triggered on state change (keyed by event ID)

## Data Dependencies

| Entity | Access | Purpose |
|--------|--------|---------|
| `stat_events` | Realtime subscription | Shot events with x, y coordinates |
| `stat_events` (substitution) | Read | Player in/out events |
| `games` | Realtime subscription | Score, period, clock |
| `game_player_stats` | Read | Starting lineups |

**Database changes needed:**
- Shot location capture in tracker (to populate x, y)
- Substitution events must be captured in tracker (may already exist)
- Player position model: Approach A requires no DB changes; Approach B needs `court_positions` table

## Implementation Steps

1. **Build SVG court component:**
   - Reuse court SVG from G-12 (court heatmap)
   - Full court or half-court layout
   - Responsive sizing

2. **Build shot marker layer:**
   - Subscribe to `stat_events` for shot_made/shot_missed
   - Animate markers with CSS keyframes
   - Persist markers for the game duration

3. **Build player position tracking:**
   - Process substitution events to maintain active player set
   - Map positions to court coordinates
   - Animate position changes

4. **Build event feed sidebar:**
   - Scrollable list of events in chronological order
   - Event type icon + description + timestamp
   - Auto-scroll to latest event

5. **Build game clock overlay:**
   - Display current period and game clock
   - Update via Realtime subscription on `games` table

6. **Integrate into tracker page:**
   - Add court visualization as a side panel or below the scoreboard
   - Toggle between court view and stat entry view

7. **Integrate into live game center:**
   - `/games/[id]/live` route with full-screen court
   - Event feed + court as the main content

8. **Add shot capture to tracker:**
   - After recording a shot made/missed event, prompt for shot location
   - Simple tap on court SVG → stores x, y in payload

## Implementation Complexity & Effort

**Complexity:** High. ~600 lines for court + animation logic + position computation. Requires tracker UX changes for shot capture.

**Effort:** XL (1-2 weeks)
- SVG court component: 4h
- Shot marker animation: 4h
- Player position tracking: 6h
- Event feed sidebar: 3h
- Realtime integration: 4h
- Tracker shot capture: 4h
- Integration + testing: 4h

## Dependencies / Prereqs

**Blocked by:**
- G-12 Court Heatmap (court SVG component reused)
- Tracker shot location capture (for shot data)

**Prereqs:**
- Supabase Realtime subscriptions working (tracker already uses them)
- `stat_events` with substitution event types in the event dictionary

## Design Decisions

- **Approach A (substitution-based player positions) for v1.** Avoids the complexity of a new data model while still showing meaningful player-on-court visualization.
- **SVG over Canvas.** Event handling (clicking on dots) is easier with SVG. Performance is acceptable for a single game's events (hundreds, not thousands).
- **Realtime subscription on `stat_events`** — already proven in the tracker. No new Realtime channels needed.
- **Court view is a side panel, not full page** on the tracker. The tracker's primary function is data entry. The court is an "ambient visualization" that enhances the experience.
- **Persistent shot markers** for the game duration. Fading them would look cinematic but lose information. Users want to see shot distribution over the game.
- **Shot capture is a simple tap** on the court after logging a shot event. Not a required field — scorekeepers can skip it and continue.

## Risks & Gotchas

- **Tracker UX complexity.** The tracker already has a complex UI. Adding a court visualization and shot capture increases cognitive load. Consider making the court collapsible or a separate tab.
- **Performance with many events.** A 40-minute game with 80+ shot attempts, 20+ substitutions, and 20+ fouls = ~120 events. SVG handles this fine, but test on low-end mobile.
- **Player position tracking from substitutions** requires accurate substitution event logging. In practice, scorekeepers may miss substitutions. Show "Unknown" dots for unassigned players.
- **Realtime subscription on `stat_events` for a specific game** needs a filter. Ensure the subscription uses `game_id = eq.{gameId}` for channel filtering.
- **Time-syncing events with game clock.** Events arrive in real-time but may need to be ordered by `period` + `clock_seconds` rather than `created_at` (if events are logged slightly out of order).
- **This is the most complex feature.** Build it last, after all other interactions are proven.

## Verification

```bash
# Type check
pnpm exec tsc --noEmit

# Build
pnpm build
```

### Done When

- [ ] SVG court renders on tracker page as a visualization panel
- [ ] Shot events animate in as colored dots at correct coordinates
- [ ] Shot dots persist for the game (green = made, red = missed)
- [ ] Player dots update on substitution events
- [ ] Event feed sidebar scrolls with latest events
- [ ] Game clock displays current period + time
- [ ] Updates in real-time via Supabase Realtime
- [ ] Tracker shot capture prompts for location after shot event
- [ ] Works on live game center page (`/games/[id]/live`)
- [ ] TypeScript compilation passes

---

_Last updated: 2026-07-21 | Status: ⬜_
