# Patterns and conventions

Active contributors: themuuln

This page documents the key patterns and conventions used throughout the Zer codebase.

## Server Components first

Pages are Server Components by default. Client Components (`"use client"`) are used only when interactivity is needed (event handlers, React hooks, browser APIs).

### Typical pattern

A page file (server component) fetches data and passes it to a client component:

```tsx
// src/app/(dashboard)/sales/page.tsx — Server Component
export default async function SalesPage() {
  const { supabase, organizationId } = await requireAppContext();
  const { data: sales } = await supabase
    .from("sales")
    .select("...")
    .eq("organization_id", organizationId);

  return <SalesContent sales={sales ?? []} />;
}
```

```tsx
// src/app/(dashboard)/sales/sales-content.tsx — Client Component
"use client";
export function SalesContent({ sales }: { sales: SaleRow[] }) {
  // Drawer state, event handlers, TanStack Query mutations
}
```

## Slide-in drawers for forms

All create, edit, and detail views use slide-in drawers (Base UI `Drawer`) instead of full-page routes. See the full documentation in [drawer-pattern in AGENTS.md](../../AGENTS.md).

### Pattern

- **List page** (server component) fetches data and renders a client component.
- **Client component** manages drawer state with `useState`.
- **Drawer component** uses the shared `SlideInDrawer` wrapper from `src/components/ui/slide-in-drawer.tsx`.
- **Full-page route** (`/sales/new`, etc.) redirects to the list page with `?create=true`, which auto-opens the drawer.

### SlideInDrawer props

```tsx
<SlideInDrawer
  open={open}
  onOpenChange={setOpen}
  title="Шинэ нэхэмжлэл"
  description="Optional description"
  trigger={<button>Шинэ ...</button>}
  panelWidth="28rem"
>
  {/* content */}
</SlideInDrawer>
```

## React Hook Form + Zod

All forms use `react-hook-form` with `zod` validation via `@hookform/resolvers/zod`.

### Standard pattern

```tsx
"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const schema = z.object({
  email: z.string().email("Зөв и-мэйл хаяг оруулна уу"),
});

type Values = z.infer<typeof schema>;

export function MyForm() {
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: Values) => {
    setServerError(null);
    const formData = new FormData();
    formData.append("email", data.email);
    const result = await serverAction(undefined, formData);
    if (result?.error) setServerError(result.error);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register("email")} />
      {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
      {serverError && <p className="text-sm text-destructive">{serverError}</p>}
      <button type="submit" disabled={isSubmitting}>Submit</button>
    </form>
  );
}
```

### Rules

1. Always use `onSubmit={handleSubmit(onSubmit)}` — never `form action={...}`.
2. Use `register()` for standard inputs.
3. Use `Controller` from react-hook-form for custom components (Combobox, Select).
4. Use `{ valueAsNumber: true }` in register for number inputs.
5. Server errors go in a `serverError` useState, not `useActionState`.
6. Error messages are in Mongolian.
7. Use `z.infer<typeof schema>` for type safety.

## Mongolian UI strings

All user-facing UI strings are in Mongolian (Cyrillic). This includes:

- Error messages in form validation
- Button labels, drawer titles, descriptions
- Table headers, filter labels
- Toast notifications

## Form ID linking

Drawers separate the submit button (in the drawer footer) from the form (in the drawer body). They connect via the HTML `form` attribute:

```tsx
// In drawer footer
<DrawerSubmit form="sale-form" label="Борлуулалт хадгалах" />

// In drawer body
<form id="sale-form" onSubmit={handleSubmit(onSubmit)}>
  {/* form fields */}
</form>
```

The `form="sale-form"` attribute on the submit button links it to the form with `id="sale-form"`, enabling submit-from-outside behavior.

## useFieldArray for line items

Forms with dynamic line items (sales, purchases, invoices, quotations, returns, bundles, journal entries) use `useFieldArray` from react-hook-form:

```tsx
import { useFieldArray } from "react-hook-form";

const { fields, append, remove } = useFieldArray({
  control,
  name: "items",
});

// Add a new line
append({ productId: "", quantity: 1, unitPrice: 0 });

// Remove a line
remove(index);
```

## Controller for Combobox

Custom Combobox components use react-hook-form's `Controller` to integrate with the form state:

```tsx
<Controller
  control={control}
  name="contactId"
  render={({ field }) => (
    <Combobox
      value={field.value}
      onChange={field.onChange}
      options={customers}
      placeholder="Харилцагч сонгох"
    />
  )}
/>
```

## ErrorBanner for server errors

The `ErrorBanner` component (`src/components/ui/error-banner.tsx`) displays dismissible error messages:

```tsx
<ErrorBanner error={serverError} />
```

Features:
- Accepts `string`, `Error`, or `null/undefined`.
- Optional `autoHide` prop for auto-dismiss after a timeout in ms.
- Dismissible via close button.
- Animated entry with fade-in and slide-down.

## ActionResult discriminated union

Server actions return a typed discriminated union defined in `src/lib/types.ts`:

```ts
type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };
```

Convenience constructors:

```ts
import { ok, err } from "@/lib/types";

// Success
return ok({ id: "abc" });

// Error
return err("Something went wrong");
```

Usage in client code:

```tsx
const result = await serverAction(formData);
if (result.success) {
  toast.success("Амжилттай");
} else {
  setServerError(result.error);
}
```

## TanStack Query for reads, Server Actions for writes

- **Reads (data fetching)** — Use TanStack React Query v5 with `useQuery` and `useSuspenseQuery`.
- **Writes (mutations)** — Use Server Actions (form submissions via `handleSubmit`) with TanStack Query's `useMutation` for optimistic updates.
- **Optimistic UI** — All mutations implement optimistic updates: `onMutate` → `onError` (rollback) → `onSettled` (refetch).

## Directory layout conventions

```
src/app/(dashboard)/{entity}/
├── page.tsx                  ← Server Component (fetches data)
├── {entity}-content.tsx      ← Client Component (manages state)
├── new/page.tsx              ← Redirect to ...?create=true
└── [id]/page.tsx             ← Standalone detail page

src/components/{entity}/
├── {entity}-create-drawer.tsx ← Create drawer
└── {entity}-detail-drawer.tsx ← Detail drawer
```
