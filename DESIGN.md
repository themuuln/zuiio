# Zer Design System

## 1. Atmosphere & Identity

Zer should feel like a calm, practical operations desk for Mongolian small-business teams. The signature is warm utility: dense enough for daily ERP work, but softened with quiet surfaces, rounded panels, and restrained color so the interface feels reliable instead of harsh.

## 2. Color

### Palette

| Role              | Token                  | Light                       | Dark                        | Usage                                |
| ----------------- | ---------------------- | --------------------------- | --------------------------- | ------------------------------------ |
| Surface/primary   | `--background`         | `oklch(0.98 0.01 95)`       | `oklch(0.145 0 0)`          | App background                       |
| Surface/secondary | `--muted`              | `oklch(0.955 0.015 95)`     | `oklch(0.269 0 0)`          | Muted panels, section fills          |
| Surface/elevated  | `--card`               | `oklch(0.995 0.01 95)`      | `oklch(0.205 0 0)`          | Cards, drawers, popovers             |
| Text/primary      | `--foreground`         | `oklch(0.22 0.02 55)`       | `oklch(0.985 0 0)`          | Headings, primary content            |
| Text/secondary    | `--muted-foreground`   | `oklch(0.49 0.03 60)`       | `oklch(0.708 0 0)`          | Helper copy, metadata                |
| Text/on-accent    | `--primary-foreground` | `oklch(0.98 0.01 95)`       | `oklch(0.205 0 0)`          | Text on primary actions              |
| Border/default    | `--border`             | `oklch(0.89 0.02 85)`       | `oklch(1 0 0 / 10%)`        | Panel borders, dividers              |
| Border/input      | `--input`              | `oklch(0.9 0.02 85)`        | `oklch(1 0 0 / 15%)`        | Inputs and controls                  |
| Accent/primary    | `--primary`            | `oklch(0.43 0.11 215)`      | `oklch(0.922 0 0)`          | Primary buttons, links, focus states |
| Accent/secondary  | `--accent`             | `oklch(0.92 0.04 175)`      | `oklch(0.269 0 0)`          | Hover surfaces, selected rows        |
| Status/error      | `--destructive`        | `oklch(0.577 0.245 27.325)` | `oklch(0.704 0.191 22.216)` | Errors, destructive actions          |
| Focus/ring        | `--ring`               | `oklch(0.57 0.11 215)`      | `oklch(0.556 0 0)`          | Focus rings and keyboard highlights  |

### Rules

- Warm neutrals are the default background language. Avoid stark white and decorative saturated fills.
- `--primary` is reserved for actions, active states, and numeric emphasis. Do not use it for large decorative backgrounds.
- `--accent` is for hover or selected surfaces, not for key actions.
- New semantic colors must be added here before use.

## 3. Typography

### Scale

| Level    | Size        | Weight | Line Height | Tracking   | Usage                  |
| -------- | ----------- | ------ | ----------- | ---------- | ---------------------- |
| Display  | `2rem`      | 600    | 1.15        | `-0.02em`  | Large page statements  |
| H1       | `1.5rem`    | 600    | 1.2         | `-0.015em` | Drawer and page titles |
| H2       | `1.125rem`  | 600    | 1.3         | `-0.01em`  | Section titles         |
| H3       | `1rem`      | 600    | 1.35        | `0`        | Card titles            |
| Body     | `0.875rem`  | 400    | 1.6         | `0`        | Default body text      |
| Body/sm  | `0.8125rem` | 400    | 1.5         | `0`        | Supportive text        |
| Caption  | `0.75rem`   | 500    | 1.4         | `0.02em`   | Labels, metadata       |
| Overline | `0.6875rem` | 600    | 1.3         | `0.08em`   | Dense table headers    |

### Font Stack

- Primary: `Geist`, system sans-serif
- Mono: `JetBrains Mono`, `Geist Mono`, monospace
- Serif: none

### Rules

- Interface chrome, data labels, and ERP summaries may lean on the mono stack for precision.
- Section headers should stay compact and weighted, never oversized marketing typography.
- Body text should generally stay between 13px and 16px.

## 4. Spacing & Layout

### Base Unit

All spacing derives from a 4px base.

| Token        | Value | Usage                       |
| ------------ | ----- | --------------------------- |
| `--space-1`  | 4px   | Tight icon gaps             |
| `--space-2`  | 8px   | Compact inline groups       |
| `--space-3`  | 12px  | Dense control spacing       |
| `--space-4`  | 16px  | Default card padding edge   |
| `--space-5`  | 20px  | Comfortable section padding |
| `--space-6`  | 24px  | Large card padding          |
| `--space-8`  | 32px  | Separation between sections |
| `--space-10` | 40px  | Page section rhythm         |

