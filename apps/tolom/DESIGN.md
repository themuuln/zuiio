---
name: TOLOM
description: Auto repair shop operating system — clean, organized, purposeful.
# ── Token overrides (shared tokens → docs/design.md) ──
typography:
  primary: "Inter, system-ui, sans-serif"    # root: Geist Sans
  code: "JetBrains Mono, monospace"          # root: Geist Mono
radius:
  base: "0.625rem"   # root: 0.5rem (8px)
  sm: "6px"          # root: 4px
  md: "8px"          # root: 8px (same)
  lg: "10px"         # root: 12px
  xl: "14px"         # root: 16px
colors:
  # Electric Indigo accent (used for --accent, --sidebar-active; NOT --primary)
  indigo-500: "oklch(0.52 0.22 265)"
  # Semantic overrides (slightly shifted from root)
  success: "oklch(0.65 0.18 145)"
  warning: "oklch(0.75 0.18 85)"
  destructive: "oklch(0.6 0.22 25)"
  info: "oklch(0.6 0.15 240)"
---

# Tolom — Design Decisions

## Product Character: "The Workshop Counter"

Clean, organized, purposeful. Like a well-run auto shop — tools in their place, everything visible, nothing wasted. The interface should feel like stepping up to a counter where someone already knows what you need.
Tolom inherits zuiio's precision but adds approachable warmth. Inter carries the typographic voice; a tight neutral palette keeps the surface quiet so data speaks. Primary actions use teal; accent surfaces use Electric Indigo.

**Rejects:** enterprise bloat, toy-like gamification, generic SaaS templates. Every pixel answers "does this help someone run their shop."

## Token Overrides

| Token | Tolom | Root | Source |
|-------|-------|------|--------|
| UI font | Inter | Geist Sans | `layout.tsx` |
| Code font | JetBrains Mono | Geist Mono | `layout.tsx` |
| `--radius` | 0.625rem (10px) | 0.5rem (8px) | `globals.css` |
| `--radius-lg` | 10px | 12px | `globals.css` |
| `--radius-xl` | 14px | 16px | `globals.css` |
| `--accent` | Indigo 50 (265°) | Teal tint (195°) | `globals.css` |
| Semantic hues | Shifted from root | — | `globals.css` |
`--primary` maps to `--brand-teal` (195°), same as root core. Electric Indigo (265°) is for accent surfaces and sidebar-active only.
> All shared tokens (spacing, shadows, elevation, z-index, motion, a11y) → `docs/design.md`

## Unique Decisions

### Ring-1 Borders (Elevation)
Cards use `ring-1 ring-foreground/10` instead of drop shadows. Floating UI (dropdowns, modals, tooltips) keeps `--shadow-lg`/`--shadow-xl`. "Counter philosophy" — flat work surface with papers on top, not a 3D environment.

### Compact Density
Buttons: `xs` 24px, `sm` 28px, `default` 32px, `lg` 36px. Input: 32px (`h-8`). Denser than root defaults for data-heavy auto shop dashboards.

### Tablet-Native
44px touch targets via `.tablet-touch` CSS class. Inter optimized for screen readability at small sizes. Card padding increases to 1.25rem at ≥768px.

### Dark Sidebar
Dark surface, light text. Active items get Electric Indigo tint (`oklch(0.52 0.22 265 / 10%)`). Staggered entrance animation on expand (50ms/item via `--stagger`).

### Motion
150–250ms, `ease-out-quart` as primary easing. Only `transform` and `opacity` animated.

## Component Inventory _(paths relative to `src/`)_
| Domain | Key path | Notes |
|--------|----------|-------|
| Sidebar | `components/app-sidebar.tsx` | Dark surface, collapsible |
| Data Table | `components/ui/data-table.tsx` | TanStack Table + virtualization |
| Detail Drawer | `components/ui/detail-drawer.tsx` | Side panel CRUD |
| Picker Drawer | `components/ui/picker-drawer.tsx` | Selection drawer |
| Bay View | `components/bay-view-v2/` | Core workspace (50+ files) |
| Bay View v3 | `components/bay-view-v3/` | Next-gen bay layout |
| Work Orders | `components/work-orders/` | CRUD + wizard flow |
| Customers | `components/customers/` | CRUD + detail drawer |
| Vehicles | `components/vehicles/` | CRUD + detail drawer |
| Services | `components/services/` | Pricing + variant editor |
| Inventory | `components/inventory/` | Parts, suppliers, POs |
| Reports | `components/reports/` | KPIs, charts, P&L |
| Auth | `components/auth/` | Org setup, SSO |
| Branches | `components/branches/` | Multi-branch management |

## Responsive Contract

| Viewport | Behavior |
|----------|----------|
| `<768px` | Full-width drawers, card-list tables, sidebar as sheet overlay |
| `≥768px` | `.tablet-touch` active: 44px targets, 1.25rem card padding |
| `≥1024px` | Sidebar collapses, drawers at lg (512px) |
| `≥1280px` | Full sidebar, drawers at 2xl (672px) for complex forms |

> Breakpoints, grid, container widths → `docs/design.md` → Responsive Patterns

## Non-Goals

- No display font (Instrument Serif is root marketing-only)
- No gradient text — emphasis via weight or size
- No deep shadows on cards — ring-1 only
- No enterprise density — progressive disclosure over nested tables
- No gamification — no progress bars, achievements, or playful illustrations
- No custom modals — shadcn primitives (Dialog, Sheet, Drawer, Popover)

## Do's and Don'ts

**Do**
- `ring-1 ring-foreground/10` for card structure (never pair with box-shadow)
- Electric Indigo for accent/sidebar-active only (not --primary)
- Inter for all UI text — no serif, no decorative weights
- Card radius max 14px (`--radius-xl`)
- Skeleton-load data areas only; preserve page chrome during refetch
- `.tablet-touch` on interactive containers for 44px targets
- Animate `transform`/`opacity` only; respect `prefers-reduced-motion`

**Don't**
- Gradient text (`background-clip: text`)
- `border` + `box-shadow` on the same element
- `border-radius: 32px+` on cards or inputs
- `space-y-*`/`space-x-*` — use `gap-*` with flex
- Build from scratch what shadcn/ui provides
- Modal dialogs as first choice — use drawers and inline editing
- Raw color values (`bg-blue-500`) — always semantic tokens
