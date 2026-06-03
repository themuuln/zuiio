---
date: 2026-06-03T10:13:24+0800
author: Temuulen Undrakhbayar
commit: 185264e
branch: main
repository: tolom
topic: Creation Flow Polish — 7 Phase Implementation
tags: [blueprint, creation-flow, refactoring, api-consistency, sheet-unification]
status: ready
parent: .rpiv/artifacts/architecture-reviews/2026-06-03_00-31-44_creation-flow.md
phase_count: 7
unresolved_phase_count: 0
last_updated: 2026-06-03T10:13:24+0800
last_updated_by: Temuulen Undrakhbayar
---

# Creation Flow Polish — Implementation Plan

## Overview

Incremental 7-phase refactoring of the creation flow across all TOLOM entities. Covers frontend pages, components, API routes, service layer, and shared infrastructure. The goal is a consistent, maintainable, and globally-accessible creation experience using Sheets, React Query mutations, centralized API cross-cutting concerns, and dependency-injected services.

Ported from the architecture review at `.rpiv/artifacts/architecture-reviews/2026-06-03_00-31-44_creation-flow.md` — 13 accepted findings across 6 layers, consolidated into 7 implementation phases.

## Requirements

- [ ] All creation flows use Sheets (side panels), not page navigations (M1)
- [ ] Cross-cutting concerns (rate limiting, permissions) are handled by createRouteHandler, not ad-hoc in each route (M2)
- [ ] All API calls go through React Query hooks/mutations, not raw fetch() (M3)
- [ ] Forms are reusable {Entity}Form components wrapped by ResponsiveFormModal (M4)
- [ ] All mutation routes enforce the correct permission
- [ ] Services accept injected db client instead of creating their own
- [ ] Work order creation wizard is decomposed into focused custom hooks

## Current State Analysis

The creation flow spans ~63 files across the stack. Key current-state findings (from architecture review):

- **Frontend pages**: Mix of full-page forms and redirects-to-sheets. Customers/new is a dead redirect.
- **Components**: Inconsistent Sheet patterns — some use ResponsiveFormModal (customers, vehicles), others build raw Sheets (expenses, suppliers, POs).
- **State**: The work order wizard context is ~600 lines with all state + queries + actions in one file.
- **API routes**: 20+ POST/PATCH/DELETE routes duplicate the same 8-line rate limiting block. Permission enforcement is inconsistent.
- **Services**: Every service creates its own Supabase client (violates documented convention). work-order-service is 930 lines with overlapping concerns.
- **Infrastructure**: api-handler.ts and errors.ts are well-structured. The global sheet registry already exists (`_global-dialogs.tsx` + `PageHeaderProvider`) but needs extension.

### Key Discoveries

- `src/hooks/use-page-header.tsx` — Already has global dialog state for customers, vehicles, expenses, work-orders + detail IDs for 6 entities
- `src/app/[locale]/dashboard/_global-dialogs.tsx` — Already implements the global sheet registry pattern using dynamic imports
- `src/components/ui/responsive-form-modal.tsx` — Responsive Sheet/Drawer/Dialog wrapper already exists
- `src/lib/api-handler.ts:30-33` — `RouteHandlerOptions` supports `requiredPermission` and `minimumRole`
- `src/lib/rate-limit.ts` — Creates `mutationRateLimiter` with check() method used in every mutation route
- Permission resources are seeded for: customers, vehicles, work_orders, inventory, invoices, reports, payroll, settings, members
- Missing permission resources: expenses, services, appointments, branches, diagnosis_labels, commission_rules, expense_categories

## Desired End State

```tsx
// A creation sheet from anywhere in the app:
const { openCreateCustomer } = useCreationSheets();
<Button onClick={() => openCreateCustomer()}>Add Customer</Button>

// A creation page with shared header:
<CreatePageHeader
  backHref="/dashboard/expenses"
  title={t("addExpense")}
  subtitle={t("subtitle")}
/>

// An API route with consistent cross-cutting concerns:
export const POST = createRouteHandler(
  async ({ request, orgId }) => {
    const body = await request.json();
    const expense = await createExpense(orgId, body, user.id);
    return NextResponse.json({ data: expense }, { status: 201 });
  },
  {
    requiredPermission: { resource: "expenses", action: "create" },
    rateLimit: true,
  },
);

// A service with injected client:
export async function createExpense(
  db: SupabaseClient,
  orgId: string,
  params: CreateExpenseParams,
  userId: string,
): Promise<Expense> { ... }
```

## What We're NOT Doing

- No schema changes (database tables/columns stay unchanged)
- No new API routes — only modifying existing ones
- No removing existing page-based creation flows (they can coexist with Sheets)
- No performance optimization or caching changes
- No addition of new creation entities — only refactoring existing ones
- No comprehensive test refactoring (tests are updated to match changed signatures only)

## Decisions

### D1 — CreatePageHeader as separate component
**Evidence:** Every `new/*/page.tsx` duplicates ~15 lines of header JSX.
**Decision:** Create `src/components/ui/create-page-header.tsx` as a lightweight standalone component with `backHref`, `title`, `subtitle` props.

### D2 — Add missing permission resources via seed migration
**Evidence:** Routes for expenses, services, and appointments lack seeded permission resources.
**Decision:** Add `expenses`, `services`, `appointments`, `branches`, `commission_rules`, `diagnosis_labels`, `expense_categories` resources to `seed_org_permissions()` with standard CRUD actions, and create a backfill migration for existing orgs.

### D3 — Extend existing GlobalDialogs pattern
**Evidence:** `_global-dialogs.tsx` + `PageHeaderProvider` already implements the global sheet registry pattern for 4 entities.
**Decision:** Extend the existing pattern with additional entity dialogs rather than creating a new registry.

### D4 — Pattern B (toast + retry) for all mutation hooks
**Evidence:** Two mutation patterns exist. Pattern B (use-expenses.ts, use-inventory.ts) is the more recent/recommended pattern with toast.success, toastRetry, and proper invalidation.
**Decision:** Standardize all creation mutations on Pattern B.

### D5 — Rate limiting as createRouteHandler option
**Evidence:** ~20+ routes duplicate the same 8-line rate limiting block. `createRouteHandler` already handles auth, membership, roles, and permissions as options.
**Decision:** Add `rateLimit?: boolean` option to `createRouteHandler` that wraps the handler with the mutation rate limiter.

### D6 — Inject db parameter into services
**Evidence:** Services create their own client via `createClient()`, violating the AGENTS.md convention and preventing unit testing.
**Decision:** Refactor all service functions to accept `db: SupabaseClient` as first parameter.

## Ordering Constraints

```
Phase 1 (Foundation)
   ↓
Phase 2 (API Infrastructure)
   ↓
Phase 3 (Query Standardization)
   ↓
Phase 4 (Sheet Unification)
   ↓
Phase 5 (Global Sheet Registry)
   ↓
   ├──► Phase 6 (Service Refactoring)
   └──► Phase 7 (Wizard Decomposition)
```

Phases are strictly sequential through Phase 5 (each depends on the previous). Phases 6 and 7 can run in parallel after Phase 5, but are done sequentially for simplicity.

