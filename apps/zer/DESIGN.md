# Zer — Design System

> **Shared design system**: [`docs/design.md`](../../docs/design.md) — tokens, rules, anti-patterns, components, accessibility, overlay patterns, and product template. This document covers only product-specific decisions.

## Stack

- Framework: Next.js 16 App Router with React Server Components
- Styling: Tailwind CSS v4 and `@zuiio/branding` semantic tokens
- Components: shadcn/ui new-york style (`components.json`)
- Charts: Recharts through local shadcn chart primitives
- Icons: `@phosphor-icons/react` (regular weight default, fill for active)
- Motion: CSS transitions; reduced-motion aware
- Forms: vertical layout, `Label → Input → Helper/Error` pattern
- Language: `mn_MN` — Mongolian throughout UI chrome

## Product Character

Zer is an operations desk for Mongolian small-business teams — ERP, inventory, invoicing, and accounting in one dense but readable surface. The visual language is warm utility: warm-neutral surfaces that feel human rather than corporate, a dark sidebar that grounds navigation, mono typography on data-heavy chrome for scan precision, and teal as the sole interactive accent. Zer rejects marketing typography, decorative fills, and any animation that slows transactional work.

## Tokens

All shared tokens (brand palette, typography scale, spacing, radius scale, shadows, motion) live in `@zuiio/branding/globals.css` and `docs/design.md`. Zer inherits these and overrides the semantic layer below.

### Semantic overrides (light mode)

| Token | Root value | Zer value | Rationale |
|---|---|---|---|
| `--background` | `oklch(0.98 0.005 80)` | `oklch(0.98 0.01 95)` | Warmer hue for friendlier workspace |
| `--foreground` | `oklch(0.13 0.003 80)` | `oklch(0.22 0.02 55)` | Lighter text; less ink-heavy for dense data |
| `--card` | `oklch(0.98 0.005 80)` | `oklch(0.995 0.01 95)` | Brighter elevated surfaces |
| `--card-foreground` | `oklch(0.13 0.003 80)` | `oklch(0.22 0.02 55)` | Matches foreground |
| `--popover` | `oklch(0.98 0.005 80)` | `oklch(0.995 0.01 95)` | Same as card |
| `--popover-foreground` | `oklch(0.13 0.003 80)` | `oklch(0.22 0.02 55)` | Matches foreground |
| `--primary` | `oklch(0.70 0.16 195)` | `var(--brand-teal)` = same | Inherited; teal is the interactive color |
| `--secondary` | `oklch(0.96 0.012 100)` | `oklch(0.94 0.02 95)` | Shifted warmer, more chromatic |
| `--secondary-foreground` | `oklch(0.13 0.003 80)` | `oklch(0.28 0.03 55)` | Lighter, warmer |
| `--muted` | `oklch(0.96 0.008 80)` | `oklch(0.955 0.015 95)` | Warmer neutral, more visible |
| `--muted-foreground` | `oklch(0.55 0.008 80)` | `oklch(0.49 0.03 60)` | Darker, more chromatic for legibility |
| `--accent` | `oklch(0.96 0.02 195)` | `oklch(0.92 0.04 175)` | Shifted cooler/greener; more saturated hover |
| `--accent-foreground` | `oklch(0.22 0.12 195)` | `oklch(0.24 0.03 175)` | Less chromatic on accent surfaces |
| `--destructive` | `oklch(0.6 0.22 25)` | `oklch(0.577 0.245 27.325)` | Slightly warmer red |
| `--border` | `oklch(0.92 0.01 80)` | `oklch(0.89 0.02 85)` | Darker, warmer dividers |
| `--input` | `oklch(0.92 0.01 80)` | `oklch(0.9 0.02 85)` | Slightly darker input borders |
| `--ring` | `oklch(0.70 0.16 195)` | `var(--brand-teal)` = same | Inherited |

### Semantic overrides (dark mode)

| Token | Root value | Zer value |
|---|---|---|
| `--primary` | `oklch(0.82 0.12 195)` | `var(--brand-teal-light)` = same |
| `--ring` | `oklch(0.82 0.12 195)` | `var(--brand-teal-light)` = same |
| `--border` | white at low opacity | `oklch(1 0 0 / 10%)` |
| `--input` | — | `oklch(1 0 0 / 15%)` |
| Charts 2–5 | colored | All desaturated grayscale |

### Sidebar (Zer-specific, no root equivalent)

| Token | Value |
|---|---|
| `--sidebar` | `oklch(0.24 0.03 245)` — dark navy |
| `--sidebar-foreground` | `oklch(0.95 0.01 95)` |
| `--sidebar-primary` | `var(--brand-teal)` |
| `--sidebar-primary-foreground` | `oklch(0.2 0.02 170)` |
| `--sidebar-accent` | `oklch(0.3 0.03 245)` |
| `--sidebar-accent-foreground` | `oklch(0.97 0.01 95)` |
| `--sidebar-border` | `oklch(1 0 0 / 10%)` |
| `--sidebar-ring` | `var(--brand-teal)` |

### Typography deviation

Root uses Geist Sans for all UI text. Zer sets `--font-heading: var(--font-mono)` and applies `html { @apply font-mono }` — the base font is Geist Mono. Mono is used for data labels, ERP summaries, and numeric chrome throughout. Sans is used only for body prose.

