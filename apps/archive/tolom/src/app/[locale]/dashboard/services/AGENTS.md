# Services

**Purpose:** Service catalog management — define services with pricing, categories, model-specific overrides, and last-used price memory.

## File Structure

```
services/
├── page.tsx               # Service catalog list page
├── _columns.tsx           # DataTable column definitions
├── _edit-service-drawer.tsx # Side panel form for editing a service
├── loading.tsx            # Loading skeleton
└── error.tsx              # Error boundary
```

## Key Components

- **ServicesPage** — Full catalog view with DataTable, category filter badges, inline add form, sidebar tabs (Categories summary, Popular/most expensive). Row click opens edit sheet.
- **createColumns** (`_columns.tsx`) — Factory function for `ColumnDef<ServiceCatalog>[]`. Columns: name (locale-aware bilingual display), category badge, default price (MNT formatted), last-used price (amber highlight), model-specific prices button (with count badge), edit/delete actions.
- **EditServiceSheet** — `DetailSheet` side panel with fields: name, name_mn (Mongolian), default_price (MNT), category (combobox with create-new option), description. Optimistic update on save.
- **ServiceForm** — Used for inline add within the page (imported from `@/components/services/service-form`).
- **ServiceModelPricesSheet** — Drawer for managing per-vehicle-model pricing overrides (imported from `@/components/services/service-model-prices-drawer`).

## Columns Detail

| Column | Key | Notes |
|--------|-----|-------|
| Name | `name` | Shows `name_mn` on mn locale, fallback to `name`. Bilingual subtitle shown for other locales. Description underneath. |
| Category | `category` | Badge with "Uncategorized" fallback |
| Default Price | `default_price` | MNT formatted via `formatMNT()` |
| Last Used Price | (computed) | From `useServiceLastUsedPrices` — shows amber-colored last price used on work orders |
| Model Prices | (button) | CarFront icon with count badge from `useServiceModelPriceCounts` |
| Actions | — | Edit (Pencil) + Delete (Trash2) ghost buttons |

## Data Flow

- **List:** `GET /api/organizations/{orgId}/services` via `serviceKeys.list()` query
- **Update:** `PATCH /api/organizations/{orgId}/services/{id}` with optimistic cache update
- **Delete:** `DELETE /api/organizations/{orgId}/services/{id}` with optimistic removal
- **Last-used prices:** `useServiceLastUsedPrices(orgId)` — shows what price was last charged for each service
- **Model price counts:** `useServiceModelPriceCounts(orgId)` — how many vehicle models have custom pricing

## State Management

- Category filter: `selectedCategory` local state
- Search: local `search` state (client-side filtering by name, name_mn, description)
- Edit sheet: `editingService` state
- Model prices sheet: `modelPricesService` state
- All server state via React Query

## Conventions

- Client component (`"use client"`)
- Optimistic mutations with rollback on error
- Client-side category + search filtering (no server-side pagination)
- Export with MNT currency formatting
- Bilingual name display: locale-aware primary + secondary name

## Dependencies

- `@/components/services/service-form` — Service creation form (used in inline add mode)
- `@/components/services/service-model-prices-drawer` — Model-specific pricing management
- `@/lib/queries/use-price-memory` — Last-used price tracking
- `@/lib/queries/use-service-vehicle-models` — Model price counts
- `@/lib/queries/keys` — `serviceKeys` query key factory
- `@/lib/utils` — `formatMNT` currency formatter
- `@/components/ui/detail-sheet` — Slide-over panel for editing
