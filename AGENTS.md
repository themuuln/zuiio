<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

<!-- BEGIN:form-packages -->

# Form handling: react-hook-form + zod

All forms in this project use **react-hook-form** + **zod** for validation.

## Standard pattern

```tsx
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const schema = z.object({
  email: z.string().email("Зөв и-мэйл хаяг оруулна уу"),
  password: z.string().min(1, "Нууц үг шаардлагатай"),
});

type Values = z.infer<typeof schema>;

export default function MyForm() {
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setValue,
    control,
  } = useForm<Values>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: Values) => {
    setServerError(null);
    const formData = new FormData();
    formData.append("field", data.field);
    const result = await serverAction(undefined, formData);
    if (result?.error) setServerError(result.error);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register("field")} />
      {errors.field && (
        <p className="text-xs text-destructive">{errors.field.message}</p>
      )}
      {serverError && <p className="text-sm text-destructive">{serverError}</p>}
      <button type="submit" disabled={isSubmitting}>
        Submit
      </button>
    </form>
  );
}
```

## Rules

1. Always use `onSubmit={handleSubmit(onSubmit)}` — never `form action={...}`
2. Use `register()` for standard inputs (text, number, email, date)
3. Use `Controller` from react-hook-form for custom components (Combobox, Select)
4. Use `{ valueAsNumber: true }` in register for number inputs
5. Server errors go in a `serverError` useState, not useActionState
6. Use `z.infer<typeof schema>` for type safety
7. Error messages are in Mongolian

## Available form components

- **shadcn Form**: `Form`, `FormField`, `FormItem`, `FormLabel`, `FormControl`, `FormMessage` at `src/components/ui/form.tsx`
- **Simple pattern** (preferred for most forms): direct `register`/`handleSubmit`/`errors` — see `src/app/login/page.tsx`

## For useMutation forms (TanStack Query)

Keep the existing `useMutation` for submission, but add `useForm` + `zod` on top for form state, validation, and Enter key support. Build FormData from validated values in onSubmit.

<!-- END:form-packages -->

<!-- BEGIN:drawer-pattern -->

# Create/Edit/Detail: Use Slide-in Drawers, Not Full Pages

All **create**, **edit**, and **detail** views must use slide-in drawers (`@base-ui/react/drawer`) instead of full-page routes.

## Pattern

- The **list page** (server component) fetches data and renders a client component
- The **client component** manages drawer state (`selectedInvoiceId`, `createOpen`) with `useState`
- **Drawer component** receives data as props and uses the shared `SlideInDrawer` wrapper
- The **full-page route** (`/invoices/new`, `/sales/new`, etc.) redirects to the list page with `?create=true` search param, which auto-opens the drawer

## Use the Shared `SlideInDrawer` Wrapper

All drawers must use `SlideInDrawer` from `@/components/ui/slide-in-drawer` instead of manually writing Base UI Drawer boilerplate. This eliminates 15+ lines of duplicated class strings per file.

### Standard drawer

```tsx
import { SlideInDrawer } from "@/components/ui/slide-in-drawer";
import {
  DrawerCancel,
  DrawerFooter,
  DrawerSubmit,
} from "@/components/ui/drawer-footer";

<SlideInDrawer
  open={open}
  onOpenChange={setOpen}
  title="Шинэ нэхэмжлэл"
  description="Optional description"
  trigger={
    <button type="button" className={buttonVariants({ variant: "default" })}>
      <Plus className="size-4" />
      Шинэ ...
    </button>
  }
  footer={
    <DrawerFooter>
      <DrawerCancel onClick={() => setOpen(false)} />
      <DrawerSubmit form="my-form" label="Хадгалах" />
    </DrawerFooter>
  }
>
  {/* drawer content — scrollable body */}
</SlideInDrawer>;
```

Props: `open`, `onOpenChange`, `title`, `description` (optional), `trigger` (optional), `panelWidth` (optional, default `"28rem"`), `footer` (optional).

### When using `DrawerLayout` directly

Pass `title`, `description`, and `footer` as props for the full-width header/footer treatment:

```tsx
<DrawerLayout
  open={open}
  onOpenChange={setOpen}
  title="Шинэ бүтээгдэхүүн"
  description="Description"
  footer={
    <DrawerFooter>
      <DrawerCancel onClick={() => setOpen(false)} />
      <DrawerSubmit form="my-form" />
    </DrawerFooter>
  }
>
  {/* scrollable content */}
</DrawerLayout>
```

**Never** render `DrawerHeader` or `DrawerFooter` inside children when using these props — the header/footer are rendered as full-width `bg-card` strips with `border-b`/`border-t` outside the scrollable area.

### Nested drawer panels

For drawers that open inside another drawer (e.g., variant manager inside product create), use `NestedDrawerPanel` instead of a separate portal-based drawer. This keeps the parent drawer visible and creates a true nested feel.

