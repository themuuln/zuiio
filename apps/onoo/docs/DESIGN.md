# Onoo Design System

> **Dark canvas. Broadcast energy. Stats as story.**

Onoo is a sports statistics platform for Mongolian basketball. The design language is **powerful, immersive, and honest** — a near-black canvas that makes every stat feel like a highlight-reel moment.

---

## Design Principles

1. **Stats as story, not spreadsheet.** Numbers should feel like a highlight reel — visual, animated, shareable. Charts over tables. Badges over footnotes.

2. **Broadcast energy.** The visual language draws from sports broadcasts, not enterprise dashboards. Dark backgrounds, high-contrast stat displays, punchy accent colors.

3. **Athlete-first.** Every visual decision serves the athlete profile. The page should feel like a portrait, not a database query.

4. **Mobile-first, Mongolia-ready.** Every surface works at 360px width, loads fast on mid-range Android, and looks intentional at every size.

5. **Cold-start friendly.** Zero games or few games should still look intentional. Every surface has a designed empty state.

6. **Never gate viewing.** No signup, no login, no app-install prompt on any public surface.

---

## Color System

Onoo uses **OKLch** for all colors — perceptual uniformity, predictable light/dark behavior, and accurate interpolation.

### Brand Palette

| Token | Value | Usage |
|-------|-------|-------|
| `--brand-sports` | `oklch(0.72 0.22 40)` | Primary brand accent — vibrant orange for CTAs, emphasis, highlights |
| `--brand-sports-light` | `oklch(0.82 0.18 40)` | Hover states, lighter accent fills |
| `--brand-sports-dim` | `oklch(0.55 0.18 40)` | Muted orange, secondary accent |
| `--brand-purple` | `oklch(0.55 0.24 285)` | Secondary brand accent — depth, premium feel |
| `--brand-purple-light` | `oklch(0.65 0.20 285)` | Purple highlights, lighter fills |

### Surface Hierarchy

A stepped dark surface system. Each level gets progressively lighter to convey depth without shadows:

| Level | Value | Used for |
|-------|-------|----------|
| `--surface-1` | `oklch(0.07 0.003 60)` | Cards, popovers — subtle lift from the canvas |
| `--surface-2` | `oklch(0.10 0.004 60)` | Elevated surfaces — navigation, sidebars |
| `--surface-3` | `oklch(0.14 0.005 60)` | Hovered states, active surfaces |
| `--ink` | `oklch(0.98 0.005 60)` | Primary text — bright white on dark canvas |

### Semantic Tokens (Dark Mode — Default)

Onoo is **dark-first**. The dark palette is the default experience.

| Token | Value | Used for |
|-------|-------|----------|
| `--background` | `oklch(0.02 0.002 60)` | Page canvas — near-black, powerful |
| `--foreground` | `oklch(0.98 0.005 60)` | Primary text |
| `--card` | `oklch(0.07 0.003 60)` | Card surfaces |
| `--primary` | `oklch(0.72 0.22 40)` | **Vibrant orange** — CTAs, links, active states |
| `--secondary` | `oklch(0.50 0.24 285)` | **Purple** — secondary actions, premium accents |
| `--muted` | `oklch(0.12 0.005 60)` | Muted surfaces |
| `--muted-foreground` | `oklch(0.55 0.01 60)` | Secondary text, placeholders |
| `--accent` | `oklch(0.72 0.22 40 / 15%)` | Orange-tinted hover/tint surfaces |
| `--accent-foreground` | `oklch(0.88 0.14 40)` | Text on accent surfaces |
| `--destructive` | `oklch(0.50 0.22 25)` | Destructive actions |
| `--success` | `oklch(0.65 0.18 145)` | Positive outcomes, completed states |
| `--warning` | `oklch(0.78 0.18 55)` | Attention needed |
| `--info` | `oklch(0.60 0.15 240)` | Information, help |
| `--border` | `oklch(1 0 0 / 10%)` | Subtle white borders on dark |
| `--input` | `oklch(1 0 0 / 15%)` | Form input borders |
| `--ring` | `oklch(0.72 0.22 40)` | Focus rings — orange |

### Chart Palette

