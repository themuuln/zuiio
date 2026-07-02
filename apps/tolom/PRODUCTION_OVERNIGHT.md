# TOLOM — Production Readiness Overnight

> Based on: MASTER_PLAN.md, PROJECT_STATUS.md, PLAN.md, AGENTS.md
> Stack: Next.js 16.2.6, Supabase, PostgreSQL, Vitest v3, shadcn/ui, agent-browser

---

## CRITICAL CONTEXT — Read Before Acting

### MCP Tools Available (use these for ALL operations)

| MCP | Command/Use | Purpose |
|-----|-------------|---------|
| **Supabase MCP** | `mcp_supabase_*` tools via `.mcp.json` | Migrations, schema inspection, SQL queries, edge function deploy, DB debugging, storage. Project ref: `fhzuolncswccxkcqzclg` — this is the LIVE remote Supabase project. All DB operations go through this. |
| **next-devtools** | `next-devtools_*` tools | Next.js 16 diagnostics, route inspection, error detection, dev server MCP tools |
| **shadcn** | `shadcn_*` tools | Add/search/list shadcn/ui components from registry |
| **agent-browser** | `agent-browser` CLI (v0.27.0) | E2E browser testing — navigate, snapshot, screenshot, console capture |

### Supabase MCP Commands Reference

```bash
# Database operations
mcp_supabase_run_sql(query="SELECT * FROM information_schema.tables WHERE table_schema='public'")
mcp_supabase_get_migration_history()
mcp_supabase_push_migration(file_path="supabase/migrations/...")
mcp_supabase_deploy_function(function_path="supabase/functions/...")

# Inspection
mcp_supabase_get_schema(schema_name="public")
mcp_supabase_get_table_schema(table_name="work_orders")
mcp_supabase_get_rls_policies()

# Edge functions
mcp_supabase_list_functions()
mcp_supabase_get_function_logs(function_name="check-service-reminders")
```

**IMPORTANT**: The Supabase MCP connects to the LIVE remote project. Use it for all DB inspection, migration operations, and SQL queries. Do NOT use local Supabase CLI unless explicitly needed.

### Current State

- **Phase 0 (Foundation)**: COMPLETE — multi-tenant, auth, orgs, branches, RLS, audit, subscriptions, edge functions, 37 migrations
- **Phase 1 (Tablet CRM)**: DB schema 100% done; frontend ~70% complete (tablet UX Wave 1A, auto-fill, price memory are WIP)
- **Phase 2 (Inventory)**: DB 100% done; Purchase Orders, Suppliers, Stock Movements UI are WIP (Wave 1B)
- **Phase 3+**: Not started (except service reminders engine is LIVE)
- **Testing**: CRITICAL GAP — only 2 test files exist. Vitest v3 configured, @testing-library/react installed but unused, agent-browser v0.27.0 installed
- **CI**: Only react-doctor workflow exists — NO test runner in CI

### Architecture Rules (NEVER violate)

1. ALL API routes must use `createRouteHandler`/`createSimpleRouteHandler` from `src/lib/api-handler.ts` — never raw `NextResponse.json()` in handlers
2. ALL pages must use React Query hooks (`src/lib/queries/`) for client data or services (`src/lib/services/`) for server logic — never raw `fetch()` + `useState/useEffect`
3. ALL tables must have: `organization_id`, `branch_id`, `created_by`, `updated_by`, `created_at`, `updated_at`, `deleted_at`
4. RLS on ALL public tables — no exceptions
5. Inventory must be ledger-based (`inventory_movements`), never direct `quantity` updates
6. Never hard-delete financial records — use `cancelled`/`voided`/`refunded`/`deleted_at`
7. Type error suppression (`as any`, `@ts-ignore`) is FORBIDDEN
8. Both `mn.json` and `en.json` must be updated together for every UI string change

---

## OVERNIGHT PLAN

Execute in this priority order. Each track is independent — parallelize aggressively.

---