```tsx
import { NestedDrawerPanel } from "@/components/ui/nested-drawer-panel";

// In parent drawer content, with `relative` on the scroll container:
<div className="relative">
  <button onClick={() => setNestedOpen(true)}>Open nested</button>
  <NestedDrawerPanel
    open={nestedOpen}
    onClose={() => setNestedOpen(false)}
    title="Nested panel title"
    parentTitle="Parent drawer title"
    footer={<DrawerFooter>...</DrawerFooter>}
  >
    {/* nested panel content */}
  </NestedDrawerPanel>
</div>;
```

## Reference Structure

- The **list page** (server component) fetches data and renders a client component
- The **client component** manages drawer state (`selectedInvoiceId`, `createOpen`) with `useState`
- **Drawer component** receives data as props and uses `Drawer.Root` for the slide-in panel
- The **full-page route** (`/invoices/new`, `/sales/new`, etc.) redirects to the list page with `?create=true` search param, which auto-opens the drawer

## Reference Structure

```
src/components/{entity}/
├── invoice-create-drawer.tsx   ← Drawer.Root wrapping the create form
└── invoice-detail-drawer.tsx   ← Drawer.Root wrapping the detail view

src/app/(dashboard)/invoices/
├── page.tsx                    ← Server component (fetches data)
├── invoices-content.tsx        ← Client component (manages drawer state)
├── new/page.tsx                ← Redirect to /invoices?create=true
└── [id]/page.tsx               ← Standalone detail page (for direct links)
```

## Key Implementation Details

1. **Create drawer** is a `<Drawer.Root>` with `<Drawer.Trigger>` as the "Шинэ ..." button in the list page's `actions` slot
2. **Detail drawer** is controlled: list page passes `selectedId` + `onClose` — opens when an ID is set, closes on `null`
3. **Drawer classes** use the exact same Base UI classes as `product-create-drawer.tsx` for consistent styling
4. **Server-to-client**: server component fetches data, client component receives it as props — no `"use client"` in the page file
5. **Redirect**: the `/new` route uses `redirect("/page?create=true")`; the client component reads `useSearchParams()` and auto-opens the drawer, then cleans the URL with `history.replaceState`
6. **Create drawer** supports controlled `open`/`onOpenChange` props for the `?create=true` flow
7. **Combobox** dropdowns use `ComboboxCreate` for creating new items inline (e.g., creating a contact while creating an invoice)
<!-- END:drawer-pattern -->

<!-- BEGIN:crud-optimistic-mutations -->

# CRUD mutations: ALWAYS use `useOptimisticCreate`/`useOptimisticUpdate`/`useOptimisticDelete`

All create, update, and delete mutations in drawer forms MUST use the TanStack Query optimistic hooks from `src/lib/query/use-optimistic.ts`. This ensures instant UI feedback, automatic cache rollback on errors, and proper cache invalidation.

## Rules

1. **NEVER use raw server action calls** (`await createX(undefined, formData)`) directly in event handlers. Always wrap them in a `useOptimisticCreate`/`useOptimisticUpdate`/`useOptimisticDelete` hook.
2. **ALWAYS register a query key** for every entity in `src/lib/query/keys.ts` (see existing `productKeys`, `bundleKeys`, `invoiceKeys`, etc.).
3. **Use `useOptimisticCreate`** for create drawers. Provide `buildOptimistic(formData)` to construct the fake item that appears instantly in the list.
4. **Use `useOptimisticUpdate`** for edit drawers. Provide `getId(formData)` and `buildOptimistic(formData)` to merge partial updates into the cached item.
5. **Use `useOptimisticDelete`** for delete confirmations. Provide `getId(formData)` to remove the item from the cache.
6. **Use `mutation.mutate(formData, { onSuccess: ... })`** to handle success (close drawer, reset form, toast). Error recovery (toast + cache rollback) is handled automatically by the hook.
7. **Use `<ErrorBanner error={mutation.error} />`** instead of manual `serverError` state.
8. **Combine `mutation.isPending` with `isSubmitting`** on `DrawerSubmit`: `isPending={isSubmitting || mutation.isPending}`.
9. **For non-CRUD actions** (share link generation, status transitions, item receiving) that don't create/update/delete list items, use raw `useMutation` from `@tanstack/react-query` with `queryClient.invalidateQueries` in `onSettled` — but DO NOT bypass the pattern for standard CRUD.

## Standard create drawer pattern

```tsx
// Import the hook and query keys
import { useOptimisticCreate } from "@/lib/query/use-optimistic";
import { entityKeys } from "@/lib/query/keys";

// Inside the component function, before useForm:
const mutation = useOptimisticCreate({
  mutationFn: async (formData: FormData) => {
    const result = await createEntity(undefined, formData);
    if (result?.error) throw new Error(result.error);
    return result;
  },
  queryKey: entityKeys.all,
  buildOptimistic: (formData) => ({
    id: `opt-${Date.now()}`,
    name: formData.get("name")?.toString() ?? "",
    // ... other fields matching the list query return type
    created_at: new Date().toISOString(),
  }),
});

// onSubmit: use mutation.mutate instead of await + setServerError
const onSubmit = (data: FormValues) => {
  if (mutation.isPending) return;
  const formData = new FormData();
  // ... build formData
  mutation.mutate(formData, {
    onSuccess: () => {
      setOpen(false);
      reset();
      toast.success("Амжилттай үүсгэгдлээ.");
    },
  });
};

// ErrorBanner uses mutation.error directly
<ErrorBanner error={mutation.error} />

// DrawerSubmit combines isSubmitting with mutation.isPending
<DrawerSubmit isPending={isSubmitting || mutation.isPending} />
```

