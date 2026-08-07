# Onoo Design System

> **Shared design system**: [`docs/design.md`](../../docs/design.md) — tokens, rules, anti-patterns, components, accessibility, overlay patterns, and product template. This document covers only product-specific decisions.

## Stack

- Framework: Next.js 16 App Router with React Server Components by default
- Styling: Tailwind CSS v4 and `@zuiio/branding` semantic tokens
- Components: shadcn/ui, new-york style
- Charts: Recharts through the local shadcn chart primitives
- Icons: Lucide React
- Motion: CSS transitions and the local `useCountUp` hook; reduced-motion aware

## Product Character

Onoo is an athlete-first Mongolian basketball statistics product. Public pages should feel editorial and energetic while keeping trusted records easy to scan. The visual language combines warm neutral reading surfaces, ink-dark sports panels, amber competition accents, strong numeric typography, and restrained team-color theming.

## Tokens

- Brand identity: shared zuiio violet tokens from `@zuiio/branding`
- Product accent: `--brand-sports` amber
- Interactive color: semantic `primary`
- Page surfaces: semantic `background`, `card`, `muted`, and `border`
- Player showcase surface: ink-dark neutral with amber and team-color accents; readable text remains neutral
- Typography: Geist Sans for UI and statistics; Instrument Serif only for editorial display moments
- Radius: `rounded-lg` for controls, `rounded-xl` for cards, larger hero compositions may use `rounded-3xl`
- Spacing: 4px base scale; 16–24px component gaps; 32–48px section gaps
- Elevation: layered semantic shadows and subtle borders; no decorative glass blur on content cards

## Decisions

- 2026-07-15 — Initialized from the existing Next.js + Tailwind v4 + shadcn stack. Existing global tokens remain authoritative.
- 2026-07-15 — Player profiles use a responsive showcase hierarchy: athlete identity and season averages, recent form, visual analysis, then complete game records.
- 2026-07-15 — Team colors are accents only. Core text and data surfaces retain predictable contrast.
- 2026-07-15 — No generated athlete imagery or copied brand assets; missing photos use the existing designed identity fallback.
- 2026-07-15 — Reworked the player showcase into an ink-dark identity hero followed by recent form and an asymmetric analysis grid. Uses semantic sidebar, warning, chart, card, and muted tokens; all public records remain below the visual layer.
- 2026-07-15 — Public navigation now collapses into a two-row, horizontally scrollable mobile header so all destinations remain reachable at 360px.

## Component Inventory

- `HeroCard` — `src/app/players/[id]/components/hero-card.tsx`; player identity, team context, season averages, and career snapshot
- `RecentGames` — `src/app/players/[id]/components/recent-games.tsx`; horizontal mobile-first last-five game capsules
- `SeasonArc` — `src/app/players/[id]/components/season-arc.tsx`; PTS/REB/AST trend chart
- `ShootingProfile` — `src/app/players/[id]/components/shooting-profile.tsx`; shooting split gauges and point-mix visualization
- `SkillRadar` — `src/app/players/[id]/components/skill-radar.tsx`; player-versus-league shape comparison
- `Milestones` — `src/app/players/[id]/components/milestones.tsx`; career-high and achievement summaries
- `SeasonSelector` — `src/app/players/[id]/components/season-selector.tsx`; season/career scope control
- `PlayerAvatar` — `src/components/player-avatar.tsx`; resilient player portrait and identity fallback
- `TeamLogo` — `src/components/team-logo.tsx`; resilient team crest and short-code fallback
- `SiteNav` — `src/app/components/site-nav.tsx`; responsive public navigation shell


## Responsive Contract

- **360px** (mobile-first):
  - One-column flow throughout all pages
  - Navigation links horizontally scrollable with shadow hint at edges
  - Standings table → card-based layout (rank, team, W-L, form dots) with expandable detail
  - Player profile action bar stacks vertically (selector + language toggle on one row, compare link below)
  - Leader podium cards stack avatar above text
  - Box score tables hide STL/BLK/TOV columns (8 visible columns fit without scroll)
  - Stat grids adapt: 2-column minimum for data cards
  - Formula headers and badge rows use `flex-wrap` to prevent overflow
  - All content fits without horizontal page scroll
- **`sm`** (640px):
  - Navigation controls align horizontally
  - Leader podium cards switch to side-by-side avatar + text layout
  - Stat values increase to desktop size
- **`md`** (768px):
  - Standings table renders full 11-column layout (scrollable within container)
  - Box score tables show all 11 columns
  - Identity and supporting context separate into clearer columns
  - Analysis cards remain stacked where chart legibility requires it
- **`lg`** (1024px):
  - Asymmetric showcase grid with season story as dominant visualization
  - Two-column editorial layouts engage (homepage leaders + standings)
  - Team pages use 12-column grid

## Accessibility

- Semantic headings and landmarks
- Visible focus states for every interactive element
- Charts include textual summaries or stat labels
- Motion respects `prefers-reduced-motion`
- Team color never carries meaning alone
- Minimum readable contrast is preserved on all themed surfaces

## Non-Goals

- No Figma sync
- No image generation
- No new animation or chart dependency
- No mock public data fallback
