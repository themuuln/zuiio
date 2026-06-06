# Repository Guidelines

**Generated:** 2026-06-01 · **Commit:** `69144ed` · **Branch:** `main`

Sub-AGENTS.md exist for high-complexity directories. Read this first, then drill into specific layers.

| Layer | File |
|-------|------|
| Business logic | `src/lib/services/AGENTS.md` |
| Shared components | `src/components/AGENTS.md` |

### Feature Module AGENTS.md

Every dashboard feature module has its own AGENTS.md. Read the relevant one when working in that module.

| Module | Path | Lines |
|--------|------|-------|
| Dashboard (root) | `src/app/[locale]/dashboard/AGENTS.md` | 101 |
| Work Orders | `.../dashboard/work-orders/AGENTS.md` | 121 |
| Inventory | `.../dashboard/inventory/AGENTS.md` | 156 |
| Customers | `.../dashboard/customers/AGENTS.md` | 114 |
| Organization | `.../dashboard/organization/AGENTS.md` | 117 |
| Estimates | `.../dashboard/estimates/AGENTS.md` | 98 |
| Reports | `.../dashboard/reports/AGENTS.md` | 88 |
| Settings | `.../dashboard/settings/AGENTS.md` | 84 |
| Vehicles | `.../dashboard/vehicles/AGENTS.md` | 79 |
| Vehicle Models | `.../dashboard/vehicle-models/AGENTS.md` | 74 |
| Expenses | `.../dashboard/expenses/AGENTS.md` | 73 |
| Finance | `.../dashboard/finance/AGENTS.md` | 72 |
| Bay View v2 | `.../dashboard/bay-view-v2/AGENTS.md` | 71 |
| Payroll | `.../dashboard/payroll/AGENTS.md` | 70 |
| Services | `.../dashboard/services/AGENTS.md` | 68 |
| Service Reminders | `.../dashboard/service-reminders/AGENTS.md` | 61 |
| Admin | `.../dashboard/admin/AGENTS.md` | 59 |
| Mechanic | `.../dashboard/mechanic/AGENTS.md` | 53 |
| Appointments | `.../dashboard/appointments/AGENTS.md` | 53 |
| Mechanic Performance | `.../dashboard/mechanic-performance/AGENTS.md` | 51 |
| EOD Close | `.../dashboard/eod-close/AGENTS.md` | 50 |
| Bay View v1 | `.../dashboard/bay-view/AGENTS.md` | 42 |
| Guide | `.../dashboard/guide/AGENTS.md` | 38 |

## Auto-loaded Skills

Load these skills automatically when the task matches their trigger. Read the SKILL.md before writing any code.

| Skill | Trigger | Path |
|-------|---------|------|
| `optimistic-ui` | Writing, reviewing, or fixing mutation handlers (`useMutation`, `useOrgMutation`, `onMutate`, `setQueryData`), toast patterns, or multi-select optimistic state | `.agents/skills/optimistic-ui/SKILL.md` |
| `supabase` | Any Supabase task (DB, Auth, Edge Functions, RLS, migrations) | `.agents/skills/supabase/SKILL.md` |
| `react-doctor` | Finishing a feature, fixing a bug, before committing React code | `.agents/skills/react-doctor/SKILL.md` |

When working on mutation hooks in `src/lib/queries/` or components with `toast.success()`, always load `optimistic-ui` first and apply its validation checklist before declaring done.

## Project Overview

TOLOM is a vertical operating system for auto service businesses — a multi-tenant SaaS platform built with Next.js, Supabase, PostgreSQL, and later Flutter for the mechanic mobile app. See `MASTER_PLAN.md` for the full product vision, roadmap, and pricing strategy.

## Project Structure