### Radius deviation

Root defines sm/md/lg/xl/full. Zer sets `--radius: 0.625rem` (10px) as the base, deriving:
- `sm` = 6px, `md` = 8px, `lg` = 10px, `xl` = 14px, `2xl` = 18px, `3xl` = 22px

## Decisions

- 2026-07-14 — Warm-neutral surfaces (hue 95) replace root's neutral (hue 80) to soften the dense ERP chrome.
- 2026-07-14 — Global `font-mono` baseline: ERP data and labels benefit from mono character width consistency.
- 2026-07-14 — Dark navy sidebar (`hue 245`) grounds navigation visually without competing with content.
- 2026-07-14 — Teal remains the sole interactive accent via `var(--brand-teal)`; no product hue shift applied despite root product config.
- 2026-07-14 — Dark-mode charts desaturate to grayscale; colored charts are light-mode only.
- 2026-07-15 — 44px minimum touch targets enforced globally via CSS media query for mobile ERP use.
- 2026-07-15 — iOS safe-area zoom prevention: inputs/textareas/selects pinned to 16px minimum.

## Component Inventory

### Layout

- `Sidebar` — `src/components/ui/sidebar.tsx`; dark navy sidebar shell with hidden scrollbar
- `SlideInDrawer` — `src/components/ui/slide-in-drawer.tsx`; standard slide-in from right
- `DrawerLayout` — `src/components/ui/drawer-layout.tsx`; drawer with title, description, footer
- `DrawerHeader` / `DrawerFooter` — `src/components/ui/drawer-header.tsx`, `drawer-footer.tsx`
- `DetailDrawerShell` — `src/components/ui/detail-drawer-shell.tsx`; detail view wrapper

### Data

- `DataTable` — `src/components/ui/data-table.tsx`; TanStack Table + shadcn styling
- `Chart` / `ChartSkeleton` — `src/components/ui/chart.tsx`, `chart-skeleton.tsx`
- `Empty` — `src/components/ui/empty.tsx`; empty state with CTA
- `StatusBadge` — `src/components/ui/status-badge.tsx`
- `InfoRow` — `src/components/ui/info-row.tsx`
- `LineItemRow` — `src/components/ui/line-item-row.tsx`

### Forms

- `Input` / `InputGroup` / `Textarea` / `Select` / `NativeSelect` — standard form primitives
- `CurrencyInput` — `src/components/ui/currency-input.tsx`
- `DatePicker` / `DateRangePicker` — `src/components/ui/date-picker.tsx`, `date-range-picker.tsx`
- `Combobox` / `CreatableCombobox` — `src/components/ui/combobox.tsx`, `creatable-combobox.tsx`
- `Field` / `Label` — `src/components/ui/field.tsx`, `label.tsx`

### Navigation

- `Breadcrumb` — `src/components/ui/breadcrumb.tsx`
- `Menubar` — `src/components/ui/menubar.tsx`
- `Tabs` — `src/components/ui/tabs.tsx`
- `Pagination` — `src/components/ui/pagination.tsx`

### Feedback

- `BottomSheet` / `BottomSheetDrawer` / `ActionSheet` — `src/components/ui/bottom-sheet.tsx`, `bottom-sheet-drawer.tsx`, `action-sheet.tsx`
- `ErrorBanner` — `src/components/ui/error-banner.tsx`
- `Spinner` / `Skeleton` — `src/components/ui/spinner.tsx`, `skeleton.tsx`

### Domain-specific

- `ProductBrowserDrawer` — `src/components/sales/product-browser-drawer.tsx`
- `ReturnCreateDrawer` — `src/components/returns/return-create-drawer.tsx`
- `CashRegisterManager` — `src/components/cash-register/cash-register-manager.tsx`
- `JournalEntryCreateDrawer` / `JournalEntryEditDrawer` — `src/components/accounting/journal-entry-create-drawer.tsx`, `journal-entry-edit-drawer.tsx`
- `BalanceSheet` / `ProfitLossStatement` / `CashFlowStatement` — `src/components/accounting/`

## Responsive Contract

- **< 768px**: single-column dashboard, sidebar collapsed or hidden, drawers cap at `calc(100vw - 3rem)` with peek, all inputs/textareas/selects enforce 16px font (iOS zoom prevention), 44px minimum touch targets.
- **≥ 768px (`md`)**: sidebar visible, 2-column form layouts where width supports it.
- **≥ 1280px (`xl`)**: max content width 1280px, full sidebar + content layout.

## Accessibility

- Semantic headings and landmarks throughout dashboard
- Visible focus states via `ring` token (teal in both modes)
- 44px minimum touch targets on all interactive elements (enforced via CSS)
- `prefers-reduced-motion` kills all animation globally
- Charts include text labels and numeric summaries
- Form fields use explicit `Label` associations
- Dark sidebar maintains WCAG contrast (L=0.95 text on L=0.24 background)

## Non-Goals

- No Instrument Serif display font — Zer is purely operational, no editorial moments
- No brand gradient overlays or violet glow effects on content
- No Figma sync or design token pipeline
- No image generation or avatar system
- No dark-mode chart colors — charts desaturate to grayscale instead
