# Vehicle Models

**Purpose:** Manage a hierarchical catalog of vehicle makes, models, and variants (generation, years, engine, body type).

## File Structure

```
vehicle-models/
├── page.tsx                      # Tree-view catalog page
├── _vehicle-model-form-drawer.tsx # Slide-over form for add/edit variant
├── loading.tsx                   # Loading skeleton
└── error.tsx                     # Error boundary
```

## Key Components

- **VehicleModelsPage** — Renders models as a **3-level collapsible tree**: Make > Model > Variant. Each level shows item count. Variants show year range, generation, engine, and body type badge. Includes fuzzy search across all fields.
- **VehicleModelFormSheet** — `DetailSheet` side panel for add/edit mode. Required fields: make + model. Collapsible detail section with optional fields: generation, year range, engine, body type. Uses optimistic mutations.

## Tree Data Model

```
MakeGroup (e.g. Toyota)
├── ModelGroup (e.g. Camry)
│   ├── VariantItem (XV70, 2.5L, 2018–2024, Sedan)
│   └── VariantItem (XV50, 2.5L, 2012–2017, Sedan)
└── ModelGroup (e.g. Land Cruiser)
    └── VariantItem (...)
```

`buildTree()` transforms a flat `VehicleModelItem[]` into `MakeGroup[]` sorted alphabetically.

## Variant Fields

| Field | Required | Type | Notes |
|-------|----------|------|-------|
| make | Yes | Input | e.g. Toyota |
| model | Yes | Input | e.g. Camry |
| generation | No | Input | e.g. XV70 |
| yearStart | No | number | |
| yearEnd | No | number | |
| engine | No | Input | e.g. 2.5L |
| bodyType | No | Select | sedan, hatchback, coupe, wagon, pickup, minivan, convertible, crossover |

## Data Flow

- **List:** `GET /api/organizations/{orgId}/vehicle-models` via `useQuery` with `vehicleModelKeys.list()`
- **Create:** `POST /api/organizations/{orgId}/vehicle-models` with optimistic cache update
- **Update:** `PATCH /api/organizations/{orgId}/vehicle-models/{id}` with optimistic cache update
- **Delete:** `DELETE /api/organizations/{orgId}/vehicle-models/{id}` with optimistic removal

## State Management

- Tree expansion state: `expandedMakes` (Set), `expandedModels` (Record of Sets)
- Form sheet: `formMode` (add/edit), `formItem`, `formOpen`
- Fuzzy search via `useFuzzySearch` with weighted keys (make: 0.35, model: 0.3, generation: 0.15, engine: 0.1, body_type: 0.1)
- All server state via React Query with `staleTime: 5 * 60_000`

## Conventions

- Client component (`"use client"`)
- Optimistic mutations with rollback on error (onMutate/onError pattern)
- `HighlightText` utility highlights fuzzy search matches in tree rows
- Export via `ExportButton` with XLSX columns
- Variant edit/delete buttons appear on hover (`opacity-0 group-hover:opacity-100`)

## Dependencies

- `@/lib/queries/keys` — `vehicleModelKeys` query key factory
- `@/lib/queries/use-organization` — `useCurrentOrg()`
- `@/lib/hooks/use-fuzzy-search` — Weighted fuzzy search
- `@/lib/utils/search-utils` — `HighlightText` component
- `@/components/ui/detail-sheet` — Slide-over panel
- `@/components/list-toolbar` — Search + stats bar
