---
name: TOLOM
description: Auto repair shop operating system — clean, organized, purposeful.
colors:
  workshop-ink: "oklch(0.205 0 0)"
  counter-white: "oklch(1 0 0)"
  shop-floor: "oklch(0.145 0 0)"
  dust-gray: "oklch(0.97 0 0)"
  steel: "oklch(0.556 0 0)"
  hairline: "oklch(0.922 0 0)"
  tool-red: "oklch(0.577 0.245 27.325)"
  dark-bg: "oklch(0.145 0 0)"
  dark-surface: "oklch(0.205 0 0)"
  dark-inverted-ink: "oklch(0.985 0 0)"
  dark-steel: "oklch(0.708 0 0)"
  dark-input: "oklch(0.269 0 0)"
typography:
  body:
    fontFamily: "SF Pro Display, Inter, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
  title:
    fontFamily: "SF Pro Display, Inter, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: 1.4
  headline:
    fontFamily: "SF Pro Display, Inter, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "-0.02em"
  label:
    fontFamily: "SF Pro Display, Inter, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0.01em"
  code:
    fontFamily: "JetBrains Mono, monospace"
    fontSize: "0.8125rem"
    fontWeight: 400
    lineHeight: 1.6
rounded:
  sm: "6px"
  md: "8px"
  lg: "10px"
  xl: "14px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  2xl: "32px"
  3xl: "48px"
components:
  button-primary:
    backgroundColor: "{colors.workshop-ink}"
    textColor: "{colors.counter-white}"
    rounded: "{rounded.lg}"
    padding: "8px 10px"
  button-primary-hover:
    backgroundColor: "{colors.workshop-ink}"
    textColor: "{colors.counter-white}"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.shop-floor}"
    rounded: "{rounded.lg}"
    padding: "8px 10px"
  card:
    backgroundColor: "{colors.counter-white}"
    rounded: "{rounded.xl}"
    padding: "16px"
  input:
    backgroundColor: "transparent"
    textColor: "{colors.shop-floor}"
    rounded: "{rounded.lg}"
    padding: "4px 10px"
  badge:
    backgroundColor: "{colors.workshop-ink}"
    textColor: "{colors.counter-white}"
    rounded: "{rounded.full}"
    padding: "2px 8px"
---

# Design System: TOLOM

## 1. Overview

**Creative North Star: "The Workshop Counter"**

Clean, organized, purposeful. Like a well-run auto shop — tools in their place, everything visible, nothing wasted. The interface should feel like stepping up to a counter where someone already knows what you need.

TOLOM's visual system is built on the zuiio design foundation and rendered through shadcn/ui (base-nova style). It inherits zuiio's precision and confidence but adds a layer of approachable warmth — the same quality, but in work clothes. SF Pro Display carries the typographic voice; a tight neutral palette keeps the surface quiet so the data speaks. Color is reserved for state (error, warning, success) and primary actions, not decoration.

This system explicitly rejects enterprise bloat (dense nested tables, dropdown overload), toy-like gamification, and generic SaaS templates. Every pixel on screen should answer "does this help someone run their shop."

**Key Characteristics:**

- Monochrome-neutral core with red for danger, no decorative color
- Single sans-serif family (SF Pro Display) for all UI text
- shadcn base-nova components with `--radius` at 0.625rem (10px)
- Ring-1 borders on cards instead of drop shadows for subtle structure
- Motion reserved for state changes (150–250ms, ease-out-quart)
- Tablet-native: 44px touch targets, SF Pro optimized for Apple clarity

## 2. Colors

The system runs on a tight neutral ladder — near-black for ink, pure white for canvas, and a handful of gray steps between. The austerity is intentional: no brand color stripe, no tinted backgrounds, no gradient accents. Color enters only through state: red for destructive actions and error states, green for success patterns, amber for warnings.

### Primary

