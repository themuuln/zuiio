# Onoo Full UI Rewrite — Plan

## Context

Onoo is a Mongolian basketball stats platform (Next.js 16, shadcn/ui, Tailwind v4). The current UI is functional and well-architected but visually conventional — it reads as "good shadcn defaults" rather than a sports platform. The rewrite brings a distinctive sports identity to every page while preserving the solid data architecture underneath.

**Scope**: Public pages only (`/`, `/games`, `/games/[id]`, `/standings`, `/players`, `/players/[id]`, `/leaders`, `/teams/[slug]`). Admin panel is out of scope — it's a separate internal tool with its own design needs.

**Base commit**: `d3b1a3e9`

---

## 1. What Changes

### Files to Modify (shared — orchestrator only)
| File | Action | What changes |
|------|--------|-------------|
| `src/app/globals.css` | Modify | New tokens: surface hierarchy, court motif accent, refined chart palette |
| `src/app/layout.tsx` | Modify | Tighten shell, improve nav bar design, better spacing |
| `src/app/components/site-nav.tsx` | Modify | Redesigned nav — sports personality, compact, better mobile |
| `src/app/components/site-footer.tsx` | Modify | More presence, team/league info |
| `src/components/ui/card.tsx` | Modify | Subtle variants: `featured`, `stat`, `hero` for different contexts |
| `src/components/ui/badge.tsx` | Modify | Sports-ready variants with better contrast |
| `src/components/ui/table.tsx` | Modify | Denser, better-aligned for sports stats |
| `src/components/ui/button.tsx` | Verify | Check sport-ready variants exist |
| `src/components/player-avatar.tsx` | Verify | Already good — check sizes |
| `src/components/team-logo.tsx` | Verify | Already good — check sizes |

### Files to Modify (routes — per-route agents)
| Route | Files | Change summary |
|-------|-------|----------------|
| `/` homepage | `src/app/page.tsx` | Stronger editorial hierarchy, better hero game treatment, courtside gradient on featured player |
| `/games` | `src/app/games/page.tsx`, `src/app/components/game-card.tsx`, `src/app/games/components/date-nav.tsx` | Game cards with more visual weight, better live indicator, date nav polish |
| `/games/[id]` | `src/app/games/[id]/page.tsx`, `src/app/components/game-status-badge.tsx` | Box score density, team comparison visualization, score header redesign |
| `/standings` | `src/app/standings/page.tsx` | Table density, race stat visualization, playoff positioning |
| `/players` | `src/app/players/page.tsx`, `src/app/players/components/player-grid.tsx` | Grid/table toggle refinement, better search, stat callouts |
| `/players/[id]` | `src/app/players/[id]/page.tsx` + 8 component files | Hero card polish, chart theming, season arc refinements |
| `/leaders` | `src/app/leaders/page.tsx`, `src/app/leaders/components/leader-tabs.tsx` | Category tabs refinement, leaderboard visual weight |
| `/teams/[slug]` | `src/app/teams/[slug]/page.tsx` | Team page redesign, roster presentation |

### Files NOT touched
- All `src/app/admin/**` — separate concern
- All `src/app/api/**` — API routes, no UI
- All `src/app/(auth)/**` — auth pages, no UI
- All `src/app/tracker/**` — live tracker, separate redesign
- All `src/app/lib/data.ts` — data layer unchanged
- All `src/lib/**` — providers, utils, hooks unchanged
- `src/app/players/compare/**` — comparison page, lower priority

---

## 2. Design Decisions

### Distinctive Element
**Basketball court baseline motif** — a subtle, repeating court-line pattern used as a section divider or background texture. Appears in hero sections and stat cards, never overwhelming. Combined with the existing amber accent (`--brand-sports`) and a richer dark sidebar treatment.

### Color Strategy (OKLCH)
Refine the existing palette, don't replace it:
- Keep `--brand-sports` amber as the energetic accent
- Introduce `--surface-1` through `--surface-3` for card hierarchy (not just flat bg/surface)
- Richer `--ink` token for headings (darker than default foreground)
- Better contrast on stat numbers (currently too similar to labels)
- Chart palette stays but with refined saturation

### Typography
- **Display**: Instrument Serif (already loaded) — for player names, hero headlines
- **Body**: Geist Sans (already loaded) — clean, readable
- **Mono**: Geist Mono (already loaded) — for tabular numbers, stats
- **Stat numbers**: Large, black-weight, tabular-nums — make stats POP

### Motion
- Keep `prefers-reduced-motion` on all transitions
- Hover → subtle scale (already `active:scale-95`)
- Focus → visible ring (already present)
- Live game pulse animation on status badge
- Chart entrance animation (already via Recharts)

