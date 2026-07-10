# Code Review: Uncommitted Changes

## Context
224 files changed (+2761/-13631). Major restructure:
- Internal `packages/` (both `@zer/*` and legacy `@zuiio/*`) **deleted** — functionality moved to monorepo `@zuiio/*` packages
- Many dashboard pages **converted from server-component data fetching to client-side TanStack Query** (PPR refactor)
- `select("*")` → `select("col1,col2,...")` column narrowing across all queries
- Turnstile CAPTCHA added to login/register
- Agent gateway migration: `search_path = ''` hardening
- `loading.tsx` files deleted (PPR pattern)
- Various drawer conditionals cleaned up

## Review Focus

Each reviewer MUST:
1. `git diff -- <assigned-files>` and `git diff --cached -- <assigned-files>` for the full diff
2. Check for **orphaned imports** from deleted packages
3. Verify **type safety** of narrowed column selects
4. Check **PPR pattern correctness** (no server-component data fetching that blocks the shell)
5. Verify **convention compliance** per AGENTS.md

---

## Task 1: Core Config, Package.json, Workspace
**Files:**
- `package.json` 
- `tsconfig.json`
- `pnpm-workspace.yaml`
- `src/lib/branding.ts`

**Check:**
- New deps correctly added (turnstile, any others)
- Old `@zer/*` path aliases removed from tsconfig paths
- Workspace yaml properly removed old package glob
- Branding barrel re-export targets existing `@zuiio/branding`

