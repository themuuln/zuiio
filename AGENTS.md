# Repository Guidelines

**Generated:** 2026-06-01 · **Commit:** `69144ed` · **Branch:** `main`

Sub-AGENTS.md exist for high-complexity directories. Read this first, then drill into specific layers.

| Layer | File |
|-------|------|
| Business logic | `src/lib/services/AGENTS.md` |
| Shared components | `src/components/AGENTS.md` |

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

### MCP Servers Available

This project has the following MCP servers connected. Use them instead of raw CLI when possible:
- **supabase** (23 tools) — migrations, SQL, types, edge functions, docs search
- **next-devtools** (24 tools) — component insights, server actions, routes
- **shadcn** (7 tools) — component search, add, docs
- **context7** (2 tools) — live documentation queries for any library (Next.js, Biome, Supabase, React, etc.)
- **playwright** (23 tools) — browser testing

Use `context7_query-docs` via MCP to look up live docs without leaving the terminal (e.g., "how does Biome 2.x `includes` work").

## UI Components & shadcn

### Hard rule: Check before building anything

**Before implementing ANY new UI element:**
1. Run `npx shadcn@latest search @shadcn -q "<component>"` — search available shadcn components by keyword
2. Check `src/components/ui/` for already-installed components
3. Run `npx shadcn@latest docs <component>` to get usage docs

**Raw HTML elements are FORBIDDEN when a shadcn component covers the same use case.** If Component exists in `src/components/ui/`, use it — never build from primitives.

### Component Mapping (Installed Components)

Use these shadcn components instead of raw HTML:

| Need | Use | Instead Of |
|------|-----|------------|
| Action/click | `<Button>` | `<button>`, `<div onClick>` |
| Input field | `<Input>` | `<input>` |
| Textarea | `<Textarea>` | `<textarea>` |
| Select (few options) | `<Select>` + `<SelectItem>` | `<select>`, `<NativeSelect>` |
| Select (many options / search) | `<Combobox>` + `<ComboboxInput>` | `<Select>` with 10+ items |
| Status/badge label | `<Badge variant="outline\|secondary\|destructive">` | `<span className="rounded-full ...">` |
| Empty state | `<Empty>` + `<EmptyTitle>` + `<EmptyMedia>` | Custom `<div>` with "No data" |
| Alert/callout | `<Alert variant="destructive\|default">` | `<div className="bg-red-50 border-red-200 ...">` |
| Horizontal divider | `<Separator />` | `<hr>`, `<div className="border-t" />` |
| Skeleton loading | `<Skeleton className="...">` | `<div className="animate-pulse ...">` |
| Toggle 2-7 options | `<ToggleGroup>` + `<ToggleGroupItem>` | Multiple `<button>` with manual active state |
| Dialog/modal | `<Dialog>` | Raw `<div role="dialog">` |
| Side panel | `<Sheet>` | Custom slide-out overlay |
| Bottom sheet | `<Drawer>` | Custom swipeable panel |
| Tooltip | `<Tooltip>` + `<TooltipContent>` | `title` attribute, custom hover popup |
| Form field layout | `<Field>` + `<FieldGroup>` + `<FieldLabel>` | `<div className="space-y-2"><Label>...</div>` |
| Form input with addon | `<InputGroup>` + `<InputGroupAddon>` | `<div className="flex"><Input /><button>...</div>` |
| Navigation | `<NavigationMenu>`, `<Breadcrumb>`, `<Sidebar>` | Custom nav lists |
| Separator menu item | `<DropdownMenuSeparator>` | `<div className="border-t">` in dropdown |
| Chart | `<ChartContainer>` + `<Chart>` | Raw Recharts components |
| Accordion | `<Accordion>` + `<AccordionItem>` | Custom expand/collapse |
| Tabs | `<Tabs>` + `<TabsList>` + `<TabsTrigger>` | Button-based tab switchers |

### Style Rules

These rules apply to ALL components, not just new ones.

#### Spacing
- **Use `gap-*` with `flex`/`flex-col`, NOT `space-y-*` or `space-x-*`**
  ```tsx
  // ✅ CORRECT
  <div className="flex flex-col gap-4">
  // ❌ WRONG
  <div className="space-y-4">
  ```
- **Use `size-*` when width equals height**, NOT `w-* h-*`
  ```tsx
  // ✅ CORRECT
  <Avatar className="size-10" />
  // ❌ WRONG
  <Avatar className="w-10 h-10" />
  ```

#### Colors
- **Use semantic tokens only:** `bg-background`, `text-foreground`, `bg-muted`, `text-muted-foreground`, `bg-primary`, `text-primary-foreground`, `bg-destructive`, `text-destructive`, `bg-accent`, `text-accent-foreground`, `bg-card`, `text-card-foreground`, `bg-popover`, `text-popover-foreground`, `border-border`, `border-input`, `border-ring`
- **Never use raw color values:** `bg-blue-500`, `text-green-700`, `border-gray-200`, `bg-red-50`
- **Dark mode is automatic via CSS variables** — never add `dark:` overrides manually

