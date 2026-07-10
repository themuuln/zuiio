---
name: TOLOM
description: Auto repair shop operating system — clean, organized, purposeful.
colors:
  # Electric Indigo Brand Palette
  indigo-50: "oklch(0.96 0.02 265)"
  indigo-100: "oklch(0.9 0.04 265)"
  indigo-200: "oklch(0.82 0.08 265)"
  indigo-300: "oklch(0.72 0.12 265)"
  indigo-400: "oklch(0.62 0.16 265)"
  indigo-500: "oklch(0.52 0.22 265)"  # PRIMARY
  indigo-600: "oklch(0.45 0.2 265)"
  indigo-700: "oklch(0.38 0.18 265)"
  indigo-800: "oklch(0.3 0.15 265)"
  indigo-900: "oklch(0.22 0.12 265)"

  # Warm Gray Neutrals
  gray-50: "oklch(0.98 0.005 80)"
  gray-100: "oklch(0.96 0.008 80)"
  gray-200: "oklch(0.92 0.01 80)"
  gray-300: "oklch(0.85 0.012 80)"
  gray-400: "oklch(0.7 0.01 80)"
  gray-500: "oklch(0.55 0.008 80)"
  gray-600: "oklch(0.4 0.006 80)"
  gray-700: "oklch(0.3 0.005 80)"
  gray-800: "oklch(0.2 0.004 80)"
  gray-900: "oklch(0.13 0.003 80)"

  # Semantic Colors
  success: "oklch(0.65 0.18 145)"
  warning: "oklch(0.75 0.18 85)"
  destructive: "oklch(0.6 0.22 25)"
  info: "oklch(0.6 0.15 240)"
typography:
  body:
    fontFamily: "Inter, system-ui, sans-serif"
    fontWeight: 400
    lineHeight: 1.5
  title:
    fontFamily: "Inter, system-ui, sans-serif"
    lineHeight: 1.4
  headline:
    fontFamily: "Inter, system-ui, sans-serif"
    lineHeight: 1.3
    letterSpacing: "-0.02em"
  label:
    fontFamily: "Inter, system-ui, sans-serif"
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
    backgroundColor: "{colors.indigo-500}"
    textColor: "{colors.indigo-50}"
    rounded: "{rounded.lg}"
    padding: "8px 10px"
  button-primary-hover:
    backgroundColor: "{colors.indigo-600}"
    textColor: "{colors.indigo-50}"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.indigo-500}"
    rounded: "{rounded.lg}"
    padding: "8px 10px"
  card:
    backgroundColor: "{colors.gray-50}"
    rounded: "{rounded.xl}"
    padding: "16px"
  input:
    backgroundColor: "transparent"
    textColor: "{colors.gray-900}"
    rounded: "{rounded.lg}"
    padding: "4px 10px"
  badge:
    backgroundColor: "{colors.indigo-500}"
    textColor: "{colors.indigo-50}"
    rounded: "{rounded.full}"
    padding: "2px 8px"
---

# Design System: TOLOM

## 1. Overview

**Creative North Star: "The Workshop Counter"**

Clean, organized, purposeful. Like a well-run auto shop — tools in their place, everything visible, nothing wasted. The interface should feel like stepping up to a counter where someone already knows what you need.

TOLOM's visual system is built on the zuiio design foundation and rendered through shadcn/ui (base-nova style). It inherits zuiio's precision and confidence but adds a layer of approachable warmth — the same quality, but in work clothes. Inter carries the typographic voice; a tight neutral palette keeps the surface quiet so the data speaks. Color enters through brand identity (Electric Indigo for actions, selections, and state) and semantic meaning (success, warning, error).

This system explicitly rejects enterprise bloat (dense nested tables, dropdown overload), toy-like gamification, and generic SaaS templates. Every pixel on screen should answer "does this help someone run their shop."

**Key Characteristics:**

