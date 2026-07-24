# Responsive Design Pass — Onoo Public Pages

## Context

The Onoo sports stats website has a solid responsive foundation (nav, footer, hero, game cards already adapt) but several data-heavy components break or become unusable at 360px mobile width. The biggest offender is the standings table (11 columns), followed by leader podium cards, shooting gauges, and various stat grids that don't adapt for narrow viewports.

## Files to Change

| File | Action | What changes |
|------|--------|--------------|
| `src/app/standings/components/standings-table.tsx` | Modify | Add mobile card view for `< md` breakpoints; hide non-essential columns (GB, Streak, Last 10, Diff) on mobile |
| `src/app/standings/page.tsx` | Modify | Wrap `StandingsTable` in a scroll hint on mobile |
| `src/app/leaders/components/leader-tabs.tsx` | Modify | Podium cards: stack avatar above text on `< sm`; reduce remaining-player grid density on mobile |
| `src/app/players/[id]/components/shooting-profile.tsx` | Modify | Reduce gauge ring size on mobile; tighten `grid-cols-3` gap |
| `src/app/players/[id]/page.tsx` | Modify | Action bar (SeasonSelector, LanguageToggle, Compare): stack vertically on mobile |
| `src/app/players/[id]/components/hero-card.tsx` | Modify | Season averages bar: reduce stat count on mobile (hide STL/BLK below sm) |
| `src/app/players/[id]/components/clutch-stats.tsx` | Modify | `grid-cols-3 gap-6` → responsive `gap-4 sm:gap-6` with smaller text on mobile |
| `src/app/players/[id]/components/advanced-stats-table.tsx` | Modify | `grid-cols-3 gap-6` → `grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6` |
| `src/app/players/compare/compare-players-client.tsx` | Modify | ComparisonPlayerCard: center avatar on mobile instead of flex-end row |
| `src/app/page.tsx` | Modify | Homepage hero: tighter gaps at 360px; featured player card stats row tighter |
| `src/app/components/site-nav.tsx` | Modify | Add subtle scroll shadow on mobile nav to hint at overflow |
| `src/app/globals.css` | Modify | Add `scrollbar-none` utility and mobile-specific spacing tokens |

## Implementation Order

### Phase 1: CSS & Nav polish
1. Add `scrollbar-none` and nav scroll shadow utilities to `globals.css`
2. Update `site-nav.tsx` with scroll shadow

### Phase 2: Standings table (highest impact)
3. Add mobile card view to `standings-table.tsx`
4. Update `standings/page.tsx` with mobile scroll hint

### Phase 3: Leader & player pages
5. Fix leader-tabs podium layout for mobile
6. Fix player hero-card stat bar for mobile
7. Fix shooting-profile gauge sizing
8. Fix player profile action bar stacking
9. Fix clutch-stats and advanced-stats-table grid responsiveness

### Phase 4: Compare & homepage
10. Fix comparison player card layout
11. Tighten homepage hero spacing

## Key Design Decisions

### Standings table mobile strategy
Use a **dual-render** approach:
- `< md` (768px): Render rows as stacked cards showing rank, team name/logo, W-L record, win%, and form dots. Hide GB, Streak, Last 10, Diff columns.
- `≥ md`: Keep existing table with all 11 columns (already has `overflow-x-auto`).

The card view is implemented as a parallel render path inside the same component, toggled by CSS `hidden md:hidden` / `md:block` classes. No client-side JS toggle needed — pure CSS responsive switching.

### Leader podium mobile strategy
On `< sm`: Stack the avatar above the player name/text. Avatar size stays `xl` but the card layout changes from `flex items-end gap-4` to `flex flex-col items-center gap-3 text-center`. The stat number moves below the name.

### Shooting profile mobile strategy
Reduce `GAUGE_SIZE` from 96 to 72 on mobile via a responsive wrapper class. The SVG viewBox stays the same; the container width adapts naturally in `grid-cols-3`.

### Player action bar mobile strategy
On `< sm`: Stack the SeasonSelector (full width) above a row containing LanguageToggle + Compare button side by side.

## Edge Cases

- Empty standings → `PublicEmptyState` already handles this, unaffected
- No qualified leaders → `PublicEmptyState` already handles this, unaffected
- Very long team names → `truncate` already applied on team name cells
- Zero games played → stats show "—" which is already handled

## Verification

1. `pnpm dev` — start dev server
2. Use browser DevTools at 360px, 768px, 1024px, 1440px widths
3. Check each page:
   - `/` — hero, tonight games, leaders, standings all readable at 360px
   - `/standings` — card view at 360px, full table at 768px+
   - `/players` — featured strip, filter bar, player grid all fit
   - `/players/[id]` — hero card, tabs, shooting profile, stats all fit
   - `/leaders` — podium cards stack on mobile
   - `/games` — game cards already responsive, verify date nav
   - `/players/compare` — player selection and comparison cards fit
4. No horizontal page scroll on any page at 360px (table scroll within container is acceptable)
5. `pnpm validate:types` — zero new TypeScript errors
