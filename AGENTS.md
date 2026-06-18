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

```tsx
import { SlideInDrawer } from "@/components/ui/slide-in-drawer";

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
>
  {/* drawer content — form, detail view, etc. */}
</SlideInDrawer>;
```

Props: `open`, `onOpenChange`, `title`, `description` (optional), `trigger` (optional, for create drawers), `panelWidth` (optional, default `"28rem"`).

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
