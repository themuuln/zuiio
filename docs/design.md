# zuiio — Design System

zuiio is a parent brand for SaaS platforms and consumer applications. The design language is **precise, fluid, and confident** — minimal enough to stay out of the way, distinctive enough to be remembered.

**Values**: Clean · Modern · Scalable · Human

---

## Color System

All colors use OKLch for perceptual uniformity and predictable light/dark behavior.

### Brand Palette

| Token | Value | Usage |
|-------|-------|-------|
| `--brand-violet` | `oklch(0.50 0.26 275)` | Primary brand color |
| `--brand-violet-light` | `oklch(0.65 0.22 275)` | Highlights, hover states |
| `--brand-violet-dim` | `oklch(0.38 0.24 275)` | Pressed states |
| `--brand-teal` | `oklch(0.70 0.16 195)` | Accent color |
| `--brand-teal-light` | `oklch(0.82 0.12 195)` | Accent highlights |

### Semantic Tokens (shadcn / Tailwind v4)

Defined in `@zuiio/branding/globals.css`. Follows shadcn convention exactly.

**Light mode**

- Background: `oklch(0.99 0.003 275)` — violet-tinted white
- Foreground: `oklch(0.12 0.018 275)` — near-black
- Primary: `oklch(0.50 0.26 275)` — brand violet
- Accent: `oklch(0.72 0.14 195)` — brand teal

**Dark mode**

- Background: `oklch(0.10 0.018 275)`
- Foreground: `oklch(0.96 0.005 275)`
- Primary: `oklch(0.65 0.22 275)` — lightened violet

### Full Palette Scale

| Name | Lightest | Mid | Darkest |
|------|----------|-----|---------|
| Violet | `oklch(0.95 0.03 275)` | `oklch(0.50 0.26 275)` | `oklch(0.25 0.20 275)` |
| Teal | `oklch(0.93 0.05 195)` | `oklch(0.70 0.16 195)` | `oklch(0.35 0.14 195)` |
| Slate | `oklch(0.97 0.004 265)` | `oklch(0.55 0.02 265)` | `oklch(0.15 0.015 265)` |
| Red | `oklch(0.93 0.05 20)` | `oklch(0.55 0.22 20)` | `oklch(0.30 0.18 20)` |
| Amber | `oklch(0.95 0.06 80)` | `oklch(0.78 0.18 75)` | `oklch(0.45 0.14 70)` |
| Green | `oklch(0.94 0.05 145)` | `oklch(0.64 0.18 145)` | `oklch(0.35 0.14 145)` |

---

## Typography

| Role | Family | Weight | Size range |
|------|--------|--------|------------|
| Display | Instrument Serif | 400 | 48–96px |
| Heading | Geist Sans | 600–700 | 20–36px |
| Body | Geist Sans | 400–500 | 14–16px |
| Label | Geist Sans | 500 | 12–13px |
| Code | Geist Mono | 400 | 13px |

### Scale

```
--text-xs:   0.75rem   / 12px
--text-sm:   0.875rem  / 14px
--text-base: 1rem      / 16px
--text-lg:   1.125rem  / 18px
--text-xl:   1.25rem   / 20px
--text-2xl:  1.5rem    / 24px
--text-3xl:  1.875rem  / 30px
--text-4xl:  2.25rem   / 36px
--text-5xl:  3rem      / 48px
--text-6xl:  3.75rem   / 60px
```

**Line heights**: UI text `1.4–1.5` · Body `1.6` · Display `1.1–1.2`
**Letter spacing**: Headings `-0.02em` · Labels `0.01em` · Display `-0.03em`

---

## Spacing

4px base unit. All spacing is multiples of 4.

```
--space-1:  4px
--space-2:  8px
--space-3:  12px
--space-4:  16px
--space-5:  20px
--space-6:  24px
--space-8:  32px
--space-10: 40px
--space-12: 48px
--space-16: 64px
--space-20: 80px
--space-24: 96px
```

---

## Border Radius

```
--radius-sm:   4px     — inputs, tags, badges
--radius-md:   8px     — cards, modals (default --radius)
--radius-lg:   12px    — panels, sheets
--radius-xl:   16px    — large surfaces, hero cards
--radius-full: 9999px  — pills, avatars, toggles
```

---

## Elevation & Shadow

