---
date: 2026-06-06T16:05:32+0800
author: unknown
commit: 188f6e1
branch: main
repository: tolom
topic: "Customer Picker for Drawer Header"
tags: [plan, bay-view-v2, drawer-header, customers]
status: ready
parent: ".rpiv/artifacts/designs/2026-06-06_16-05-32_customer-picker-drawer-header.md"
last_updated: 2026-06-06T16:05:32+0800
last_updated_by: unknown
---

# Customer Picker for Drawer Header — Implementation Plan

## Overview

Replace the passive "No customer data" text in the work order detail drawer header with an interactive customer picker that lets users search existing customers or quick-create a new one. 3 phases: backend schema/API → frontend mutation + modal component → wire into drawer.

## Desired End State

- Work orders without a customer show a "Select customer..." button instead of "No customer data"
- Clicking opens a modal with customer search and quick-create
- Selecting or creating a customer assigns them via PATCH and immediately shows their info
- Work orders with a customer show existing customer details unchanged

## What We're NOT Doing

- Not changing the customer info display when a customer IS set
- No new API endpoints — reusing existing customer search/create endpoints
- Not adding a "Change customer" option when one is already set
- Not modifying the existing `CustomerSelect` wizard component
- No bulk operations or cross-org customer search

## Phase 1: Backend — Schema + API Route

### Overview

Add `customer_id` to the `updateWorkOrderSchema` and add a handler block in the PATCH route for work orders. This enables assigning/clearing a customer on an existing work order via the API.

### Changes Required:

#### 1. Schema — Add customer_id to updateWorkOrderSchema
**File**: `src/lib/validation/work-orders.ts`
**Changes**: Add `customer_id` field and update the refine's condition to accept it as a valid update.

```typescript
// In the z.object({...}), add after loss_reason:
customer_id: uuid.nullable().optional(),

// In the refine, add || data.customer_id !== undefined:
.refine(
  (data) =>
    data.status !== undefined ||
    data.mechanic_id !== undefined ||
    data.complaint !== undefined ||
    data.diagnosis !== undefined ||
    data.notes !== undefined ||
    data.loss_reason !== undefined ||
    data.customer_id !== undefined,
  {
    message:
      "At least one of status, mechanic_id, complaint, diagnosis, notes, loss_reason, or customer_id is required",
  },
);
```

#### 2. API Route — Add customer_id handler
**File**: `src/app/api/organizations/[id]/work-orders/[workOrderId]/route.ts`
**Changes**: Add a `customer_id !== undefined` handler block after the `mechanic_id` block.

```typescript
    if (body.customer_id !== undefined) {
      const userId = (await supabase.auth.getUser()).data.user?.id;
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

### Success Criteria:

#### Automated Verification:
- [ ] Validation schema accepts `{ customer_id: "uuid-here" }` as valid PATCH body
- [ ] Validation schema accepts `{ customer_id: null }` to clear customer
- [ ] Type check passes: `tsc --noEmit`
- [ ] API returns 200 with updated work order when PATCH with valid customer_id
- [ ] API returns 400 for update with no valid fields

#### Manual Verification:
- [ ] Can PATCH via curl/Postman to assign customer
- [ ] Can PATCH with `null` to clear customer

---

## Phase 2: Frontend — Mutation + Modal Component

### Overview

Add `assignCustomer` mutation to the drawer mutations hook, and create a new `CustomerPickerModal` component with customer search and quick-create inline form.

### Changes Required:

#### 1. Add assignCustomer mutation
**File**: `src/components/bay-view-v2/_use-drawer-mutations.ts`
**Changes**: Add `assignCustomer` async function and return it from the hook.

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

Add `assignCustomer` to the return object.

#### 2. Create CustomerPickerModal component
**File**: `src/components/bay-view-v2/_customer-picker-modal.tsx` **(new)**
**Changes**: Compact modal with search results list and quick-create form, following patterns from existing `CustomerSelect`.

```tsx
"use client";

import { AlertTriangle, Plus, User, X } from "lucide-react";
import { useState } from "react";
import { z } from "zod";
import { SearchInput } from "@/components/search-input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldContent, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Typography } from "@/components/ui/typography";
import { formatMongolianPhone, inputProps } from "@/lib/form-ux";
import { useForm, zodResolver } from "@/lib/hooks/use-form";
import type { Customer } from "@/lib/types";

interface CustomerPickerModalProps {
  orgId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (customer: Customer) => void;
}