```
tolom/
├── src/                # Next.js application (frontend + API routes)
│   ├── app/            # App router pages and layouts
│   │   ├── [locale]/dashboard/   # 20 feature modules
│   │   └── api/                  # RESTful API routes
│   ├── components/     # Shared React components → src/components/AGENTS.md
│   │   └── ui/         # shadcn primitives (62 installed)
│   ├── lib/            # Utilities, clients, helpers
│   │   ├── services/   # Business logic layer → src/lib/services/AGENTS.md
│   │   ├── queries/    # React Query hooks
│   │   └── stores/     # Zustand client state
│   └── middleware.ts   # Auth and tenant middleware
├── supabase/           # Supabase migrations, seeds, edge functions
│   ├── migrations/     # SQL migrations (100 files, ordered, idempotent)
│   └── functions/      # Edge functions (webhooks, scheduled jobs)
├── docs/               # VitePress Гарын авлага documentation
├── e2e/                # Playwright end-to-end tests
└── public/             # Static assets
```

## Build, Test, and Development Commands

```bash
npm run dev          # Start Next.js dev server
npm run build        # Production build (skips redundant TS check)
npm run start        # Start production server
npm run lint         # Biome check (linter + formatter + import sort)
npm run format       # Biome format --write
npm run test         # Run all tests (vitest)
npm run docs:build   # Rebuild VitePress Гарын авлага into public/guide/
supabase start       # Start local Supabase stack (CLI only — no MCP equivalent)
supabase migration new <name>  # Create a new migration file (CLI only — creates local file)

# Fast validation (replaces `npm run build` for quick feedback)
npm run validate:types   # tsc --noEmit --incremental (fast type-check only)
npm run validate:lint    # biome check src/ (fast lint on source code)
npm run validate         # validate:types && validate:lint
```

### Validation Strategy

**Old heavy approach:** `npm run build` — compiles, minifies, code-splits, and optimizes the entire app (~90% CPU/RAM).

**New lightweight approach:** `npm run validate` — runs `tsc --noEmit --incremental` + `biome check src/` in memory, bypassing Turbopack/Webpack entirely. ~90% less resources.

The production build (`npm run build`) has `typescript: { ignoreBuildErrors: true }` in `next.config.ts` since type-checking is already handled by `pnpm validate:types`.

**Pre-commit verification:**
```bash
npm run validate && npm run test
```

**Before merging/CI (stricter):**
```bash
npm run validate && npm run test && npm run build
```

## UI Components & shadcn

Use the **shadcn skill** and **shadcn MCP** to search, add, and get docs for components. Never build from raw HTML when a shadcn component covers the use case.

### Style Rules

These rules apply to ALL components, not just new ones.

#### Spacing
- **Use `gap-*` with `flex`/`flex-col`, NOT `space-y-*` or `space-x-*`**
- **Use `size-*` when width equals height**, NOT `w-* h-*`

#### Colors
- **Use semantic tokens only:** `bg-background`, `text-foreground`, `bg-muted`, `text-muted-foreground`, `bg-primary`, `text-primary-foreground`, `bg-destructive`, `text-destructive`, `bg-accent`, `text-accent-foreground`, `bg-card`, `text-card-foreground`, `bg-popover`, `text-popover-foreground`, `border-border`, `border-input`, `border-ring`
- **Never use raw color values:** `bg-blue-500`, `text-green-700`, `border-gray-200`, `bg-red-50`
- **Dark mode is automatic via CSS variables** — never add `dark:` overrides manually

#### Truncation
- **Use `truncate` shorthand** — not `overflow-hidden text-ellipsis whitespace-nowrap`

### Test Selectors for shadcn Components

When writing Playwright tests for shadcn (Radix-based) components, target **ARIA roles and `data-*` attributes** — never CSS class names. Radix primitives render into portals and complex DOM structures that class selectors can't reliably reach.