## Task 2: Deleted @zer/* packages
**Files:**
- `packages/branding/` (package.json + src/index.ts)
- `packages/config/` (package.json + tsconfig.base.json)
- `packages/core/` (all src/*.ts, index.ts, package.json, tsconfig.json)
- `packages/export/` (all src/*.ts, index.ts, package.json, tsconfig.json)
- `packages/hooks/` (all src/*.ts, index.ts, package.json, tsconfig.json)
- `packages/i18n/` (all src/*.ts, index.ts, package.json, tsconfig.json)
- `packages/query/` (all src/*.ts, index.ts, package.json, tsconfig.json)
- `packages/supabase/` (all src/*.ts, index.ts, package.json, tsconfig.json)

**Check:**
- No remaining imports from `@zer/*` in the codebase (`grep` for `@zer/`)
- Verify monorepo `@zuiio/*` packages cover the same exports

## Task 3: Deleted @zuiio packages — AI Agent, Capture, Config
**Files:**
- `packages/zuiio-ai-agent/` (all files)
- `packages/zuiio-capture/` (all files)
- `packages/zuiio-config/` (package.json + tsconfig.json)

**Check:**
- `@zuiio/ai-agent` — any remaining imports? (grep `@zuiio/ai-agent`)
- `@zuiio/capture` — is the library still imported in app files? Verify `withDbCapture` and `capture` still work
- `@zuiio/config` — are there tsconfig extends that need updating?
- Verify the monorepo versions exist and cover these exports

## Task 4: Deleted @zuiio packages — Core, Export, Hooks
**Files:**
- `packages/zuiio-core/` (all files)
- `packages/zuiio-export/` (all files)
- `packages/zuiio-hooks/` (all files)

**Check:**
- `@zuiio/core` — remaining imports? check barrel files in src/lib/ that re-export
- `@zuiio/export` — verify serve.ts functions still accessible from monorepo
- `@zuiio/hooks` — any direct imports in app/ or components/?

## Task 5: Deleted @zuiio packages — HR, Offline, Query, Realtime
**Files:**
- `packages/zuiio-hr/` (all files including tests)
- `packages/zuiio-offline/` (all files)
- `packages/zuiio-query/` (all files including tests)
- `packages/zuiio-realtime/` (all files)

**Check:**
- `@zuiio/hr` — packages/hr-core and packages/hr-supabase exist? Verify
- `@zuiio/offline` — any remaining use? grep imports
- `@zuiio/query` — verify useOptimisticCreate/Update/Delete re-exports in src/lib/query/ use-optimistic.ts
- `@zuiio/realtime` — remaining imports?

## Task 6: Auth pages + Turnstile + Email
**Files:**
- `src/app/(auth)/forgot-password/actions.ts`
- `src/app/(auth)/login/actions.ts`
- `src/app/(auth)/login/login-form.tsx`
- `src/app/(auth)/register/actions.ts`
- `src/app/(auth)/register/page.tsx`
- `src/app/(auth)/reset-password/actions.ts`
- `src/app/(onboarding)/onboarding/page.tsx`
- `src/app/api/email/test/route.ts`

**Check:**
- Turnstile integration: `validateTurnstile` import path resolves? Token passed from client to server action?
- `capture()` call removed from catch blocks — is error handling still adequate?
- Onboarding page: narrowed `select()` correct for the component's needs?
- Email test route: narrowed select has all needed columns?

## Task 7: Accounting, Commissions, Discounts, Expenses
**Files:**
- `src/app/(dashboard)/accounting/accounting-content.tsx`
- `src/app/(dashboard)/accounting/loading.tsx` (DELETED)
- `src/app/(dashboard)/accounting/page.tsx`
- `src/app/(dashboard)/commissions/loading.tsx` (DELETED)
- `src/app/(dashboard)/discounts/discounts-content.tsx`
- `src/app/(dashboard)/expenses/expenses-content.tsx`
- `src/app/(dashboard)/expenses/expenses-table.tsx`
- `src/app/(dashboard)/expenses/page.tsx`

**Check:**
- PPR pattern: loading.tsx deleted, page.tsx switched to client-side fetch via useQuery — verify shell renders immediately
- Accounting: useQuery + query keys correct? Branch filter handled?
- Discounts: drawer conditional removed? Verify it still mounts properly
- Expenses: useQuery + withDbCapture present? Branch filter working?

## Task 8: HR pages
**Files:**
- `src/app/(dashboard)/hr/page.tsx`
- `src/app/(dashboard)/hr/payroll/page.tsx`
- `src/components/hr/employee-table.tsx`
- `src/components/hr/payroll-run-list.tsx`

**Check:**
- PPR conversion: page.tsx simplified, loading deleted
- Employee-table: drawer conditional pattern — removed correctly? Check mount condition
- Payroll-run-list: `PayrollRunRow` export change — verify consumers handle it

## Task 9: Inventory main + categories + warehouses
**Files:**
- `src/app/(dashboard)/inventory/loading.tsx` (DELETED)
- `src/app/(dashboard)/inventory/page.tsx`
- `src/app/(dashboard)/inventory/categories/page.tsx`
- `src/app/(dashboard)/inventory/warehouses/warehouses-client.tsx`
- `src/components/categories/categories-table.tsx`

**Check:**
- PPR conversion complete — page.tsx simplified, loading deleted
- Categories-table: drawer conditional removed — verify
- Warehouses: `.select("*")` → `.select("id,name,location,is_default,created_at")` — are all consumed fields covered?
- Categories page: redirect logic preserved? PPR pattern correct?

## Task 10: Inventory adjustments + movements
**Files:**
- `src/app/(dashboard)/inventory/adjustments/adjustments-content.tsx`
- `src/app/(dashboard)/inventory/adjustments/page.tsx`
- `src/app/(dashboard)/inventory/movements/movements-content.tsx`
- `src/app/(dashboard)/inventory/movements/page.tsx`

**Check:**
- Adjustments-content: major restructure — verify data fetching, pagination, and action buttons work
- PPR pattern: page.tsx simplified correctly
- Movements: Plus icon import added — verify it's used
- Verify all TanStack Query usage follows conventions

## Task 11: Inventory restock
**Files:**
- `src/app/(dashboard)/inventory/restock/page.tsx`
- `src/app/(dashboard)/inventory/restock/restock-content.tsx`

**Check:**
- PPR conversion: page.tsx simplified, content now handles data fetching client-side
- Restock-content: major changes (+388/-191) — verify all state, fetching, and error handling
- Check conventions: withDbCapture on supabase queries, drawers pattern

## Task 12: Invoices, Products/Bundles, Reports, Returns
**Files:**
- `src/app/(dashboard)/invoices/[id]/page.tsx`
- `src/app/(dashboard)/products/bundles/bundles-content.tsx`
- `src/app/(dashboard)/reports/loading.tsx` (DELETED)
- `src/app/(dashboard)/returns/page.tsx`
- `src/app/(dashboard)/returns/returns-content.tsx`
- `src/components/products/bundle-detail-drawer.tsx`
- `src/components/products/products-table.tsx`

**Check:**
- Invoices: massive page.tsx simplification — what moved? Verify detail content component
- Bundles: drawer conditional removed — verify mount pattern
- Returns: PPR conversion complete? Returns-content has useQuery now
- Bundle detail: null-safe `(bundle.items ?? [])` change — verify
- Products table: `useBrands` hook added — verify it exists and works
- Reports: loading deleted, PPR pattern

## Task 13: Sales pages
**Files:**
- `src/app/(dashboard)/sales/[id]/page.tsx`
- `src/app/(dashboard)/sales/[id]/loading.tsx` (DELETED)
- `src/app/(dashboard)/sales/page.tsx`
- `src/app/(dashboard)/sales/sales-content.tsx`
- `src/components/sales/sale-detail-drawer.tsx`

**Check:**
- Sales detail: page.tsx simplified — what moved? Detail component exists?
- Sales page: `SalesDataFetcher` signature changed — verify callers updated
- Sale detail drawer: null-safe `(sale.sale_items ?? [])` change
- PPR pattern across all sales pages

## Task 14: Settings pages (all sub-pages)
**Files:**
- All `src/app/(dashboard)/settings/*` files (actions, page.tsx, loading.tsx deletions, sub-pages)
- `src/app/(dashboard)/settings/branches/branches-content.tsx`

**Check:**
- PPR conversion for ALL settings pages — loading.tsx deletions, page.tsx simplifications
- Branch content: useEffect added? Verify
- Narrowed selects: `select("brand_name,brand_logo_url,...")` — verify all consumed columns present
- SMTP/notification config selects narrowed correctly
- Users actions: `getAuthUsers` function added — verify signature and consumers
- Branches page: old server-component code removed correctly

## Task 15: Shop pages + layout
**Files:**
- `src/app/(dashboard)/shop/layout.tsx`
- `src/app/(dashboard)/shop/loading.tsx` (DELETED)
- `src/app/(dashboard)/shop/receipt/[id]/page.tsx`
- `src/components/shop/product-card.tsx`
- `src/components/shop/receipt-content.tsx`
- `src/components/shop/receipt-drawer.tsx`
- `src/components/shop/shop-history-drawer.tsx`

**Check:**
- Shop layout: Suspense added — verify streaming/P PR pattern
- Receipt page: PPR conversion, detail content component
- Product card: major refactor (+279/-187) — verify memo, ref, state handling
- Receipt content: useQuery + useParams — verify pattern
- Receipt drawer: conditional loading UI removed — verify
- Shop history drawer: deeper drawer conditional pattern correct?

## Task 16: Lib files, Migration, Components, Types
**Files:**
- `src/lib/branches.ts`
- `src/lib/email.ts`
- `src/lib/notification.ts`
- `src/lib/query/factory.ts`
- `src/lib/supabase/types.ts`
- `src/components/customers/customers-table.tsx`
- `src/components/suppliers/suppliers-table.tsx`
- `src/components/products/variant-picker.tsx`
- `supabase/migrations/20260706000000_agent_gateway_production.sql`

**Check:**
- Lib narrowed selects: branches (`select("id,organization_id,name,...")`), email (smtp_configs), notification (notification_configs) — columns cover all consumed fields
- Types: `payroll_runs` type added — verify schema matches DB
- Migration: `search_path = ''` change — verify this is the intended hardening
- Customer/supplier tables: drawer conditionals removed — verify mount pattern
- Variant picker: massive change (+465/-65) — verify all state, variant selection, and UI rendering
- Factory.ts: example comment updated — verify
