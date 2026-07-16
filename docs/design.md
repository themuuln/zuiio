---
colors:
  primary:
    violet: "oklch(0.50 0.26 275)"
    violet-light: "oklch(0.65 0.22 275)"
    violet-dim: "oklch(0.38 0.24 275)"
    violet-glow: "oklch(0.50 0.26 275 / 0.12)"
  accent:
    teal: "oklch(0.70 0.16 195)"
    teal-light: "oklch(0.82 0.12 195)"
    teal-glow: "oklch(0.70 0.16 195 / 0.1)"
  gradient:
    brand: "linear-gradient(135deg, oklch(0.50 0.26 275), oklch(0.70 0.16 195))"
    brand-subtle: "linear-gradient(135deg, oklch(0.50 0.26 275 / 0.08), oklch(0.70 0.16 195 / 0.06))"
  semantic:
    background: "oklch(0.98 0.005 80)"
    foreground: "oklch(0.13 0.003 80)"
    card: "oklch(0.98 0.005 80)"
    card-foreground: "oklch(0.13 0.003 80)"
    popover: "oklch(0.98 0.005 80)"
    popover-foreground: "oklch(0.13 0.003 80)"
    primary: "oklch(0.70 0.16 195)"
    primary-foreground: "oklch(0.13 0.003 80)"
    secondary: "oklch(0.96 0.012 100)"
    secondary-foreground: "oklch(0.13 0.003 80)"
    muted: "oklch(0.96 0.008 80)"
    muted-foreground: "oklch(0.50 0.008 80)"
    accent: "oklch(0.96 0.02 195)"
    accent-foreground: "oklch(0.22 0.12 195)"
    destructive: "oklch(0.55 0.22 25)"
    destructive-foreground: "oklch(1 0 0)"
    destructive-text: "oklch(0.50 0.18 25)"
    success: "oklch(0.64 0.18 145)"
    success-foreground: "oklch(0.13 0.003 80)"
    warning: "oklch(0.78 0.18 75)"
    warning-foreground: "oklch(0.13 0.003 80)"
    info: "oklch(0.6 0.15 240)"
    info-foreground: "oklch(0.13 0.003 80)"
    border: "oklch(0.92 0.01 80)"
    input: "oklch(0.92 0.01 80)"
    ring: "oklch(0.70 0.16 195)"
  charts:
    chart-1: "oklch(0.70 0.16 195)"
    chart-2: "oklch(0.65 0.18 145)"
    chart-3: "oklch(0.75 0.18 85)"
    chart-4: "oklch(0.6 0.22 25)"
    chart-5: "oklch(0.6 0.15 240)"
typography:
  ui: "Geist Sans"
  display: "Instrument Serif"
  code: "Geist Mono"
  scale:
    base: "16px"
    ratio: 1.25
    sizes: ["12px", "14px", "16px", "20px", "24px", "32px", "40px", "48px"]
spacing:
  base: 4
  unit: "px"
  scale: [4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96]
radius:
  sm: "4px"
  md: "8px"
  lg: "12px"
  xl: "16px"
  full: "9999px"
surfaces:
  z-index:
    base: 0
    raised: 10
    sticky: 20
    floating: 30
    overlay: 40
    top: 50
motion:
  never-animate: ["width", "height"]
  prefer: ["transform", "opacity"]
  respect-reduced-motion: true
  durations:
    micro: "150ms"
    standard: "250ms"
    slow: "400ms"
products:
  core:
    accent-hue: 195
    color: "teal"
  zer:
    accent-hue: 165
    color: "green"
  tolom:
    accent-hue: 265
    color: "indigo"
  tumurch:
    accent-hue: 80
    color: "amber"
  tamga:
    accent-hue: 285
    color: "purple"
icons:
  library: "@phosphor-icons/react"
  default-weight: "regular"
  active-weight: "fill"
components:
  style: "shadcn new-york"
  forms:
    layout: "vertical"
    pattern: "Label -> Input -> Helper/Error"
  overlays:
    form-edit: "Sheet (right side)"
    confirm: "Dialog (center)"
    mobile-action: "Drawer (bottom)"
    quick-info: "Popover"
  empty-states:
    requirement: "What goes here + single primary action CTA"
  loading:
    content: "Skeleton"
    actions: "Spinner"
voice:
  tone: ["concise", "direct", "human", "confident"]
  language: "mn_MN"
---

# zuiio — Design System

zuiio is a parent brand for SaaS platforms and consumer applications. The design language is **precise, fluid, and confident** — minimal enough to stay out of the way, distinctive enough to be remembered.

**Values**: Clean · Modern · Scalable · Human

---

## Color System

All colors use OKLch for perceptual uniformity and predictable light/dark behavior.

### Brand Palette

| Token | Value | Usage |
|-------|-------|-------|
| `--brand-violet` | `oklch(0.50 0.26 275)` | Primary brand color — shared across all products, never overridden |
| `--brand-violet-light` | `oklch(0.65 0.22 275)` | Highlights, hover states |
| `--brand-violet-dim` | `oklch(0.38 0.24 275)` | Pressed states |
| `--brand-teal` | `oklch(0.70 0.16 195)` | Core accent color |
| `--brand-teal-light` | `oklch(0.82 0.12 195)` | Accent highlights |

### Semantic Tokens (shadcn / Tailwind v4)

Defined in `@zuiio/branding/globals.css`. Follows shadcn convention exactly.

**Light mode**

- Background: `oklch(0.98 0.005 80)` — warm off-white
- Foreground: `oklch(0.13 0.003 80)` — near-black
- Primary: `oklch(0.70 0.16 195)` — brand teal (semantic primary)
- Accent: `oklch(0.96 0.02 195)` — teal-tinted surface

**Dark mode**

- Background: `oklch(0.13 0.003 80)`
- Foreground: `oklch(0.98 0.005 80)`
- Primary: `oklch(0.82 0.12 195)` — lightened teal

### Dark Mode Decisions

Dark mode uses **elevated surface brightness**, not opacity overlays. Depth is conveyed through violet-tinted background steps: each layer (card, popover, overlay) gets progressively lighter, never through semi-transparent white washes.