| Component | Reliable Selector | Fragile Alternative |
|-----------|------------------|-------------------|
| **Dialog/Modal** | `page.getByRole('dialog')` | `page.locator('.modal-content')` misses portal |
| **Dropdown/Select** | `page.locator('[data-state="open"]')` | `page.locator('.select-trigger')` is always present |
| **Popover** | `page.getByRole('dialog').filter({ hasText: /search/i })` | `page.locator('.popover-content')` fragile to rename |
| **Combobox** | `page.getByRole('combobox')` then `page.getByRole('option', { name: '...' })` | CSS class chain breaks on dark mode |
| **Checkbox** | `page.getByRole('checkbox')` + check `isChecked()` | `page.locator('input[type=checkbox]')` hidden by shadcn |
| **Switch/Toggle** | `page.locator('[data-state="checked"]')` | `page.locator('.peer')` breaks on styling change |
| **Tabs** | `page.getByRole('tab', { name: '...' })` | `page.locator('[data-slot="tab"]')` changes with shadcn upgrade |
| **Alert/Destructive** | `page.getByRole('alert')` | `page.locator('.destructive-bg')` renamed on refactor |
| **Tooltip** | `page.locator('[role="tooltip"]')` | `page.locator('.tooltip-arrow')` appears/disappears |

**Key Radix attributes to use:**
- `[data-state="open"|"closed"|"checked"|"unchecked"|"active"|"inactive"]`
- `[data-disabled]` / `[data-placeholder]` / `[data-highlighted]`
- `[role="dialog"|"tooltip"|"option"|"combobox"|"tab"|"tabpanel"|"alert"]`
- `[aria-expanded]` / `[aria-selected]` / `[aria-checked]` / `[aria-hidden]`

**Pattern:** Snapshot the page, find the Radix ref, then use Playwright's built-in role/locator:
```
# Snapshot shows: [ref=e12] <button data-state="closed" aria-expanded="false">Select fuel type</button>
# Click to open:
page.locator('[data-state="closed"]').filter({ hasText: /fuel/i }).click()
# After open: snapshot shows options with refs
page.getByRole('option', { name: 'Diesel' }).click()
```

## i18n Message Parity

- **Both `mn.json` and `en.json` must be updated together.** When adding or changing any UI string, always add the corresponding key in both locale files. Missing translations cause fallback keys to show in the UI.
- When a key is removed from the code, remove it from both `src/messages/mn.json` and `src/messages/en.json`.

## Coding Style & Naming Conventions

- **TypeScript** throughout — no `any` without a comment explaining why.
- **2-space indentation**, single quotes, trailing semicolons (Biome defaults).
- **Linting/formatting via Biome** (v2.2.0) — not ESLint. The `lint` script runs `biome check`, which covers linting, formatting, and import sorting in one pass. Use `pnpm validate:lint` for fast Biome checks on `src/` only.
- **Files/directories**: kebab-case (`work-order-form.tsx`, `use-customer-data.ts`).
- **Components**: PascalCase (`WorkOrderForm`), **hooks**: `use` prefix (`useCustomerData`).
- **Database tables/columns**: snake_case (`work_orders`, `organization_id`).
- **API routes**: RESTful — `GET /api/organizations/[id]/work-orders`.
- **Database type imports**: Always import from `@/lib/types`, never from `@/lib/database.types`. The latter is auto-generated and its export shape changes between Supabase CLI versions — importing from it directly causes silent build breaks on regeneration.

## API Route Consistency

- **All API routes must use the `api-handler.ts` wrapper.** This ensures consistent error shapes (`ApiResponse<T>`), proper HTTP status codes, and unified error logging. Do not write raw `NextResponse.json()` in route handlers — never duplicate error-handling logic.
- Page components must not contain direct data-fetching logic (raw `fetch()` + inline `useState`/`useEffect`). All data fetching should go through either:
  - **React Query hooks** in `src/lib/queries/` for client-side data
  - **Server services** in `src/lib/services/` for server-side logic
- The only exception is quick prototyping, but it must be migrated before merging.

## Component Size & Splitting

- **Keep page components under ~400 lines.** Beyond that, extract sections into sub-components or separate files (e.g., `_charts.tsx`, `_kpi-card.tsx`, `_work-orders-table.tsx`).
- Files exceeding 500 lines are a signal to split. Place extracted sub-components in a `_`-prefixed file in the same directory (e.g., `dashboard/_charts.tsx`).
- See `src/components/AGENTS.md` for the component directory structure and shared component catalog.

## Data Fetching Pattern

