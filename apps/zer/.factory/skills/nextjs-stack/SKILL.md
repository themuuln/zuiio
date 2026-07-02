---
name: nextjs-stack
description: >-
  All Next.js stack conventions for this project: form handling, UI patterns,
  query management, doc workflow, and available tools. Invoke when working on
  any Next.js feature. Not relevant for non-Next.js projects (Flutter, etc.).
---

# Next.js Stack — This Project's Conventions

Everything the agent needs to work in this Next.js project.

---

## 1. Next.js version notes

Read `node_modules/next/dist/docs/` before writing any code. This version has
breaking changes from training data — APIs, conventions, and file structures
may differ. Heed deprecation notices.

---

## 2. Form handling: react-hook-form + zod

All forms use **react-hook-form** + **zod** for validation.

### Standard pattern

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

### Rules

1. `onSubmit={handleSubmit(onSubmit)}` — never `form action={...}`
2. `register()` for standard inputs (text, number, email, date)
3. `Controller` from react-hook-form for custom components (Combobox, Select)
4. `{ valueAsNumber: true }` in register for number inputs
5. Server errors go in `serverError` useState, not useActionState
6. `z.infer<typeof schema>` for types
7. Error messages are in Mongolian

### Available form components

- **shadcn Form**: `Form`, `FormField`, `FormItem`, `FormLabel`, `FormControl`, `FormMessage` at `src/components/ui/form.tsx`
- **Simple pattern** (preferred): direct `register`/`handleSubmit`/`errors`

### For useMutation forms (TanStack Query)

Keep `useMutation` for submission, add `useForm` + `zod` on top for form state, validation, and Enter key support. Build FormData from validated values in onSubmit.

---

## 3. UI: slide-in drawers

All **create**, **edit**, and **detail** views use slide-in drawers (`@base-ui/react/drawer`) via the shared `SlideInDrawer` wrapper at `@/components/ui/slide-in-drawer`.

```tsx
import { SlideInDrawer } from "@/components/ui/slide-in-drawer";

<SlideInDrawer
  open={open}
  onOpenChange={setOpen}
  title="Шинэ нэхэмжлэл"
  description="Optional description"
  trigger={...}
>
  {/* drawer content */}
</SlideInDrawer>
```

Props: `open`, `onOpenChange`, `title`, `description` (optional), `trigger` (optional), `panelWidth` (default `"28rem"`).

### Structure

```
src/components/{entity}/
├── {entity}-create-drawer.tsx
├── {entity}-detail-drawer.tsx
└── {entity}-edit-drawer.tsx (optional)

src/app/(dashboard)/{entity}/
├── page.tsx              ← server component (fetches data)
├── {entity}-content.tsx  ← client (manages drawer state)
├── new/page.tsx          ← redirect to /{entity}?create=true
└── [id]/page.tsx         ← standalone detail page
```

### Key details

- Create drawer: `Drawer.Root` with `Drawer.Trigger` as the "Шинэ ..." button
- Detail drawer: controlled via `selectedId` + `onClose` props
- Redirect: `/new` route uses `redirect("/page?create=true")`; client reads `useSearchParams()` and auto-opens
- Combobox inside drawer: use `ComboboxCreate` for creating items inline

---

## 4. Documentation workflow

Docs live in `docs/` (VitePress). The agent writes them, not auto-generated changelogs.

### Commands

```bash
# Check what changed since last sync
./scripts/documentize.sh sync

# Read commits since last doc update
git log $(jq -r '.lastCodeSyncCommit' .documentizer/sync.json)..HEAD --oneline

# Stamp after writing docs
./scripts/documentize.sh sync --commit
```

### Enforcement

CI (`.github/workflows/docs.yml`) runs on every PR to `main` — fails if `sync --check` doesn't pass.

---

## 5. Available tools

This project has these project-specific agents and skills:

| Tool                                | Location                                         | Purpose                                      |
| ----------------------------------- | ------------------------------------------------ | -------------------------------------------- |
| `/react-grab`                       | `.factory/skills/react-grab/`                    | Browser UI element grabbing loop             |
| `playwright-test-agent` droid       | `.factory/droids/playwright-test-agent.md`       | Playwright E2E test planner/generator/healer |
| `user-testing-flow-validator` droid | `.factory/droids/user-testing-flow-validator.md` | Flow validation for user testing             |

---

## 6. Research docs

Project-specific research is in `.factory/research/`:

- `react-query-research.md` — TanStack Query v5 patterns
- `supabase-realtime-research.md` — Realtime + React Query integration
- `mutation-patterns.md` — Server action mutation inventory