Designed for stat visualizations — orange as primary series, purple as secondary:

| Token | Value | Series |
|-------|-------|--------|
| `--chart-1` | `oklch(0.72 0.22 40)` | Primary — **orange** |
| `--chart-2` | `oklch(0.55 0.24 285)` | Secondary — **purple** |
| `--chart-3` | `oklch(0.82 0.18 40)` | Tertiary — light orange |
| `--chart-4` | `oklch(0.65 0.20 285)` | Quaternary — light purple |
| `--chart-5` | `oklch(0.78 0.18 55)` | Quinary — warm amber |

### Color Psychology

- **Orange (40°)** — the primary action color. Energy, competition, heat. Derived from the basketball court's amber floor tones and Mongolian sports broadcasting tradition. High-contrast against the near-black canvas. Used for: CTAs, links, emphasis, leader highlights, stat callouts.
- **Purple (285°)** — the premium accent. Depth, quality, authority. Used for: secondary navigation, premium badges, secondary chart series, alternate section backgrounds.
- **Near-black background** — power, focus, immersion. Every stat stands forward. The canvas disappears so the data speaks.

### Token Usage Rules

- `--primary` is fill-only. Never render primary as text directly on the page background. Always pair with `--primary-foreground` for text on primary fills.
- `--brand-purple` is for chrome and accents, never for interactive elements. Use `--secondary` for interactive purple.
- All borders use `oklch(1 0 0 / 10%)` (white at low opacity) rather than gray tones — feels more intentional on dark surfaces.
- Never stack `shadow` + `border` on the same element. On a dark canvas, subtle surface steps (surface-1, surface-2, surface-3) replace shadows for depth.

---

## Typography

Onoo uses three typefaces, each with a distinct role:

| Role | Family | Weight | Size range | Usage |
|------|--------|--------|------------|-------|
| Display | **Oswald** | 600–800 | 24–72px | Scores, stat numbers, hero headlines — condensed power |
| Body | **Inter** | 400–600 | 12–18px | All UI text, descriptions, labels — excellent Cyrillic |
| Stat | **JetBrains Mono** | 700 | 14–48px | Tabular numerals, stat displays, leaderboards |

### Font Selection Rationale

**Oswald** — condensed, bold, athletic. Inspired by sports jersey typography and broadcast score overlays. Its narrow proportions allow big stat numbers without consuming excessive horizontal space, critical at 360px mobile widths. Excellent Cyrillic support.

**Inter** — clean, highly legible, excellent Cyrillic glyphs. The body workhorse for all UI text, form labels, and navigation. Variable font with a wide weight range.

**JetBrains Mono** — tabular numerals for stat displays. Every digit occupies the same width, making stat columns and leaderboards visually aligned. Weight 700 for impact.

### Scale

```css
--text-xs:   0.75rem  (12px)  — Labels, metadata, timestamps
--text-sm:   0.875rem (14px)  — Body text, descriptions
--text-base: 1rem     (16px)  — Default body
--text-lg:   1.125rem (18px)  — Lead body
--text-xl:   1.25rem  (20px)  — Large body, stat labels
--text-2xl:  1.5rem   (24px)  — Section headings
--text-3xl:  1.875rem (30px)  — Page headings
--text-4xl:  2.25rem  (36px)  — Hero stat display
--text-5xl:  3rem     (48px)  — Large hero stat display
--text-6xl:  3.75rem  (60px)  — Score numbers
```

### Type Classes

```css
.type-display  — Oswald 800, letter-spacing -0.02em, line-height 1.1
.type-heading  — Oswald 700, letter-spacing -0.01em, line-height 1.2
.type-body     — Inter 400, line-height 1.6
.type-label    — Inter 600, letter-spacing 0.05em, text-transform uppercase, font-size 0.75rem
.type-score    — JetBrains Mono 700, tabular-nums, letter-spacing -0.03em
```

### Usage Rules

- **Oswald display** is for impact moments — stat numbers, hero sections, leaderboard rankings. Never for body text or UI labels.
- **Inter body** handles everything functional. 14px for dense UI (tables, sidebars), 16px for reading content.
- **JetBrains Mono stats** is for data displays — scores, shooting percentages, stat lines. Always use `tabular-nums` to keep digits aligned.
- Mongolian Cyrillic text is ~1.5–2x wider than English. Apply `truncate` on labels that might overflow. Use `flex-shrink-0` on stat labels in flex layouts.