| Layer | Location | When to Use |
|-------|----------|-------------|
| **React Query hooks** | `src/lib/queries/` (28 hooks) | Client-side pages that need caching, refetching, loading/error states |
| **Server services** | `src/lib/services/AGENTS.md` (47 services) | API route handlers and server components |
| **Direct fetch** | Inside API routes only | To call Supabase or external services from an API handler |

The rule: pages use hooks, hooks call API routes, API routes call services, services query Supabase. Never skip a layer. See `src/lib/services/AGENTS.md` for service-layer conventions.

## Client State (Zustand)

React Query handles server state. Zustand handles **transient client UI state** — state that doesn't belong in React Query, nuqs, or react-hook-form.

### Mental Model

```
Server state    → React Query
URL state       → nuqs
Form state      → react-hook-form
Client UI state → Zustand
```

### When to Use Zustand

- Multi-step form wizard progress (work order builder)
- UI state (sidebar collapsed, active filters, panel open/closed)
- Cross-component state that doesn't need URL persistence
- Shopping cart / work order builder before submission

### When NOT to Use Zustand

- **Server data** (customers, work orders, inventory) → use React Query
- **URL-synced state** (pagination, search, tabs) → use nuqs
- **Form field values** (inputs, validation) → use react-hook-form
- **Auth/session** → use Supabase SSR

### Store Conventions

All stores live in `src/lib/stores/` and must follow this pattern:

```tsx
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

// Separate State and Actions interfaces
interface MyState { /* ... */ }
interface MyActions { /* ... */ }
type MyStore = MyState & MyActions;

export const useMyStore = create<MyStore>()(
  devtools(
    persist(
      immer((set, get) => ({
        // State
        // Actions (use immer draft: s.field = value)
      })),
      { name: 'tolom-my-store', partialize: (state) => ({ /* only durable state */ }) },
    ),
    { name: 'MyStore' }, // DevTools label
  ),
);

// Selector hooks for granular re-renders
export const useMyThing = () => useMyStore((s) => s.thing);
```

### Required Middleware

| Middleware | Purpose | Required |
|-----------|---------|----------|
| `devtools` | Redux DevTools integration | Yes |
| `immer` | Immutable updates with mutable syntax | Yes |
| `persist` | localStorage persistence | When state survives page refresh |

### Selector Hooks — Always Use Them

Every store MUST export selector hooks. Components must never destructure the full store.

```tsx
// ❌ WRONG — re-renders on ANY store change
const { sidebarCollapsed, activeFilters, toggleSidebar } = useUiStore();

// ✅ CORRECT — only re-renders when sidebarCollapsed changes
const sidebarCollapsed = useSidebarCollapsed();

// ✅ CORRECT — only re-renders when this specific filter changes
const statusFilter = useFilter('status');
```

### Current Stores

| Store | File | Persisted | Purpose |
|-------|------|-----------|---------|
| `useUiStore` | `src/lib/stores/ui-store.ts` | Sidebar only | Sidebar collapsed, active filters |
| `useWorkOrderStore` | `src/lib/stores/work-order-store.ts` | All state | Multi-step wizard, vehicle selection, line items, notes |

### Available Selector Hooks

| Hook | Store | Returns |
|------|-------|---------|
| `useSidebarCollapsed` | ui | `boolean` |
| `useActiveFilters` | ui | `Record<string, string>` |
| `useFilter(key)` | ui | `string \| undefined` |
| `useWorkOrderStep` | work-order | `WorkOrderStep` |
| `useWorkOrderItems` | work-order | `WorkOrderItem[]` |
| `useWorkOrderVehicle` | work-order | `{ vehicleId, customerId }` |
| `useWorkOrderTotals` | work-order | `{ itemCount, totalAmount }` |

### Adding a New Store

1. Create `src/lib/stores/<name>-store.ts`
2. Follow the middleware stack: `devtools > persist > immer`
3. Separate `State` and `Actions` interfaces
4. Export selector hooks for every frequently-accessed field
5. Export from `src/lib/stores/index.ts`
6. Add tests in `<name>-store.test.ts`

## Database & Multi-Tenancy Rules

