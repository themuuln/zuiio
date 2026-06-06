---
date: 2026-06-06T16:05:32+0800
author: unknown
commit: 188f6e1
branch: main
repository: tolom
topic: "Customer Picker for Drawer Header"
tags: [design, bay-view-v2, drawer-header, customers]
status: implemented
last_updated: 2026-06-06T16:05:32+0800
last_updated_by: unknown
---

# Customer Picker for Drawer Header

## Summary

Replace the passive "No customer data" text in the work order detail drawer header with an interactive customer picker (modal) that lets users search existing customers or quick-create a new one. This enables mechanics to associate a customer with a work order directly from the drawer without navigating away.

## Scope

### Building
- Backend: Add `customer_id` field to `updateWorkOrderSchema` and PATCH handler in work-orders API route
- Backend: Add `customer_id` update handling to the PATCH route's conditional chain
- Frontend: New `CustomerPickerModal` component — compact modal/sheet for customer search + quick create
- Frontend: Add `assignCustomer` mutation to `_use-drawer-mutations.ts`
- Frontend: Update `_drawer-header.tsx` — replace "No customer data" span with a trigger that opens the picker

### Not Building
- Not changing the customer info display when a customer IS set (name, phone stays as-is)
- No new API endpoints — reusing `GET /api/organizations/${orgId}/customers?q=...` and `POST /api/organizations/${orgId}/customers`
- Not adding a "Change customer" option when one is already set (future scope)
- Not modifying the existing `CustomerSelect` wizard component
- No bulk operations or cross-org customer search

## Architecture

### File Map

| Layer | File | Change Type |
|-------|------|-------------|
| Validation | `src/lib/validation/work-orders.ts` | Add `customer_id` to `updateWorkOrderSchema` + refine |
| API Route | `src/app/api/organizations/[id]/work-orders/[workOrderId]/route.ts` | Add `customer_id` handler block |
| Mutations | `src/components/bay-view-v2/_use-drawer-mutations.ts` | Add `assignCustomer` async function |
| Component | `src/components/bay-view-v2/_customer-picker-modal.tsx` | **New** — modal with customer search + quick create |
| Component | `src/components/bay-view-v2/_drawer-header.tsx` | Replace "No customer data" span |
| Component | `src/components/bay-view-v2/work-order-detail-drawer.tsx` | Plumb `assignCustomer` + modal open state |

### Data Flow

1. User clicks "Select Customer" trigger in drawer header (replaces "No customer data")
2. Modal opens with:
   - Search input (debounced, hits `GET /api/organizations/${orgId}/customers?q=...`)
   - Results list showing matching customers
   - "Quick add customer" button that expands to inline form
3. User selects a customer → `assignCustomer(customerId)` mutation fires → PATCH work order with `customer_id` → drawer refetches work order → customer info appears in header
4. User clicks "Quick add" → fills first_name + phone → `POST /api/organizations/${orgId}/customers` → auto-select new customer → refetch

### API Route Changes

In `updateWorkOrderSchema` (work-orders.ts):
- Add: `customer_id: uuid.nullable().optional()`
- Update refine to accept `customer_id` as valid update field

In PATCH route handler (route.ts), add after the `mechanic_id` block:
```typescript
if (body.customer_id !== undefined) {
  const { error } = await supabase
    .from("work_orders")
    .update({
      customer_id: body.customer_id,
      updated_by: userId,
    })
    .eq("id", workOrderId)
    .eq("organization_id", orgId);

  if (error) {
    return NextResponse.json(
      { error: { code: "UPDATE_FAILED", message: error.message } },
      { status: 500 },
    );
  }

  const wo = await getWorkOrder(supabase, workOrderId);
  return NextResponse.json({ data: wo });
}
```

### assignCustomer Mutation