## Standard edit drawer pattern

```tsx
import { useOptimisticUpdate } from "@/lib/query/use-optimistic";

const mutation = useOptimisticUpdate({
  mutationFn: async (formData: FormData) => {
    const result = await updateEntity(undefined, formData);
    if (result?.error) throw new Error(result.error);
    return result;
  },
  queryKey: entityKeys.all,
  getId: (formData) => formData.get("id")?.toString() ?? "",
  buildOptimistic: (formData) => ({
    name: formData.get("name")?.toString() ?? "",
    // ... fields that changed
  }),
});
```

## Standard delete pattern

```tsx
import { useOptimisticDelete } from "@/lib/query/use-optimistic";

const mutation = useOptimisticDelete({
  mutationFn: async (formData: FormData) => {
    const result = await deleteEntity(undefined, formData);
    if (result?.error) throw new Error(result.error);
    return result;
  },
  queryKey: entityKeys.all,
  getId: (formData) => formData.get("id")?.toString() ?? "",
});
```

## Already migrated entities (DO NOT revert to raw pattern)

- Products (create/edit/delete)
- Categories (create/edit/delete)
- Customers (create/edit)
- Suppliers (create/edit)
- Bundles (create/edit)
- Invoices (create)
- Discounts (create)
- Quotations (create)
- Returns (create)
- Purchase orders (create)
- Accounts (create)
- Journal entries (create/edit)

<!-- END:crud-optimistic-mutations -->

<!-- BEGIN:detail-drawer-patterns -->

# Detail drawers: Use reusable abstractions

All detail drawers and table action columns MUST use the shared components from `src/components/ui/`.

## Available reusable components

### `DetailDrawerShell` (for detail views)

Wraps `DrawerLayout` with standardized action buttons (Edit/Delete) and optional status badge.

```tsx
import { DetailDrawerShell } from "@/components/ui/detail-drawer-shell";

const STATUS_MAP = {
  pending: { label: "Хүлээгдэж буй", variant: "secondary" },
  paid: { label: "Төлөгдсөн", variant: "default" },
};

<DetailDrawerShell
  open={open}
  onOpenChange={setOpen}
  title={entity.name}
  description="Дэлгэрэнгүй мэдээлэл"
  status={{ value: entity.status, mapping: STATUS_MAP }}
  onEdit={() => setEditOpen(true)}
  onDelete={() => handleDelete(entity.id)}
  isDeletePending={isDeleting}
  footer={<DrawerFooter>...</DrawerFooter>}
>
  {/* info rows, tables, etc. */}
</DetailDrawerShell>;
```

### `TableActionsCell` (for table action columns)

Standardizes the 3-icon action column (View/Eye, Edit/Pencil, Delete/Trash) in data tables.

```tsx
import { TableActionsCell } from "@/components/ui/table-actions-cell";

{
  id: "actions",
  header: "",
  cell: ({ row }) => (
    <TableActionsCell
      onView={() => setSelected(row.original)}
      onEdit={() => setEditItem(row.original)}
      onDelete={() => handleDelete(row.original.id, row.original.name)}
      isDeletePending={deletingId === row.original.id}
    />
  ),
  enableSorting: false,
  enableHiding: false,
}
```

### `StatusBadge` (for status display)

Renders a consistent status badge with label and color variant.

```tsx
import { StatusBadge } from "@/components/ui/status-badge";

const STATUS_MAP = {
  active: { label: "Идэвхтэй", variant: "default" },
  inactive: { label: "Идэвхгүй", variant: "secondary" },
};

<StatusBadge value={status} mapping={STATUS_MAP} />;
```

### `useDeleteWithConfirm` (for delete mutations)

Standardizes confirm dialog → mutate → toast → cache invalidation.

```tsx
import { useDeleteWithConfirm } from "@/hooks/use-delete-with-confirm";

const { handleDelete, isPending } = useDeleteWithConfirm({
  mutationFn: (id) => deleteEntity(id),
  queryKey: entityKeys.all(),
  entityName: "Бүтээгдэхүүн",
});

// In table action cell:
<TableActionsCell onDelete={() => handleDelete(item.id, item.name)} />;
```

### `InfoRow` (for key-value display in detail drawers)

Already exists at `src/components/ui/info-row.tsx`. Use it consistently instead of manual divs.

<!-- END:detail-drawer-patterns -->