- Phase 3 depends on Phase 1's CreatePageHeader (shared component available)
- Phase 4 depends on Phase 3's standardized hooks (replacing fetch)
- Phase 5 depends on Phase 4's ResponsiveFormModal sheets (registering them)
- Phases 6 and 7 are independent of Phases 1-5

## Verification Notes

- Permission backfill migration must not break existing orgs — always use `on conflict do nothing`
- Adding `requiredPermission` to previously-unchecked routes may cause 403 errors for roles missing those permissions — verify all roles have appropriate permissions assigned after deploy
- Rate limiting in createRouteHandler must be fully backward-compatible — `rateLimit: true` is opt-in
- Service refactoring changes function signatures — every caller must be updated
- Sheet migration must preserve form reset on close, scroll behavior, and sticky footer actions

## Performance Considerations

- None of the phases affect performance-critical paths
- Phase 6 (service refactor) is purely structural — no runtime behavior change
- Phase 3 (query standardization) adds toast/retry overhead to mutations that didn't have it — negligible

## Migration Notes

- **Phase 1**: Add permission seed migration. Run `supabase db push --linked` to deploy, regenerate types.
- **Phase 2**: Purely additive change to api-handler.ts. No migration needed.
- **Phase 6**: Largest migration risk — service signatures change. All callers must be updated atomically.

## Pattern References

- `src/components/customers/new-customer-sheet.tsx` — Canonical ResponsiveFormModal sheet pattern
- `src/components/customers/customer-form.tsx` — Canonical form component (quick/full modes, onSuccess/onCancel)
- `src/lib/queries/use-expenses.ts:92-115` — Canonical mutation hook (Pattern B with toast)
- `src/app/api/organizations/[id]/customers/route.ts` — Canonical route with requiredPermission
- `src/app/[locale]/dashboard/_global-dialogs.tsx` — Existing global sheet registry to extend
- `src/hooks/use-page-header.tsx` — Existing global dialog state provider

## Developer Context

### Step 4 Checkpoint

**Q1: CreatePageHeader location — separate file or page-header.tsx?**
**A:** Separate file. Lightweight, focused component for creation pages.
**Recorded:** 2026-06-03

**Q2: Permission strategy for routes without seeded permissions?**
**A:** Add new permission resources (expenses, services, appointments, etc.) via seed migration + backfill.
**Recorded:** 2026-06-03

### Design Summary (confirmed 2026-06-03)

```
Design: Creation Flow Polish — 7 Phase Implementation
Approach: Incremental refactoring across 13 findings.

Decisions:
- D1: Separate CreatePageHeader component
- D2: Add missing permission resources via seed migration
- D3: Extend existing GlobalDialogs pattern (no new registry)
- D4: Pattern B (toast + retry) for all mutation hooks
- D5: Rate limiting as createRouteHandler option
- D6: Inject db parameter into services

Scope: All 13 accepted findings across 7 phases | Not building: No schema changes, no new routes
Files: ~63 files across the entire stack
```

## Plan History

- Phase 1: Foundation — approved as generated
- Phase 2: API Infrastructure — approved as generated
- Phase 3: Query Standardization — approved as generated
- Phase 1: Foundation — approved as generated
- Phase 2: API Infrastructure — approved as generated
- Phase 3: Query Standardization — approved as generated
- Phase 4: Sheet Unification — approved as generated
- Phase 5: Global Sheet Registry — approved as generated
- Phase 6: Service Refactoring — approved as generated
- Phase 7: Wizard Decomposition — approved as generated
- Phase 5: Global Sheet Registry — pending
- Phase 6: Service Refactoring — pending
- Phase 7: Wizard Decomposition — pending

## References

- `.rpiv/artifacts/architecture-reviews/2026-06-03_00-31-44_creation-flow.md`
- `.rpiv/artifacts/architecture-reviews/2026-06-03_00-31-44_creation-flow.md#consolidated-polish-plan`

---

## Phase 1: Foundation

### Overview

Eliminate trivial duplication and close immediate security gaps. Creates the shared `CreatePageHeader` component, adds missing permission resources via seed migration, and adds `requiredPermission` to all mutation routes that currently lack it.

Depends on: nothing (foundation).

### Changes Required:

#### 1. src/components/ui/create-page-header.tsx

**File**: src/components/ui/create-page-header.tsx
**Changes**: NEW — Reusable creation page header with back button, title, and subtitle

```tsx
"use client";

import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";
import { Link } from "@/lib/i18n/navigation";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export type CreatePageHeaderProps = {
  backHref: string;
  title: string;
  subtitle?: string;
  className?: string;
  /** Optional action buttons rendered on the right side */
  actions?: ReactNode;
};

export function CreatePageHeader({
  backHref,
  title,
  subtitle,
  className,
  actions,
}: CreatePageHeaderProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <Button
        render={<Link href={backHref} />}
        variant="ghost"
        size="icon-xs"
        aria-label="Back"
      >
        <ArrowLeft className="size-5" />
      </Button>
      <div className="flex-1 min-w-0">
        <Typography.H1 className="text-2xl font-semibold tracking-tight">
          {title}
        </Typography.H1>
        {subtitle && (
          <Typography.Muted className="text-sm text-muted-foreground">
            {subtitle}
          </Typography.Muted>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2 shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
}
```

#### 2. supabase/migrations/20260603000000_add_missing_permissions.sql

**File**: supabase/migrations/20260603000000_add_missing_permissions.sql
**Changes**: NEW — Add expenses, services, appointments, branches, commission_rules, diagnosis_labels, expense_categories to seed_org_permissions() with CRUD actions, plus backfill for existing orgs