- Every table MUST include `organization_id`, `branch_id`, `created_by`, `updated_by`, `created_at`, `updated_at`, `deleted_at`.
- **Row Level Security (RLS) must be enabled on all tables in public schema.** No exception.
- **Never hard-delete financial records.** Use `deleted_at`, `cancelled`, `voided`, or `refunded` statuses.
- **Inventory must be ledger-based** — never update a `quantity` column directly. Use `inventory_movements` with movement type, source, and audit trail.
- Business logic lives in Next.js server-side API routes and edge functions, **never in the browser**.

## Supabase

Use **Supabase MCP** by default. CLI only when MCP can't:
- `supabase migration new <name>` — create migration file (MCP has no equivalent)
- `supabase db push --linked` — if MCP `apply_migration` fails
- `supabase gen types typescript --linked` — if MCP `generate_typescript_types` fails

### Type Sync Rule

**Regenerate TypeScript types after every migration.** After MCP: `supabase_generate_typescript_types()`. After CLI: `supabase gen types typescript --linked > src/lib/database.types.ts`. Skipping this = build break. Always run `npm run build` after.

### Database Type Imports

**Never import from `@/lib/database.types` directly.** It's auto-generated and overwrites on every regeneration. Always use `@/lib/types` — the aliases in `src/lib/types/index.ts` survive regeneration.

## Testing Guidelines