#### Truncation
- **Use `truncate` shorthand** — not `overflow-hidden text-ellipsis whitespace-nowrap`

### Common Anti-Patterns (Must Fix)

#### 1. Custom Badge Spans → `<Badge>`
❌ `<span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-green-100 text-green-700">`
✅ `<Badge variant="outline">Active</Badge>`

The `Badge` component supports these variants: `default`, `secondary`, `destructive`, `outline`, `ghost`, `link`. Use `variant="outline"` for status badges (paid, pending, completed, etc.) and `variant="secondary"` for count badges.

#### 2. Custom Alert/Callout Divs → `<Alert>`
❌ `<div className="rounded-lg border border-red-200 bg-red-50 p-3"><AlertTriangle />Error</div>`
✅ `<Alert variant="destructive"><AlertTriangle /><AlertTitle>Error</AlertTitle><AlertDescription>Details</AlertDescription></Alert>`

#### 3. Custom Empty States → `<Empty>`
❌ `<div className="flex flex-col items-center py-12"><p>No data found</p></div>`
✅ `<Empty><EmptyHeader><EmptyMedia variant="icon"><Icon /></EmptyMedia><EmptyTitle>No data</EmptyTitle></EmptyHeader></Empty>`

#### 4. Raw `<hr>` / `border-t` Divs → `<Separator>`
❌ `<hr className="border-border" />`
❌ `<div className="border-t" />`
✅ `<Separator />`

Only replace standalone visual dividers — NOT structural container borders on Cards, Dialogs, or Sheet headers.

#### 5. `animate-pulse` Divs → `<Skeleton>`
❌ `<div className="h-4 w-20 animate-pulse rounded bg-muted-foreground/20" />`
✅ `<Skeleton className="h-4 w-20" />`

#### 6. Raw `<button>` → `<Button>`
❌ `<button onClick={...} className="px-4 py-2 bg-primary text-white rounded-md">`
✅ `<Button onClick={...}>Submit</Button>`

#### 7. Segmented Controls → `<ToggleGroup>`
❌ Multiple `<button>` elements with manual `bg-primary` active state
✅ `<ToggleGroup><ToggleGroupItem value="day">Day</ToggleGroupItem>...</ToggleGroup>`

### Component Selection Guide

| If you have... | Use... |
|---|---|
| 2-7 mutually exclusive options | `<ToggleGroup>` |
| 3-20 options, one choice | `<Select>` |
| 10+ options or user should search | `<Combobox>` |
| A yes/no toggle | `<Switch>` |
| Multiple independent choices | `<Checkbox>` |
| One choice from 2-5 | `<RadioGroup>` |
| A range value | `<Slider>` |
| A date selection | `<DatePicker>` |
| An OTP/code input | `<InputOTP>` |

### Installed shadcn Components

All components in `src/components/ui/` are available for use. Current inventory (58 components):

`Accordion`, `AlertDialog`, `Alert`, `Avatar`, `Badge`, `Breadcrumb`, `Button`, `ButtonGroup`, `Calendar`, `Card`, `Carousel`, `Chart`, `Checkbox`, `Collapsible`, `Combobox`, `Command`, `ContextMenu`, `DatePicker`, `Dialog`, `Drawer`, `DropdownMenu`, `Empty`, `Field`, `HoverCard`, `Input`, `InputGroup`, `InputOTP`, `Kbd`, `Label`, `Menubar`, `NativeSelect`, `NavigationMenu`, `Pagination`, `Popover`, `Progress`, `RadioGroup`, `Resizable`, `ScrollArea`, `Select`, `Separator`, `Sheet`, `Sidebar`, `Skeleton`, `Slider`, `Sonner`, `Spinner`, `Switch`, `Table`, `Tabs`, `Textarea`, `Toggle`, `ToggleGroup`, `Tooltip`, `Typography`

### Adding New Components

```bash
npx shadcn@latest add <component-name>
# e.g., npx shadcn@latest add tabs sheet tooltip
```

After adding, verify against the rules above. Third-party registries (e.g., `@magicui`, `@bundui`) may use hardcoded import paths — fix these to match the project's `@/components/ui/` alias.

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

## Supabase CLI & MCP Usage

### MCP First — CLI Only When MCP Can't

**Default: Use Supabase MCP tools.** Only fall back to CLI when MCP has no equivalent.