```sql
-- Add missing permission resources to seed functions
--
-- Resources added:
--   expenses, services, appointments, branches
--   commission_rules, diagnosis_labels, expense_categories
--
-- This migration:
--   1. Updates seed_org_permissions() to create new resource permissions
--   2. Updates seed_org_role_permissions() to grant them to appropriate roles
--   3. Backfills permissions for all existing orgs

-- ============================================================
-- 1. Update seed_org_permissions — add new resources
-- ============================================================
CREATE OR REPLACE FUNCTION seed_org_permissions(p_org_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.permissions (organization_id, name, resource, action, description)
  VALUES
    -- Original resources (unchanged, kept for completeness)
    (p_org_id, 'work_orders.create', 'work_orders', 'create', 'Create work orders'),
    (p_org_id, 'work_orders.read',   'work_orders', 'read',   'View work orders'),
    (p_org_id, 'work_orders.update', 'work_orders', 'update', 'Update work orders'),
    (p_org_id, 'work_orders.delete', 'work_orders', 'delete', 'Delete work orders'),
    (p_org_id, 'invoices.create', 'invoices', 'create', 'Create invoices'),
    (p_org_id, 'invoices.read',   'invoices', 'read',   'View invoices'),
    (p_org_id, 'invoices.update', 'invoices', 'update', 'Update invoices'),
    (p_org_id, 'invoices.delete', 'invoices', 'delete', 'Delete invoices'),
    (p_org_id, 'inventory.create', 'inventory', 'create', 'Add inventory items'),
    (p_org_id, 'inventory.read',   'inventory', 'read',   'View inventory'),
    (p_org_id, 'inventory.update', 'inventory', 'update', 'Update inventory items'),
    (p_org_id, 'inventory.delete', 'inventory', 'delete', 'Delete inventory items'),
    (p_org_id, 'customers.create', 'customers', 'create', 'Add customers'),
    (p_org_id, 'customers.read',   'customers', 'read',   'View customers'),
    (p_org_id, 'customers.update', 'customers', 'update', 'Update customers'),
    (p_org_id, 'customers.delete', 'customers', 'delete', 'Delete customers'),
    (p_org_id, 'vehicles.create', 'vehicles', 'create', 'Add vehicles'),
    (p_org_id, 'vehicles.read',   'vehicles', 'read',   'View vehicles'),
    (p_org_id, 'vehicles.update', 'vehicles', 'update', 'Update vehicles'),
    (p_org_id, 'vehicles.delete', 'vehicles', 'delete', 'Delete vehicles'),
    (p_org_id, 'reports.read', 'reports', 'read', 'View reports and analytics'),
    (p_org_id, 'payroll.read',  'payroll', 'read',  'View payroll records'),
    (p_org_id, 'payroll.write', 'payroll', 'write', 'Manage payroll settings and run calculations'),
    (p_org_id, 'settings.read',   'settings', 'read',   'View organization settings'),
    (p_org_id, 'settings.update', 'settings', 'update', 'Update organization settings'),
    (p_org_id, 'members.read',   'members', 'read',   'View team members'),
    (p_org_id, 'members.invite', 'members', 'invite', 'Invite new members'),
    -- New resources
    (p_org_id, 'expenses.create', 'expenses', 'create', 'Create expenses'),
    (p_org_id, 'expenses.read',   'expenses', 'read',   'View expenses'),
    (p_org_id, 'expenses.update', 'expenses', 'update', 'Update expenses'),
    (p_org_id, 'expenses.delete', 'expenses', 'delete', 'Delete expenses'),
    (p_org_id, 'services.create', 'services', 'create', 'Create service catalog entries'),
    (p_org_id, 'services.read',   'services', 'read',   'View service catalog'),
    (p_org_id, 'services.update', 'services', 'update', 'Update service catalog entries'),
    (p_org_id, 'services.delete', 'services', 'delete', 'Delete service catalog entries'),
    (p_org_id, 'appointments.create', 'appointments', 'create', 'Create appointments'),
    (p_org_id, 'appointments.read',   'appointments', 'read',   'View appointments'),
    (p_org_id, 'appointments.update', 'appointments', 'update', 'Update appointments'),
    (p_org_id, 'appointments.delete', 'appointments', 'delete', 'Delete appointments'),
    (p_org_id, 'branches.create', 'branches', 'create', 'Create branches'),
    (p_org_id, 'branches.read',   'branches', 'read',   'View branches'),
    (p_org_id, 'branches.update', 'branches', 'update', 'Update branches'),
    (p_org_id, 'branches.delete', 'branches', 'delete', 'Delete branches'),
    (p_org_id, 'commission_rules.create', 'commission_rules', 'create', 'Create commission rules'),
    (p_org_id, 'commission_rules.read',   'commission_rules', 'read',   'View commission rules'),
    (p_org_id, 'commission_rules.update', 'commission_rules', 'update', 'Update commission rules'),
    (p_org_id, 'commission_rules.delete', 'commission_rules', 'delete', 'Delete commission rules'),
    (p_org_id, 'diagnosis_labels.create', 'diagnosis_labels', 'create', 'Create diagnosis labels'),
    (p_org_id, 'diagnosis_labels.read',   'diagnosis_labels', 'read',   'View diagnosis labels'),
    (p_org_id, 'diagnosis_labels.update', 'diagnosis_labels', 'update', 'Update diagnosis labels'),
    (p_org_id, 'diagnosis_labels.delete', 'diagnosis_labels', 'delete', 'Delete diagnosis labels'),
    (p_org_id, 'expense_categories.create', 'expense_categories', 'create', 'Create expense categories'),
    (p_org_id, 'expense_categories.read',   'expense_categories', 'read',   'View expense categories'),
    (p_org_id, 'expense_categories.update', 'expense_categories', 'update', 'Update expense categories'),
    (p_org_id, 'expense_categories.delete', 'expense_categories', 'delete', 'Delete expense categories')
  ON CONFLICT (organization_id, name) WHERE deleted_at IS NULL DO NOTHING;
END;
$$;

-- ============================================================
-- 2. Update seed_org_role_permissions — grant new permissions
-- ============================================================
CREATE OR REPLACE FUNCTION seed_org_role_permissions(p_org_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_owner_id    UUID;
  v_manager_id  UUID;
  v_mechanic_id UUID;
  v_guest_id    UUID;
BEGIN
  -- Roles (idempotent)
  INSERT INTO public.roles (organization_id, name, description, is_system)
  SELECT p_org_id, r.name, r.description, true
  FROM (
    VALUES
      ('Org Owner', 'Full access to all organization features and settings'),
      ('Manager',   'Day-to-day operations manager with access to reports and approvals'),
      ('Mechanic',  'Service technician who performs repairs and maintenance'),
      ('Guest',     'External invoice viewer with limited portal access')
  ) AS r (name, description)
  WHERE NOT EXISTS (
    SELECT 1 FROM public.roles
    WHERE organization_id = p_org_id AND name = r.name AND deleted_at IS NULL
  );

  SELECT id INTO v_owner_id    FROM public.roles WHERE organization_id = p_org_id AND name = 'Org Owner' AND deleted_at IS NULL;
  SELECT id INTO v_manager_id  FROM public.roles WHERE organization_id = p_org_id AND name = 'Manager'   AND deleted_at IS NULL;
  SELECT id INTO v_mechanic_id FROM public.roles WHERE organization_id = p_org_id AND name = 'Mechanic'  AND deleted_at IS NULL;
  SELECT id INTO v_guest_id    FROM public.roles WHERE organization_id = p_org_id AND name = 'Guest'     AND deleted_at IS NULL;

  -- Org Owner: ALL permissions
  INSERT INTO public.role_permissions (role_id, permission_id)
  SELECT v_owner_id, p.id
  FROM public.permissions p
  WHERE p.organization_id = p_org_id AND p.deleted_at IS NULL
  ON CONFLICT (role_id, permission_id) DO NOTHING;

  -- Manager: work_orders, invoices, inventory, customers, vehicles (full CRUD)
  --          + reports.read, payroll, settings.read, members.read
  --          + expenses (full CRUD), services (full CRUD)
  --          + appointments (full CRUD), branches (full CRUD)
  --          + commission_rules (full CRUD), diagnosis_labels (full CRUD)
  --          + expense_categories (full CRUD)
  INSERT INTO public.role_permissions (role_id, permission_id)
  SELECT v_manager_id, p.id
  FROM public.permissions p
  WHERE p.organization_id = p_org_id AND p.deleted_at IS NULL
    AND (
      p.resource IN ('work_orders', 'invoices', 'inventory', 'customers', 'vehicles',
                     'expenses', 'services', 'appointments', 'branches',
                     'commission_rules', 'diagnosis_labels', 'expense_categories')
      OR (p.resource = 'reports'  AND p.action = 'read')
      OR (p.resource = 'payroll')
      OR (p.resource = 'settings' AND p.action = 'read')
      OR (p.resource = 'members'  AND p.action IN ('read', 'update'))
    )
  ON CONFLICT (role_id, permission_id) DO NOTHING;

  -- Mechanic: work_orders (read/update), inventory (read), customers (read),
  --           vehicles (read), services (read), appointments (read)
  INSERT INTO public.role_permissions (role_id, permission_id)
  SELECT v_mechanic_id, p.id
  FROM public.permissions p
  WHERE p.organization_id = p_org_id AND p.deleted_at IS NULL
    AND (
      (p.resource IN ('work_orders', 'inventory', 'customers', 'vehicles', 'services') AND p.action IN ('read', 'update'))
      OR (p.resource = 'appointments' AND p.action IN ('read', 'update'))
    )
  ON CONFLICT (role_id, permission_id) DO NOTHING;

  -- Guest: invoices.read
  INSERT INTO public.role_permissions (role_id, permission_id)
  SELECT v_guest_id, p.id
  FROM public.permissions p
  WHERE p.organization_id = p_org_id AND p.deleted_at IS NULL
    AND p.resource = 'invoices' AND p.action = 'read'
  ON CONFLICT (role_id, permission_id) DO NOTHING;
END;
$$;

-- ============================================================
-- 3. Backfill: add new permissions for all existing orgs
-- ============================================================
DO $$
DECLARE
  org_record RECORD;
BEGIN
  FOR org_record IN SELECT id FROM public.organizations WHERE deleted_at IS NULL LOOP
    -- Seed new permission rows for this org
    PERFORM seed_org_permissions(org_record.id);
    -- Re-assign role permissions to catch the newly added ones
    PERFORM seed_org_role_permissions(org_record.id);
  END LOOP;
END;
$$;
```