- **Framework**: vitest (unit/integration), Playwright (E2E).
- **Test files**: co-located with source or in `__tests__/` directories.
- **Naming**: `describe('WorkOrderService')` / `it('deducts inventory on part addition')`.
- **RLS policies must be tested** — verify Organization A cannot access Organization B's data.
- Run `npm run test` before opening a PR.
- **When writing Playwright tests:** read the [Test Selectors for shadcn](#test-selectors-for-shadcn-components) and [Playwright Route Mocking](#playwright-route-mocking-via-playwright-mcp) sections above for component targeting patterns and network interception.

## Worktrunk Workflow

Every task runs in its own git worktree via `wt` (worktrunk). See `~/AGENTS.md §15` for the canonical workflow, or load the `worktrunk` skill.

**Project hooks** (`.config/wt.toml`):
- `post-start`: copies `.env` + runs `pnpm install`
- `pre-merge`: runs `pnpm validate && pnpm test`

Worktrees land as sibling directories: `../tolom.<sanitized-branch>/`

## Commit & Pull Request Guidelines

This repo follows the global guidelines in `~/AGENTS.md`:

- **Atomic commits** — one logical change per commit.
- **Do not commit secrets, env files, or local config.**
- **Test files must be in the same commit as their implementation.**
- **Commit order**: utilities/types → models/schemas → services/logic → API/controllers → config/infra.
- PRs should reference the relevant phase from `MASTER_PLAN.md` and include screenshots for UI changes.
- **Branch naming**: `feat/<phase>/<module>-<description>` — e.g., `feat/phase1/inventory-ledger`, `feat/phase2/services-catalog`. This links every branch to the development phase in MASTER_PLAN.md and makes it easy to track progress.

## Test Credentials

**All passwords:** `Tolom!11` · **PIN:** `1234`

| Role | Email | Org |
|------|-------|-----|
| Org Owner | `themuuln{num}@gmail.com` | `tolom{num}` |
| Mechanic | `mechanic{num}` | `tolom{num}` |

Default E2E test user (`E2E_EMAIL` / `E2E_PASSWORD` env vars): `themuuln4@gmail.com` / `Tolom!11` (owns `tolom4`).
Override with `E2E_EMAIL=other@example.com E2E_PASSWORD=... npx playwright test`.

## Testing Workflow

### Problem
Dev mode (`npm run dev`) compiles modules lazily via Turbopack — first requests take **8-9s**, making rapid testing painful.

### Solution
Always use a **production build on a separate port** for testing:

```bash
# Build (takes ~30s)
npm run build

# Start production server on a free port
PORT=$(nextport) npm run start
```

This eliminates all compilation overhead. First request is **~100ms** instead of 8s.

### Authenticated API Testing (curl)

For mutations, use curl with a session cookie. Extract the cookie from a logged-in browser session:

```bash
# 1. Get a session cookie from an active browser login
# Open http://localhost:{PORT}/dashboard/payroll, log in,
# then copy the sb-*-auth-token cookie from DevTools > Application > Cookies

COOKIE="sb-xxxxxxxxx-auth-token=<full-cookie-value>"
ORG_ID="00000000-0000-0000-0000-000000000001"

# 2. Test API endpoints
curl -s -b "$COOKIE" http://localhost:{PORT}/api/organizations/$ORG_ID/payroll/pay-rates
curl -s -X POST -b "$COOKIE" -H "Content-Type: application/json" \
  -d '{"year":2026,"month":6}' \
  http://localhost:{PORT}/api/organizations/$ORG_ID/payroll/calculate
```

### Playwright Route Mocking (via Playwright MCP)

When running tests via Playwright MCP (not writing `.spec.ts` files), use `playwright_browser_route` to mock network requests at the browser level. This lets you test error states, empty responses, and edge cases without modifying server code.

**Available tools** (enabled via `--caps=network,storage`):
- `playwright_browser_route` — Mock a URL pattern with status, body, headers
- `playwright_browser_route_list` — List all active routes
- `playwright_browser_unroute` — Remove routes by pattern (omit to clear all)
- `playwright_browser_network_state_set` — Toggle offline/online

**Concrete patterns for this codebase:**

```
# Mock Supabase REST API to return empty data
playwright_browser_route pattern='**/rest/v1/**' status=200 \
  body='[]' contentType='application/json'

# Mock a 500 error on a specific API route
playwright_browser_route pattern='**/api/invoices/*' status=500

# Mock rate limit on auth endpoints
playwright_browser_route pattern='**/api/auth/**' status=429 \
  body='{"error":"rate_limit_exceeded"}' contentType='application/json'

# Mock slow network (no route, just offline simulation)
playwright_browser_network_state_set state='offline'
```

**Workflow:**
1. Set up routes with `playwright_browser_route`
2. Navigate to the page with `playwright_browser_navigate`
3. Interact and snapshot to verify the UI handles the mocked response
4. Clean up with `playwright_browser_unroute`

### Common Pitfalls Found in QA

| Issue | Symptom | Fix |
|-------|---------|-----|
| **Nested `[id]` route params** | Build error: "same slug name 'id' repeat" | Rename nested param to `[recordId]` or `[orgId]` — Next.js disallows duplicate `[id]` in path |
| **`profiles!inner` join** | API returns empty `data:[]` silently | Add FK between tables, or query profiles in a separate call. Without a foreign key, Supabase can't resolve the join |
| **Missing UNIQUE constraint** | Upsert silently fails (no error, no insert) | Every `onConflict` must have a matching `UNIQUE` constraint on the table |
| **Upsert resets immutable fields** | Recalculate wipes `status` and `paid_at` | Use check-then-update instead of upsert when some fields must be preserved |
| **`revalidateTag` signature** | TypeScript error: "Expected 2 arguments" | Next.js 16 requires `revalidateTag(tag, "default")` — the second arg is mandatory |
| **RLS blocking service functions** | Quietly empty results | Service functions using `createClient()` inherit the request user's RLS. If the user lacks SELECT on a table, the query returns `[]` without error |
| **Missing test seed data** | Can't verify calculation logic | Add seed `mechanic_daily_reports` rows in the migration or via MCP before testing calculate endpoints |

### Testing Hygiene

1. **Test each phase before starting the next.** Don't write 7 phases then QA at the end — by phase 3 (API routes), hit the endpoints with curl. A profiles join bug found at phase 3 costs 2 minutes to fix. Found at phase 7 costs 30 minutes of backtracking.
2. **Build + production server before any API test.** Run `npm run build && PORT=$(nextport) npm run start` at the start of any session involving backend work. Never test against dev mode — the 8s compilation tax kills iteration speed.
3. **Always check the response shape.** An empty `data:[]` could mean "no records" or "silent SQL failure". When in doubt, run the query via MCP `supabase_execute_sql`.
4. **Test the full lifecycle before moving on.** For payroll: create rate → calculate → approve → pay → recalculate (verify status preserved). Each step validates the previous one.

### E2E Auth Session Sharing

All tests reuse a single authenticated session via Playwright's `storageState`:
- **`e2e/global-setup.ts`** — runs once before all tests. Logs in via the UI, saves session cookies + localStorage to `e2e/.auth/user.json`.
- **`playwright.config.ts`** — sets `globalSetup` and `storageState: "e2e/.auth/user.json"`. Every test starts already authenticated.
- **No per-test-file login needed.** Tests that don't need custom auth can skip `loginViaUI()` entirely. Only use `loginViaUI` when testing a different user role.

**If the auth session expires:** Delete `e2e/.auth/user.json` and re-run. The global setup regenerates it.

**`.gitignore`:** `e2e/.auth/*.json` is git-ignored. The `.gitkeep` file preserves the directory in version control.

## Optimistic UI

> **Load `.agents/skills/optimistic-ui/SKILL.md` before writing any mutation code.** The skill contains the full patterns, anti-patterns, and validation checklist.

Mutations must update the UI **synchronously** before the fetch fires. Don't block the user on a loading spinner — show the result instantly, rollback on error.

### Core Rules

1. **Never block optimistic updates with a busy guard.** `if (busy) return` before the state update causes the UI to freeze on rapid clicks. Optimistic state fires on every click; only the fetch can be gated.
2. **Use stable keys for reconciliation.** `useEffect` dependencies must be primitive strings, not object references. `serverValue` is a new array every render — derive a stable `JSON.stringify`/sorted-IDs key outside the effect.
3. **Track in-flight fetches with a counter, not a boolean.** A boolean busy flag blocks subsequent clicks. A `fetchCountRef` counter lets the UI stay responsive while tracking pending operations.
4. **Dismiss-then-show toasts.** Call `toast.dismiss()` before `toast.success()` so rapid interactions collapse into one visible toast instead of stacking.

### Implementation Pattern

```tsx
// ✅ CORRECT — optimistic + stable reconciliation
function MyComponent({ serverData, onMutation }) {
  const [optimistic, setOptimistic] = useState<T[] | null>(null);
  const lastRequestedRef = useRef<string | null>(null);
  const fetchCountRef = useRef(0);
  const prevIdsRef = useRef<string[]>([]);

  const serverValue = buildFromServerData(serverData);

  // Stable key for reconciliation (not an object reference)
  const serverKey = serverValue.map(m => m.id).sort().join(",");
  const lastKey = lastRequestedRef.current;

  useEffect(() => {
    if (!optimistic || !lastKey || fetchCountRef.current > 0) return;
    if (serverKey === lastKey) {
      setOptimistic(null);           // server caught up
      lastRequestedRef.current = null;
    }
  }, [serverKey, lastKey, optimistic]);

  const value = optimistic ?? serverValue;

  // Keep ref in sync every render (for diffing in handler)
  prevIdsRef.current = value.map(m => m.id);

  const handleChange = useCallback(async (newValue: T[]) => {
    // 1. Optimistic — fires on EVERY click, never guarded
    setOptimistic(newValue);
    const newIds = newValue.map(m => m.id);
    lastRequestedRef.current = [...newIds].sort().join(",");
    const oldIds = prevIdsRef.current;
    prevIdsRef.current = newIds;

    // 2. Diff what changed
    const added = newValue.filter(m => !new Set(oldIds).has(m.id));
    const removed = oldIds.filter(id => !new Set(newIds).has(id));

    // 3. Fetch (tracked, not blocking)
    for (const item of added) {
      fetchCountRef.current++;
      try {
        await fetch(...);
        toast.dismiss(); toast.success("Added");
        onMutation();
      } catch {
        toast.error("Failed");
      } finally {
        fetchCountRef.current--;
      }
    }
  }, [...]);

  return <Combobox value={value} onValueChange={handleChange} />;
}
```

### Anti-Patterns

| Anti-Pattern | Why It Breaks | Fix |
|---|---|---|
| `if (busy) return` before `setOptimistic` | Second click is silently dropped — UI freezes | Remove guard, use `fetchCountRef` for fetch-only gating |
| `useEffect` depends on object/value refs | Runs every render (new array/object reference), causes flicker | Derive stable `string` key: `ids.sort().join(",")` |
| `setOptimistic(null)` inside render IIFE | State update during render → extra re-renders | Move to `useEffect` |
| Per-fetch toasts on rapid clicks | Toast spam (5 clicks = 5 toasts) | `toast.dismiss()` before each `toast.success()` |
| Boolean busyRef blocks handler | Skips optimistic update AND ref diff, losing the click | Use `fetchCountRef` counter, never guard the handler |

### Error Rollback

On fetch failure, clear optimistic so server state takes over:
```tsx
} catch {
  setOptimistic(null); // rollback to last known server state
  toast.error("Failed");
}
```

## Architecture Notes

- **Feature flags and settings over hard-coding** — never build one-off customizations. Everything must be configurable.
- **Read `MASTER_PLAN.md` before building** — the development order (Phase 0 → Phase 1 → ...) is intentional and should not be reordered.
- **Phase 0 (multi-tenant foundation) is the completion gate** — no product features until auth, orgs, branches, roles, and RLS are solid.


## UI Loading Patterns

### Layout-Preserving Loading (Preserve Chrome on Refetch)

**Problem**: When changing tabs/filters/periods, React Query's `isPending` goes `true` and `data` becomes `undefined` (new query key, no cache hit). If the page early-returns a full skeleton, it hides the tab bar, buttons, and other static UI — making the page feel broken.

**Rule**: Once the initial page layout has rendered (user has seen the real UI), never replace the page chrome with skeletons. Always preserve the static layout (tabs, headers, buttons) and only skeleton-load the data-dependent content areas.

**Implementation pattern:**

```tsx
// ❌ BAD — hides period bar / tab buttons on period change
const { isPending, data } = useQuery(...);
if (isPending && !data) return <FullPageSkeleton />;

// ✅ GOOD — always keep layout visible after first load
const { isPending, isFetching, data } = useQuery(...);
const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
useEffect(() => { if (data) setHasLoadedOnce(true); }, [data]);

// Only full skeleton on absolute FIRST load (never seen data)
if (isPending && !hasLoadedOnce) return <FullPageSkeleton />;

// After first load: always render layout, skeleton only data areas
return (
  <div>
    <TabsOrFilters />  {/* always visible */}
    <KpiCards loading={!data || isFetching} />  {/* skeleton values */}
    <ChartSection />  {/* dynamic import handles its own loading */}
  </div>
);
```

**Key React Query exports:**
- `isPending` — `true` when no data exists for current key
- `isFetching` — `true` during ANY fetch (including refetches when data exists)
- `isRefetching` — `true` during fetch but data already exists (`isFetching && !isPending`)

Use `hasLoadedOnce` ref to distinguish "never loaded" from "period transition."

**In KPI cards / value displays**, pass `loading={!data || isFetching}` to show skeletons on data values while preserving the card layout, labels, and icons.

**In dynamic imports**, let the dynamic `loading` callback handle its own skeleton. Don't wrap it in an early return.

### Гарын авлага (VitePress Documentation) Sync Rule

- **Always update docs after code changes.** After implementing, modifying, or removing any user-facing feature, page, API, or UI element, check whether the corresponding page in `docs/*.md` (VitePress source) needs updating.
- If a new page/feature is added → create a new `docs/*.md` file and add it to `docs/.vitepress/config.mjs` sidebar.
- If an existing page/feature changes → update the matching `docs/*.md` with the current behavior, fields, options, and flow.
- After updating docs source, run `npm run docs:build` to regenerate `public/guide/` and verify the updated pages render via `/guide/*` on the dev server.
- This applies to all feature work, settings changes, UI layout changes, and new modules — not just explicit documentation requests.
