---
name: zuiio-design-system
description: Apply zuiio's design system when building UI for the zuiio ecosystem (Tolom, Zer, or the zuiio website). Enforces OKLch color tokens, Geist Sans typography, 4px spacing grid, shadcn/ui new-york style, and motion constraints. Use on any frontend task in this monorepo.
---

# Zuiio Design System

Apply these rules when building or modifying any UI in the zuiio monorepo.

## Color System

All colors use OKLch. Never use raw hex values.

### Brand Palette

| Token | OKLch Value | Usage |
|-------|-------------|-------|
| `--brand-violet` | `oklch(0.50 0.26 275)` | Primary brand color |
| `--brand-violet-light` | `oklch(0.65 0.22 275)` | Highlights, hover |
| `--brand-violet-dim` | `oklch(0.38 0.24 275)` | Pressed states |
| `--brand-teal` | `oklch(0.70 0.16 195)` | Accent |
| `--brand-teal-light` | `oklch(0.82 0.12 195)` | Accent highlights |

### Semantic Tokens (Light mode)

- Background: `oklch(0.99 0.003 275)` — violet-tinted white
- Foreground: `oklch(0.12 0.018 275)` — near-black
- Primary: `oklch(0.50 0.26 275)` — brand violet
- Primary Foreground: `oklch(0.99 0.003 275)`
- Accent: `oklch(0.92 0.06 195)` — brand teal
- Muted: `oklch(0.94 0.008 275)`
- Muted Foreground: `oklch(0.50 0.025 275)`
- Border: `oklch(0.90 0.010 275)`
- Destructive: `oklch(0.55 0.22 20)`

In dark mode: violet-tinted background steps, not opacity overlays.

### Product-specific Accent Hues

Each product shares primary violet but gets its own accent:

| Product | Accent hue |
|---------|-------------|
| Core / default | `195` (teal) |
| ERP / operations | `165` (green) |
| Finance / pay | `225` (blue) |
| Analytics | `80` (amber) |
| Developer | `285` (purple) |

## Typography

| Role | Family | Weight | Sizes |
|------|--------|--------|-------|
| Display | Instrument Serif | 400 | 48–96px |
| Heading | Geist Sans | 600–700 | 20–36px |
| Body | Geist Sans | 400–500 | 14–16px |
| Label | Geist Sans | 500 | 12–13px |
| Code | Geist Mono | 400 | 13px |

Type scale: `xs` 12px → `sm` 14px → `base` 16px → `lg` 18px → `xl` 20px → `2xl` 24px → `3xl` 30px → `4xl` 36px → `5xl` 48px → `6xl` 60px.

Line heights: UI text 1.4–1.5, Body 1.6, Display 1.1–1.2. Headings `-0.02em` letter spacing, Display `-0.03em`.

## Spacing

4px base unit. Use ONLY multiples of 4: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96.

## Border Radius

- `sm` 4px — inputs, tags, badges
- `md` 8px — cards, modals (default)
- `lg` 12px — panels, sheets
- `xl` 16px — large surfaces, hero cards
- `full` 9999px — pills, avatars, toggles

## Shadows

- `xs`: `0 1px 2px oklch(0 0 0 / 0.05)`
- `sm`: `0 1px 3px oklch(0 0 0 / 0.10), 0 1px 2px -1px oklch(0 0 0 / 0.10)`
- `md`: `0 4px 6px -1px oklch(0 0 0 / 0.10), 0 2px 4px -2px oklch(0 0 0 / 0.10)`
- `lg`: `0 10px 15px -3px oklch(0 0 0 / 0.10), 0 4px 6px -4px oklch(0 0 0 / 0.10)`
- `xl`: `0 20px 25px -5px oklch(0 0 0 / 0.10), 0 8px 10px -6px oklch(0 0 0 / 0.10)`

Brand glow: `0 0 0 1px oklch(0.50 0.26 275 / 0.15), 0 4px 12px oklch(0.50 0.26 275 / 0.12)`