#### 3. src/app/api/organizations/[id]/expenses/route.ts

**File**: src/app/api/organizations/[id]/expenses/route.ts
**Changes**: MODIFY — Add requiredPermission to GET and POST handlers

```tsx
export const GET = createRouteHandler(
  async ({ request, orgId }) => {
    // ... existing handler body unchanged
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    if (type === "stats") {
      const stats = await getExpenseStats(orgId);
      return NextResponse.json({ data: stats });
    }
    // ... rest of existing GET handler
  },
  { requiredPermission: { resource: "expenses", action: "read" } },
);

export const POST = createRouteHandler(
  async ({ request, orgId, user }) => {
    await requireActiveSubscription(orgId);
    // ... rate limit and handler body unchanged
    const body = await request.json();
    const expense = await createExpense(orgId, body, user.id);
    return NextResponse.json({ data: expense }, { status: 201 });
  },
  { requiredPermission: { resource: "expenses", action: "create" } },
);
```

#### 4. src/app/api/organizations/[id]/services/route.ts

**File**: src/app/api/organizations/[id]/services/route.ts
**Changes**: MODIFY — Add requiredPermission to GET and POST handlers

```tsx
export const GET = createRouteHandler(
  async ({ request, orgId }) => {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") ?? undefined;
    const services = await getServices(orgId, category);
    return NextResponse.json({ data: services });
  },
  { requiredPermission: { resource: "services", action: "read" } },
);

export const POST = createRouteHandler(
  async ({ request, orgId }) => {
    await requireActiveSubscription(orgId);
    // ... rate limit and handler body unchanged
    const body = await request.json();
    const service = await createService(orgId, body);
    return NextResponse.json({ data: service }, { status: 201 });
  },
  { requiredPermission: { resource: "services", action: "create" } },
);
```

#### 5. src/app/api/organizations/[id]/inventory/parts/route.ts

**File**: src/app/api/organizations/[id]/inventory/parts/route.ts
**Changes**: MODIFY — Add requiredPermission to GET and POST handlers

```tsx
export const GET = createRouteHandler(
  async ({ orgId }) => {
    const parts = await getPartsCatalog(orgId);
    return NextResponse.json({ data: parts });
  },
  { requiredPermission: { resource: "inventory", action: "read" } },
);

export const POST = createRouteHandler(
  async ({ request, orgId, user }) => {
    await requireActiveSubscription(orgId);
    // ... rate limit and handler body unchanged
    const body = await request.json();
    const part = await createPart(orgId, body, user.id);
    return NextResponse.json({ data: part }, { status: 201 });
  },
  { requiredPermission: { resource: "inventory", action: "create" } },
);
```

#### 6. src/app/api/organizations/[id]/inventory/suppliers/route.ts

**File**: src/app/api/organizations/[id]/inventory/suppliers/route.ts
**Changes**: MODIFY — Add requiredPermission to GET and POST handlers

```tsx
export const GET = createRouteHandler(
  async ({ orgId }) => {
    const suppliers = await getSuppliers(orgId);
    return NextResponse.json({ data: suppliers });
  },
  { requiredPermission: { resource: "inventory", action: "read" } },
);

export const POST = createRouteHandler(
  async ({ request, orgId, user }) => {
    await requireActiveSubscription(orgId);
    // ... rate limit and handler body unchanged
    const body = await request.json();
    const supplier = await createSupplier(orgId, body, user.id);
    return NextResponse.json({ data: supplier }, { status: 201 });
  },
  { requiredPermission: { resource: "inventory", action: "create" } },
);
```

#### 7-15. Inventory, commission, diagnosis, category, and branch routes

**Files**: multiple inventory routes + commission-rules + diagnosis-labels + expense-categories + branches
**Changes**: MODIFY — Add requiredPermission to POST handlers

For each route, the change is the same pattern: add the second argument to `createRouteHandler`. Below are the resource/action mappings:

| Route file | Resource | Action |
|---|---|---|
| `inventory/purchase-orders/route.ts` POST | `inventory` | `create` |
| `inventory/parts-cars/route.ts` POST | `inventory` | `create` |
| `inventory/movements/route.ts` POST | `inventory` | `create` |
| `inventory/part-categories/route.ts` POST | `inventory` | `create` |
| `inventory/thresholds/route.ts` POST | `inventory` | `create` |
| `commission-rules/route.ts` POST | `commission_rules` | `create` |
| `diagnosis-labels/route.ts` POST | `diagnosis_labels` | `create` |
| `expense-categories/route.ts` POST | `expense_categories` | `create` |
| `branches/route.ts` POST | `branches` | `create` |
| `branches/route.ts` GET | `branches` | `read` |
| `commission-rules/route.ts` GET | `commission_rules` | `read` |
| `diagnosis-labels/route.ts` GET | `diagnosis_labels` | `read` |
| `expense-categories/route.ts` GET | `expense_categories` | `read` |
| `expense-categories/route.ts` POST | `expense_categories` | `create` |

Example pattern (same for all):