export function CustomerPickerModal({
  orgId,
  open,
  onOpenChange,
  onSelect,
}: CustomerPickerModalProps) {
  const [customerSearch, setCustomerSearch] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searching, setSearching] = useState(false);
  const [showQuick, setShowQuick] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const customerQuickSchema = z.object({
    first_name: z.string().min(1, "First name is required"),
    last_name: z.string().optional().or(z.literal("")),
    phone: z.string().optional().or(z.literal("")),
  });

  type CustomerQuickValues = z.infer<typeof customerQuickSchema>;

  const form = useForm<CustomerQuickValues>({
    resolver: zodResolver(customerQuickSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      phone: "",
    },
  });

  const handleSearch = (q: string) => {
    setCustomerSearch(q);
    if (!orgId || !q) {
      setCustomers([]);
      return;
    }
    setSearching(true);
    fetch(`/api/organizations/${orgId}/customers?q=${encodeURIComponent(q)}`)
      .then((r) => r.json())
      .then((d) => setCustomers(d.data?.data ?? []))
      .catch(() => setCustomers([]))
      .finally(() => setSearching(false));
  };

  const handleQuickCreate = form.handleSubmit(async (data) => {
    if (!orgId) return;
    setCreateError(null);
    try {
      const res = await fetch(`/api/organizations/${orgId}/customers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: data.first_name.trim(),
          last_name: data.last_name?.trim() || null,
          phone: data.phone?.trim() || null,
          type: "individual",
        }),
      });
      const json = await res.json();
      if (json.error) {
        if (json.error.code === "CONFLICT") {
          setCreateError(
            "This phone number belongs to an existing customer. Search for them instead.",
          );
        } else {
          setCreateError(json.error.message ?? "Failed to create customer");
        }
      } else if (json.data) {
        onSelect(json.data);
        form.reset();
        setShowQuick(false);
        onOpenChange(false);
      }
    } catch {
      setCreateError("Network error");
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <User className="size-4" />
            Select Customer
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-3 -mt-2">
          <SearchInput
            placeholder="Search by name or phone..."
            loading={searching}
            onSearch={handleSearch}
            debounceMs={400}
          />

          {customerSearch && customers.length > 0 && (
            <div className="flex flex-col gap-1 border rounded-lg overflow-hidden max-h-60 overflow-y-auto">
              {customers.map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    onSelect(c);
                    onOpenChange(false);
                  }}
                  className="flex items-center gap-3 w-full p-3 text-left hover:bg-muted/50 transition-colors min-h-[48px]"
                >
                  <User className="size-5 shrink-0 text-muted-foreground" />
                  <div>
                    <span className="font-medium text-sm">
                      {[c.first_name, c.last_name]
                        .filter(Boolean)
                        .join(" ") || "No name"}
                    </span>
                    {c.phone && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        {c.phone}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {!showQuick && (
            <Button
              variant="outline"
              onClick={() => setShowQuick(true)}
              className="w-full justify-start gap-2 border-dashed"
            >
              <Plus className="size-4" />
              Quick create customer
            </Button>
          )}

          {showQuick && (
            <form
              className="flex flex-col gap-3 rounded-lg border p-4 bg-muted/20"
              onSubmit={handleQuickCreate}
            >
              <Typography.Text className="text-sm font-medium">
                New Customer
              </Typography.Text>
              <Field data-invalid={!!form.formState.errors.first_name}>
                <FieldContent>
                  <Input
                    placeholder="e.g. Bat"
                    aria-invalid={!!form.formState.errors.first_name}
                    className="h-11"
                    {...inputProps("firstName")}
                    {...form.register("first_name")}
                    autoFocus
                  />
                  {form.formState.errors.first_name && (
                    <FieldError>
                      {form.formState.errors.first_name.message}
                    </FieldError>
                  )}
                </FieldContent>
              </Field>
              <Field>
                <FieldContent>
                  <Input
                    placeholder="e.g. Erdene"
                    className="h-11"
                    {...inputProps("lastName")}
                    {...form.register("last_name")}
                  />
                </FieldContent>
              </Field>
              <Field data-invalid={!!form.formState.errors.phone}>
                <FieldContent>
                  <Input
                    placeholder="e.g. 99112233"
                    type="tel"
                    className="h-11"
                    aria-invalid={!!form.formState.errors.phone}
                    {...inputProps("phone")}
                    {...form.register("phone", {
                      onChange: (e) => {
                        e.target.value = formatMongolianPhone(e.target.value);
                      },
                    })}
                  />
                  {form.formState.errors.phone && (
                    <FieldError>
                      {form.formState.errors.phone.message}
                    </FieldError>
                  )}
                </FieldContent>
              </Field>
              {createError?.includes("belongs to") ? (
                <div className="flex items-start gap-2 rounded-lg border border-amber-400 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-700 dark:bg-amber-950/20 dark:text-amber-300">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600" />
                  <span>{createError}</span>
                </div>
              ) : createError ? (
                <Typography.Text className="text-sm text-destructive">
                  {createError}
                </Typography.Text>
              ) : null}
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowQuick(false);
                    setCreateError(null);
                    form.reset();
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={
                    form.formState.isSubmitting ||
                    !form.watch("first_name").trim()
                  }
                >
                  {form.formState.isSubmitting
                    ? "Creating..."
                    : "Create & Select"}
                </Button>
              </div>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

### Success Criteria:

#### Automated Verification:
- [ ] Type check passes: `tsc --noEmit`
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

---

## Phase 3: Frontend — Wire into Drawer

### Overview

Update `DrawerHeaderSection` to accept new props, replace the "No customer data" span with a picker trigger, and wire the modal into `WorkOrderDetailDrawer`.

### Changes Required:

#### 1. Update DrawerHeaderSection props and template
**File**: `src/components/bay-view-v2/_drawer-header.tsx`
**Changes**: Add `showCustomerPicker`, `setShowCustomerPicker` props; replace the "No customer data" span with a "Select customer..." button trigger.

Add new props to the interface:
```typescript
  showCustomerPicker?: boolean;
  setShowCustomerPicker?: (v: boolean) => void;
```

Replace the "No customer data" block:
```tsx
          ) : wo ? (
            <div className="flex flex-col gap-1">
              <button
                type="button"
                onClick={() => setShowCustomerPicker?.(true)}
                className="flex items-center gap-2 text-xs text-muted-foreground italic hover:text-foreground transition-colors pl-1"
              >
                <User className="size-4 text-muted-foreground/75" />
                Select customer...
              </button>
            </div>
```

#### 2. Wire modal into WorkOrderDetailDrawer
**File**: `src/components/bay-view-v2/work-order-detail-drawer.tsx`
**Changes**: Add modal open state, import and render `CustomerPickerModal`, pass props to `DrawerHeaderSection`.

Add import:
```typescript
import { CustomerPickerModal } from "./_customer-picker-modal";
```

Add state alongside other state declarations:
```typescript
  const [showCustomerPicker, setShowCustomerPicker] = useState(false);
```

Pass props to DrawerHeaderSection:
```typescript
          showCustomerPicker={showCustomerPicker}
          setShowCustomerPicker={setShowCustomerPicker}
```

Render the modal (before the closing DrawerContent or after DrawerHeader):
```tsx
        {/* Customer picker modal */}
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

### Success Criteria:

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

---

## Testing Strategy

### Automated:
- TypeScript type checking (`tsc --noEmit`)
- Lint (`pnpm lint`)
- Plumb through existing test suite if applicable

### Manual Testing Steps:
1. Open a work order without a customer assigned
2. Verify "Select customer..." button appears instead of "No customer data"
3. Click button → modal opens
4. Search for a customer by name/phone
5. Select a customer → customer assigned, toast shown, header updates
6. Open a different work order with a customer → existing info still shows
7. Test quick-create: open modal, fill name + phone, create & select
8. Verify error state (network failure) shows error toast
9. Close and reopen drawer → customer assignment persists

## Performance Considerations

- Customer search API is already debounced in existing components (400ms)
- No new database queries — reusing existing endpoints
- Single customer assignment is a lightweight PATCH
- Modal renders only when opened (no upfront cost)

## Migration Notes

No schema migrations needed — `customer_id` already exists on the `work_orders` table. The API route just needs to expose it via PATCH.

## Developer Context

_Reserved for Step 4 review notes and mid-implementation findings._

## References

- Design: `.rpiv/artifacts/designs/2026-06-06_16-05-32_customer-picker-drawer-header.md`
- Related component: `src/components/work-orders/customer-select.tsx`
- Related component: `src/components/customers/quick-create-customer-sheet.tsx`
- Types: `src/lib/types/composite.ts`
- API: `src/app/api/organizations/[id]/work-orders/[workOrderId]/route.ts`
- Schema: `src/lib/validation/work-orders.ts`

## Plan Review (Step 4)

_Independent post-finalization review by artifact-code-reviewer and artifact-coverage-reviewer subagents. Findings triaged at Step 5._