Hover card lift: `0 4px 12px oklch(0 0 0 / 0.08), 0 2px 4px oklch(0 0 0 / 0.06)`

**Rule:** Never pair `border` with `box-shadow` on the same element — pick one. Ghost-card (1px border + wide blur shadow) is banned.

## Motion

### Easing

```
--ease-out:     cubic-bezier(0.23, 1, 0.32, 1);   /* strong enter */
--ease-move:    cubic-bezier(0.25, 1, 0.5, 1);    /* slides, drawers */
--ease-in-out:  cubic-bezier(0.77, 0, 0.175, 1);  /* deliberate transitions */
--ease-spring:  cubic-bezier(0.34, 1.56, 0.64, 1); /* micro-scale only */
```

### Duration

```
--duration-instant: 80ms;   /* hover color */
--duration-fast:    120ms;  /* button press, focus */
--duration-base:    200ms;  /* tooltips, popovers */
--duration-slow:    280ms;  /* dropdowns, toggles */
--duration-slower:  350ms;  /* modals, drawers */
```

| Interaction | Duration | Easing |
|-------------|----------|--------|
| Hover color | `instant` | `ease-out` |
| Button press | `fast` | `ease-out` |
| Tooltip | `base` | `ease-out` |
| Dropdown / select | `slow` | `ease-out` |
| Panel / drawer open | `slower` | `ease-move` |
| Modal | `slower` | `ease-out` |
| Micro spring (badge, toggle) | `slow` | `ease-spring` |
| Page transition | `slower` | `ease-in-out` |

**Never animate `width` or `height`** — use `transform` and `opacity` only. Always respect `prefers-reduced-motion`.

## Surfaces

6-layer z-index scale (semantic — never 999 or 9999):

| Layer | z-index | Surface |
|-------|---------|---------|
| Base | 0 | Page canvas |
| Raised | 10 | Cards, sections, sidebars |
| Sticky | 20 | Headers, persistent nav |
| Floating | 30 | Dropdowns, popovers |
| Overlay | 40 | Modals, sheets, drawers |
| Top | 50 | Toasts, notifications, skip-link |

## Component Conventions

- **shadcn/ui style**: `new-york`
- **Icons**: `@phosphor-icons/react` — `regular` weight default, `fill` for active/selected states
- **Radius**: default `8px` (`--radius-md`)

### Forms

- Always vertical stack: Label → Input → Helper/Error
- Error state: `--destructive` border + error text below
- Required indicator: asterisk in `--destructive`, never "(required)"

### Modals / Overlays

| Use case | Component |
|----------|-----------|
| Form / edit | Sheet (right side) |
| Confirm / destructive | Dialog (center) |
| Mobile primary action | Drawer (bottom) |
| Quick info | Popover |

### Empty States

Always include: description of what goes here + single primary action CTA. Never just an icon.

### Loading

- Skeleton over spinner for content areas
- Spinner only for button actions and page-level loading

## Voice & Tone

- **Concise** — fewer words, same meaning
- **Direct** — "Do X" not "Try doing X"
- **Human** — plain language
- **Confident** — state facts, no hedging

Patterns:

- Error: "What went wrong + what to do"
- Success: "Confirm the action, nothing more"
- Empty state: "What goes here + first action"
- Destructive confirm: "Restate consequences, not just 'Are you sure?'"

## Monorepo Conventions

- UI components live in each app's `src/components/`, **not** in `@zuiio/ui`
- `@zuiio/ui` is for pure utility components only (HighlightText, formatting helpers)
- Framework-agnostic logic → `@zuiio/core`
- React hooks → `@zuiio/hooks`
- Mongolian payroll → `@zuiio/hr`
- Runtime deps in `dependencies`, not `peerDependencies` (private monorepo)
- `noUncheckedIndexedAccess: true`
- `pnpm exec tsc --noEmit` to type-check all packages

## Reference Files

- Design tokens: `docs/design.md`
- Brand tokens (TS): `packages/branding/src/index.ts`
- Agent instructions: `AGENTS.md`, `.claude/instructions.md`
- Web stack: `docs/stack-web.md`