```tsx
// Before:
export const POST = createRouteHandler(async ({ request, orgId, user }) => {
  await requireActiveSubscription(orgId);
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const rateCheck = mutationRateLimiter.check(ip);
  if (!rateCheck.allowed) { /* 429 response */ }
  const body = await request.json();
  const result = await createX(orgId, body, user.id);
  return NextResponse.json({ data: result }, { status: 201 });
});

// After:
export const POST = createRouteHandler(
  async ({ request, orgId, user }) => {
    await requireActiveSubscription(orgId);
    const ip = request.headers.get("x-forwarded-for") ?? "unknown";
    const rateCheck = mutationRateLimiter.check(ip);
    if (!rateCheck.allowed) { /* 429 response */ }
    const body = await request.json();
    const result = await createX(orgId, body, user.id);
    return NextResponse.json({ data: result }, { status: 201 });
  },
  { requiredPermission: { resource: "<resource>", action: "create" } },
);
```

### Success Criteria:

#### Automated Verification:
- [ ] Type checking passes: `npm run validate`
- [ ] Migration applies clean: `supabase migration up`
- [ ] Permissions seed function compiles: `supabase db diff --linked` shows no unexpected changes
- [ ] All route files parse: `npm run validate:types`
- [ ] No duplicate `permission_action` enum values: check `supabase_execute_sql` with `SELECT enum_range(NULL::permission_action)`

#### Manual Verification:
- [ ] CreatePageHeader renders correctly on a creation page (e.g., expenses/new)
- [ ] POST to expenses API as a Mechanic returns 403 (Mechanics lack expenses.create)
- [ ] POST to expenses API as a Manager returns 201
- [ ] POST to services API as a Guest returns 403
- [ ] POST to inventory/parts API as a Mechanic returns 403 (Mechanics have only read)
- [ ] Verify the backfill re-seeded permissions for existing orgs: check one org's permissions table

---

## Phase 2: API Infrastructure

### Overview

Eliminate rate-limiting boilerplate from 20+ route handlers by moving it into `createRouteHandler` as an opt-in option.

Depends on: Phase 1 (foundation).

### Changes Required:

#### 1. src/lib/api-handler.ts

**File**: src/lib/api-handler.ts
**Changes**: MODIFY — Add `rateLimit?: boolean` to `RouteHandlerOptions`. When true, wrap handler with mutationRateLimiter check inside `createRouteHandler`.

```tsx
import { mutationRateLimiter } from "@/lib/rate-limit";

interface RouteHandlerOptions {
  /** If false, orgId won't be extracted (use for non-org routes like /api/profile) */
  requireOrg?: boolean;
  /** Minimum role level required for this route */
  minimumRole?: "Org Owner" | "Manager" | "Mechanic" | "Guest";
  /** Specific permission required for this route (checked after minimumRole) */
  requiredPermission?: { resource: string; action: string };
  /** Apply mutation rate limiting to this route (default: false) */
  rateLimit?: boolean;
}

export function createRouteHandler(
  handler: RouteHandler,
  options?: RouteHandlerOptions,
) {
  return async (request: NextRequest, context: RouteContext) => {
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new UnauthorizedError();

      const params = await context.params;
      const orgId = options?.requireOrg === false ? "" : (params.id ?? "");

      // Verify org membership when orgId is present
      if (orgId) {
        const { data: membership } = await supabase
          .from("organization_users")
          .select("organization_id")
          .eq("user_id", user.id)
          .eq("organization_id", orgId)
          .is("removed_at", null)
          .maybeSingle();

        if (!membership) {
          throw new ForbiddenError("Not a member of this organization");
        }
      }

      // Check role requirements
      if (options?.minimumRole) {
        await requireRole(options.minimumRole);
      }

      // Check specific permission requirements
      if (options?.requiredPermission) {
        await requirePermission(
          options.requiredPermission.resource,
          options.requiredPermission.action,
          orgId,
        );
      }

      // Apply rate limiting
      if (options?.rateLimit) {
        const ip = request.headers.get("x-forwarded-for") ?? "unknown";
        const rateCheck = mutationRateLimiter.check(ip);
        if (!rateCheck.allowed) {
          return NextResponse.json(
            { error: { code: "RATE_LIMITED", message: "Too many requests" } },
            {
              status: 429,
              headers: {
                "Retry-After": String(
                  Math.ceil((rateCheck.resetAt - Date.now()) / 1000),
                ),
              },
            },
          );
        }
      }

      return await handler({ request, params, orgId, user, supabase });
    } catch (error) {
      const { status, body, headers } = toApiErrorResponse(error);
      return NextResponse.json(body, { status, headers });
    }
  };
}
```

### Success Criteria:

#### Automated Verification:
- [ ] Type checking passes: `npm run validate`
- [ ] Existing routes without `rateLimit: true` continue to work unchanged (no rate limit applied)
- [ ] A route with `rateLimit: true` returns 429 after exceeding 60 requests in 60s

#### Manual Verification:
- [ ] No existing route behavior changed — rateLimit is opt-in
- [ ] Test a route that enables rateLimit (e.g., customers POST) works normally under 60 req/min

---

## Phase 3: Query Standardization

### Overview

Standardize all creation submissions on React Query mutations (Pattern B with toast + retry). Convert raw fetch() patterns in vehicles/new, estimates/new, and customer-form.tsx.

Depends on: Phase 2 (API infrastructure).

### Changes Required:

#### 1. src/lib/queries/use-customers.ts — add useCreateCustomer

**File**: src/lib/queries/use-customers.ts
**Changes**: MODIFY — Add Pattern B mutation hook for customer creation

```tsx
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { toastRetry } from "@/lib/toast-utils";
import { customerKeys } from "./keys";
import type { CreateCustomerParams, Customer } from "@/lib/types";

export function useCreateCustomer(orgId: string | undefined) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (body: CreateCustomerParams) => {
      if (!orgId) throw new Error("No organization ID");
      const res = await fetch(`/api/organizations/${orgId}/customers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      let json: Record<string, unknown>;
      try {
        json = await res.json();
      } catch {
        throw new Error(`Server returned ${res.status} ${res.statusText}. Please try again.`);
      }
      if (!res.ok || json.error) {
        const message = (json.error as Record<string, unknown>)?.message as string ?? "Failed to create customer";
        throw new Error(message);
      }
      return json.data as Customer;
    },
    onSuccess: () => {
      if (orgId) {
        queryClient.invalidateQueries({ queryKey: customerKeys.all(orgId) });
      }
      toast.success("Customer created");
    },
    onError: (err: Error, variables) => {
      toastRetry(err.message, () => mutation.mutateAsync(variables));
    },
  });

  return mutation;
}