## TRACK 1: TEST FOUNDATION — BUILD TEST INFRASTRUCTURE

### 1.1 Add Coverage
- Add `@vitest/coverage-v8` to devDependencies
- Add coverage block to `vitest.config.mts` (threshold: 40% statements, 30% branches)
- Add scripts: `test:coverage`, `test:ui`
- Add `.env.test` with test Supabase vars (read from `.env.example` for structure)

### 1.2 Create Test Utilities
- `src/test/factories.ts` — factory functions for Customer, Vehicle, WorkOrder, Organization (use `createMockSupabaseClient` pattern)
- `src/test/mocks/handlers.ts` — MSW handlers for API routes (MSW is already in node_modules)
- `src/test/test-utils.tsx` — custom render with QueryClientProvider, next-intl provider, ThemeProvider wrappers

### 1.3 Add test:ci to CI
- Update `.github/workflows/react-doctor.yml` to run `npm run test:ci` or add separate test workflow
- Must run: `biome check`, `vitest run --coverage`, `npm run build`

---

## TRACK 2: SERVICE LAYER TESTS (TDD) — HIGHEST PRIORITY

### 2.1 Inventory Service Tests
**Files to test**: `src/lib/services/inventory-service.ts`
**Test pattern** (follow `customer-service.test.ts`):
```typescript
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
const mockClient = createMockSupabaseClient();
```
**Must cover**:
- `addStockMovement()` — valid movement creates audit log and updates balance
- `addStockMovement()` — rejects invalid movement_type
- `getInventoryBalance()` — returns correct computed balance
- `getLowStockItems()` — returns items below threshold
- `adjustStock()` — creates adjustment movement with reason
- Error cases: missing part, invalid quantity, unauthorized org

### 2.2 Work Order Service Tests
**Files to test**: `src/lib/services/work-order-service.ts`
**Must cover**:
- `createWorkOrder()` — creates WO with proper org/branch/user context
- `createWorkOrder()` — with services and parts creates ledger entries
- `updateWorkOrderStatus()` — creates status history entry (immutable ledger)
- `updateWorkOrderStatus()` — "Completed" triggers service schedule auto-creation
- `updateWorkOrderStatus()` — rejects invalid status transitions
- `getWorkOrderDetail()` — returns WO with services, parts, status history
- Error cases: not found, wrong org, invalid status

### 2.3 Customer Service Tests (EXTEND EXISTING)
**Files to test**: `src/lib/services/customer-service.ts` (extends existing `customer-service.test.ts`)
**Must add**:
- `getCustomerById()` — returns full data with vehicles
- `updateCustomer()` — validates unique phone across org
- `searchCustomers()` — supports phone and name search
- `deleteCustomer()` — soft delete (sets deleted_at)
- `getCustomerVehicles()` — returns vehicle list with service history summary

### 2.4 Vehicle Service Tests
**Files to test**: `src/lib/services/vehicle-service.ts`
**Must cover**:
- `createVehicle()` — with plate number, make, model, year validation
- `getVehicleByPlate()` — normalize plate format, case-insensitive
- `getVehicleByPlate()` — returns 404 when not found
- `updateVehicle()` — validates VIN format if provided
- `getVehicleHistory()` — returns complete service history
- Duplicate plate detection within same organization

### 2.5 Service Catalog Tests
**Files to test**: `src/lib/services/service-catalog-service.ts`
**Must cover**:
- `getServices()` — returns paginated catalog filtered by org
- `createService()` — with base cost, name, category
- `updateServicePrice()` — creates price_history entry
- `getServicePriceHistory()` — returns ordered price changes
- `getLastSoldPrice()` — returns most recent price for vehicle make/model

### 2.6 Report Service Tests
**Files to test**: `src/lib/services/report-service.ts`
**Must cover**:
- `getMechanicDailyReport()` — aggregates WOs by mechanic for date
- `getMechanicMonthlyReport()` — monthly totals with service breakdown
- `getDailyRevenue()` — sums payments for the day
- `getRevenueByCategory()` — groups by service category
- Performance: verify queries use proper indexes (check `EXPLAIN ANALYZE` equivalent)