- **Workshop Ink** `oklch(0.205 0 0)`: Primary buttons, active sidebar items, selected states. Also used as `--primary` for shadcn components. Near-black, not off-black — zero chroma for maximum contrast against white.

### Neutral

- **Counter White** `oklch(1 0 0)`: Page background, card backgrounds, input backgrounds. Pure white with zero tint — the workshop counter wiped clean.
- **Shop Floor** `oklch(0.145 0 0)`: Body text, headings, icons. Dark enough for ≥4.5:1 on white at all sizes. The ink that carries the information.
- **Dust Gray** `oklch(0.97 0 0)`: Secondary surfaces, hover backgrounds, muted regions. The subtle shade that says "this is secondary" without losing the white foundation.
- **Steel** `oklch(0.556 0 0)`: Muted foreground text, placeholder text, secondary labels. Light enough to recede; dark enough to pass ≥4.5:1 on Counter White at 14px+.
- **Hairline** `oklch(0.922 0 0)`: Borders, input strokes, dividers. Present but barely — structure without visual weight.

### Semantic

- **Tool Red** `oklch(0.577 0.245 27.325)`: Destructive actions, error states, validation failures. The only saturated color in the system. Used at full opacity for text, reduced to 10% background for subtle danger cues.

### Dark Mode

In dark mode, the neutral ladder inverts: dark backgrounds step from `oklch(0.145 0 0)` (canvas) to `oklch(0.205 0 0)` (card) to `oklch(0.269 0 0)` (secondary surface). Text runs `oklch(0.985 0 0)` for high contrast. Input backgrounds use `oklch(0.269 0 0)` at 30% opacity for a muted, glass-like field. Borders drop to 10% white-on-dark.

### Named Rules

**The No-Decoration Rule.** The primary color is used on actions, selections, and state indicators only. It does not appear as background washes, section tints, decorative borders, or brand flourishes. If you're reaching for primary to make something "look nice," stop.
**The Tool Red Rule.** Red means danger or error. It is never used for emphasis, decoration, or "making things pop." One red alert on screen at a time is enough; two means a design failure.

## 3. Typography

**Font Stack:** SF Pro Display (primary) with Inter fallback, both loaded as variable fonts. JetBrains Mono for code, monospaced values, and input fields where precision matters.

**Character:** SF Pro's clean geometry gives the interface a premium, tool-like clarity — the same typographic voice as Apple's own system interfaces, but applied to auto shop data. No serif display pairing; no decorative weights. One family, tuned across weights for hierarchy.

### Hierarchy

- **Headline** (600, `1.5rem / 24px`, line-height 1.3, letter-spacing -0.02em): Page titles, card titles. Used sparingly — most screens have exactly one headline.
- **Title** (600, `1rem / 16px`, line-height 1.4): Card titles, section headers within drawers, form group labels.
- **Body** (400, `0.875rem / 14px`, line-height 1.5): All body text, form labels, table cells, list items. Mobile-optimized at 16px then scales down to 14px on desktop via `md:text-sm`.
- **Label** (500, `0.75rem / 12px`, line-height 1.4, letter-spacing 0.01em): Badges, status indicators, sidebar section labels, form field labels in dense layouts. All-uppercase only in the DetailDrawer.Section eyebrow — never on every section.

### Named Rules

**The One Family Rule.** SF Pro Display carries every typographic role: headings, body, labels, buttons, data. No serif display font, no decorative weight, no secondary sans. The system's variety comes from weight, size, and spacing — not from font mixing.

## 4. Elevation

TOLOM uses subtle tonal layering rather than shadow gymnastics. Cards and raised surfaces get a 1px ring (`ring-1 ring-foreground/10`) — just enough to separate them from the white canvas. Dropdowns, modals, and tooltips get shadows (`--shadow-lg` at 0 10px 15px) because they genuinely float above the page. Everything else is flat.

This is the "counter" philosophy: a well-organized work surface with layers of paper and tools on top, not a 3D environment with deep perspective.

### Shadow Vocabulary