export function useCustomerDuplicateCheck(
  orgId: string | undefined,
  phone?: string,
  email?: string,
) {
  return useQuery({
    queryKey: [...customerKeys.all(orgId ?? ""), "duplicate-check", phone, email],
    queryFn: async () => {
      if (!orgId) return null;
      const query = phone || email;
      if (!query || query.length < 3) return null;
      const res = await fetch(`/api/organizations/${orgId}/customers?q=${encodeURIComponent(query)}&pageSize=5`);
      const json = await res.json();
      if (!res.ok || json.error) return null;
      const customers = (json.data?.data ?? json.data ?? []) as Customer[];
      if (!customers.length) return null;
      const phoneMatch = phone ? customers.find(c => c.phone === phone) : null;
      const emailMatch = email ? customers.find(c => c.email === email) : null;
      return { phoneMatch, emailMatch };
    },
    enabled: !!orgId && !!((phone && phone.length >= 3) || (email && email.length >= 3)),
    staleTime: 10_000,
  });
}
```

#### 2. src/lib/queries/use-vehicles.ts — add useCreateVehicle

**File**: src/lib/queries/use-vehicles.ts
**Changes**: NEW — Add Pattern B mutation hook for vehicle creation

```tsx
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { toastRetry } from "@/lib/toast-utils";
import { vehicleKeys } from "./keys";
import type { CreateVehicleParams, Vehicle } from "@/lib/types";

export function useCreateVehicle(orgId: string | undefined) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (body: CreateVehicleParams) => {
      if (!orgId) throw new Error("No organization ID");
      const res = await fetch(`/api/organizations/${orgId}/vehicles`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok || json.error) {
        throw new Error(json.error?.message ?? "Failed to create vehicle");
      }
      return json.data as Vehicle;
    },
    onSuccess: () => {
      if (orgId) {
        queryClient.invalidateQueries({ queryKey: vehicleKeys.all(orgId) });
      }
      toast.success("Vehicle created");
    },
    onError: (err: Error, variables) => {
      toastRetry(err.message, () => mutation.mutateAsync(variables));
    },
  });

  return mutation;
}
```

#### 3. src/app/[locale]/dashboard/vehicles/new/page.tsx

**File**: src/app/[locale]/dashboard/vehicles/new/page.tsx
**Changes**: MODIFY — Replace raw fetch() with useCreateVehicle mutation

The key change: replace the manual `fetch` + `setSaving`/`setError` in handleSubmit with the mutation hook. The page imports `useCreateVehicle` and calls `mutateAsync` + `onSuccess`/`onError` callbacks for toast and navigation. Remove `setSaving(true/false)` and `setError` states — the mutation handles them via `isPending` and `onError`.

```tsx
// In NewVehicleForm component:
import { useCreateVehicle } from "@/lib/queries/use-vehicles";

// Replace:
const [saving, setSaving] = useState(false);
const [error, setError] = useState<string | null>(null);

// With:
const createVehicle = useCreateVehicle(orgId);

// Replace handleSubmit's fetch() block with:
const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
  event.preventDefault();
  if (!orgId) { setError(t("noOrganization")); return; }
  if (!selectedCustomer) { setError(t("selectCustomerFirst")); return; }

  // Client-side validation (unchanged)
  const errors: Record<string, string> = {};
  // ... existing validation logic
  setFieldErrors(errors);
  if (Object.keys(errors).length > 0) return;

  try {
    const vehicle = await createVehicle.mutateAsync({
      ...form,
      customerId: selectedCustomer.id,
      year: form.year ? Number(form.year) : undefined,
      odometer: form.odometer ? Number(form.odometer) : undefined,
    });
    toast.success(t("vehicleCreated"));
    replace("/dashboard/vehicles");
    setDetailVehicleId(vehicle.id);
  } catch (err) {
    // error toast handled by mutation hook
  }
};

// Replace saving variable references:
// saving → createVehicle.isPending
// <Button disabled={saving}> → <Button disabled={createVehicle.isPending}>
```

#### 4. src/app/[locale]/dashboard/estimates/new/page.tsx

**File**: src/app/[locale]/dashboard/estimates/new/page.tsx
**Changes**: MODIFY — Replace raw fetch() for estimate submission and catalog searches with React Query hooks

```tsx
// Add imports:
import { useServiceCatalog } from "@/lib/queries/use-wizard-data";
import { usePartsCatalog } from "@/lib/queries/use-inventory";

// Replace the inline searchServices function and useState for services:
const { data: services = [], isFetching: searchingServices } =
  useServiceCatalog(orgId);

// Replace the inline searchParts function and useState for parts:
const { data: parts = [], isFetching: searchingParts } =
  usePartsCatalog(orgId);

// Replace the inline handleSave raw fetch with:
import { useMutation } from "@tanstack/react-query";