### Accessibility (WCAG AA minimum)
- All existing ARIA labels preserved
- Heading hierarchy maintained (h1 → h2 → h3)
- Focus-visible on all interactive elements (already present)
- Color contrast ≥ 4.5:1 body, ≥ 3:1 large text
- Screen reader: "Монголын сагсан бөмбөг" badge is informational

---

## 3. Wave Plan

### Wave 1: Foundation (sequential, orchestrator)
**Token and shell changes — must complete before any routes.**

Files:
- `src/app/globals.css` — refined tokens
- `src/app/layout.tsx` — shell adjustments
- `src/app/components/site-nav.tsx` — redesigned nav
- `src/app/components/site-footer.tsx` — enhanced footer
- `src/components/ui/card.tsx` — variants
- `src/components/ui/badge.tsx` — sport variants
- `src/components/ui/table.tsx` — density improvements

Gate: typecheck passes, nav/footer render correctly.

### Wave 2: Pilot — `/players` directory page
**Most representative of design system: cards, tables, search, filtering.**

Files:
- `src/app/players/page.tsx`
- `src/app/players/components/player-grid.tsx`

Gate: typecheck passes, search/filter/sort work, both grid and table views render.

### Wave 3: Homepage + Game Cards (parallel)
**Homepage is the highest-traffic page; game cards are shared.**

Files:
- `src/app/page.tsx`
- `src/app/components/game-card.tsx`
- `src/app/components/game-status-badge.tsx`

Gate: typecheck passes, hero game renders, latest story shows, leaders and standings sections work.

### Wave 4: Games List + Game Detail (parallel)
**Depends on game cards from Wave 3.**

Files:
- `src/app/games/page.tsx`
- `src/app/games/components/date-nav.tsx`
- `src/app/games/[id]/page.tsx`

Gate: typecheck passes, date navigation works, box scores render, team comparison displays.

### Wave 5: Leaders + Standings + Teams (parallel)
**Independent content pages.**

Files:
- `src/app/leaders/page.tsx`
- `src/app/leaders/components/leader-tabs.tsx`
- `src/app/standings/page.tsx`
- `src/app/teams/[slug]/page.tsx`

Gate: typecheck passes, tab switching works, standings table renders, team page shows.

### Wave 6: Player Detail (sequential — highest complexity)
**8 custom components, charts, radar, shooting profile.**

Files:
- `src/app/players/[id]/page.tsx`
- `src/app/players/[id]/components/hero-card.tsx`
- `src/app/players/[id]/components/stat-number.tsx`
- `src/app/players/[id]/components/skill-radar.tsx`
- `src/app/players/[id]/components/shooting-profile.tsx`
- `src/app/players/[id]/components/season-arc.tsx`
- `src/app/players/[id]/components/season-selector.tsx`
- `src/app/players/[id]/components/milestones.tsx`
- `src/app/players/[id]/components/recent-games.tsx`

Gate: typecheck passes, all charts render with correct data, season switching works.

### Final: Integration
- Full typecheck: `pnpm validate:types`
- Full lint: `pnpm lint`
- Verify all routes compile and render

---

## 4. Edge Cases

- **Empty states**: Every page already has `PublicEmptyState` — preserve all, ensure they render with new design tokens
- **Loading states**: Skeletons exist for games, leaders, players — ensure they match new card density
- **Error states**: `error.tsx` files exist for games, leaders, players, standings — don't touch (they use error boundaries)
- **No data**: Pages handle null/empty gracefully — preserve
- **Mobile**: Nav already scrolls horizontally on small screens — improve with better touch targets
- **Dark mode**: `.dark` token overrides exist — preserve and extend to new tokens
- **Mongolian text**: All labels in Mongolian — never change, never add English

---

## 5. Verification

After each wave:
1. `pnpm validate:types` — zero errors
2. `pnpm lint` — zero new errors
3. Dev server renders each changed route without console errors

After all waves:
1. Full typecheck
2. Full lint
3. Manual walkthrough: navigate every route, click every link, verify no regressions

---

## 6. Risk Assessment

| Risk | Mitigation |
|------|-----------|
| Token changes break admin panel | Admin uses its own sidebar tokens, public tokens are separate |
| Chart components break | Charts use `recharts` with `ChartConfig` — only change colors, not data |
| shadcn upgrades needed | Check current shadcn version; only modify if component API changed |
| Homepage fetches 6 queries in parallel | Data layer unchanged — no risk |
| Mongolian text accidentally changed | Search for all Cyrillic strings before/after — only add, never remove |