---

## TRACK 3: COMPONENT & HOOK TESTS

### 3.1 Query Hook Tests
**Files to test**: `src/lib/queries/use-work-orders.ts`, `use-customers.ts`, `use-inventory.ts`, `use-dashboard.ts`, `use-price-memory.ts`, `use-vehicles.ts`
**Pattern**:
```typescript
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
```
**Must cover**:
- Hook returns expected data shape
- Hook handles error state (network failure, 403, 404)
- Hook handles empty state (no results)
- Query key invalidation works correctly
- Optimistic updates work (for mutations)

### 3.2 Component Tests
**Files to test** (high priority):
- `src/components/price-display.tsx` — renders current price + last sold hint, color coding on price difference
- `src/components/status-badge.tsx` — renders correct color/shape per status
- `src/components/mechanic-select.tsx` — loads mechanics, selects one, handles empty
- `src/components/search-input.tsx` — debounce behavior, clear button
- `src/components/work-orders/*.tsx` — key sub-components
- `src/components/data-table.tsx` — sorting, pagination, empty state
- All UI work-order components

**Pattern**:
```typescript
import { render, screen } from "@/test/test-utils"; // custom render with providers
import userEvent from "@testing-library/user-event";
```

### 3.3 Hook Tests
**Files to test**: `src/hooks/use-current-user-role.ts`, `use-navigation.ts`, `use-require-auth.ts`
**Must cover**: authentication state, role-based access, redirect behavior

---

## TRACK 4: E2E TESTING WITH AGENT-BROWSER

Use `agent-browser` CLI to test critical user flows in a real browser.

### 4.1 Install & Configure
```bash
agent-browser install
```

### 4.2 Auth Flow E2E
```bash
agent-browser open http://localhost:3000
agent-browser snapshot -i
# Verify: unauthenticated users see login page
# Fill login form
agent-browser fill @<email-field> "admin@test.com"
agent-browser fill @<password-field> "password123"
agent-browser click @<submit-button>
agent-browser console_messages
# Verify: redirected to /dashboard, no auth errors
agent-browser screenshot --annotate
agent-browser close
```

### 4.3 Customer Creation Flow
```bash
agent-browser open http://localhost:3000/mn/dashboard/customers/new
agent-browser fill @<first-name-field> "Test"
agent-browser fill @<phone-field> "99112233"
agent-browser click @<save-button>
agent-browser console_messages
# Verify: customer created, redirected to customer detail
# Verify: no console errors
agent-browser screenshot --annotate
agent-browser close
```

### 4.4 Work Order Lifecycle E2E (CRITICAL FLOW)
```bash
agent-browser open http://localhost:3000/mn/dashboard/work-orders/new
# 1. Select customer (or quick-create)
agent-browser click @<customer-select>
# 2. Select vehicle (or quick-create)
# 3. Add service from catalog — verify last-sold-price is visible
# 4. Assign mechanic
# 5. Add notes
# 6. Create WO
# 7. Verify WO appears in list with correct status "New"
# 8. Open WO detail — verify status can transition through all states
# 9. Transition to "Completed"
# 10. Verify: status history shows all transitions, service schedule auto-created
agent-browser console_messages  # Verify: 0 errors
agent-browser screenshot --annotate
agent-browser close
```

### 4.5 Dashboard E2E
```bash
agent-browser open http://localhost:3000/mn/dashboard
# Verify: KPI cards load with data (daily revenue, WO count, mechanic workload)
# Verify: time range filter works
# Verify: mechanic selector filters dashboard data
agent-browser console_messages  # Verify: 0 hydration errors, 0 runtime errors
agent-browser screenshot --annotate
agent-browser close
```