---

## Spacing

4px base unit. All spacing is multiples of 4.

| Token | Value | Usage |
|-------|-------|-------|
| `space-1` | 4px | Tight micro-gaps |
| `space-2` | 8px | Component internal (icon + text) |
| `space-3` | 12px | Between related elements |
| `space-4` | 16px | Card padding, form spacing |
| `space-5` | 20px | Generous internal spacing |
| `space-6` | 24px | Between distinct UI blocks |
| `space-8` | 32px | Section separation |
| `space-10` | 40px | Major section breaks |
| `space-12` | 48px | Page-level spacing |
| `space-16` | 64px | Hero sections |
| `space-20` | 80px | Marketing page spreads |
| `space-24` | 96px | Full bleed sections |

---

## Border Radius

| Token | Value | Used for |
|-------|-------|----------|
| `--radius-sm` | 4px | Inputs, tags, badges |
| `--radius-md` | 8px | Cards, modals (default `--radius`) |
| `--radius-lg` | 12px | Panels, sheets |
| `--radius-xl` | 16px | Large surfaces, hero cards |
| `--radius-full` | 9999px | Pills, avatars, toggles |

On a dark canvas, border-radius creates containment without relying on shadow depth. Cards use `--radius-md` (8px) as the default — visible enough to define the card boundary, subtle enough to not compete with content.

---

## Shadows

On a near-black canvas, traditional shadows (dark on dark) don't work. Instead, Onoo uses **surface elevation steps** + **very subtle light glows**:

| Token | Value | Used for |
|-------|-------|----------|
| `--shadow-xs` | `0 1px 2px oklch(0 0 0 / 0.05)` | Inputs, tags |
| `--shadow-sm` | `0 1px 3px oklch(0 0 0 / 0.10), 0 1px 2px -1px …` | Cards at rest |
| `--shadow-md` | `0 4px 6px -1px oklch(0 0 0 / 0.10)` | Cards raised |
| `--shadow-lg` | `0 10px 15px -3px oklch(0 0 0 / 0.10)` | Modals, drawers |
| `--shadow-xl` | `0 20px 25px -5px oklch(0 0 0 / 0.10)` | Large overlays |
| `--shadow-card-hover` | `0 4px 12px oklch(0 0 0 / 0.25)` | Card hover lift |

**Rule:** Never pair `shadow` + `border` on the same element. Use the surface hierarchy (`surface-1` → `surface-2` → `surface-3`) for depth between levels.

---

## Motion

### Durations

| Token | Value | Used for |
|-------|-------|----------|
| `--duration-fast` | 150ms | Micro-interactions, hovers, toggles |
| `--duration-normal` | 250ms | Standard transitions, drawer open/close |
| `--duration-slow` | 400ms | Page transitions, emphasis animations |

### Easing

| Token | Value | Character |
|-------|-------|-----------|
| `--ease-spring` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Bouncy, confident |
| `--ease-sport` | `cubic-bezier(0.22, 1, 0.36, 1)` | Athletic, decisive |

### Live Indicators

- **Live pulse animation**: A pulsing circle/indicator during active games. Uses `opacity` animation (performant, no layout thrash).
- **Count-up numbers**: Stat numbers on hero cards animate from 0 to their value on page load.
- **Flip digits**: Score changes use a flip animation (translate/rotate with `transform`).

### Rules

- Prefer `transform` and `opacity` for animations — never animate `width`, `height`, or `position`.
- Respect `prefers-reduced-motion` — all animations degrade gracefully.
- Stats (count-ups, flip digits) animate once on load. Never animate on every render.

---

## Components

### shadcn/ui

Onoo uses **shadcn/ui** components with the **base-nova** style, built on **Base UI** (migrated from Radix). All components reference theme tokens via Tailwind utility classes.

Key component behaviors:

| Component | Pattern | Details |
|-----------|---------|---------|
| Button | `size` variants (`sm`/`md`/`lg`/`xl`) | Primary uses `--color-primary` (orange) |
| Card | `bg-card` with `border` | Dark card on near-black canvas |
| Dialog | Center-modal for confirmations | Uses `--color-background` |
| Sheet | Right-side panel for forms | Uses `--color-background` |
| Drawer | Bottom sheet on mobile, right panel on desktop | Base UI Drawer |
| Badge | Size variants | Destructive (red), Success (green), Outline |
| Table | Sticky header, zebra rows | Data tables for stats, leaderboards |
| Tabs | Underline style | Stat category switching |
| Skeleton | Pulse animation | Content loading states |

### Sport-Specific Components

| Component | Description |
|-----------|-------------|
| Player Hero Card | Large stat display with jersey number, position, season averages |
| Court Baseline Motif | Subtle half-court line + center circle decoration |
| Stat Number | Large condensed tabular numeral — the signature Onoo stat display |
| Podium Card | Top-3 leader display with gold/silver/bronze styling |
| Live Game Center | Real-time score display with team colors, period, clock |
| Form Guide | Last 5 games: win/loss indicator strip |

### Empty States

Every list/detail surface has a designed empty state in Mongolian that explains what belongs here and provides a single primary CTA.

Example pattern:
```
[Icon]
Энэ өдөр тоглолт товлоогүй байна
→ Тоглолт нэмэх
```

---

## Player Showcase — Signature Surface

The player profile page is Onoo's signature surface. It composes:

```
Header ─────── Hero identity card (jersey, name, position, team colors)
                └── Season averages as animated stat numbers

Body  ──────── Season arc chart (PTS/R/AST trend across games)
                └── Per-game stat table
                └── Career stats
                └── Milestones and badges
```

The visual hierarchy reads top-to-bottom like a sports broadcast graphic: hero first, narrative second, details third.

### Player Showcase Hero

A full-bleed hero section with:
- **Radial gradient glow** using `--brand-sports` (orange) from the upper-left
- **Radial gradient glow** using `--brand-purple` from the lower-right
- **Court baseline motif** as a subtle background texture
- **Stat numbers** in Oswald 800 with count-up animation

---

## Dark-First Decisions

Onoo is a **dark-first** product. Unlike most apps that treat dark mode as an afterthought, Onoo's default experience is the dark palette. Key decisions:

1. **Near-black canvas** (`oklch 0.02`) — not pure black, but close. Pure black creates harsh contrast with cards; the 2% lightness step gives the page depth while maintaining the "dark and powerful" feel.

2. **Surface elevation, not shadows** — On a near-black background, traditional box-shadows are invisible. Onoo uses stepped surface lightness (surface-1, surface-2, surface-3) to convey depth.

3. **White borders at low opacity** (`oklch(1 0 0 / 10%)`) — borders on dark surfaces use white with transparency rather than gray. This feels more intentional and consistent across the dark palette.

4. **No light mode transition planned** — Onoo is a targeted sports platform, not a general-purpose app. Users expect and prefer the broadcast-dark aesthetic. If light mode is added later, it will be an explicit design project, not a CSS variable flip.

---

## Implementation

### Where Tokens Live

All design tokens are defined in CSS custom properties:

| File | What it defines |
|------|----------------|
| `packages/branding/globals.css` | Base tokens, Tailwind v4 theme registration via `@theme inline` |
| `src/app/globals.css` | Onoo overrides — dark-first palette, orange-purple accent, surface hierarchy |

### Using Tokens in Code

```tsx
// Tailwind utilities (preferred)
<div className="bg-card text-card-foreground">…</div>
<Button variant="primary" size="lg">Тоглогч харах</Button>

// CSS variable reference (for custom styling)
<div className="bg-[var(--surface-2)]">…</div>
<p className="text-[var(--ink)]">…</p>
```

### Code Architecture

- **Tailwind v4** with `@theme inline` for utility generation
- **Var() indirection** pattern: `@theme inline { --color-card: var(--card); }` → `.dark { --card: …; }` — enables `.dark` class overrides through CSS variable cascade
- All values in **OKLch** for perceptual uniformity
- **No hardcoded hex/rgb** in component code — always reference CSS variables

---

_Last updated: 2026-07-22_
