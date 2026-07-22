# Scorebar Implementation Plan

## Context

NBA.com has a persistent horizontally scrollable game scores ticker at the top of
the page. Onoo currently has a "tonight's games" ticker only on the homepage
(lines 203-265 of `src/app/page.tsx`). The user wants this elevated to a site-wide,
NBA.com-style scorebar showing scores, teams, live indicators, and date navigation.

Feature research: `docs/features/games-scorebar.md`

## Files to Change

### New Files
| File | Action | What changes |
|------|--------|--------------|
| `src/app/components/scorebar.tsx` | Create | Server Component: fetches today's games, renders scorebar strip + date pills |
| `src/app/components/scorebar-game.tsx` | Create | Client Component: single compact game card with live indicator animation |

### Modified Files
| File | What changes |
|------|--------------|
| `src/app/layout.tsx` | Import `Scorebar`, render below `SiteNav`, above `<main>{children}</main>` |
| `src/app/page.tsx` | Remove the "tonight's games ticker" section (lines 203-265) — now handled site-wide |
| `src/app/lib/data.ts` | Add `getGamesForDateBar()` — fetches games for today + neighbor days for date pill counts |

## Component Architecture

```
Layout
 └─ Scorebar (Server, fetches data)
     ├─ DatePills (inline, links to /games?date=)
     └─ ScorebarStrip (flex overflow-x:auto)
         └─ ScorebarGame[] (Client, one per game)
```

### Scorebar (Server Component)

```tsx
// src/app/components/scorebar.tsx
async function Scorebar() {
  const today = getUlaanbaatarDate();
  const games = await getGamesByDate(today);
  // Group by status: live first, then scheduled, then recent finals
  return (
    <div className="border-b bg-[var(--surface-1)]">
      <div className="mx-auto max-w-7xl px-4 py-2 sm:px-6 lg:px-8">
        <DatePills currentDate={today} />
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {games.map(game => <ScorebarGame key={game.id} game={game} />)}
        </div>
      </div>
    </div>
  );
}
```

### ScorebarGame (Client Component)

- Compact card: team logos + abbreviated names + score or time
- Live: pulsing red dot via CSS animation, scores shown
- Final: scores shown, muted treatment
- Scheduled: time shown, no scores
- Links to `/games/${game.id}`
- Client component only because of the CSS animation for the live indicator

### DatePills (inline in Scorebar)

A row of ~8 day buttons (past 2 + today + next 5). Each pill shows:
- Day of week (short) + date number
- Today highlighted with amber/accent color
- Clicking navigates to `/games?date=YYYY-MM-DD`

## Implementation Order

1. **Add `getGamesForDateBar()` to data.ts** — a function that fetches games for
   today and returns them + counts for adjacent days. (Or just reuse `getGamesByDate`
   for the main data and add `getGameCountsForDateRange` for pill counts.)
2. **Create `src/app/components/scorebar-game.tsx`** — compact game card component.
3. **Create `src/app/components/scorebar.tsx`** — the Server Component that composes
   everything.
4. **Modify `src/app/layout.tsx`** — add Scorebar below SiteNav.
5. **Modify `src/app/page.tsx`** — remove the duplicate ticker section.
6. **Verify** — `pnpm check`, `pnpm dev`, manual checks.

## Edge Cases

- **No games today**: Date pills still show. Scorebar strip shows a subtle
  "Өнөөдөр тоглолт алга" message.
- **All games final**: All scores shown, no live indicator.
- **Single game**: Cards are compact enough; single card centered or left-aligned.
- **Mobile 360px**: Cards are compact (shorter team names, smaller logos). Strip
  scrolls naturally.
- **Admin/layout page**: Scorebar renders but an admin route might suppress it
  (not yet — simple site-wide for now).

## Verification

1. `pnpm check` — typecheck + lint pass, zero errors
2. `pnpm dev` — scorebar visible on homepage, players, standings, teams pages
3. Mobile viewport — scrollable, compact, readable
4. Click game card → navigates to game page
5. Live game shows pulsing indicator
6. Scheduled game shows time
7. No console errors