- Electric Indigo brand color for primary actions and selections
- Warm gray neutrals for backgrounds and text
- Single sans-serif family (Inter) for all UI text
- shadcn base-nova components with `--radius` at 0.625rem (10px)
- Ring-1 borders on cards instead of drop shadows for subtle structure
- Motion reserved for state changes (150–250ms, ease-out-quart)
- Tablet-native: 44px touch targets, Inter optimized for screen readability
## 2. Colors

The system runs on Electric Indigo as the brand color with warm gray neutrals for backgrounds and text. The indigo is vibrant but professional — used for primary actions, selections, and state indicators. Color enters through semantic meaning: success (green), warning (amber), error (red).

### Brand: Electric Indigo

- **Indigo 50** `oklch(0.96 0.02 265)`: Lightest tint, used for accent backgrounds and hover states.
- **Indigo 100** `oklch(0.9 0.04 265)`: Light tint, used for secondary accent backgrounds.
- **Indigo 200** `oklch(0.82 0.08 265)`: Subtle tint, used for borders and dividers.
- **Indigo 300** `oklch(0.72 0.12 265)`: Muted, used for disabled text and placeholders.
- **Indigo 400** `oklch(0.62 0.16 265)`: Medium, used for links and secondary text in dark mode.
- **Indigo 500** `oklch(0.52 0.22 265)`: PRIMARY — buttons, CTAs, active states, focus rings.
- **Indigo 600** `oklch(0.45 0.2 265)`: Hover state for primary buttons.
- **Indigo 700** `oklch(0.38 0.18 265)`: Dark, used for focus rings and active states.
- **Indigo 800** `oklch(0.3 0.15 265)`: Darker, used for dark mode surfaces.
- **Indigo 900** `oklch(0.22 0.12 265)`: Darkest, used for text on light backgrounds.

### Neutral: Warm Gray

- **Gray 50** `oklch(0.98 0.005 80)`: Page background, card backgrounds. Warm off-white.
- **Gray 100** `oklch(0.96 0.008 80)`: Secondary surfaces, hover backgrounds, muted regions.
- **Gray 200** `oklch(0.92 0.01 80)`: Borders, input strokes, dividers.
- **Gray 300** `oklch(0.85 0.012 80)`: Light borders, subtle separators.
- **Gray 400** `oklch(0.7 0.01 80)`: Muted text, placeholder text.
- **Gray 500** `oklch(0.55 0.008 80)`: Secondary text, labels.
- **Gray 600** `oklch(0.4 0.006 80)`: Dark text, headings.
- **Gray 700** `oklch(0.3 0.005 80)`: Dark surfaces, dark mode cards.
- **Gray 800** `oklch(0.2 0.004 80)`: Darker surfaces, dark mode backgrounds.
- **Gray 900** `oklch(0.13 0.003 80)`: Darkest, dark mode canvas.

### Semantic

- **Success** `oklch(0.65 0.18 145)`: Confirmation, positive states, completed actions.
- **Warning** `oklch(0.75 0.18 85)`: Caution, pending states, attention needed.
- **Error** `oklch(0.6 0.22 25)`: Destructive actions, error states, validation failures.
- **Info** `oklch(0.6 0.15 240)`: Informational messages, help text.

### Dark Mode

In dark mode, the surface system inverts: dark backgrounds step from `oklch(0.13 0.003 80)` (canvas) to `oklch(0.2 0.004 80)` (card) to `oklch(0.3 0.005 80)` (elevated). Text runs `oklch(0.98 0.005 80)` for high contrast. Primary shifts to `oklch(0.62 0.16 265)` (Indigo 400) for better visibility on dark backgrounds. Borders use 10% white opacity.

### Named Rules

**The Brand Color Rule.** Electric Indigo is used on actions, selections, and state indicators only. It does not appear as background washes, section tints, decorative borders, or brand flourishes. If you're reaching for indigo to make something "look nice," stop.
**The Semantic Color Rule.** Success, warning, and error colors are reserved for their semantic meaning. They are never used for emphasis, decoration, or "making things pop." One error alert on screen at a time is enough; two means a design failure.

## 3. Typography

**Font Stack:** Inter (primary) loaded as variable font. JetBrains Mono for code, monospaced values, and input fields where precision matters.