```
--shadow-xs: 0 1px 2px oklch(0 0 0 / 0.05)
--shadow-sm: 0 1px 3px oklch(0 0 0 / 0.10), 0 1px 2px -1px oklch(0 0 0 / 0.10)
--shadow-md: 0 4px 6px -1px oklch(0 0 0 / 0.10), 0 2px 4px -2px oklch(0 0 0 / 0.10)
--shadow-lg: 0 10px 15px -3px oklch(0 0 0 / 0.10), 0 4px 6px -4px oklch(0 0 0 / 0.10)
--shadow-xl: 0 20px 25px -5px oklch(0 0 0 / 0.10), 0 8px 10px -6px oklch(0 0 0 / 0.10)
```

Brand glow (primary surfaces):

```
--shadow-brand: 0 0 0 1px oklch(0.50 0.26 275 / 0.15), 0 4px 16px oklch(0.50 0.26 275 / 0.12)
```

---

## Motion

```
--ease-spring:  cubic-bezier(0.34, 1.56, 0.64, 1)
--ease-out:     cubic-bezier(0.0, 0.0, 0.2, 1)
--ease-in-out:  cubic-bezier(0.4, 0.0, 0.2, 1)

--duration-fast:   100ms
--duration-base:   150ms
--duration-slow:   250ms
--duration-slower: 400ms
```

| Interaction | Duration | Easing |
|-------------|----------|--------|
| Hover / focus | `fast` | `ease-out` |
| UI state change | `base` | `ease-out` |
| Panel open / modal | `slow` | `ease-in-out` |
| Micro spring (scale) | `slow` | `ease-spring` |
| Page transition | `slower` | `ease-in-out` |

Never animate layout properties (`width`, `height`) — use `transform` and `opacity` only.

---

## Surfaces

3-layer depth model:

1. **Base** — `--background` — page canvas
2. **Raised** — `--card` + `--shadow-sm` — cards, sections, sidebars
3. **Floating** — `--popover` + `--shadow-lg` — dropdowns, modals, tooltips

In dark mode: depth via violet-tinted background steps, not opacity overlays.

---

## Component Conventions

**shadcn style**: `new-york`
**Icons**: `@phosphor-icons/react` — weight `regular` default, `fill` for active/selected states
**Radius**: `--radius` = `8px` (maps to `--radius-md`)

### Forms

- Always vertical stack: Label → Input → Helper/Error
- Error state: `--destructive` border + error text below input
- Required indicator: asterisk in `--destructive`, never "(required)"

### Modals / Overlays

| Use case | Component |
|----------|-----------|
| Form / edit | Sheet (right side) |
| Confirm / destructive action | Dialog (center) |
| Mobile primary action | Drawer (bottom) |
| Quick info | Popover |

### Empty States

Always include: what goes here + single primary action CTA. Never just an icon.

### Loading

- Skeleton over spinner for content areas
- Spinner only for button actions and page-level loading

---

## Voice & Tone

- **Concise** — fewer words, same meaning
- **Direct** — "Do X" not "Try doing X"
- **Human** — plain language unless the audience is technical
- **Confident** — state facts, no hedging

| Context | Pattern |
|---------|---------|
| Error | What went wrong + what to do |
| Success | Confirm the action, nothing more |
| Empty state | What goes here + first action |
| Destructive confirm | Restate consequences, not just "Are you sure?" |

---

## Product Naming

`zuiio [Product]` — e.g. `zuiio ERP`, `zuiio Pay`, `zuiio Docs`

Each product:

- Shares primary violet (never overridden)
- Gets its own accent hue (±30° shift from base teal `195`)
- Gets its own phosphor icon (consistent `duotone` weight for product marks)

| Product | Accent hue | Example |
|---------|------------|---------|
| Core / default | `195` (teal) | zuiio |
| ERP / operations | `165` (green) | zuiio ERP |
| Finance / pay | `225` (blue) | zuiio Pay |
| Analytics | `80` (amber) | zuiio Insights |
| Developer | `285` (purple) | zuiio Dev |

---

## File Conventions

```
packages/branding/     — CSS brand tokens (source of truth)
apps/*/globals.css     — per-app shadcn-compatible CSS variables
components.json        — shadcn config per app
```

All color values are derived from `@zuiio/branding`. The CSS variables in `packages/branding/globals.css` are the single source of truth.