### 4.6 Multi-Tenant Isolation E2E (SECURITY)
```bash
# Login as Org A user
# Navigate to customer list — note customer IDs
# Logout
# Login as Org B user
# Navigate to customer list — verify Org A customers are NOT visible
# Try to access Org A's customer detail URL directly — verify 403/redirect
agent-browser console_messages
agent-browser close
```

### 4.7 Service Reminders Flow E2E
```bash
# Complete a WO with services
# Navigate to /dashboard/service-reminders
# Verify: new schedule entry appears for the completed service
# Verify: reminder_logs table has entry after cron trigger
agent-browser close
```

---

## TRACK 5: PHASE 4 — MULTI-BRANCH & ACCOUNTING (Additional QoL Features)

### 5.1 Multi-Branch Foundation — Database & Schema
- Create migration `add_multi_branch_support.sql`:
  - `organization.branch_limit` column (int, default 1)
  - `branches.is_active` column
  - Branch-level RLS policies on ALL existing tables (customers, vehicles, work_orders, inventory, payments, etc.)
  - `stock_transfers` table: `id, organization_id, from_branch_id, to_branch_id, status, created_by, created_at, completed_at`
  - `stock_transfer_items` table: `id, transfer_id, part_id, quantity, unit_cost`
- Add `branch_id` filter to ALL existing React Query hooks where missing
- Use Supabase MCP for migration:
  ```bash
  mcp_supabase_get_schema(schema_name="public")
  mcp_supabase_push_migration(file_path="supabase/migrations/NNNNNN_add_multi_branch_support.sql")
  mcp_supabase_run_sql(query="SELECT verify_rls_on_all_tables()")
  ```

### 5.2 Multi-Branch UI
- **Branch Switcher**: Add branch selector to dashboard header (similar to org selector pattern)
  - Component: `src/components/branch-select.tsx`
  - Read from `organization.branch_limit` to control multi-branch vs single-branch UX
- **Multi-Branch Dashboard**: `/dashboard/branches/` page showing:
  - Branch cards with: name, active WO count, daily revenue, mechanic count
  - Per-branch KPI comparison table
- **Branch Settings**: Add per-branch configuration in `/dashboard/organization/`:
  - Branch name, address, phone, is_active toggle
  - Branch-level inventory toggle
- **Branch Inventory View**: `/dashboard/inventory?branch_id=X` — filter parts by branch:
  - Add `branch_id` param to `useInventory` hook
  - Show branch stock level in parts list
- **Stock Transfer UI**: `/dashboard/inventory/transfers/`:
  - "New Transfer" form: select source branch → select destination branch → select parts → quantities
  - Transfer list with status tracking (Pending → Approved → In Transit → Received → Completed)
  - Receive flow: destination branch confirms receipt, creates inventory_movements entries for both sides

### 5.3 Branch-Level Permissions
- Add `branch_id` to `role_permissions` or create `branch_user_permissions` table:
  - Can manage users in this branch?
  - Can view other branches' data?
  - Can approve stock transfers?
  - Can override discount limits?
- Update `useCurrentUserRole()` hook to return branch permissions
- Add branch permission checks in API routes: `requireBranchAccess(branchId, 'inventory:write')`

### 5.4 Accounting Layer
- **Expense Tracking** (enhance existing):
  - `/dashboard/expenses/` — Add expense categories CRUD
  - Add recurring expense support (monthly rent, utilities)
  - Add expense approval workflow (manager approval for expenses > threshold)
- **Accounting Export**:
  - Export general ledger to Excel/CSV per date range
  - Export invoice register for accounting period
  - Export payment summary matching bank statements
- **Payroll/Commission Export**:
  - Mechanic commission calculation (% of labor revenue, per work order)
  - Export monthly commission report per mechanic
  - Export payroll summary (hours worked, commissions, bonuses)
- **Add `useSupabaseMCP` for database export operations**

### 5.5 Approval Workflows
- **Discount Approval**: If discount > X% or > ₮X, requires manager approval:
  - Add `discount_approval_threshold` to `organization.settings`
  - Work order discount creates pending approval request
  - Manager dashboard shows pending approvals
  - Push notification/email to managers when approval requested
