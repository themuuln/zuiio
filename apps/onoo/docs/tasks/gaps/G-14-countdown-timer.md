---
**ID:** `G-14`
**Name:** Countdown Timer for Next Game
**Priority:** `P2`
**Status:** `⬜`
**Effort:** `S` (2-4h)
**Tags:** `frontend`, `animation`, `landing-page`, `engagement`
**DB Readiness:** `✅` Fully supported by current schema

---

## Goal

Show a live countdown below the landing page hero showing days/hours/minutes/seconds until the next scheduled game. Creates urgency and return visits. Removes when game starts, replaced with live score.

## Why

A countdown timer is the simplest engagement hook — it answers "when's the next game?" without the user having to scroll or tap. FIBA uses this prominently on their competition pages. It creates a psychological pull: "the game starts in 3 hours — I'll come back for it." For leagues with irregular schedules, it also confirms the next date without digging into the schedule page.

## Technical Approach

### Component: `<NextGameCountdown>`

```
┌─────────────────────────────────────────────┐
│  Next: MAG vs TIT                           │
│  ⏱ 02d 14h 32m 18s                         │
│  Ulaanbaatar Sports Palace • Jan 28, 7:00PM │
└─────────────────────────────────────────────┘
```

- Props: `game: { homeTeam, awayTeam, scheduledAt, venue }` or null
- If next game is null: render nothing
- Uses `Intl.DateTimeFormat` with Ulaanbaatar timezone (`Asia/Ulaanbaatar`)
- Updates every second via `useEffect` + `setInterval(1000)`

### Timer Logic

```ts
function useCountdown(targetDate: Date): { days, hours, minutes, seconds } | null {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const diff = targetDate.getTime() - now.getTime();
  if (diff <= 0) return null; // game started

  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}
```

### Lifecycle States

1. **No upcoming game:** Hidden (null data from fetcher)
2. **Game scheduled (> 24 hours away):** Show days + hours only (no seconds)
3. **Game in 24 hours:** Show full countdown (days, hours, minutes, seconds)
4. **Game started (countdown reaches 0):** Remove countdown, trigger parent to show live score instead

### Data Source

- `getGamesByDate` / `getLiveGames` — already fetches games with `scheduled_at`
- Fetch the *next* game: query `games` with `scheduled_at > now()`, `status = 'scheduled'`, limit 1, ordered by `scheduled_at ASC`
- New fetcher: `getNextGame() → Game | null`

### Styling

- Countdown digit groups with bold large font
- Labels below each group: "days", "hrs", "min", "sec" (subtle, smaller)
- Colon separators between groups
- Pulse animation on the seconds group (opacity blink at each second change)
- Background: subtle dark overlay on the hero section, or inline below the hero text

## Data Dependencies

| Entity | Access | Purpose |
|--------|--------|---------|
| `games` | Read | `scheduled_at` from next game |

No database changes needed.

## Implementation Steps

1. **Create `getNextGame` fetcher:**
   - SQL: select * from games where status = 'scheduled' and scheduled_at > now() order by scheduled_at asc limit 1
   - Return null if no upcoming game

2. **Create `useCountdown` hook:**
   - Accepts target date
   - Returns remaining time units
   - Returns null when expired

3. **Create `<NextGameCountdown>` component:**
   - Displays next game info + countdown
   - Responsive: compact on mobile (row layout), expanded on desktop
   - Pulse animation on seconds

4. **Integrate into landing page hero:**
   - Below the hero tagline or as part of the hero section
   - If countdown reaches 0, fade out and show "LIVE" badge

5. **Test:**
   - Countdown shows correct remaining time
   - Updates every second
   - Disappears when game starts
   - Shows nothing if no upcoming game

## Implementation Complexity & Effort

**Complexity:** Low. ~60 lines for countdown component.

**Effort:** S (2-4 hours)
- Hook + component: 1h
- Styling + responsive: 1h
- Integration: 30min
- Edge cases (timezone, DST): 30min

## Dependencies / Prereqs

**Blocked by:** None
**Prereqs:** Landing page hero section exists. `games` table has `scheduled_at` data.

## Design Decisions

- **Ulaanbaatar timezone (`Asia/Ulaanbaatar`)** — all game times are in local time. No UTC conversion needed for display, but the fetcher must handle UTC storage vs local display.
- **Defer loading:** The countdown is not critical content. It uses `@defer` or a client-side fetch after initial page load.
- **Hidden when no upcoming game** — common case in off-season. The hero section looks normal, just without the countdown.
- **Pulse on seconds** adds life to the component — it visually confirms the countdown is ticking.

## Risks & Gotchas

- **Timezones and DST:** `scheduled_at` is in UTC in the database. `Intl.DateTimeFormat` with `Asia/Ulaanbaatar` zone handles conversion. Mongolia doesn't observe DST, but server timezone handling must be verified.
- **1-second interval drift:** `setInterval(1000)` drifts slightly. Use `setTimeout` with delta to `nextSecondBoundary` for precise updates, or accept 1s granularity (good enough for a countdown).
- **SSR:** The countdown should not render on the server (hydration mismatch inevitable). Use `useEffect` to render the timer on client only, with a static placeholder on server.
- **Performance:** One interval per page isn't a concern. Ensure cleanup on unmount.

## Verification

```bash
# Type check
pnpm exec tsc --noEmit

# Build
pnpm build
```

### Done When

- [ ] Countdown timer renders on landing page hero below tagline
- [ ] Shows days, hours, minutes, seconds ticking in real-time
- [ ] Game info (teams, venue, time) shown above countdown
- [ ] Countdown disappears when game starts (reaches 0)
- [ ] Hidden entirely when no upcoming game
- [ ] Seconds flash/pulse on change
- [ ] SSR-safe (client-only render)
- [ ] TypeScript compilation passes

---

_Last updated: 2026-07-21 | Status: ⬜_