- Card surfaces: `oklch(0.2 0.004 80)` — slightly above base background
- Borders: `oklch(1 0 0 / 10%)` — white at low opacity, not gray
- Brand glow: intensified in dark mode for visibility (`0.20` opacity vs `0.15` in light)

### Full Palette Scale

| Name | Lightest | Mid | Darkest |
|------|----------|-----|---------|
| Violet | `oklch(0.95 0.03 275)` | `oklch(0.50 0.26 275)` | `oklch(0.25 0.20 275)` |
| Teal | `oklch(0.93 0.05 195)` | `oklch(0.70 0.16 195)` | `oklch(0.35 0.14 195)` |
| Slate | `oklch(0.97 0.004 265)` | `oklch(0.55 0.02 265)` | `oklch(0.15 0.015 265)` |
| Red | `oklch(0.93 0.05 20)` | `oklch(0.55 0.22 20)` | `oklch(0.30 0.18 20)` |
| Amber | `oklch(0.95 0.06 80)` | `oklch(0.78 0.18 75)` | `oklch(0.45 0.14 70)` |
| Green | `oklch(0.94 0.05 145)` | `oklch(0.64 0.18 145)` | `oklch(0.35 0.14 145)` |

### Color Psychology

This palette is designed for **B2B software** — Mongolian ERP, repair shops, gym management. Trust and clarity matter more than excitement.

- **Violet (275°)** — brand identity. Signals innovation and premium positioning. Appears in brand marks, shadow-brand glow, and the gradient. Not used for interactive UI.
- **Teal (195°)** — the interactive color. Research shows blue-teal ranges are "consistently rated as more trustworthy in health, finance, and insurance." Users click teal, not violet.
- **Warm neutrals (hue 80°)** — all backgrounds, borders, and grays share a warm undertone. Warm neutrals feel more human than cool grays. This is chromatic coherence — all UI colors sharing one temperature direction is rated as "higher-quality and more professional."
- **Success green (145°)** — positive outcomes, completed tasks, available status.
- **Warning amber (75°)** — attention needed, pending states, caution.
- **Info blue (240°)** — neutral information, help text, tips.
- **Destructive red (25°)** — irreversible actions only. Never for warnings.

### Token Usage Rules

- **`--brand-violet`** — brand identity only. Never for interactive elements; use semantic `--primary` instead. Appears in: logo, shadow-brand, gradient.
- **`--brand-teal`** — interactive accents: links, active states, focus rings, chart highlights.
- **Semantic `--primary`** — the color users click. Buttons, active nav items, selected states. Maps to teal in core, shifts hue per product.
- **Usage restriction**: `--primary` is fill-only — never render primary as text directly on the page background. The foreground text on primary surfaces uses `--primary-foreground` (8.50:1), which passes AA. This is why `--primary on background` (2.23:1) is acceptable — it's never used that way.
- **Semantic `--secondary`** — secondary actions, less prominent buttons, tags. Slightly cooler than muted (hue 100 vs 80) to feel distinct.
- **Semantic `--accent`** — hover backgrounds, tinted surfaces, selected row highlights.
- **Semantic `--muted`** — disabled states, placeholder text, secondary information.
- **Semantic `--destructive`** — destructive button fills and confirmation CTAs.
- **Semantic `--destructive-text`** — inline error messages, validation errors. Softer than `--destructive` (L=0.50 vs 0.60) for readability on light backgrounds.
- **Semantic `--success`** — status indicators, completed actions, positive feedback.
- **Semantic `--warning`** — caution states, pending actions, attention indicators.
- **Semantic `--info`** — help tooltips, informational badges, neutral callouts.
- **Palette scale** — use for data visualization, status badges, and chart series. Never for UI chrome.

---

## Typography

Fonts must be loaded by each app via `next/font` or `@fontsource`. The CSS variables in `globals.css` declare the family names; apps provide the actual font files.

| Role | Family | Weight | Size range | When to use |
|------|--------|--------|------------|-------------|
| Display | Instrument Serif | 400 | 48–96px | Hero headlines, marketing pages, section openers. Never for UI labels. |
| Heading | Geist Sans | 600–700 | 20–36px | Page titles, section headers, card titles. |
| Body | Geist Sans | 400–500 | 14–16px | Paragraphs, descriptions, form help text. |
| Label | Geist Sans | 500 | 12–13px | Form labels, badges, metadata, timestamps. |
| Code | Geist Mono | 400 | 13px | Code blocks, API references, technical identifiers. |

### Scale

```css
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

**Usage rules**:
- Display (Instrument Serif) is for moments of emphasis — hero sections, marketing landing pages. It signals "this is important and beautiful." Never use it for functional UI.
- Heading (Geist Sans 600–700) is for structure — page titles, section headers, modal titles. Always left-aligned.
- Body (Geist Sans 400–500) is for reading. 14px for dense UI (tables, sidebars), 16px for content areas.
- Label (Geist Sans 500) is for metadata and form labels. Always paired with the input it describes.

---

## Spacing

4px base unit. All spacing is multiples of 4.

```css
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

**Usage rules**:
- **Component internal**: `space-2` to `space-3` (8–12px) — gaps between related elements inside a card or form.
- **Between components**: `space-4` to `space-6` (16–24px) — separation between distinct UI blocks.
- **Section spacing**: `space-8` to `space-12` (32–48px) — between major page sections.
- **Page-level**: `space-16` to `space-24` (64–96px) — hero sections, marketing page breaks.

---

## Border Radius

```css
--radius-sm:   4px     — inputs, tags, badges
--radius-md:   8px     — cards, modals (default --radius)
--radius-lg:   12px    — panels, sheets
--radius-xl:   16px    — large surfaces, hero cards
--radius-full: 9999px  — pills, avatars, toggles
```

---

## Elevation & Shadow

```css
--shadow-xs:   0 1px 2px oklch(0 0 0 / 0.05);
--shadow-sm:   0 1px 3px oklch(0 0 0 / 0.10), 0 1px 2px -1px oklch(0 0 0 / 0.10);
--shadow-md:   0 4px 6px -1px oklch(0 0 0 / 0.10), 0 2px 4px -2px oklch(0 0 0 / 0.10);
--shadow-lg:   0 10px 15px -3px oklch(0 0 0 / 0.10), 0 4px 6px -4px oklch(0 0 0 / 0.10);
--shadow-xl:   0 20px 25px -5px oklch(0 0 0 / 0.10), 0 8px 10px -6px oklch(0 0 0 / 0.10);
```