- **Surface ring** (`ring-1 ring-foreground/10`): Cards, raised panels, separated content regions. The default structural separator.
- **Floating** (`--shadow-lg: 0 10px 15px -3px oklch(0 0 0 / 0.10), 0 4px 6px -4px oklch(0 0 0 / 0.10)`): Dropdowns, popovers, tooltips, command palettes. For UI that genuinely floats.
- **Modal** (`--shadow-xl: 0 20px 25px -5px oklch(0 0 0 / 0.10), 0 8px 10px -6px oklch(0 0 0 / 0.10)`): Dialogs, sheets, modals. These interrupt the user; the shadow says so.

### Named Rules

**The Flat-By-Default Rule.** Surfaces are flat at rest. Shadows appear only as a response to state (hover, elevation, focus). If a surface isn't floating above something, it doesn't cast a shadow.

## 5. Components

### Buttons

- **Shape:** Rounded with `--radius-lg` (10px). Full pill not used for buttons — reserved for badges and tags. Icon buttons use matching radius.
- **Primary:** `bg-primary text-primary-foreground`. In light mode: Workshop Ink (near-black) on Counter White. Hover: 80% opacity of background. Active: 1px downward translate for tactile press feel.
- **Outline:** Transparent background, Hairline border. Hover: Dust Gray background. Used for secondary actions alongside primary buttons.
- **Secondary:** Dust Gray background with Shop Floor text. Hover: 5% darker via color-mix. For tertiary actions or grouped button bars.
- **Ghost:** No background, no border. Hover: Dust Gray background. For icon-only actions, toolbar buttons, inline actions.
- **Destructive:** 10% Tool Red background, Tool Red text. Hover: 20% background. For delete, remove, irreversible actions.
- **Sizes:** `xs` (24px) for inline chips, `sm` (28px) for compact toolbars, `default` (32px) for most actions, `lg` (36px) for primary CTAs. Icon buttons match: `icon-xs` (24px), `icon-sm` (28px), `icon` (32px), `icon-lg` (36px).
- **Focus:** `ring-3 ring-ring/50` with `border-ring` — a 3px halo in the ring color (Steel at 50% opacity).

### Chips & Badges

- **Style:** Pill-shaped (`rounded-4xl` = `calc(--radius * 2.6)` ≈ 26px). 20px tall, 2px vertical padding, 8px horizontal.
- **Default:** Primary background (Workshop Ink) with countertext. For status indicators and counts.
- **Secondary:** Dust Gray background with Shop Floor text. For categories and tags.
- **Destructive:** 10% Tool Red background with Tool Red text. For error states and warnings.
- **Outline:** Hairline border, transparent background. For filter chips and removable tags.

### Cards

- **Corner Style:** `rounded-xl` (14px from `--radius * 1.4`).
- **Background:** Counter White (`--card: oklch(1 0 0)`). Card foreground: Shop Floor.
- **Border:** `ring-1 ring-foreground/10` — a single hairline ring at 10% opacity, not a border stroke. Never paired with box-shadow (ghost-card ban).
- **Internal Padding:** CSS custom property `--card-spacing` defaults to `--spacing(4)` = 16px. Compact variant at `--spacing(3)` = 12px.
- **Footer:** Rounded bottom corners, Dust Gray background at 50% opacity, Hairline top border.

### Inputs & Fields

- **Style:** 32px tall (`h-8`), `rounded-lg` (10px), Hairline border (`border-input`), transparent background. Text at 16px on mobile, 14px on desktop.
- **Focus:** Border shifts to ring color, 3px halo (`ring-3 ring-ring/50`).
- **Error:** Tool Red border, Tool Red 20% ring. Dark mode: 50% border, 40% ring.
- **Disabled:** 50% opacity, 50% Dust Gray background on light, 80% input background on dark. Pointer events disabled.
- **Placeholder:** Steel (`--muted-foreground`) at full contrast. Never lightened further — placeholder must meet 4.5:1 on Counter White.