In `_use-drawer-mutations.ts`, add:
```typescript
async function assignCustomer(customerId: string | null) {
  const orgId = orgIdRef.current;
  if (!orgId || !workOrderId) return;
  setSaving(true);
  try {
    const res = await fetch(
      `/api/organizations/${orgId}/work-orders/${workOrderId}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customer_id: customerId }),
      },
    );
    const json = await res.json();
    if (json.error) {
      toast.error(json.error.message ?? "Failed to assign customer");
    } else {
      await fetchWo(true);
      onRefresh();
      toast.dismiss();
      if (customerId) {
        toast.success("Customer assigned");
      }
    }
  } catch {
    toast.error("Failed to assign customer");
  } finally {
    setSaving(false);
  }
}
```

Return `assignCustomer` from the hook.

### CustomerPickerModal Component

New component at `_customer-picker-modal.tsx`:

- Triggered by a button/section in the drawer header when `wo.customer` is null
- Uses a responsive dialog/sheet (follows app pattern: `ResponsiveFormModal` or a custom dialog)
- Contains:
  - Search input with debounce
  - Results list showing matching customers (name, phone)
  - Quick-create inline form (first_name + phone) with "Create & Select" button
- Reuses patterns from `CustomerSelect` but in a more compact modal form
- Props: `orgId`, `open`, `onOpenChange`, `onSelect(customer: Customer)`

### Drawer Header Changes

Replace:
```tsx
) : wo ? (
  <span className="text-xs text-muted-foreground italic pl-1">
    No customer data
  </span>
) : null}
```

With:
```tsx
) : wo ? (
  <div className="flex flex-col gap-1">
    <Button
      variant="ghost"
      size="sm"
      className="h-auto justify-start gap-2 px-2 py-1.5 text-xs text-muted-foreground italic hover:text-foreground"
      onClick={() => setShowCustomerPicker(true)}
    >
      <User className="size-4 text-muted-foreground/75" />
      Select customer...
    </Button>
  </div>
) : null}
```

And add the modal rendering after the DrawerHeader, plus pass `setShowCustomerPicker` and assignCustomer handler.

### Work Order Detail Drawer Changes

Add state for customer picker modal:
```typescript
const [showCustomerPicker, setShowCustomerPicker] = useState(false);
```

Pass to DrawerHeaderSection:
```typescript
showCustomerPicker={showCustomerPicker}
setShowCustomerPicker={setShowCustomerPicker}
onAssignCustomer={assignCustomer}
```

Render the modal:
```tsx
{showCustomerPicker && orgId && (
  <CustomerPickerModal
    orgId={orgId}
    open={showCustomerPicker}
    onOpenChange={setShowCustomerPicker}
    onSelect={(customer) => {
      assignCustomer(customer.id);
    }}
  />
)}
```

## Slices

### Slice 1: Backend — Schema + API Route

**Files**:
- `src/lib/validation/work-orders.ts`
- `src/app/api/organizations/[id]/work-orders/[workOrderId]/route.ts`

**Changes**:
1. Add `customer_id: uuid.nullable().optional()` to `updateWorkOrderSchema`
2. Add `customer_id` to the refine's "at least one" check
3. Add `customer_id` handler block in PATCH route

**Success Criteria**:

#### Automated Verification:
- [ ] Validation schema accepts `{ customer_id: "uuid-here" }` as valid PATCH body
- [ ] Validation schema accepts `{ customer_id: null }` to clear customer
- [ ] Type check passes: `tsc --noEmit`
- [ ] API returns 200 with updated work order when PATCH with valid customer_id
- [ ] API returns 400 for update with no valid fields

#### Manual Verification:
- [ ] Can PATCH via curl/Postman to assign customer: `curl -X PATCH /api/organizations/{id}/work-orders/{woId} -H 'Content-Type: application/json' -d '{"customer_id":"...id..."}'`
- [ ] Can PATCH with `null` to clear customer

### Slice 2: Frontend — Mutation + Modal Component

**Files**:
- `src/components/bay-view-v2/_use-drawer-mutations.ts`
- `src/components/bay-view-v2/_customer-picker-modal.tsx` **(new)**

**Changes**:
1. Add `assignCustomer` async function to `_use-drawer-mutations.ts`
2. Return `assignCustomer` from the hook
3. Create `_customer-picker-modal.tsx` with search, results list, and quick-create inline form

**Success Criteria**:

#### Automated Verification:
- [ ] Type check passes: `tsc --noEmit` with no errors
- [ ] `assignCustomer` function exists in hook return
- [ ] Modal compiles without TS errors
- [ ] Lint passes: `pnpm lint`

#### Manual Verification:
- [ ] Modal opens when trigger is clicked
- [ ] Search input fetches customers with debounce
- [ ] Results appear and are clickable
- [ ] Quick-create form allows creating a new customer
- [ ] "Create & Select" auto-selects the new customer
- [ ] Error states are handled gracefully

### Slice 3: Frontend — Wire into Drawer

**Files**:
- `src/components/bay-view-v2/_drawer-header.tsx`
- `src/components/bay-view-v2/work-order-detail-drawer.tsx`

**Changes**:
1. Update `DrawerHeaderSection` to accept `showCustomerPicker`, `setShowCustomerPicker`, `onAssignCustomer` props
2. Replace "No customer data" span with a "Select customer..." button
3. In `work-order-detail-drawer.tsx`: add modal open state, pass props, render modal

**Success Criteria**:

#### Automated Verification:
- [ ] Type check passes: `tsc --noEmit`
- [ ] No import errors in drawer files
- [ ] Lint passes: `pnpm lint`

#### Manual Verification:
- [ ] Work order without customer shows "Select customer..." button instead of "No customer data"
- [ ] Clicking button opens customer picker modal
- [ ] Selecting a customer assigns them and shows customer info in header
- [ ] Work order with customer still shows customer details (unchanged behavior)
- [ ] Full drawer lifecycle works: open → assign customer → close → reopen → customer persists
- [ ] Clearing customer (setting to null) reverts to "Select customer..." view

## Ordering Constraints

- Slice 1 must precede Slice 2 (API must accept customer_id before frontend uses it)
- Slice 2 must precede Slice 3 (modal must exist before drawer wires it)
- Slice 2 and Slice 3 could run in the same worktree since they touch separate files (but modal creation must come first)

## Verification Notes

1. **Backend-first**: Without the API route change, the frontend will get 400 errors. Slice 1 must be fully deployed before Slice 2/3 testing.
2. **Offline support**: The current `useDrawerMutations` doesn't use mutation queue for PATCH — the existing mechanic assign doesn't queue either. Following same pattern.
3. **Error handling**: Network errors during assignment show toast. Optimistic update is not used (consistent with mechanic assign pattern).
4. **Modal pattern**: Uses the app's existing responsive dialog pattern. Consistent with `QuickCreateCustomerSheet` and other modals.
5. **Customer search API**: `GET /api/organizations/${orgId}/customers?q=...` already exists and returns paginated results. No new endpoint needed.

## Performance Considerations

- Customer search API is already debounced in the existing `CustomerSelect` (400ms). The new modal will use the same debounce pattern.
- No new database queries — reusing existing endpoints.
- Single customer assignment is a lightweight PATCH with no cascade effects.
- Modal is lazy (renders only when opened).

## References

- Related component: `src/components/work-orders/customer-select.tsx` (existing customer selection pattern)
- Related component: `src/components/customers/quick-create-customer-sheet.tsx` (existing quick-create pattern)
- Types: `src/lib/types/composite.ts` (WorkOrderDetail, Customer)
- API: `src/app/api/organizations/[id]/work-orders/[workOrderId]/route.ts` (PATCH handler)
- Schema: `src/lib/validation/work-orders.ts` (updateWorkOrderSchema)