- **Stock Adjustment Approval**: Stock adjustments > threshold require manager sign-off
  - Add `adjustment_approval_threshold` to organization settings
- **UI Components**:
  - `src/components/approval-badge.tsx` — shows approval status
  - `src/components/approval-dialog.tsx` — approve/reject with comment
  - Dashboard widget: pending approvals count

### 5.6 Centralized Customer Database
- Customers are shared across ALL branches by default (single source of truth)
- Vehicle ownership is branch-scoped (which branch last served this vehicle)
- Customer detail page shows visit history across ALL branches
- Add branch filter to customer list
- Add "Last Served At" branch column to customer list

### 5.7 Multi-Branch Reports
- `/dashboard/reports?scope=branch`:
  - Revenue by branch (bar chart, daily/weekly/monthly)
  - Work order volume by branch
  - Mechanic utilization by branch
  - Customer distribution by branch
- `/dashboard/reports?scope=organization`:
  - Consolidated P&L across all branches
  - Branch comparison: revenue, WO count, average ticket, mechanic efficiency
  - Inventory valuation across branches
  - Stock transfer volume and value

### 5.8 E2E for Multi-Branch (agent-browser)
```bash
# Admin creates a second branch
agent-browser open http://localhost:3000/mn/dashboard/organization
agent-browser click @<add-branch-button>
agent-browser fill @<branch-name-field> "Branch 2"
agent-browser fill @<branch-address-field> "Address"
agent-browser click @<save-branch-button>
agent-browser console_messages  # Verify: branch created, no errors

# Switch between branches
agent-browser click @<branch-selector>
agent-browser click @<branch-2-option>
agent-browser snapshot -i
# Verify: inventory filtered, customer list changes, dashboard updates

# Create a stock transfer
agent-browser navigate http://localhost:3000/mn/dashboard/inventory/transfers/new
# ...complete transfer flow

# Verify data isolation
agent-browser close
```

---

## TRACK 6: PRODUCTION HARDENING

### 5.1 API Route Audit
- Verify EVERY API route uses `createRouteHandler` or `createSimpleRouteHandler` (grep for raw `NextResponse.json()` — fix any found)
- Add rate limiting to all mutation endpoints (file `src/lib/rate-limit.ts` exists — use it)
- Add input validation (zod) to ALL mutation API routes
- Verify proper HTTP status codes: 201 for create, 204 for delete, 422 for validation, 409 for conflicts

### 5.2 Error Handling Audit
- Verify EVERY page has `error.tsx` boundary AND `loading.tsx`
- Check all `error.tsx` files have: retry button, error message, proper i18n
- Add global `src/app/global-error.tsx` for root-level errors
- Verify API error responses match `ApiResponse<T>` shape from api-handler

### 5.3 Security Hardening
- CSP headers: check if CSP is configured in `next.config.ts` (currently missing — add it)
- Rate limiting: wrap ALL mutation API routes with rate-limit
- Input validation: add zod schemas for ALL mutation endpoints
- Verify middleware.ts protects all `/dashboard/*` routes (read `src/proxy.ts`)
- Check RLS policies cover all new tables since last migration
- Verify auth session refresh logic works in edge cases

### 5.4 Database & Performance
- Run `supabase db push --linked` to ensure remote matches local
- Run `supabase gen types typescript --linked > src/lib/database.types.ts` to sync types
- Add missing indexes (check `20260514091354_add_missing_indexes.sql` for reference — add for any newer tables)
- Verify N+1 query patterns in list pages (use `useWorkOrders`, `useCustomers` queries)
- Add pagination limits to all list queries (default 50, max 100)

### 5.5 Tablet UX Audit
- Every interactive element must be ≥44px touch target on tablet
- Test at 1024px viewport width
- Verify WO creation flow works in ≤5 taps
- Verify plate-number search works with both `-` and space separators
- Verify price memory shows last-sold-price hint on every price input
- Verify quick-create customer/vehicle inline (not page navigation)