**Character:** Inter's tall x-height and open apertures give the interface excellent readability at small sizes — perfect for data-dense auto shop dashboards. The font's neutral, professional tone matches the "Workshop Counter" philosophy. No serif display pairing; no decorative weights. One family, tuned across weights for hierarchy.

### Hierarchy

- **Headline** (600, `1.5rem / 24px`, line-height 1.3, letter-spacing -0.02em): Page titles, card titles. Used sparingly — most screens have exactly one headline.
- **Title** (600, `1rem / 16px`, line-height 1.4): Card titles, section headers within drawers, form group labels.
- **Body** (400, `0.875rem / 14px`, line-height 1.5): All body text, form labels, table cells, list items. Mobile-optimized at 16px then scales down to 14px on desktop via `md:text-sm`.
- **Label** (500, `0.75rem / 12px`, line-height 1.4, letter-spacing 0.01em): Badges, status indicators, sidebar section labels, form field labels in dense layouts. All-uppercase only in the DetailDrawer.Section eyebrow — never on every section.

### Named Rules

**The One Family Rule.** Inter carries every typographic role: headings, body, labels, buttons, data. No serif display font, no decorative weight, no secondary sans. The system's variety comes from weight, size, and spacing — not from font mixing.

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
- **Primary:** `bg-primary text-primary-foreground`. In light mode: Electric Indigo on white. Hover: Indigo 600. Active: 1px downward translate for tactile press feel.
- **Outline:** Transparent background, Indigo 200 border. Hover: Indigo 50 background. Used for secondary actions alongside primary buttons.
- **Secondary:** Gray 100 background with Gray 900 text. Hover: 5% darker via color-mix. For tertiary actions or grouped button bars.
- **Ghost:** No background, no border. Hover: Gray 100 background. For icon-only actions, toolbar buttons, inline actions.
- **Destructive:** 10% Error background, Error text. Hover: 20% background. For delete, remove, irreversible actions.
- **Sizes:** `xs` (24px) for inline chips, `sm` (28px) for compact toolbars, `default` (32px) for most actions, `lg` (36px) for primary CTAs. Icon buttons match: `icon-xs` (24px), `icon-sm` (28px), `icon` (32px), `icon-lg` (36px).
- **Focus:** `ring-3 ring-ring/50` with `border-ring` — a 3px halo in the ring color (Indigo 400 at 50% opacity).

### Chips & Badges

- **Style:** Pill-shaped (`rounded-4xl` = `calc(--radius * 2.6)` ≈ 26px). 20px tall, 2px vertical padding, 8px horizontal.
- **Default:** Primary background (Indigo 500) with white text. For status indicators and counts.
- **Secondary:** Gray 100 background with Gray 900 text. For categories and tags.
- **Destructive:** 10% Error background with Error text. For error states and warnings.
- **Outline:** Indigo 200 border, transparent background. For filter chips and removable tags.

### Cards

- **Corner Style:** `rounded-xl` (14px from `--radius * 1.4`).
- **Background:** Gray 50 (`--card: oklch(0.98 0.005 80)`). Card foreground: Gray 900.
- **Border:** `ring-1 ring-foreground/10` — a single hairline ring at 10% opacity, not a border stroke. Never paired with box-shadow (ghost-card ban).
- **Internal Padding:** CSS custom property `--card-spacing` defaults to `--spacing(4)` = 16px. Compact variant at `--spacing(3)` = 12px.
- **Footer:** Rounded bottom corners, Gray 100 background at 50% opacity, Gray 200 top border.

### Inputs & Fields

- **Style:** 32px tall (`h-8`), `rounded-lg` (10px), Gray 200 border (`border-input`), transparent background. Text at 16px on mobile, 14px on desktop.
- **Focus:** Border shifts to Indigo 400, 3px halo (`ring-3 ring-ring/50`).
- **Error:** Error border, Error 20% ring. Dark mode: 50% border, 40% ring.
- **Disabled:** 50% opacity, 50% Gray 100 background on light, 80% input background on dark. Pointer events disabled.
- **Placeholder:** Gray 500 (`--muted-foreground`) at full contrast. Never lightened further — placeholder must meet 4.5:1 on Gray 50.

