# Architecture Analysis: Page & Dashboard Layer

> Generated: 2026-05-12
> Analysis of data flow patterns across Next.js App Router pages, components, and hooks.

---

## 1. Page Structure Overview

```
src/app/
├── [locale]/                     # Internationalized routes
│   ├── page.tsx                  # Landing page
│   ├── layout.tsx                # Root layout (fonts, providers, metadata)
│   ├── auth/                     # Auth pages (login, signup, etc.)
│   └── dashboard/               # Protected pages
│       ├── layout.tsx            # Sidebar + main content layout
│       ├── page.tsx              # Main dashboard (~280 lines)
│       ├── _charts.tsx           # Charts section (~470 lines)
│       ├── bay-view/            # Drag-and-drop bay view
│       ├── customers/           # Customer CRUD
│       ├── work-orders/         # Work order CRUD
│       ├── inventory/           # Inventory management
│       ├── finance/             # Financial overview (~760 lines)
│       ├── reports/             # Reports
│       └── ...                  # Other feature pages
├── api/                          # API routes
│   └── organizations/
│       └── [id]/
│           ├── customers/
│           ├── work-orders/
│           ├── inventory/
│           ├── reports/
│           └── ...
├── auth/                         # Non-locale auth pages (duplicate?)
│   └── ...
├── guide/                        # Docs/guide pages
├── page.tsx                      # Root redirect
├── layout.tsx                    # Root HTML shell
└── error.tsx + not-found.tsx     # Error pages
```

---

## 2. Data Fetching Patterns

### Pattern A: React Query Hooks (Used in ~3 places)

Files: `src/lib/queries/use-organization.ts`, `src/lib/queries/use-customers.ts`

```typescript
// Clean hook that goes through API route → service layer
export function useCustomers(orgId, query) {
  return useQuery({
    queryKey: customerKeys.list(orgId, query),
    queryFn: async () => {
      const res = await fetch(`/api/organizations/${orgId}/customers?...`);
      // ...
    },
    enabled: !!orgId,
  });
}
```

**Used by:** Customer list, vehicle list (presumably)
**Good:** Caching, dedup, background refetch, loading/error states built-in

### Pattern B: Imperative fetch + useState (Used in ~4 places)

Files: `dashboard/page.tsx`, `dashboard/finance/page.tsx`, `work-orders/new/page.tsx`

```typescript
// Dashboard page - useEffect + fetch + useState
const [data, setData] = useState<DashboardData | null>(null);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);

useEffect(() => {
  fetch(`/api/organizations/${orgId}/reports?type=dashboard&period=${period}`)
    .then(r => r.json())
    .then(d => setData(d.data))
    .catch(e => setError(e.message));
}, [orgId, period]);
```

**Used by:** Dashboard (main page), Finance page, Work order creation wizard (org fetch)
**Problem:** Manual loading/error state, no caching, no dedup, no refetch. The finance page is ~760 lines with the same pattern.

### Pattern C: Server Actions (Used in ~5 places)

Files: `src/app/[locale]/dashboard/actions.ts`, auth actions, `complete-organization-login.ts`

```typescript
"use server";
export async function getDashboardStats() {
  const supabase = await createClient();
  // ... direct DB queries in server action
}
```

**Used by:** Some dashboard stats
**Notes:** Server Actions bypass the API route layer entirely. They call `createClient()` directly, duplicating the pattern.

---

## 3. Key Friction Points

### 3.1. Dashboard Page is an Outlier (Fixable)

The main dashboard (`dashboard/page.tsx`) is a well-structured ~280-line client component, BUT:

- Uses **imperative fetch** instead of React Query (Pattern B vs Pattern A)
- Has **manual loading/error state management** (3 `useState` calls)
- Fetches the **current org id** via a second API call before fetching dashboard data
- Loading state shows **9 skeleton components** — manually coded

**Why this matters:** The `useCustomers` hook already demonstrates the better pattern. The dashboard should follow it. This is a ~2 hour refactor that removes all the imperative fetch boilerplate.

### 3.2. Charts Section is Oddly Separated

File: `dashboard/_charts.tsx` (~470 lines)

This is a client component prefixed with `_` (Next.js private file convention), dynamically imported. It contains:
- 6 chart components inline (revenue trend, status distribution, top services, tech perf, category breakdown, customer acquisition)
- Custom `ChartTooltip` component
- All chart rendering logic

**Issue:** The charts file is large but doesn't have its own API boundary — it imports `DashboardData` and renders from that. The separation makes sense for code-splitting (dynamic import with `ssr: false`) but the file is doing too much. Each chart could be its own component.

### 3.3. Finance Page is a Monolith