const createEstimate = useMutation({
  mutationFn: async (data: { customer_id: string; vehicle_id: string; notes?: string; terms?: string; items: QuoteLine[] }) => {
    const res = await fetch(`/api/organizations/${orgId}/estimates`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (json.error) throw new Error(json.error.message);
    return json.data;
  },
  onSuccess: (data) => {
    toast.success("Quote created");
    router.push(`/dashboard/estimates/${data.id}`);
  },
  onError: (err: Error) => toast.error(err.message),
});
```

#### 5-6. customer-form.tsx — useCustomerDuplicateCheck

**File**: src/components/customers/customer-form.tsx + src/lib/queries/use-customers.ts
**Changes**: MODIFY — customer-form uses the new useCustomerDuplicateCheck hook (defined in #1 above)

In the handleSubmit of customer-form.tsx, replace the inline duplicate check fetch:

```tsx
// Instead of:
const checkRes = await fetch(`/api/organizations/${orgId}/customers?q=...`);
const checkJson = await checkRes.json();
// ... inline check logic

// Use:
const { data: duplicateCheck } = useCustomerDuplicateCheck(orgId, phone, email);

// In handleSubmit, check before submitting:
if (duplicateCheck?.phoneMatch) {
  toast.warning(`Phone belongs to ${duplicateCheck.phoneMatch.first_name}`);
}
if (duplicateCheck?.emailMatch) {
  toast.warning(`Email belongs to ${duplicateCheck.emailMatch.first_name}`);
}
```

**Note**: The duplicate check uses `useQuery` with `enabled` so it fires automatically when phone/email changes. This replaces the blocking inline `await fetch()`. The actual submission then doesn't need to wait for the check.

### Success Criteria:

#### Automated Verification:
- [ ] Type checking passes: `npm run validate`
- [ ] Tests pass: `npm run test`
- [ ] useCreateCustomer and useCreateVehicle hooks can be imported without errors

#### Manual Verification:
- [ ] Creating a vehicle via /dashboard/vehicles/new succeeds, shows success toast, redirects to list
- [ ] Creating an estimate via /dashboard/estimates/new succeeds, shows toast, navigates to detail
- [ ] Duplicate phone check fires automatically when typing in CustomerForm (check Network tab)
- [ ] Duplicate email shows a warning toast without blocking submission

---

## Phase 4: Sheet Unification

### Overview

Migrate all raw-Sheet creation flows to the ResponsiveFormModal pattern with extracted form components. Converts expense, supplier, purchase-order, parts-car, appointment, and mechanic creation sheets.

Depends on: Phase 3 (standardized mutation hooks available for extracted forms).

### Changes Required:

#### 1-8. Sheet Migration to ResponsiveFormModal Pattern

**Files**: 4 NEW form components + 4 MODIFY sheet wrappers

**Pattern (same for all entities)**:

```tsx
// NEW: src/components/{entity}/{entity}-form.tsx
// Takes the form body from the raw sheet, wraps with the form component pattern:

export type ExpenseFormProps = {
  mode?: "quick" | "full";
  onSuccess?: (expense: Expense) => void;
  onCancel?: () => void;
};

export function ExpenseForm({ mode = "full", onSuccess, onCancel }: ExpenseFormProps) {
  // Schema + useForm + mutation hook (Pattern B) — extracted from new-expense-sheet.tsx
  // Fields, validation, submit button, cancel button — self-contained
  // Calls onSuccess(createdExpense) on success, onCancel() on cancel
}

// MODIFY: src/components/{entity}/new-{entity}-sheet.tsx
// Thin shell using ResponsiveFormModal:

export function NewExpenseSheet({ open, onOpenChange, onSuccess }: NewExpenseSheetProps) {
  const t = useTranslations("expenses");
  return (
    <ResponsiveFormModal
      open={open}
      onOpenChange={onOpenChange}
      title={t("addExpense")}
      description={t("subtitle")}
      sheetSize="2xl"
    >
      <ExpenseForm
        mode="full"
        onSuccess={(expense) => { onSuccess?.(expense); onOpenChange(false); }}
        onCancel={() => onOpenChange(false)}
      />
    </ResponsiveFormModal>
  );
}
```

**Entity mapping**:

| Raw sheet → | Form component | Sheet (thin shell) |
|---|---|---|
| `new-expense-sheet.tsx` | `expense-form.tsx` NEW | `new-expense-sheet.tsx` MODIFY |
| `new-supplier-sheet.tsx` | `inventory/supplier-form.tsx` NEW | `inventory/new-supplier-sheet.tsx` MODIFY |
| `new-purchase-order-sheet.tsx` | `inventory/purchase-order-form.tsx` NEW | `inventory/new-purchase-order-sheet.tsx` MODIFY |
| `appointments/_create-sheet.tsx` | `appointments/appointment-form.tsx` NEW | `appointments/_create-sheet.tsx` MODIFY |

### Success Criteria:

#### Automated Verification:
- [ ] Type checking passes: `npm run validate`
- [ ] All existing sheet imports still work (no broken re-exports)

#### Manual Verification:
- [ ] Creating an expense via the sheet works end-to-end (open → fill → submit → close)
- [ ] Creating a supplier via the sheet works end-to-end
- [ ] Creating a purchase order via the sheet works end-to-end
- [ ] Mobile view shows Drawer (bottom sheet) instead of side Sheet
- [ ] Form resets when closing and re-opening the sheet
- [ ] Sticky footer buttons (cancel/submit) remain visible on long forms

---

## Phase 5: Global Sheet Registry

### Overview

Extend the existing GlobalDialogs + PageHeaderProvider pattern to support additional creation entities and fix the broken customers/new redirect.

Depends on: Phase 4 (all creation sheets unified on ResponsiveFormModal).

### Changes Required:

#### 1. src/app/[locale]/dashboard/_global-dialogs.tsx

**File**: src/app/[locale]/dashboard/_global-dialogs.tsx
**Changes**: MODIFY — Add dynamic imports for supplier, PO, appointment, and parts-car creation sheets

```tsx
const NewSupplierSheet = dynamic(
  () => import("@/components/inventory/new-supplier-sheet").then(m => m.NewSupplierSheet),
  { ssr: false },
);
const NewPurchaseOrderSheet = dynamic(
  () => import("@/components/inventory/new-purchase-order-sheet").then(m => m.NewPurchaseOrderSheet),
  { ssr: false },
);
const AppointmentCreateSheet = dynamic(
  () => import("@/app/[locale]/dashboard/appointments/_create-sheet").then(m => m.AppointmentCreateSheet),
  { ssr: false },
);
const NewPartsCarSheet = dynamic(
  () => import("@/components/inventory/new-parts-car-sheet").then(m => m.NewPartsCarSheet),
  { ssr: false },
);

// Render inside the fragment:
<NewSupplierSheet
  open={isNewSupplierSheetOpen}
  onOpenChange={setNewSupplierSheetOpen}
/>
<NewPurchaseOrderSheet
  open={isNewPOSheetOpen}
  onOpenChange={setNewPOSheetOpen}
/>
<AppointmentCreateSheet
  open={isNewAppointmentSheetOpen}
  onOpenChange={setNewAppointmentSheetOpen}
  orgId={...}
/>
<NewPartsCarSheet
  open={isNewPartsCarSheetOpen}
  onOpenChange={setNewPartsCarSheetOpen}
/>
```

#### 2. src/hooks/use-page-header.tsx — add states

**File**: src/hooks/use-page-header.tsx
**Changes**: MODIFY — Add open states and setters for supplier, PO, appointment, parts-car

```tsx
// Add these state pairs alongside existing ones:
const [isNewSupplierSheetOpen, setNewSupplierSheetOpen] = useState(false);
const [isNewPOSheetOpen, setNewPOSheetOpen] = useState(false);
const [isNewAppointmentSheetOpen, setNewAppointmentSheetOpen] = useState(false);
const [isNewPartsCarSheetOpen, setNewPartsCarSheetOpen] = useState(false);

// Export in context value:
isNewSupplierSheetOpen,
setNewSupplierSheetOpen,
isNewPOSheetOpen,
setNewPOSheetOpen,
isNewAppointmentSheetOpen,
setNewAppointmentSheetOpen,
isNewPartsCarSheetOpen,
setNewPartsCarSheetOpen,
```

#### 3. src/components/page-header.tsx (QuickCreateActions)

**File**: src/components/page-header.tsx
**Changes**: MODIFY — Add creation menu items for supplier, PO, appointment, parts-car

```tsx
// Add to createItems array in QuickCreateActions:
import { Package, CalendarPlus, Wrench, Truck } from "lucide-react";

const createItems = [
  // ...existing items (WO, customer, vehicle, expense)
  { label: t("inventory.newSupplier"), icon: Truck, onClick: () => setNewSupplierSheetOpen(true) },
  { label: t("inventory.newPurchaseOrder"), icon: Package, onClick: () => setNewPOSheetOpen(true) },
  { label: t("appointments.newAppointment"), icon: CalendarPlus, onClick: () => setNewAppointmentSheetOpen(true) },
  { label: t("inventory.newPartsCar"), icon: Wrench, onClick: () => setNewPartsCarSheetOpen(true) },
];
```

#### 4. src/app/[locale]/dashboard/customers/new/page.tsx

**File**: src/app/[locale]/dashboard/customers/new/page.tsx
**Changes**: MODIFY — Wire redirect to set PageHeader state instead of pushing search params

```tsx
"use client";

import { useEffect } from "react";
import { usePageHeader } from "@/hooks/use-page-header";
import { useRouter } from "@/lib/i18n/navigation";

export default function NewCustomerRedirect() {
  const { replace } = useRouter();
  const { setNewCustomerDialogOpen } = usePageHeader();

  useEffect(() => {
    setNewCustomerDialogOpen(true);
    replace("/dashboard/customers");
  }, [replace, setNewCustomerDialogOpen]);

  return null;
}
```

### Success Criteria:

#### Automated Verification:
- [ ] Type checking passes: `npm run validate`
- [ ] All dynamic imports in GlobalDialogs resolve: `npm run build`

#### Manual Verification:
- [ ] Quick-create "+" button in header shows all 8 creation options
- [ ] Each quick-create item opens the correct Sheet
- [ ] Navigating to /dashboard/customers/new opens the customer Sheet and redirects to list
- [ ] Creating via Cmd+K palette opens correct Sheets

---

## Phase 6: Service Refactoring

### Overview

Refactor all 22 service functions to accept `db: SupabaseClient` as a parameter (removing internal createClient() calls), and split work-order-service.ts into focused modules.

Depends on: Phase 5.

### Changes Required:

#### 1-22. Service db parameter injection

**Files**: All 22 service files + all route files
**Changes**: MODIFY — Add `db: SupabaseClient` as first parameter, remove internal createClient() calls

**Pattern (same for all service functions)**:

```typescript
// BEFORE (vehicle-service.ts):
export async function createVehicle(
  orgId: string,
  params: CreateVehicleParams,
  userId: string,
): Promise<Vehicle> {
  const supabase = await createClient(); // ← creates its own client
  // ...
}

// AFTER:
export async function createVehicle(
  db: SupabaseClient,
  orgId: string,
  params: CreateVehicleParams,
  userId: string,
): Promise<Vehicle> {
  const supabase = db; // ← use injected client
  // ...
}
```

**Caller update (in route handler)**:

```typescript
// BEFORE:
export const POST = createRouteHandler(async ({ request, orgId, user }) => {
  const vehicle = await createVehicle(orgId, body, user.id);
  // ...
});

// AFTER:
export const POST = createRouteHandler(async ({ request, orgId, user, supabase }) => {
  const vehicle = await createVehicle(supabase, orgId, body, user.id);
  // ...
});
```

**Migration scope**: ~22 service files × ~5 exported functions each = ~110 function signature changes + all route callers. Large but mechanical.

#### work-order-service split

**File**: `src/lib/services/work-order-service.ts` (MODIFY) + new files
**Changes**: Split into 3 files:

1. `src/lib/services/work-order-service.ts` — Core CRUD: `createWorkOrder`, `getWorkOrder`, `getWorkOrders`, `cancelWorkOrder`, `recalculateWorkOrderTotals`
2. `src/lib/services/work-order-items-service.ts` — Line items: `addServiceToWorkOrder`, `addPartToWorkOrder`, `removeServiceFromWorkOrder`, `removePartFromWorkOrder`, `updateWorkOrderServicePrice`, `updateWorkOrderPartPrice`
3. `src/lib/services/work-order-workflow.ts` — Status-driven side effects: `updateWorkOrderStatus`, `assignMechanic` (including inventory deduction and schedule sync logic)

Each file gets the `db: SupabaseClient` parameter pattern.

### Success Criteria:

#### Automated Verification:
- [ ] Type checking passes: `npm run validate`
- [ ] All service exports still resolve: `npm run build`
- [ ] work-order-service tests pass: `npm run test -- work-order`

#### Manual Verification:
- [ ] Creating a vehicle works end-to-end (proves vehicle-service API unchanged)
- [ ] Creating a work order with services and parts works end-to-end
- [ ] Service function signatures match callers (verify one route → service call)

---

## Phase 7: Wizard Decomposition

### Overview

Split the ~600-line wizard context into focused custom hooks, maintaining the same public API (WizardProvider + sections).

Depends on: Phase 5 (can also be done independently after Phase 3).

### Changes Required:

#### 1-6. Custom hooks (extracted from wizard-context.tsx)

**Files**: NEW — 6 focused hooks

```typescript
// src/lib/hooks/use-customer-selection.ts
// Handles: customer search, selection, quick-create inline form
// Exports: useCustomerSelection(orgId) → { customerSearch, customers, selectedCustomer, ... }

// src/lib/hooks/use-vehicle-selection.ts
// Handles: vehicle search by customer, selection
// Exports: useVehicleSelection(orgId, customerId?) → { vehicleSearch, vehicles, selectedVehicle, ... }

// src/lib/hooks/use-service-lines.ts
// Handles: service catalog, add/update/remove service lines, price history
// Exports: useServiceLines(orgId, vehicleMake?) → { serviceLines, addService, updateService, removeService, ... }

// src/lib/hooks/use-part-lines.ts
// Handles: parts catalog, add/update/remove part lines, price history
// Exports: usePartLines(orgId, vehicleMake?) → { partLines, addPartFromCatalog, updatePart, removePart, ... }

// src/lib/hooks/use-draft-save.ts
// Handles: localStorage auto-save, draft restore, beforeunload warning
// Exports: useDraftSave(draftData) → { isDraftRestored, discardDraft }

// src/lib/hooks/use-wizard-submit.ts
// Handles: validation, create mutation, success/error handling
// Exports: useWizardSubmit(orgId) → { handleCreate, isSaving }
```

#### 7. src/components/work-orders/wizard/wizard-context.tsx

**File**: src/components/work-orders/wizard/wizard-context.tsx
**Changes**: MODIFY — Compose extracted hooks, maintain same provider API

The wizard context becomes a composition layer:

```typescript
export function WizardProvider({ children, onCreated }: WizardProviderProps) {
  const { data: profile } = useQuery({ /* profile query */ });
  const orgId = profile?.organizationId ?? null;

  const customer = useCustomerSelection(orgId);
  const vehicle = useVehicleSelection(orgId, customer.selectedCustomer?.id);
  const services = useServiceLines(orgId, vehicle.selectedVehicle?.make);
  const parts = usePartLines(orgId, vehicle.selectedVehicle?.make);
  const draft = useDraftSave(/* ... */);
  const submit = useWizardSubmit(orgId);

  // Compose into WizardContext value (same shape as current)
  const value: WizardContextType = {
    orgId,
    loading: /* ... */,
    saving: submit.isPending,
    // Delegates to individual hooks:
    customerSearch: customer.search,
    customers: customer.results,
    vehicleSearch: vehicle.search,
    vehicles: vehicle.results,
    serviceLines: services.lines,
    partLines: parts.lines,
    // ... rest of the context shape
  };

  return <WizardContext.Provider value={value}>{children}</WizardContext.Provider>;
}
```

**No changes to individual section components** (customer-section.tsx, vehicle-section.tsx, etc.) — they import `useWizardContext()` which returns the same shape.

### Success Criteria:

#### Automated Verification:
- [ ] Type checking passes: `npm run validate`
- [ ] Existing test suite passes: `npm run test`
- [ ] Wizard sections render without errors: check on /dashboard/work-orders/new

#### Manual Verification:
- [ ] Full work order creation flow works (customer → vehicle → services → parts → mechanic → submit)
- [ ] Draft auto-save still works (localStorage on close/refresh)
- [ ] Last visit suggestions still show on vehicle select
- [ ] Price history lookups still populate default prices 