| Operation | Preferred Tool | Notes |
|-----------|---------------|-------|
| Create migration file | **CLI** `supabase migration new <name>` | MCP has no equivalent — only CLI use case |
| Apply migration to remote | **MCP** `supabase_apply_migration` | Name + SQL. If migration already exists, use `supabase_execute_sql` |
| Apply ad-hoc SQL | **MCP** `supabase_execute_sql` | Direct SQL execution, no migration tracking |
| Execute ad-hoc SQL query | **MCP** `supabase_execute_sql` | SELECT, INSERT, UPDATE, etc. |
| Generate TS types | **MCP** `supabase_generate_typescript_types` | Direct output, no `2>/dev/null` needed |
| List/inspect tables | **MCP** `supabase_list_tables` | Schema introspection |
| List migrations | **MCP** `supabase_list_migrations` | Check applied migrations |
| Check security/performance | **MCP** `supabase_get_advisors` | Advisory notices |
| Get logs | **MCP** `supabase_get_logs` | Edge function, auth, API logs |
| Deploy edge function | **MCP** `supabase_deploy_edge_function` | Upload and deploy |
| Search docs | **MCP** `supabase_search_docs` | GraphQL-based doc search |

### Applying Migrations (MCP Workflow)

```bash
# 1. Create migration file locally (CLI — only CLI step)
supabase migration new <name>

# 2. Write SQL in the migration file

# 3. Apply via MCP (preferred)
# Use supabase_apply_migration with name + SQL content
# OR supabase_execute_sql for ad-hoc data changes

# 4. Regenerate types via MCP
# Use supabase_generate_typescript_types

# 5. Verify
npm run build
```

### When CLI Is Still Needed

- `supabase migration new <name>` — create migration file (MCP has no equivalent)
- `supabase db push --linked` — only if MCP `apply_migration` fails or for batch migration pushes
- `supabase gen types typescript --linked` — only if MCP `generate_typescript_types` fails

### MCP Tool Quick Reference

| Tool | Purpose |
|------|---------|
| `supabase_apply_migration` | Apply SQL migration by name |
| `supabase_execute_sql` | Run raw SQL (SELECT, INSERT, UPDATE, DDL) |
| `supabase_generate_typescript_types` | Generate TypeScript types |
| `supabase_list_tables` | List tables in schema |
| `supabase_list_migrations` | List applied migrations |
| `supabase_get_advisors` | Security/performance advisories |
| `supabase_get_logs` | Project logs by service type (api, postgres, auth, edge-function, storage, realtime) |
| `supabase_search_docs` | Search Supabase documentation |

### Debugging with Supabase Logs (MCP)

When debugging Supabase-related issues (failed queries, silent failures, auth problems), check the logs first via MCP before writing ad-hoc test queries.

**Available log services:**

| `service` | What it shows | Use for |
|-----------|---------------|--------|
| `api` | PostgREST HTTP requests + status codes | 400/401/403/500 errors, slow queries |
| `postgres` | Postgres query errors | SQL errors, constraint violations, GROUP BY issues |
| `auth` | Auth events (login, signup, token) | Auth failures, session issues |
| `edge-function` | Edge function invocations | Webhook errors, scheduled job failures |
| `storage` | Storage operations | Upload/download failures |
| `realtime` | Realtime connections | Connection drops |

**Workflow:**

```
1. Check API logs:  supabase_get_logs(service="api") → look for 4xx/5xx status codes
2. Check Postgres:  supabase_get_logs(service="postgres") → look for ERROR severity
3. Check Auth:      supabase_get_logs(service="auth") → look for failed logins
```

**What logs catch vs. what they miss:**

| Scenario | Visible in logs? |
|----------|-----------------|
| SQL syntax error | ✅ `postgres` logs show ERROR |
| Missing column/constraint | ✅ `postgres` logs show ERROR |
| Auth token expired | ✅ `auth` logs show the event |
| HTTP 500 from API | ✅ `api` logs show status 500 |
| **RLS silent block (UPDATE returns 200 + empty data)** | ❌ API shows 200 — no error logged |
| **RLS silent block (SELECT returns [])** | ❌ API shows 200 — no error logged |

For silent RLS blocks, use `logSupabaseResult()` from `@/lib/supabase/logger` in service code, or query the table directly via `supabase_execute_sql` to verify data exists.

### Type Sync Rule

- **Regenerate TypeScript types after every migration**, regardless of which tool applied it.
- After MCP: call `supabase-tolom_generate_typescript_types()`.
- After CLI: `supabase gen types typescript --linked > src/lib/database.types.ts`.
- Committing a migration without updating `database.types.ts` is a build break — the frontend will reference columns/types that don't exist or miss new ones.
- Always run `npm run build` after regenerating types to catch mismatches.

### Failure consequence
Skipping the deploy step causes **"Failed to load..." errors** — API routes/Supabase queries fail because the remote database doesn't have the latest tables/functions. All development blocks until resolved.