File: `dashboard/finance/page.tsx` (~760 lines)

Similar pattern to the dashboard page: imperative fetch, manual state management, multiple tabs (overview/transactions/invoices). Combined with the KPI cards and table rendering, this page is large.

**Comparison:** The work-orders list page uses the `DataTable` component, while the finance page has an inline table. Inconsistent patterns.

### 3.4. Bay View is Highly Optimized but Has a Dependency Concern

The bay view (`bay-view/page.tsx`, `bay-view-client.tsx`, 10+ component files) is architecturally clean:

- Server-side "use server" service layer (`bay-view-service.ts`) handles all DB operations
- Client components are thin UI wrappers
- Drag-and-drop uses `@dnd-kit` properly

**But:** The service file's functions (`assignMechanicToWorkOrder`, `assignVehicleToBay`, `removeVehicleFromBay`, etc.) are called directly from client components via server actions — bypassing the API route layer entirely. This is fine for server actions, but it means:

- No API route → no HTTP cache layer
- No API route → harder to test (can't test via HTTP)
- Error handling is embedded in the component instead of centralized

### 3.5. NewWorkOrderPage Wizard (~900 lines)

File: `work-orders/new/page.tsx`

This is the largest single component in the codebase. It manages a 6-step wizard entirely with local state:
- ~40 `useState` calls
- Manual form validation
- Manual search/create for customers and vehicles
- Inline HTML tables for services/parts line items

**Why this is risky:** With 40 state variables, the component has an exponential number of possible states. Adding a new step or field requires understanding all existing state interactions.

---

## 4. Component Anatomy

### Smart vs. Dumb Components

| Category | Examples | Pattern |
|----------|----------|---------|
| Page components | `DashboardPage`, `FinancePage` | Mix of imperative fetch + useState |
| Feature components | `BayViewClient`, `NewWorkOrderPage` | Client state management, server action calls |
| Shared components | `DataTable`, `SearchInput`, `MechanicSelect` | Props-driven, no data fetching |
| UI primitives | `Button`, `Card`, `Input`, `Skeleton` | shadcn-style, composable |
| Chart components | `ChartContainer`, `ChartsSection` | Dynamic imports, props-driven |

### DataTable Analysis

The `DataTable` component (in `components/data-table.tsx`) is well-designed:
- Supports loading skeleton, empty state, row click
- Mobile-responsive with headers as labels on small screens
- Generic typed API (`DataTableColumn<T>`)

**This is a good seam** — a deep component with a small interface.

---

## 5. Data Flow Diagram

```
Browser (Client Component)
  │
  ├── React Query hook ──► API Route ──► Service ──► Supabase
  │     (useCustomers)      (thin wrap)    (logic)
  │
  ├── useEffect + fetch ──► API Route ──► Service ──► Supabase
  │     (DashboardPage)      (thin wrap)    (logic + cache)
  │
  ├── Server Action ──► Supabase
  │     (Bay View)     (direct)
  │
  └── Direct Import ──► Service ──► Supabase
        (not done yet, but possible)
```

**Problem:** There are 3 data-fetching patterns. As the team grows, this creates:
- Confusion ("should I use a hook or fetch?")
- Inconsistent error handling
- Duplicate loading/error state management

---

## 6. Prioritized Recommendations

| Priority | Issue | Files | Effort | Impact |
|----------|-------|-------|--------|--------|
| **P1** | Dashboard uses imperative fetch instead of React Query | `dashboard/page.tsx`, `dashboard/_charts.tsx` | Small | Eliminates pattern inconsistency |
| **P1** | Finance page monolith | `dashboard/finance/page.tsx` | Medium | Reduces duplication with DataTable |
| **P2** | NewWorkOrderPage wizard needs decomposition | `work-orders/new/page.tsx` | Large | Testability, maintainability |
| **P2** | No `useDashboardReports` hook exists | Missing file | Small | Centralizes report fetching |
| **P3** | Bay view bypasses API routes | `bay-view-service.ts` | Considered | Not urgent, but flag for testability |
| **P3** | Charts section too large | `_charts.tsx` | Small | Extract individual chart components |
| **P4** | Duplicate auth page trees | `app/[locale]/auth/` vs `app/auth/` | Medium | Eliminate dead code |

---

## 7. What to Keep

1. **Bay view architecture** — clean separation of service layer and client components
2. **DataTable component** — deep, well-typed, mobile-responsive
3. **Dynamic imports for charts** — reduces initial bundle size
4. **React Query hooks pattern** — `useCustomers`, `useCurrentOrg` are the right pattern
5. **Skeleton loading states** — consistent across all pages