### Detail Drawer (Sheet)

- **Role:** Side panel for creating, editing, and viewing records. Replaces page navigation — keeps context intact.
- **Layout:** Header (shrink-0, Hairline bottom border) → Body (flex-1, scrollable) → Footer (shrink-0, Hairline top border). Footer buttons connect to form via `form="<id>"`.
- **Width:** Full-width on mobile, `sm:max-w-*` on desktop. Default: `lg` (512px). Compact forms: `md` (448px). Complex with tables: `2xl` (672px).
- **Header actions:** Optional `actions` slot for buttons alongside the title (e.g. "Manage Variants").

### Sidebar

- **Width:** 16rem expanded, 3rem collapsed. Mobile: 18rem as a sheet overlay.
- **States:** Expanded (full nav with labels), collapsed (icons only), hover-expanded (icons-only but temporarily shows labels on hover).
- **Style:** Dark sidebar surface (`--sidebar: oklch(0.205 0 0)`), light text. Primary active item gets violet accent from zuiio brand in dark mode.
- **Menu items:** Staggered entrance animation on expand — 50ms delay per item via CSS custom property `--stagger`.

### Empty States

- Always includes: what goes here + single primary action CTA. Never just an icon.
- Styled with muted text, centered layout, and a clear action button.

### Loading States

- Skeleton blocks for content areas (`animate-pulse`, muted background).
- Spinner only for button loading and page-level initial load.
- Content chrome (tabs, headers, buttons) preserved on refetch; only data-dependent areas skeleton.

## 6. Do's and Don'ts

### Do

- **Do** use a single sans-serif family (SF Pro Display) for all UI text — headings, body, labels, buttons, data.
- **Do** use `ring-1 ring-foreground/10` for card borders instead of box-shadows. Never pair both as decoration.
- **Do** keep card radius at 14px (`--radius-xl`) maximum. Cards are not rounded beyond recognition.
- **Do** use `gap-*` with flex for spacing, never `space-y-*` or `space-x-*`.
- **Do** preserve page chrome (tabs, headers, buttons) during data refetch — only skeleton-load content areas.
- **Do** cap body text line length at 65–75ch in prose contexts (empty states, descriptions).
- **Do** maintain 44px minimum touch targets on tablet layouts.
- **Do** use `text-wrap: balance` on h1–h3 for even line lengths.
- **Do** animate only transform and opacity — never layout properties (width, height, top, left).
- **Do** respect `prefers-reduced-motion` — crossfade or instant transition for all animations.

### Don't

- **Don't** use gradient text (`background-clip: text`). Solid color only; emphasis via weight or size.
- **Don't** use side-stripe borders (`border-left` or `border-right` > 1px) as colored accents on cards, list items, or callouts.
- **Don't** pair `border: 1px solid X` with `box-shadow: 0 Npx Mpx ...` (M ≥ 16px) on the same element. The "ghost-card" pattern. Pick one.
- **Don't** apply `border-radius: 32px+` on cards, sections, or inputs. Cards top out at 14px; full-pill is for tags and badges only.
- **Don't** use raw color values like `bg-blue-500`. Always use semantic tokens (`bg-primary`, `text-muted-foreground`).
- **Don't** use `space-y-*` or `space-x-*` — use `gap-*` with flex instead.
- **Don't** build from scratch what shadcn/ui provides. Never write custom modals, selects, or tooltips when the library has them.
- **Don't** use enterprise bloat patterns: dense nested tables, overwhelming data density, multi-level dropdowns.
- **Don't** use toy-like gamification, cartoonish illustrations, or playful interface patterns. This is real business software.
- **Don't** use display fonts or decorative type in UI labels, buttons, or data.
- **Don't** use modal dialogs as the first choice. Exhaust inline editing, expandable sections, and drawer panels first.
- **Don't** use `bg-background` or `oklch(1 0 0)` as API — use `bg-card` for surfaces that sit on the page background.
