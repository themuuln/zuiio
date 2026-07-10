# Bay View

**Purpose:** Workshop bay view — visual overview of active bays, assigned vehicles, and mechanic work status. Thin wrapper around the v2 client component.

## File Structure
```
bay-view/
├── page.tsx    # Thin wrapper — dynamically imports BayViewV2Client
└── error.tsx   # Sentry error boundary
```

## Key Components

- **`BayViewPage`** — Renders `BayViewV2Client` via `next/dynamic` with `ssr: false`. Wrapped in a full-height container with negative margins for edge-to-edge layout.
- **`BayViewV2Client`** — The actual implementation lives in `@/components/bay-view-v2/bay-view-v2-client`. All logic, state, and UI are in the component directory.
- **`BayViewPageSkeleton`** — Loading skeleton from `@/components/bay-view-v2/_page-skeleton`.

## Data Flow

All data fetching happens inside the v2 client component. This page has no direct data fetching.

## Differences from bay-view-v2

| Aspect | bay-view | bay-view-v2 |
|--------|----------|-------------|
| Component | Same `BayViewV2Client` | Same `BayViewV2Client` |
| Wrapper div | `-mx-3 -mb-5 -mt-3 flex h-full flex-col overflow-hidden` + responsive tablet/lg margins | `absolute inset-0` |
| Component name | `BayViewPage` | `BayViewV2Page` |
| Has error.tsx | Yes | No |
| Has loading.tsx | No | No |

Both routes serve the identical v2 component. The wrapper styling differs slightly — bay-view has responsive negative margins, bay-view-v2 uses absolute positioning.

## Conventions

- Mechanic users are redirected here from the main dashboard (`/dashboard`).
- All bay-view logic lives in `src/components/bay-view-v2/` — this page is just a route entry point.

## Dependencies

- `@/components/bay-view-v2/bay-view-v2-client` — BayViewV2Client
- `@/components/bay-view-v2/_page-skeleton` — BayViewPageSkeleton
