# Components — UI Layer

**Role:** Shared React components. Feature-specific page sections and reusable UI elements.

## Structure

```
src/components/
├── ui/                   # shadcn primitives (62 components, see root AGENTS.md for rules)
├── bay-view-v2/          # Bay view drag-drop interface (3 large files >1000 lines)
├── vehicles/             # Vehicle forms and sheets
├── work-orders/          # Work order wizard and parts
├── customers/            # Customer-related components
├── inventory/            # Inventory management UI
├── expenses/             # Expense forms
├── reports/              # Report filters and charts
├── services/             # Service catalog UI
├── charts/               # Chart wrapper components
├── auth/                 # Auth pages UI
└── app-sidebar/          # App-level sidebar
```

Plus root-level shared components: `data-table-dashboard.tsx`, `page-header.tsx`, `page-state.tsx`, `status-badge.tsx`, `search-input.tsx`, etc.

## Conventions

- **All shadcn rules from root AGENTS.md apply** — see there for component mapping, spacing, colors, anti-patterns.
- **Feature components** (`bay-view-v2/`, `vehicles/`) are scoped to their domain. Don't use them outside it.
- **`_`-prefixed files** next to pages = extracted sub-components for that page (e.g., `dashboard/_charts.tsx`).
- **Each feature subdir** should have its own barrel export (`index.ts`) or the parent component is the entry point.
- **Large file threshold is 500 lines.** Files >800 lines must be split. Current offenders: `data-table-dashboard.tsx` (1094 lines), `org-theme-settings.tsx` (939 lines).

## Гарын авлага Sync

When adding/modifying a component that changes user-facing UI, update the corresponding page in `docs/*.md` and run `npm run docs:build`. See the Гарын авлага Sync Rule in root `AGENTS.md`.

## Shared Components (Root Level)

These are used across features — keep them generic:

| Component | Purpose |
|-----------|---------|
| `page-header.tsx` | Consistent page title + actions layout |
| `page-state.tsx` | Loading/empty/error state wrappers |
| `data-table-dashboard.tsx` | Reusable data table with sorting, pagination |
| `status-badge.tsx` | Status display (uses `<Badge>`) |
| `search-input.tsx` | Search field with debounce |
| `filter-chips.tsx` | Active filter display |
| `brand-theme-provider.tsx` | Org-level theming |

See `src/lib/services/AGENTS.md` for the backend layer these components consume.