### Database Type Safety — Import Convention

**`src/lib/database.types.ts` is raw generated output — never manually edit it.**
Running `supabase gen types typescript` (or the MCP equivalent) **overwrites the entire file**.
The Supabase v6+ generator outputs helpers (`Tables<>`, `Enums<>`) but **no explicit type exports**.

**Rule: Never import from `@/lib/database.types` directly.** Always use `@/lib/types` instead:

```ts
// ❌ WRONG — breaks when database.types.ts is regenerated
export type { Customer } from "@/lib/database.types";

// ✅ RIGHT — stable, survives regeneration
export type { Customer } from "@/lib/types";
```

The convenience type aliases live in `src/lib/types/index.ts` and reference the raw `Database` type from `database.types.ts` using the helpers:

```ts
// src/lib/types/index.ts (conceptual — only modify, don't replicate)
import type { Database } from "@/lib/database.types";
type Pub = Database["public"];

export type Customer = Pub["Tables"]["customers"]["Row"];
export type WorkOrderStatus = "New" | "Diagnosing" | /* ... */;
```

**To prevent regressions**, the lint config (`biome.json`) must enforce this:

```json
// biome.json
{
  "linter": {
    "rules": {
      "correctness": {
        "noRestrictedImports": {
          "options": {
            "paths": {
              "@/lib/database.types": {
                "message": "Import from @/lib/types instead — database.types.ts is regenerated and may not export this type."
              }
            }
          }
        }
      }
    }
  }
}
```

**Migration checklist after type regeneration:**
1. Run `supabase gen types typescript --linked > src/lib/database.types.ts`
2. Run `npm run build` — if it passes, you're done
3. If it fails, check whether `src/lib/types/index.ts` needs a new/updated alias for the changed type
4. Fix only in `src/lib/types/index.ts` — never touch `database.types.ts`

## Testing Guidelines

- **Framework**: vitest (unit/integration), Playwright (E2E).
- **Test files**: co-located with source or in `__tests__/` directories.
- **Naming**: `describe('WorkOrderService')` / `it('deducts inventory on part addition')`.
- **RLS policies must be tested** — verify Organization A cannot access Organization B's data.
- Run `npm run test` before opening a PR.

## Worktrunk Workflow

Every task runs in its own git worktree via `wt` (worktrunk). See `~/AGENTS.md #19` for the canonical workflow, or load the `worktrunk` skill.

**Project hooks** (`.config/wt.toml`):
- `post-start`: copies `.env` + runs `pnpm install`
- `pre-merge`: runs `pnpm validate && pnpm test`

Worktrees land as sibling directories: `../tolom.<sanitized-branch>/`

## Commit & Pull Request Guidelines

This repo follows the global guidelines in `~/.factory/AGENTS.md`:

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

Examples: `themuuln4@gmail.com` owns `tolom4`, `mechanic4` works at `tolom4`.

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

## Architecture Notes

- **Feature flags and settings over hard-coding** — never build one-off customizations. Everything must be configurable.
- **Read `MASTER_PLAN.md` before building** — the development order (Phase 0 → Phase 1 → ...) is intentional and should not be reordered.
- **Phase 0 (multi-tenant foundation) is the completion gate** — no product features until auth, orgs, branches, roles, and RLS are solid.

## Installed Agent Skills (Global)

The following skills are installed globally (`~/.agents/skills/`) and MUST be loaded via `skill(name="...")` when the task matches their domain. They auto-trigger on relevant keywords.

| Skill | When to Load | Trigger Keywords |
|-------|-------------|-----------------|
| **frontend-design** | Designing/redesigning any UI — pages, components, layouts. Rejects generic AI aesthetics. | `design UI`, `redesign`, `make it look good`, `frontend`, `landing page`, `aesthetic` |
| **ui-ux-pro-max** | Choosing colors, typography, layout patterns, or reviewing UX. 50+ styles, 161 palettes, 57 font pairings. | `color palette`, `typography`, `UX pattern`, `design system`, `style guide`, `UI review` |
| **web-design-guidelines** | Auditing UI code for design and accessibility compliance against Vercel standards. | `audit design`, `check UI`, `accessibility review`, `design review`, `polish` |
| **marketing-psychology** | Applying behavioral science, cognitive biases, or psychology to conversion, onboarding, or pricing pages. | `psychology`, `cognitive bias`, `conversion`, `behavioral science`, `persuasion`, `A/B test` |
| **product-management** | Product strategy, roadmap, prioritization, PRDs, OKRs, PMF measurement, stakeholder decisions. | `roadmap`, `prioritize`, `PRD`, `OKR`, `product strategy`, `PMF`, `RICE`, `backlog` |

**Usage**: When a task matches any trigger keyword above, call `skill(name="<skill-name>")` before proceeding.

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
