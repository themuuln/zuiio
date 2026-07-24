# Onoo Design System

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

## Component Inventory

- `HeroCard` — player identity, team context, season averages, and career snapshot
- `RecentGames` — horizontal mobile-first last-five game capsules
- `SeasonArc` — PTS/REB/AST trend chart
- `ShootingProfile` — shooting split gauges and point-mix visualization
- `SkillRadar` — player-versus-league shape comparison
- `Milestones` — career-high and achievement summaries
- `SeasonSelector` — season/career scope control
- `PlayerAvatar` — resilient player portrait and identity fallback
- `TeamLogo` — resilient team crest and short-code fallback

## Responsive Contract

- 360px: one-column flow, compact identity treatment, three core averages visible without horizontal page scroll, scrollable recent-game strip
- `md`: identity and supporting context separate into clearer columns; analysis cards remain stacked where chart legibility requires it
- `lg`: asymmetric showcase grid with the season story as the dominant visualization and supporting analysis alongside it
- Full data tables must remain reachable but may scroll within their own container

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