### 5.6 i18n Audit
- Run a script to find all `t("..."` calls and verify keys exist in both `mn.json` and `en.json`
- Check for hardcoded Mongolian text in components (should use `next-intl` `t()`)
- Check for hardcoded English text (should use `next-intl` `t()`)

### 5.7 Build & Deploy Verification
```bash
npm run lint    # Biome check — fix all issues
npm run build   # Next.js build — 0 errors (currently ignores TS errors — FIX THIS)
npm run test:coverage  # All tests pass, coverage meets threshold
```

---

## EXECUTION ORDER

```
HOUR 1:   Track 1 (test infra) + Track 2.1-2.2 (inventory + WO service tests) — parallel
HOUR 2:   Track 2.3-2.6 (customer, vehicle, catalog, report service tests) — parallel per-file
HOUR 3:   Track 3.1 (query hook tests) + Track 4.1-4.2 (agent-browser setup + auth E2E)
HOUR 4:   Track 3.2-3.3 (component + hook tests) + Track 4.3-4.4 (customer + WO E2E)
HOUR 5:   Track 4.5-4.7 (dashboard, security, reminders E2E) + Track 6.1-6.2 (API + error audit)
HOUR 6:   Track 6.3-6.7 (security, DB, tablet UX, i18n, build) — parallel
HOUR 7:   Track 5.1-5.3 (multi-branch database, UI, permissions) — parallel
HOUR 8:   Track 5.4-5.7 (accounting, approvals, reports) + Track 5.8 (multi-branch E2E)
```

## COMPLETION DEFINITION

All items in this prompt are done when:

- [ ] `npm run test` — ALL tests pass (target: 50+ test files, 200+ test cases)
- [ ] `npm run test:coverage` — coverage threshold met (40% statements, 30% branches minimum)
- [ ] `npm run lint` — Biome clean, 0 warnings
- [ ] `npm run build` — 0 TypeScript errors (remove `ignoreBuildErrors: true` from next.config.ts), 0 build warnings
- [ ] agent-browser E2E suite — all 7 flows pass (auth, customer, WO lifecycle, dashboard, multi-tenant, reminders, multi-branch)
- [ ] API audit — 0 raw `NextResponse.json()` in route handlers, all use `createRouteHandler`/`createSimpleRouteHandler`
- [ ] Security audit — CSP headers present, rate limiting on mutations, zod validation on all inputs, middleware.ts wired at edge
- [ ] i18n audit — 0 missing translation keys in code vs locale files
- [ ] Tablet UX audit — all touch targets ≥44px at 1024px viewport, WO creation ≤5 taps
- [ ] Every page has `error.tsx` + `loading.tsx`
- [ ] CI workflow runs tests + lint + build on PR and push to main

**Phase 4 (Multi-Branch) specific:**
- [ ] Branch migration applied to remote Supabase via MCP
- [ ] Branch switcher component in header — works with org.branch_limit
- [ ] Multi-branch dashboard — per-branch KPI cards + comparison
- [ ] Branch inventory filter — parts list filters by branch_id
- [ ] Stock transfer flow — create, approve, receive, ledger entries on both sides
- [ ] Branch-level RLS — every query filters by branch_id, users see only their branches
- [ ] Expense approvals workflow — manager approval for expenses > threshold
- [ ] Accounting export — Excel/CSV export for GL, invoices, payments
- [ ] Mechanic commission — % calculation, monthly export
- [ ] Centralized customer DB — shared across branches, visit history shows branch context
- [ ] Multi-branch reports — revenue by branch, WO volume by branch, mechanic utilization
- [ ] Branch-isolation E2E passes — switching branches correctly filters data

Output `<promise>DONE</promise>` only when ALL conditions above are verifiably met. Do NOT output the promise early. If you encounter blockers, fix them — do not skip.