Brand glow (primary surfaces):

```css
--shadow-brand: 0 0 0 1px oklch(0.50 0.26 275 / 0.15), 0 4px 12px oklch(0.50 0.26 275 / 0.12);
```

Hover card lift:

```css
--shadow-card-hover: 0 4px 12px oklch(0 0 0 / 0.08), 0 2px 4px oklch(0 0 0 / 0.06);
```

**Rule:** Never pair `border` with `box-shadow` on the same element — pick one. A subtle border + wide blur shadow ("ghost-card") is the most common AI tell. Cards use shadow-only or border-only, never both as decoration.
 See [Rules > The Ghost-Card Ban](#the-ghost-card-ban).

---

## Motion

### Easing

```css
--ease-out:     cubic-bezier(0.23, 1, 0.32, 1);   /* strong enter — button press, popover, modal, dropdown */
--ease-move:    cubic-bezier(0.25, 1, 0.5, 1);    /* slides, drawers, panels on-screen */
--ease-in-out:  cubic-bezier(0.77, 0, 0.175, 1);  /* slow deliberate transitions, marketing */
--ease-spring:  cubic-bezier(0.34, 1.56, 0.64, 1); /* micro-scale only: buttons, toggles, badges */
```

Built-in `ease` and weak `ease-out` variants are too soft — use these named curves.
`ease-spring` has overshoot (1.56); reserve it for micro-interactions where bounce feels deliberate, never for panel opens or page transitions.

### Duration

```css
--duration-instant: 80ms;   /* hover color/opacity changes */
--duration-fast:    120ms;  /* button press feedback, focus rings */
--duration-base:    200ms;  /* tooltips, small popovers, checkboxes */
--duration-slow:    280ms;  /* dropdowns, selects, toggles */
--duration-slower:  350ms;  /* modals, drawers, sheets */
```

| Interaction | Duration | Easing |
|-------------|----------|--------|
| Hover color / opacity | `instant` | `ease-out` |
| Button press (`:active` scale) | `fast` | `ease-out` |
| Focus ring | `fast` | `ease-out` |
| Tooltip, small popover | `base` | `ease-out` |
| Dropdown, select, toggle | `slow` | `ease-out` |
| Panel / drawer open | `slower` | `ease-move` |
| Modal / dialog | `slower` | `ease-out` |
| Micro spring (badge count, toggle snap) | `slow` | `ease-spring` |
| Page transition | `slower` | `ease-in-out` |

Never animate layout properties (`width`, `height`, `margin`, `padding`, `top`, `left`) — use `transform` and `opacity` only.
Never `transition: all` — list properties explicitly.
Every animation must have a `@media (prefers-reduced-motion: reduce)` fallback.

---

## Surfaces

6-layer z-index scale (semantic — never raw values like 999 or 9999):

| Layer | z-index | Surface |
|-------|---------|---------|
| Base | 0 | Page canvas (`--background`) |
| Raised | 10 | Cards, sections, sidebars |
| Sticky | 20 | Headers, persistent nav |
| Floating | 30 | Dropdowns, popovers, tooltips |
| Overlay | 40 | Modals, sheets, drawers |
| Top | 50 | Toasts, notifications, skip-link |

In dark mode: depth via violet-tinted background steps, not opacity overlays.

---

## Accessibility

Every component must meet WCAG 2.2 AA. These are the baseline rules; individual component pages may specify stricter requirements.

### Focus Rings

Use the `--ring` token (`oklch(0.70 0.16 195)`) for all focus indicators. Focus rings must be visible on every interactive element.

```css
:focus-visible {
  outline: 2px solid var(--ring);
  outline-offset: 2px;
}
```

Never remove focus outlines without providing an alternative visible focus state.

### Contrast Requirements

| Pair | Minimum ratio | Standard |
|------|--------------|----------|
| Normal text on background | 4.5:1 | WCAG AA |
| Large text (≥18px bold or ≥24px) on background | 3:1 | WCAG AA |
| UI components and graphical objects | 3:1 | WCAG AA |
| Placeholder text on background | 4.5:1 | WCAG AA (same as body) |

Verify every token pair against both light and dark mode backgrounds. A pair that passes in light mode may fail in dark. Document actual computed ratios in product DESIGN.md.

### Keyboard Navigation

- All interactive elements must be reachable via `Tab`
- Modals and drawers must trap focus
- Escape must close overlays
- Arrow keys must navigate within lists, menus, and tabs

### Reduced Motion

Every animation must respect `prefers-reduced-motion: reduce`. When active:
- Replace transitions with instant state changes, or
- Use `opacity` only (no `transform` animations)

Only animate `transform`, `opacity`, `box-shadow`, or color/opacity transitions. Never layout properties (`width`, `height`, `top`, `left`).
Interactive elements must have visible hover, active, and focus states.

### Touch Targets

Minimum touch target: `44×44px` (WCAG 2.2). Buttons and links in mobile layouts must meet this minimum. Use `min-h-11 min-w-11` (44px) for touch-interactive elements.

### Token Contrast Verification

Computed using OKLch → OKLab → linear sRGB → CIE relative luminance → WCAG contrast ratio formula. All ratios verified against the exact OKLch values defined in the semantic token block.

#### Light Mode

| Token Pair | Foreground | Background | Ratio | WCAG AA (4.5:1) | WCAG AA Large (3:1) | Notes |
|---|---|---|---|---|---|---|
| foreground on background | `oklch(0.13 0.003 80)` | `oklch(0.98 0.005 80)` | **18.99:1** | ✅ PASS | ✅ | Near-black on off-white — excellent |
| card-foreground on card | `oklch(0.13 0.003 80)` | `oklch(0.98 0.005 80)` | **18.99:1** | ✅ PASS | ✅ | Same as foreground (light mode) |
| popover-foreground on popover | `oklch(0.13 0.003 80)` | `oklch(0.98 0.005 80)` | **18.99:1** | ✅ PASS | ✅ | Same as foreground (light mode) |
| secondary-foreground on secondary | `oklch(0.13 0.003 80)` | `oklch(0.96 0.012 100)` | **17.93:1** | ✅ PASS | ✅ | Near-black on light warm surface |
| accent-foreground on accent | `oklch(0.22 0.12 195)` | `oklch(0.96 0.02 195)` | **14.12:1** | ✅ PASS | ✅ | Dark teal on teal-tinted surface |
| warning-foreground on warning | `oklch(0.13 0.003 80)` | `oklch(0.78 0.18 75)` | **9.82:1** | ✅ PASS | ✅ | Dark text on amber badge — excellent |
| primary-foreground on primary | `oklch(0.13 0.003 80)` | `oklch(0.70 0.16 195)` | **8.50:1** | ✅ PASS | ✅ | Dark text on teal button — excellent |
| success-foreground on success | `oklch(0.13 0.003 80)` | `oklch(0.64 0.18 145)` | **9.31:1** | ✅ PASS | ✅ | Dark text on green badge — good |
| destructive-text on background | `oklch(0.50 0.18 25)` | `oklch(0.98 0.005 80)` | **6.22:1** | ✅ PASS | ✅ | Error text on page — good |
| muted-foreground on background | `oklch(0.50 0.008 80)` | `oklch(0.98 0.005 80)` | **5.48:1** | ✅ PASS | ✅ | Helper text on page — passes |
| muted-foreground on muted | `oklch(0.50 0.008 80)` | `oklch(0.96 0.008 80)` | **5.12:1** | ✅ PASS | ✅ | Placeholder in muted surface — passes |
| destructive on background | `oklch(0.55 0.22 25)` | `oklch(0.98 0.005 80)` | **5.33:1** | ✅ PASS | ✅ | Red fill on white — passes |
| destructive-foreground on destructive | `oklch(1.00 0.00 0)` | `oklch(0.55 0.22 25)` | **5.33:1** | ✅ PASS | ✅ | White on red button — passes |
| info on background | `oklch(0.60 0.15 240)` | `oklch(0.98 0.005 80)` | **3.62:1** | ❌ FAIL | ✅ PASS | Blue badge fill on white — large text only |
| info-foreground on info | `oklch(0.13 0.003 80)` | `oklch(0.60 0.15 240)` | **7.66:1** | ✅ PASS | ✅ | Dark text on blue badge — good |
| success on background | `oklch(0.64 0.18 145)` | `oklch(0.98 0.005 80)` | **2.96:1** | ❌ FAIL | ❌ FAIL | Green fill on white — **fails all text sizes** |
| warning on background | `oklch(0.78 0.18 75)` | `oklch(0.98 0.005 80)` | **1.93:1** | ❌ FAIL | ❌ FAIL | Amber fill on white — **fails all text sizes** |
| primary on background | `oklch(0.70 0.16 195)` | `oklch(0.98 0.005 80)` | **2.23:1** | ❌ FAIL | ❌ FAIL | Teal text on white — **fails all text sizes** |

#### Dark Mode

| Token Pair | Foreground | Background | Ratio | WCAG AA (4.5:1) | WCAG AA Large (3:1) | Notes |
|---|---|---|---|---|---|---|
| foreground on background | `oklch(0.98 0.005 80)` | `oklch(0.13 0.003 80)` | **18.99:1** | ✅ PASS | ✅ | Near-white on near-black — excellent |
| card-foreground on card | `oklch(0.98 0.005 80)` | `oklch(0.20 0.004 80)` | **17.09:1** | ✅ PASS | ✅ | Light text on dark card |
| popover-foreground on popover | `oklch(0.98 0.005 80)` | `oklch(0.25 0.004 80)` | **15.10:1** | ✅ PASS | ✅ | Light text on elevated popover |
| warning-foreground on warning | `oklch(0.13 0.003 80)` | `oklch(0.88 0.18 75)` | **13.68:1** | ✅ PASS | ✅ | Dark text on light amber — excellent |
| primary on background | `oklch(0.82 0.12 195)` | `oklch(0.13 0.003 80)` | **12.07:1** | ✅ PASS | ✅ | Light teal on dark — excellent |
| primary-foreground on primary | `oklch(0.13 0.003 80)` | `oklch(0.82 0.12 195)` | **12.07:1** | ✅ PASS | ✅ | Dark text on light teal button |
| success-foreground on success | `oklch(0.13 0.003 80)` | `oklch(0.74 0.18 145)` | **9.31:1** | ✅ PASS | ✅ | Dark text on green badge — good |
| warning-foreground on warning (dark) | `oklch(0.13 0.003 80)` | `oklch(0.88 0.18 75)` | **13.68:1** | ✅ PASS | ✅ | Same as above — excellent |
| info-foreground on info | `oklch(0.13 0.003 80)` | `oklch(0.70 0.15 240)` | **7.66:1** | ✅ PASS | ✅ | Dark text on blue badge |
| destructive-text on background | `oklch(0.70 0.18 25)` | `oklch(0.13 0.003 80)` | **6.95:1** | ✅ PASS | ✅ | Error text on dark page — good |
| destructive on background | `oklch(0.55 0.22 25)` | `oklch(0.13 0.003 80)` | **6.50:1** | ✅ PASS | ✅ | Red fill on dark — good |
| success on background | `oklch(0.74 0.18 145)` | `oklch(0.13 0.003 80)` | **9.31:1** | ✅ PASS | ✅ | Green fill on dark — excellent |
| info on background | `oklch(0.70 0.15 240)` | `oklch(0.13 0.003 80)` | **7.66:1** | ✅ PASS | ✅ | Blue fill on dark — good |
| warning on background | `oklch(0.88 0.18 75)` | `oklch(0.13 0.003 80)` | **13.68:1** | ✅ PASS | ✅ | Amber fill on dark — excellent |
| destructive-foreground on destructive | `oklch(1.00 0.00 0)` | `oklch(0.55 0.22 25)` | **5.33:1** | ✅ PASS | ✅ | White on red button — passes |
| muted-foreground on background | `oklch(0.70 0.01 80)` | `oklch(0.13 0.003 80)` | **7.70:1** | ✅ PASS | ✅ | Helper text on dark — good |
| muted-foreground on muted | `oklch(0.70 0.01 80)` | `oklch(0.30 0.005 80)` | **4.60:1** | ✅ PASS | ✅ | Placeholder on dark muted — passes |

#### Summary

| Severity | Count | Tokens |
|----------|-------|--------|
| ❌ Fails AA normal + large (fill-only, acceptable) | 3 | primary on bg (light), warning on bg (light), success on bg (light) — all fill-only, foreground-on-fill passes |
| ⚠️ Passes large only | 1 | info on bg (light) — badge fill only, foreground-on-fill passes |
| ✅ Passes AA normal text | 26 | All remaining pairs |

#### All Fixes Applied

| Priority | Token | Fix applied | Result |
|---|---|---|---|
| P0 ✅ | `secondary-foreground` (dark) | Inverted to `oklch(0.93 0.015 100)` | 14.74:1 |
| P0 ✅ | `accent-foreground` (dark) | Inverted to `oklch(0.93 0.12 195)` | 13.45:1 |
| P1 ✅ | `success-foreground` (light) | Switched to dark text `oklch(0.13 0.003 80)` | 9.31:1 |
| P1 ✅ | `info-foreground` (light) | Switched to dark text `oklch(0.13 0.003 80)` | 7.66:1 |
| P1 ✅ | `destructive` (light) | Darkened to `oklch(0.55 0.22 25)` | 5.33:1 |
| P1 ✅ | `destructive` (dark) | Darkened to `oklch(0.55 0.22 25)` | 6.50:1 |
| P1 ✅ | `muted-foreground` (light) | Darkened to `oklch(0.50 0.008 80)` | 5.12:1 on muted |

**Accepted as fill-only** (no fix needed):

| Token | Ratio | Why acceptable |
|---|---|---|
| `primary` on bg (light) | 2.23:1 | Fill-only; `primary-foreground` on `primary` = 8.50:1 |
| `warning` on bg (light) | 1.93:1 | Badge fill; `warning-foreground` on `warning` = 9.82:1 |
| `success` on bg (light) | 2.96:1 | Badge fill; `success-foreground` on `success` = 9.31:1 |
| `info` on bg (light) | 3.62:1 | Badge fill; `info-foreground` on `info` = 7.66:1 |
| `destructive` on bg (light) | 5.33:1 | Button fill; now passes after darkening |


### Typography Accessibility
- `text-wrap: balance` on h1–h3 for even line lengths
- `text-wrap: pretty` on long prose to reduce orphans
- Line length cap: 65–75ch for prose (empty states, descriptions). Data tables can run denser
- Body text: 14px minimum on mobile. No text smaller than 12px

### Content Accessibility
- Semantic headings and landmarks
- All images have descriptive alt text
- Charts include textual summaries or stat labels
- Category colors never carry meaning alone (always paired with text or icon)


---

## Responsive Patterns

### Breakpoints

```css
--breakpoint-sm: 640px;   /* mobile landscape */
--breakpoint-md: 768px;   /* tablet */
--breakpoint-lg: 1024px;  /* desktop */
--breakpoint-xl: 1280px;  /* wide desktop */
--breakpoint-2xl: 1536px; /* ultra-wide */
```

### Grid System

- **Columns**: 12-column grid at desktop, 4-column at mobile
- **Gutters**: `space-4` (16px) at mobile, `space-6` (24px) at desktop
- **Margins**: `space-4` (16px) at mobile, `space-8` (32px) at desktop
- **Max content width**: `max-w-7xl` (1280px) for page content, `max-w-2xl` (672px) for reading-focused layouts

### Container Widths

| Context | Max width | Notes |
|---------|-----------|-------|
| Page content | `1280px` | Standard page layouts |
| Reading / forms | `672px` | Articles, settings, auth flows |
| Narrow (modals) | `480px` | Confirmation dialogs, quick actions |

### Mobile-First

Start with mobile layout, add complexity at larger breakpoints. Responsive behavior is structural (collapse sidebar, responsive table, breakpoint-driven columns), not fluid typography. Key principles:
- Stack vertically at mobile, use grid at desktop
- Hide secondary navigation behind hamburger/drawer at mobile
- Tables become card lists at mobile
- Sidebars become sheets/drawers at mobile

### CSS-Only Responsive Grids

Use `repeat(auto-fit, minmax(280px, 1fr))` for responsive grids that adapt without explicit breakpoints.

---

## Component Conventions

**shadcn style**: `new-york`
**Icons**: `@phosphor-icons/react` — weight `regular` default, `fill` for active/selected states
**Radius**: `--radius` = `8px` (maps to `--radius-md`)

### Component Anatomy

Every component has five observable properties:

1. **Anatomy** — labeled parts (icon, label, helper text, etc.)
2. **States** — default, hover, focus, active, disabled, loading, error
3. **Tokens** — which design tokens it consumes
4. **Variants** — size, style, or behavioral variations
5. **Behavior** — keyboard interaction, screen reader announcement

### Forms

- Always vertical stack: Label → Input → Helper/Error
- Error state: `--destructive` border + error text below input
- Required indicator: asterisk in `--destructive`, never "(required)"

```tsx
// Form field pattern
<div className="flex flex-col gap-2">
  <Label htmlFor="email">
    Имэйл <span className="text-destructive">*</span>
  </Label>
  <Input id="email" type="email" placeholder="name@example.com" />
  <p className="text-sm text-muted-foreground">Таны хувийн имэйл</p>
</div>
```

### Modals / Overlays

See [Overlay Patterns](#overlay-patterns) for the full overlay decision table, drawer behavior, and nested drawer patterns.
### Empty States

Always include: what goes here + single primary action CTA. Never just an icon.

```tsx
// Empty state pattern
<div className="flex flex-col items-center justify-center py-12 text-center">
  <Package className="size-12 text-muted-foreground mb-4" />
  <h3 className="text-lg font-semibold">Бараа байхгүй байна</h3>
  <p className="text-sm text-muted-foreground mt-1 max-w-sm">
    Шинэ бараа нэмж эхлэх боломжтой
  </p>
  <Button className="mt-4">Бараа нэмэх</Button>
</div>
```

### Loading

- Skeleton over spinner for content areas
- Spinner only for button actions and page-level loading
- Preserve chrome (tabs, headers, buttons) on refetch — only skeleton data-dependent areas
- Skeleton → content transition should be smooth, not jarring

```tsx
// Skeleton pattern for content loading
<div className="flex flex-col gap-4">
  <Skeleton className="h-4 w-3/4" />
  <Skeleton className="h-4 w-1/2" />
  <Skeleton className="h-32 w-full" />
</div>
```

### Component States

| State | Visual treatment | When to show |
|-------|-----------------|--------------|
| Default | Normal styling | Ready for interaction |
| Hover | `--shadow-card-hover`, color shift | Mouse over interactive element |
| Focus | `--ring` outline, 2px offset | Keyboard navigation reached this element |
| Active | Scale 0.98, `--duration-fast` | Mouse down / tap in progress |
| Disabled | 50% opacity, `cursor-not-allowed` | Temporarily unavailable |
| Loading | Skeleton or spinner replacing content | Data fetching in progress |
| Error | `--destructive` border, error text | Validation failed or action rejected |

---

## Patterns

Patterns show how components combine into common product flows. Without patterns, teams solve the same problem differently.

### Form Pattern

**Problem**: User needs to input structured data (create, edit, settings).

**Components**: Sheet (desktop) or Drawer (mobile) → Form → Input fields → Submit/Cancel buttons.

**Layout**:
- Flex column with `gap-4` between fields
- Section headings with `text-lg font-semibold` and `gap-2` below
- Submit button at bottom, full width on mobile
- Cancel as secondary button or link

**Edge cases**:
- Long forms: split into sections with headings
- Unsaved changes: warn before close (use `beforeunload` on web)
- Server errors: show at top of form, not inline

### Confirmation Flow

**Problem**: User is about to do something irreversible.

**Components**: Dialog → Title → Description → Cancel / Confirm buttons.

**Rules**:
- Title restates the action: "Барааг устгах уу?" not "Итгэлтэй байна уу?"
- Description states consequences: "Энэ үйлдлийг буцаах боломжгүй"
- Confirm button uses `--destructive` for destructive actions
- Confirm label is the action verb: "Устгах", "Засах", "Нэмэх"
- Cancel is always the first button (left side)

### Error Handling

**Problem**: Something went wrong and the user needs to understand what happened.

**Pattern**:
- Inline errors (form validation): `--destructive` text below the field
- Page-level errors: centered message with retry button
- Network errors: toast notification with retry option

**Voice**: "What went wrong + what to do" — never just "Error occurred."

### Data Table Pattern

**Problem**: Displaying lists of records with actions.

**Components**: Table → Header → Rows → Pagination or infinite scroll.

**Rules**:
- Sortable columns: visual indicator (chevron) in header
- Row actions: three-dot menu (Popover) at row end
- Empty state when no data
- Skeleton loading when fetching
- Selection: checkbox column for bulk actions

### Navigation Pattern

**Problem**: Moving between sections of the app.

**Desktop**: Sidebar navigation (persistent, collapsible)
**Mobile**: Bottom tab bar (max 5 items) + hamburger for overflow

**Rules**:
- Active item: `--accent` background + `--primary` text
- Icons: Phosphor `regular` weight for inactive, `fill` for active
- Group related items with section headings
- Badge counts on items with notifications

---

## Guardrails

These rules prevent the most common design drift, especially from AI-generated code. For formal design invariants, see [Rules](#rules); for banned patterns with rationale, see [Anti-Patterns](#anti-patterns).

### NEVER

- Use colors outside the token system — only oklch values from `globals.css`
- Use purple-to-blue gradients as primary CTA
- Use coral/salmon/teal+orange color combos
- Use Inter/Roboto/Arial as display font
- Use centered hero + 3 feature cards layout
- Use glassmorphism or neumorphism
- Use `rounded-2xl+` on everything
- Use emoji as bullet points
- Use "Welcome to..." hero text
- Use placeholder text (lorem ipsum)
- Animate width/height — use transform + opacity
- Use spinners for content loading — use skeleton
- Pair `border` + `box-shadow` on the same element

### ALWAYS

- Use tokens from `globals.css` (oklch format, never raw hex)
- Use Geist Sans (UI) + Instrument Serif (display)
- Use Phosphor Icons (regular weight, fill for active)
- Use skeleton loaders for content areas
- Use `--success`, `--warning`, `--info` for status states (never invent ad-hoc colors)
- Use `--destructive-text` for inline error messages (not `--destructive`)
- Respect `prefers-reduced-motion`
- Use 4px spacing grid (4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96)
- Create asymmetric layouts (not everything centered)
- Use real Mongolian content (not placeholder)
- List transition properties explicitly (never `transition: all`)

---

## Voice & Tone

- **Concise** — fewer words, same meaning
- **Direct** — "Do X" not "Try doing X"
- **Human** — plain language unless the audience is technical
- **Confident** — state facts, no hedging

| Context | Pattern | Example |
|---------|---------|---------|
| Error | What went wrong + what to do | "Холболт тасарсан. Дахин оролдоно уу." |
| Success | Confirm the action, nothing more | "Хадгалагдсан" |
| Empty state | What goes here + first action | "Бараа байхгүй байна. Бараа нэмэх." |
| Destructive confirm | Restate consequences, not just "Are you sure?" | "Энэ үйлдлийг буцаах боломжгүй. Устгах уу?" |

---

## Product Naming

Use the parent brand as `Zuiio`. Public product names should be clear enough to stand alone, with "by Zuiio" used when the parent brand needs to be explicit.

Examples:

- `Zer by Zuiio`
- `Tolom by Zuiio`
- `Tumurch by Zuiio`
- `Tamga by Zuiio`

### Product Token Overrides

Each product shares the violet brand, warm neutral backgrounds, and the full semantic token set. Products only override **`--color-primary`** and **`--color-primary-foreground`** — nothing else.

| Product | Accent hue | `--color-primary` | `--color-primary-foreground` |
|---------|------------|--------------------|------------------------------|
| Core / default | `195` (teal) | `oklch(0.70 0.16 195)` | `oklch(0.13 0.003 80)` |
| Zer (ERP) | `165` (green) | `oklch(0.64 0.18 165)` | `oklch(0.13 0.003 80)` |
| Tolom (repair) | `265` (indigo) | `oklch(0.52 0.22 265)` | `oklch(0.13 0.003 80)` |
| Tumurch (fitness) | `80` (amber) | `oklch(0.78 0.18 80)` | `oklch(0.13 0.003 80)` |
| Tamga (consumer) | `285` (purple) | `oklch(0.55 0.20 285)` | `oklch(0.98 0.005 80)` |

Each product's `globals.css` overrides only these two tokens:

```css
/* apps/zer/globals.css */
@import "@zuiio/branding/globals.css";

/* Zer product overrides */
:root {
  --color-primary: oklch(0.64 0.18 165);
  --color-primary-foreground: oklch(0.13 0.003 80);
  --color-ring: oklch(0.64 0.18 165);
}
```

Products get their own phosphor icon (consistent weight for product marks). New products must follow this override pattern — only change `--color-primary` and its foreground pair.

---

## Governance

### Ownership

DESIGN.md is maintained alongside `@zuiio/branding`. Token changes require updating both the CSS source of truth and this document.

### How to Propose Changes

1. **New token**: Add to `globals.css` first, then document here with usage rules.
2. **New component pattern**: Document in the Patterns section with the problem it solves, components involved, and edge cases.
3. **Breaking token change**: Requires updating all apps that consume the changed token. Document migration steps.

### Versioning

- **Token additions**: Minor change. Add to globals.css, update this doc.
- **Token renames/removals**: Breaking change. Migrate all consumers, update this doc, communicate to team.
- **Pattern additions**: Non-breaking. Add to Patterns section.

---

## File Conventions

```text
packages/branding/         — CSS brand tokens (source of truth)
packages/branding/src/     — JS/TS token constants for programmatic access
apps/*/globals.css         — per-app shadcn-compatible CSS variables
apps/*/components.json     — shadcn config per app
```

All color, motion, spacing, and shadow values derive from `@zuiio/branding`. The CSS variables in `packages/branding/globals.css` are the single source of truth. Each app imports these and overlays only its app-specific shadcn semantic tokens.

```css
/* apps/<app>/globals.css */
@import "@zuiio/branding/globals.css";   /* brand tokens, spacing, motion, shadows */
/* … then app-specific shadcn semantic tokens … */
```

### Font Loading

Apps must load Geist Sans, Instrument Serif, and Geist Mono. Recommended approach:

```tsx
// apps/<app>/layout.tsx
import { Geist, Geist_Mono } from "next/font/geist";
import { Instrument_Serif } from "next/font/instrument-serif";

const geistSans = Geist({ variable: "--font-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-mono", subsets: ["latin"] });
const instrumentSerif = Instrument_Serif({
  variable: "--font-display",
  subsets: ["latin"],
  weight: "400",
});

export default function Layout({ children }) {
  return (
    <body className={`${geistSans.variable} ${geistMono.variable} ${instrumentSerif.variable} font-sans`}>
      {children}
    </body>
  );
}
```
---

## Rules

These are design invariants. Every product inherits them. Deviation requires documented rationale in the product's DESIGN.md.

### The Brand Color Rule
Violet is brand identity only — logo, shadow-brand glow, gradient. Teal (or the product's accent hue) is the interactive color: links, active states, focus rings, buttons. Never swap their roles.

### The Semantic Color Rule
Success, warning, destructive, and info colors are reserved for their semantic meaning. Never used for emphasis, decoration, or "making things pop." One error alert on screen at a time is enough; two means a design failure.

### The One Family Rule
Geist Sans carries every typographic role: headings, body, labels, buttons, data. Products may override the font family (e.g., Tolom uses Inter) but must document why. No serif + sans pairing in product UI; Instrument Serif is display-only.

### The Flat-By-Default Rule
Surfaces are flat at rest. Shadows appear only as a response to state (hover, elevation, focus) or for UI that genuinely floats above the page (dropdowns, modals, tooltips). If a surface isn't floating, it doesn't cast a shadow.

### The Accent Scarcity Rule
The primary accent color appears on ≤15% of any given screen. Submit buttons, the logo, and nothing else. Links and interactive text use foreground, never primary.

### The Ghost-Card Ban
Never pair `border: 1px solid X` with `box-shadow: 0 Npx Mpx ...` (M ≥ 16px) on the same element. Pick one structural separator: either a border/ring OR a shadow, never both as decoration.

### The Gap Rule
Use `gap-*` with flex for spacing between elements. Never use `space-y-*` or `space-x-*`.

### The Card Radius Ceiling
Cards top out at `--radius-xl` (16px). Full-pill (`border-radius: 9999px`) is reserved for badges, tags, and avatars only.

---

## Anti-Patterns

These patterns are banned across all products. If you're about to write any of these, rewrite with different structure.

| Pattern | Why it's banned | Use instead |
|---------|----------------|-------------|
| Gradient text (`background-clip: text`) | Decorative, never meaningful | Solid color; emphasis via weight or size |
| Side-stripe borders (`border-left > 1px`) | Colored accent on cards/lists | Full borders, background tints, or leading icons |
| `space-y-*` / `space-x-*` | Inconsistent with flex-first layout | `gap-*` with flex |
| `bg-background` for card surfaces | Confuses page canvas with raised surfaces | `bg-card` |
| `border-radius: 32px+` on cards | Over-rounded, looks toy-like | Max `--radius-xl` (16px) |
| Raw color values (`bg-blue-500`) | Bypasses token system | Semantic tokens (`bg-primary`) |
| Custom modals/selects/tooltips | Reinvents shadcn/ui components | Use the library component |
| Modal as first choice | Interrupts flow unnecessarily | Inline editing, expandable sections, drawers first |
| Display fonts in UI labels | Wrong register for functional text | Geist Sans weight/size hierarchy |
| Identical card grids (icon + heading + text) | Template feel, no information hierarchy | Vary card types and content density |
| Enterprise bloat (dense nested tables, multi-level dropdowns) | Overwhelming for B2B users | Progressive disclosure, section cards |

---

## Components

### Buttons

| Size | Height | Use case |
|------|--------|----------|
| `xs` | 24px | Inline chips, tight spaces |
| `sm` | 28px | Compact toolbars, secondary actions |
| `default` | 32px | Most actions |
| `lg` | 36px | Primary CTAs |

**Variants**: primary, outline, secondary, ghost, destructive.
**Focus**: `ring-3 ring-ring/50` with `border-ring` — 3px halo at 50% opacity.
**Active state**: 1px downward translate for tactile press feel.
**Icon buttons**: Match the height of their text siblings.

### Chips & Badges

- Pill-shaped (`rounded-4xl` ≈ 26px). 20px tall, 2px vertical padding, 8px horizontal.
- **Default**: primary background, white text (status indicators, counts).
- **Secondary**: gray background, dark text (categories, tags).
- **Destructive**: 10% error background, error text.
- **Outline**: primary border, transparent background (filter chips, removable tags).

### Cards

- **Radius**: `rounded-xl` (16px max). See [Rules > The Card Radius Ceiling](#the-card-radius-ceiling).
- **Border**: Default is shadow-sm or ring-1 ring-foreground/10 (product chooses). Never pair both. See [Rules > The Ghost-Card Ban](#the-ghost-card-ban).
- **Internal padding**: 16px default, 12px compact variant.
- **Footer** (optional): Gray background at 50% opacity, top border, rounded bottom corners.

### Inputs & Fields

- **Height**: 32px (`h-8`) default, 40px (`h-10`) for auth/forms.
- **Border**: `border-input`, transparent background.
- **Focus**: Border shifts to primary, 3px halo (`ring-3 ring-ring/50`).
- **Error**: Error border + error ring. Visible error text below input.
- **Disabled**: 50% opacity, muted background. Pointer events disabled.
- **Placeholder**: `--muted-foreground` at full contrast. Must meet 4.5:1 on the background.

### Detail Drawer (Sheet)

- **Role**: Side panel for creating, editing, viewing records. Replaces page navigation.
- **Layout**: Header (shrink-0, border-bottom) → Body (flex-1, scrollable) → Footer (shrink-0, border-top). Footer buttons connect via `form="<id>"`.
- **Width**: Full-width on mobile. Desktop: `md` (448px), `lg` (512px), `2xl` (672px).
- **Header**: Title + optional `actions` slot for buttons.

### Sidebar

- **Width**: 16rem expanded, 3rem collapsed. Mobile: 18rem as sheet overlay.
- **States**: Expanded (labels), collapsed (icons only), hover-expanded (icons, labels on hover).
- **Surface**: Dark (`oklch(0.2 0.004 80)`), light text. Active item gets accent color.

---

## Overlay Patterns

| Use case | Component | Placement |
|----------|-----------|-----------|
| Form / edit | Sheet / DetailDrawer | Right side |
| Confirm / destructive | Dialog | Center |
| Mobile primary action | Drawer | Bottom |
| Quick info | Popover | Near trigger |

### Drawer Content Rhythm
- Stack sections vertically inside drawers.
- Switch to 2-column only when drawer width comfortably supports it (≥512px).
- Sticky headers must remain visually contained; avoid full-bleed sticky bars competing with footer actions.
- Content padding: `space-6` (24px) at all breakpoints.

### Nested Drawers
- Use `NestedDrawerPanel` (inline, not portal-based).
- Slides in from right with 450ms cubic-bezier animation.
- Parent header/footer remain visible, creating stacked paper feel.
- Includes breadcrumb back button showing parent title.
- Close button dismisses nested panel and returns to parent content.

### Mobile Drawer Behavior
- Default width: `28rem`, capped at `calc(100vw - 3rem)` (leaves 3rem peek).
- Supports swipe-to-close via right-side bleed area (`--bleed: 3rem`).
- Handles iOS safe-area with `supports(-webkit-touch-callout: none)`.


## Product Overrides

Products may deviate from root defaults. The five products defined in the YAML frontmatter — Core, Zer, Tolom, Tumurch, Tamga — each inherit all root tokens and may override the fields below. Document every override in the product's `DESIGN.md` with rationale.

| Field | Root default | Override mechanism |
|-------|-------------|-------------------|
| Accent hue | Teal (195°) | CSS variable `--primary` in product globals.css |
| Font family | Geist Sans | Product DESIGN.md typography section |
| Elevation | Shadow scale | Product DESIGN.md elevation section |
| Radius scale | sm=4, md=8, lg=12, xl=16 | CSS variable `--radius` in product globals.css |
| Code font | Geist Mono | Product DESIGN.md typography section |

For the specific accent hue values per product, see [Product Token Overrides](#product-token-overrides).

**Rule**: If a product deviates, the deviation must be documented with rationale. Silent forks become dead documentation.

---

## Creative North Stars

Each product has a named metaphor that guides design decisions. When in doubt, ask "does this fit the metaphor?"

| Product | North Star | Guiding principle |
|---------|-----------|-------------------|
| Core / default | Precision & Confidence | Minimal, precise, trustworthy |
| Zer (ERP) | Warm Utility | Dense enough for daily ERP, softened with quiet surfaces |
| Tolom (auto repair) | Workshop Counter | Clean, organized, purposeful — tools in their place |
| Zuiio ID (auth) | Secure Threshold | Restrained confidence — identity handled carefully |
| Onoo (basketball) | Editorial Energy | Energetic, data-rich, editorially composed |

---

## Product Design Doc Template

Every product DESIGN.md should follow this structure (see `apps/onoo/DESIGN.md` as the model):

```markdown
# [Product] Design System

## Stack
Framework, styling, components, charts, icons, motion — reference root where shared.

## Product Character
One paragraph: what this product feels like, who it's for, what it rejects.

## Tokens
Only tokens that DEVIATE from root. Reference root for shared tokens.

## Decisions
Date-stamped design decisions with rationale. This is the living history.

## Component Inventory
Component name → file path. Agents need to know what exists.

## Responsive Contract
Breakpoint → layout behavior. What changes at each width.

## Accessibility
Product-specific a11y requirements beyond root defaults.

## Non-Goals
What this product explicitly does NOT include. Prevents scope creep.
```