### Detail Drawer (Sheet)

- **Role:** Side panel for creating, editing, and viewing records. Replaces page navigation — keeps context intact.
- **Layout:** Header (shrink-0, Gray 200 bottom border) → Body (flex-1, scrollable) → Footer (shrink-0, Gray 200 top border). Footer buttons connect to form via `form="<id>"`.
- **Width:** Full-width on mobile, `sm:max-w-*` on desktop. Default: `lg` (512px). Compact forms: `md` (448px). Complex with tables: `2xl` (672px).
- **Header actions:** Optional `actions` slot for buttons alongside the title (e.g. "Manage Variants").

### Sidebar

- **Width:** 16rem expanded, 3rem collapsed. Mobile: 18rem as a sheet overlay.
- **States:** Expanded (full nav with labels), collapsed (icons only), hover-expanded (icons-only but temporarily shows labels on hover).
- **Style:** Dark sidebar surface (`--sidebar: oklch(0.2 0.004 80)`), light text. Primary active item gets Electric Indigo accent in dark mode.
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

- **Do** use Electric Indigo for primary actions, selections, and state indicators — not for decoration.
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

# Design System: TOLOM

## 1. Overview

**Creative North Star: "The Workshop Counter"**

Clean, organized, purposeful. Like a well-run auto shop — tools in their place, everything visible, nothing wasted. The interface should feel like stepping up to a counter where someone already knows what you need.

TOLOM's visual system is built on the zuiio design foundation and rendered through shadcn/ui (base-nova style). It inherits zuiio's precision and confidence but adds a layer of approachable warmth — the same quality, but in work clothes. Inter carries the typographic voice; a tight neutral palette keeps the surface quiet so the data speaks. Color is reserved for state (error, warning, success) and primary actions, not decoration.

This system explicitly rejects enterprise bloat (dense nested tables, dropdown overload), toy-like gamification, and generic SaaS templates. Every pixel on screen should answer "does this help someone run their shop."

**Key Characteristics:**

- Monochrome-neutral core with red for danger, no decorative color
- Single sans-serif family (Inter) for all UI text
- shadcn base-nova components with `--radius` at 0.625rem (10px)
- Ring-1 borders on cards instead of drop shadows for subtle structure
- Motion reserved for state changes (150–250ms, ease-out-quart)
- Tablet-native: 44px touch targets, Inter optimized for screen readability
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

**Font Stack:** Inter (primary) loaded as variable font. JetBrains Mono for code, monospaced values, and input fields where precision matters.

**Character:** Inter's tall x-height and open apertures give the interface excellent readability at small sizes — perfect for data-dense auto shop dashboards. The font's neutral, professional tone matches the "Workshop Counter" philosophy. No serif display pairing; no decorative weights. One family, tuned across weights for hierarchy.

### Hierarchy

- **Headline** (600, `1.5rem / 24px`, line-height 1.3, letter-spacing -0.02em): Page titles, card titles. Used sparingly — most screens have exactly one headline.
- **Title** (600, `1rem / 16px`, line-height 1.4): Card titles, section headers within drawers, form group labels.
- **Body** (400, `0.875rem / 14px`, line-height 1.5): All body text, form labels, table cells, list items. Mobile-optimized at 16px then scales down to 14px on desktop via `md:text-sm`.
- **Label** (500, `0.75rem / 12px`, line-height 1.4, letter-spacing 0.01em): Badges, status indicators, sidebar section labels, form field labels in dense layouts. All-uppercase only in the DetailDrawer.Section eyebrow — never on every section.

### Named Rules

**The One Family Rule.** Inter carries every typographic role: headings, body, labels, buttons, data. No serif display font, no decorative weight, no secondary sans. The system's variety comes from weight, size, and spacing — not from font mixing.

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

- **Do** use a single sans-serif family (Inter) for all UI text — headings, body, labels, buttons, data.
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