### Grid

- Max content width: `1280px`
- Content rhythm inside drawers: stack sections vertically; switch to 2-column only when the drawer width comfortably supports it.
- Breakpoints: `sm 640`, `md 768`, `lg 1024`, `xl 1280`

### Rules

- Default card padding is 16px on mobile and 20px to 24px on larger surfaces.
- Dense transactional forms should use section cards to break up long stacks.
- Sticky regions in drawers must remain visually contained; avoid full-bleed sticky bars that compete with footer actions.

## 5. Components

### Slide-in drawer

- Structure: header, scrollable body, optional sticky footer actions
- Variants: standard, nested
- Spacing: `--space-6` outer padding, `--space-4` section gaps
- States: open, closing, nested, disabled actions
- Accessibility: visible close control, focus management via Base UI drawer
- Motion: transform-based slide in from the right

#### Standard drawer (SlideInDrawer / DrawerLayout with title+footer)

- Header is a full-width strip with `bg-card` surface and `border-b` bottom border.
  Includes title, optional description, and close button (right-aligned).
- Scrollable content fills the space between header and footer.
- Footer is a full-width strip with `bg-card` surface and `border-t` top border.
  Contains action buttons (Cancel + Submit), right-aligned via `DrawerFooter`.
- Never put header or footer inside the scrollable content area.
  Use the `title`/`description`/`footer` props on `SlideInDrawer` or `DrawerLayout`.

#### Nested drawer

- Nested drawers must use `NestedDrawerPanel` (inline inside the parent drawer content area),
  NOT a separate portal-based `DrawerLayout` or `SlideInDrawer`.
- `NestedDrawerPanel` renders with `absolute` positioning inside a `relative` parent container.
- It slides in from the right with the same `450ms` cubic-bezier animation.
- The parent drawer's header and footer remain visible, creating a stacked paper feel.
- Includes a breadcrumb back button showing the parent title.
- The close button dismisses the nested panel and returns to parent content.

#### Mobile behavior

- Drawer panel defaults to `28rem` width, capped at `calc(100vw - 3rem)` on mobile (leaves 1.5rem peek of the main page).
- All touch targets must be at least `44px` height for mobile accessibility.
- Drawer supports swipe-to-close via the right-side bleed area (`--bleed: 3rem`).
- Content padding is `--space-6` (24px) on all breakpoints, with appropriate bleed compensation.
- On iOS, the `supports-[-webkit-touch-callout:none]` overrides handle the safe-area adjustments.

### Form section card

- Structure: title, short description, grouped controls inside a bordered card
- Variants: neutral card, muted summary card
- Spacing: `--space-4` mobile, `--space-5` desktop
- States: default, validation error inside fields, disabled
- Accessibility: each section needs a text heading and explicit labels
- Motion: no section-level animation beyond drawer entrance

### Compact metric tile

- Structure: small label over a stronger numeric value
- Variants: neutral, highlighted for totals
- Spacing: `--space-3` inner padding
- States: default, warning when supporting note appears
- Accessibility: labels must explain the number without surrounding context
- Motion: none

## 6. Motion & Interaction

### Timing

| Type     | Duration | Easing                           | Usage                       |
| -------- | -------- | -------------------------------- | --------------------------- |
| Micro    | `120ms`  | `ease-out`                       | Button press, icon feedback |
| Standard | `200ms`  | `ease-in-out`                    | Hover and selection states  |
| Emphasis | `450ms`  | `cubic-bezier(0.32, 0.72, 0, 1)` | Drawer open and close       |

### Rules

- Only animate `transform`, `opacity`, `box-shadow`, or color/opacity transitions.
- Buttons, inputs, and selection rows must have visible hover, active, and focus states.
- Respect reduced-motion defaults by avoiding decorative animation inside ERP forms.

## 7. Depth & Surface

### Strategy

`mixed`

| Layer             | Treatment               | Usage                              |
| ----------------- | ----------------------- | ---------------------------------- |
| Base surface      | Tonal shift             | Page and app backgrounds           |
| Standard panels   | 1px border + tonal fill | Forms, cards, drawers              |
| Elevated overlays | Border + shadow         | Drawers, dropdowns, nested pickers |

### Rules

- Drawer and dropdown elevation may use shadows; ordinary section cards should rely mostly on border and tonal contrast.
- Prefer subtle tonal separation over stacked shadows.
- Border radii should stay in the `md` to `2xl` range already defined in the theme.
