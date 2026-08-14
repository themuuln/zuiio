# Architecture Analysis: Database Schema & Migrations

> Generated: 2026-05-12
> Analysis of the Supabase/PostgreSQL schema from migration files and type definitions.

---

## 1. Migration Overview

```
00001_phase0_foundation.sql     — Core multi-tenant foundation (orgs, branches, roles, RLS)
00002_phase1_startup_crm.sql    — Customers, vehicles, work orders, services
00003_phase2_parts_catalog.sql  — Parts catalog, vehicle model parts
00004_seed_demo_org.sql         — Demo organization seed data
00005_fix_org_membership_rls.sql— RLS fix for organization membership
00006_seed_vehicles_and_customers.sql — More seed data
00007_org_selector_bay_view_pin.sql   — Bay view PIN, org selector improvements
00008_inventory_control.sql     — Inventory movements, ledger, purchase orders
00009_seed_showcase_data.sql    — Showcase/demo data
00010_add_parts_catalog_name_mn.sql   — Mongolian name for parts catalog
00011_work_orders_rls_policies.sql    — Work order RLS policies
```

---

## 2. Schema Architecture

### Multi-Tenant Foundation (Phase 0)

```
organizations ──┬── branches
                ├── roles
                ├── permissions
                ├── role_permissions
                ├── organization_users
                └── subscription_plans
```

Core columns on every table:
- `organization_id` (UUID, NOT NULL)
- `created_by`, `updated_by` (UUID, nullable)
- `created_at`, `updated_at` (timestamptz, NOT NULL)
- `deleted_at` (timestamptz, nullable — soft delete)

### Business Domain (Phase 1)

```
customers ──── vehicle_owners ──── vehicles
                                        │
work_orders ──┬── work_order_services
              ├── work_order_parts
              ├── work_order_status_history
              ├── mechanic_assignments
              └── payments

service_catalog
service_price_history
part_price_history
```

### Inventory (Phase 2)

```
parts_catalog ──┬── vehicle_model_parts
                ├── inventory_movements (ledger)
                ├── inventory_balances
                ├── suppliers
                ├── purchase_orders ─── purchase_order_items
                └── stock_thresholds
```

---

## 3. Schema Strengths

1. **Soft deletes everywhere** — `deleted_at` on all tables
2. **Audit trail** — `created_by`, `updated_by` on all tables
3. **Ledger-based inventory** — `inventory_movements` for write path, `inventory_balances` for read path
4. **Price history** — Both `service_price_history` and `part_price_history` for pricing memory analytics
5. **Multi-tenant** — Every table has `organization_id`
6. **Status history** — `work_order_status_history` provides audit trail for state changes

---

## 4. Schema Friction Points

### 4.1. No Database-Generated Invoice/Payment Model

Work orders have services and parts with prices, but there's no explicit invoice model. The `payments` table exists but is referenced only in `dashboard/actions.ts`. The billing model appears to work directly from work order totals rather than through a formal invoice.

**Risk:** When pricing gets more complex (taxes, discounts on WO level + line item level, partial payments), the current flat structure will need rework. The `total` column on work_orders is computed client-side, not stored in DB.

### 4.2. Settings Column is Catch-All

The `settings` column on both `branches` and `organizations` is `JSONB` with no schema enforcement:

```typescript
settings: Record<string, unknown>;
```

This is used for bay count, feature flags, etc. As more settings are added, this becomes an opaque blob that's hard to validate, query, or migrate.

### 4.3. Vehicle Model Parts is a Thin Join

`vehicle_model_parts` maps parts to vehicle models. The service computes a "popularity score" client-side by counting assignments. This could be a materialized view or a computed column.

### 4.4. Inventory Balance Calculation

`inventory_balances` is the read-optimized view of inventory. It's populated by `inventory_movements`. The migration should include a trigger or function that updates balances automatically on movement insert, but this isn't visible from the type definitions alone.

### 4.5. No `work_order_id` on Payments

The `payments` table exists but its relationship to work_orders isn't clear from the types. Payment to work-order linkage is needed for financial auditing.

---

## 5. RLS Policy Architecture

Based on `00011_work_orders_rls_policies.sql`:

- RLS is enabled on all public tables
- Policies check `organization_id` matches the user's org
- Uses `auth.uid()` for user identification
- Uses a helper function `get_user_organization_id()` to resolve the user's current organization

**Good:** Defense-in-depth. Even if a client-side query bypasses the API route, RLS prevents cross-org data access.

**Note:** The `get_user_organization_id()` RPC is called from both:
- RLS policies (for row filtering)
- Service layer (e.g., `bay-view-service.ts` and `organization-access-service.ts`)

This is a dependency coupling — if the RPC changes, both layers need updating.

---

## 6. Recommendations

| Priority | Issue | Effort | Impact |
|----------|-------|--------|--------|
| **P1** | Add formal invoice/payment model before financial features expand | Large | Data integrity for financial records |
| **P2** | Schema-enforce `settings` JSONB (check constraints or JSON schema) | Small | Prevents data rot in settings |
| **P2** | Add `work_order_id` FK on payments | Small | Financial audit trail |
| **P3** | Vehicle model parts popularity as computed column or MV | Small | Eliminates client-side computation |
| **Context** | Inventory balance trigger validation | Verify | Ensure write-path atomicity |
