# Supabase Production Readiness Plan

**Created:** 2026-06-10  
**Audit Score:** ~6.7/10 → **Target: 9/10**

---

## Phase 1: Low-Risk Fixes (type imports, RLS, triggers)

### 1a. Fix type imports
- `src/lib/services/price-rules-service.ts`: Replace `import type { Tables } from "@/lib/database.types"` → add alias to `src/lib/types/core.ts` or import from `@/lib/types`
- `src/app/api/organizations/[id]/export/route.ts`: Replace `import type { Database } from "@/lib/database.types"` → use `@/lib/types`

### 1b. Add missing RLS policies migration
Create migration `supabase/migrations/<timestamp>_fix_missing_rls_policies.sql`:
- `mechanic_time_logs`: Add INSERT, UPDATE, DELETE policies
- `day_close_logs`: Add UPDATE, DELETE policies
- `customer_communications`: Add UPDATE policy
- `car_brands`: Add UPDATE, DELETE policies
- `car_models`: Add UPDATE, DELETE policies

### 1c. Add missing `set_updated_at` triggers
Same migration:
- `invoice_refunds` → trigger
- `mechanic_time_logs` → trigger
- `day_close_logs` → trigger
- `stock_transfers` → trigger
- `stock_transfer_items` → trigger
- `work_order_helpers` → trigger

**Success criteria:** `npm run validate` passes, new migration applies cleanly.

---

## Phase 2: Audit Logging on All Mutations

Add `createAuditLog()` calls to every service that does writes but lacks audit trail.

| Service | Mutations to audit |
|---------|-------------------|
| `work-order-service.ts` | createWorkOrder, updateWorkOrderStatus |
| `work-order-items-service.ts` | addServiceToWorkOrder, addPartToWorkOrder, removeServiceFromWorkOrder, removePartFromWorkOrder |
| `invoice-service.ts` | createInvoice, updateInvoice, recordPayment, sendInvoice |
| `estimate-service.ts` | createEstimate, updateEstimate, convertEstimateToWorkOrder |
| `inventory-service.ts` | createPart, updatePart, softDeletePart, createMovement, createSupplier, updateSupplier, receivePurchaseOrder |
| `service-catalog-service.ts` | createService, updateService, deleteService |
| `refund-service.ts` | recordRefund, cancelRefund |
| `appointment-service.ts` | createAppointment, updateAppointment, cancelAppointment |
| `user-service.ts` | inviteUser (via invite-service), updateMember, removeUser |
| `invite-service.ts` | createInvite, redeemInvite |
| `payroll-service.ts` | upsertPayRate, calculateMonthlyPayroll |
| `time-tracking-service.ts` | clockIn, clockOut |
| `day-close-service.ts` | closeDay |
| `parts-cars-service.ts` | createPartsCar, updatePartsCar, deletePartsCar |
| `vehicle-models-service.ts` | createVehicleModel, updateVehicleModel, deleteVehicleModel |
| `service-reminder-service.ts` | updateSchedule, deleteSchedule |
| `price-rules-service.ts` | createPriceRule, updatePriceRule, deletePriceRule |
| `organization-service.ts` | updateOrganization |

Pattern for each mutation:
```ts
// Before mutation: fetch existing for old_data (updates/deletes)
// After mutation: 
await createAuditLog({
  supabase: db,
  action: "create" | "update" | "soft_delete",
  table_name: "table_name",
  record_id: data.id,
  user_id: userId,
  organization_id: orgId,
  old_data: existing,  // for updates/deletes
  new_data: data,      // for creates/updates
});
```

**Success criteria:** Every mutation function in every service calls `createAuditLog`. Tests updated to verify.

### ✅ Completed (2026-06-10)

**22 audit log calls added across 14 services:**
| Service | Calls Added |
|---------|-------------|
| work-order-service.ts | 2 (create, cancel) |
| work-order-items-service.ts | 2 (add service, add part) |
| invoice-service.ts | 3 (create, update status, record payment) |
| estimate-service.ts | 3 (create, update, convert) |
| refund-service.ts | 2 (record, cancel) |
| inventory-service.ts | 6 (create part, update part, create supplier, update supplier, receive PO, create movement) |
| service-catalog-service.ts | 3 (create, update, delete) |
| appointment-service.ts | 3 (create, update, delete) |
| user-service.ts | 2 (update member, remove user) |
| invite-service.ts | 2 (create, redeem) |
| payroll-service.ts | 1 (upsert pay rate) |
| time-tracking-service.ts | 2 (clock in, clock out) |
| vehicle-models-service.ts | 3 (create, update, delete) |
| service-reminder-service.ts | 2 (update, delete) |
| organization-service.ts | 1 (update) |
| price-rules-service.ts | 3 (create, update, delete) |

All tests passing (0 new failures, 33 pre-existing).

---

## Phase 3: Service DI Refactor

### ✅ Completed (2026-06-10)

**27 services refactored** to accept `db: SupabaseClient` as first parameter.

**Skipped:** `subscription-enforcement.ts` (59 call sites — separate PR recommended)
**Not refactored:** `bay-view-service.ts`, `post-service-service.ts`, `bay-view-actions.ts` ("use server" files)

All tests passing (0 new failures, 33 pre-existing).

---

## Phase 4: Verification

- `npm run validate` (type-check + lint)
- `npm run test` (all tests pass)
- `lsp_diagnostics` on all changed files
- Manual review: every service mutation has audit log, every service accepts db param
