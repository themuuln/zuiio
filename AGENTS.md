<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

# Agent Instructions

**Always read `VISION.md` first** — it is the single source of truth for project direction, architecture, goals, and principles. This file (AGENTS.md) covers operational rules and coding specifics. When in doubt, defer to VISION.md.

---

## @zuiio Shared Packages

**Zer shares 7 packages with Tolom via the `@zuiio` monorepo** (`/Users/themuuln/coding/personal/zuiio/`). Before writing any utility, hook, or export code, check if it already exists in `@zuiio`.

### Package Map

| Package | What's Inside | How to Import |
|---------|---------------|---------------|
| `@zuiio/core` | UUID, errors (AppError hierarchy), timezone (UB), currency formatting, name helpers, array utils, date ranges, discount calc, rate limiter, **Mongolian domain validators** (phone/plate/VIN/year), form validation (flattenFieldErrors, ActionState), paginate, validation helpers | `import { cn, generateUUID, formatCurrency, ... } from "@zuiio/core"` |
| `@zuiio/hooks` | useDebounce, useDisclosure, useCopyToClipboard, useIntersectionObserver, useLocalStorage, useOnlineStatus, useTableFilters, useFuzzySearch | `import { useDebounce, ... } from "@zuiio/hooks"` |
| `@zuiio/query` | React Query provider, useOptimisticCreate/Update/Delete (FormData + JSON variants) | `import { useOptimisticCreate, ... } from "@zuiio/query"` |
| `@zuiio/realtime` | useRealtime (single table), useRealtimeMulti (multi-table on one WebSocket channel) — accepts supabase client as param. Zer's `useRealtimeSubscriptions` wraps `useRealtimeMulti` | `import { useRealtimeMulti, ... } from "@zuiio/realtime"` |
| `@zuiio/hr` | Mongolian payroll: income tax, social insurance, overtime, salary calc, validation (extracted from Zer's hr-core). Zer's `hr-core` is now a re-export barrel | `import { calculateSalary, ... } from "@zuiio/hr"` |
| `@zuiio/export` | toCsv, toXlsx, toXlsxMultiSheet, toDocx, toDocxMultiSection, toPdfAsync, toPdfMultiSectionAsync, serveEntityExport. Zer's `lib/export/` and `lib/csv.ts` are now re-export barrels | `import { toCsv, serveEntityExport, ... } from "@zuiio/export"` |
| `@zuiio/offline` | Mutation queue engine, IndexedDB persister, useOfflineMutation | `import { MutationQueueProvider, ... } from "@zuiio/offline"` |

### Zer Barrel Files (re-export from @zuiio)

These files are thin wrappers that re-export from `@zuiio`. **Do not put new code here** — add new code to `@zuiio` or add it as Zer-specific below the re-exports.

| File | Re-exports From |
|------|----------------|
| `src/lib/utils.ts` | `@zuiio/core` — cn |
| `src/lib/validation.ts` | `@zuiio/core` — escapeHtml, getString, normalizePhone, requireEmail, requirePassword, sanitizeRedirectPath |
| `src/lib/format.ts` | `@zuiio/core` — formatCurrency, formatDate, formatRouteDate, slugify |
| `src/lib/types.ts` | `@zuiio/core` — ActionResult, CartItemData, CustomerOption, FormState, LineItem, ProductOption, SaleItemData, SupplierOption, ok, err |
| `src/lib/rate-limit.ts` | `@zuiio/core` — rateLimit, resetRateLimit, clearAllRateLimits |
| `src/lib/compress-image.ts` | `@zuiio/core` — compressImage |
| `src/lib/discount-utils.ts` | `@zuiio/core` — calculateDiscount, DiscountCondition, DiscountParams, DiscountResult |
| `src/lib/csv.ts` | `@zuiio/export` — toCsv |
| `src/lib/export/index.ts` | `@zuiio/export` — toCsv, toXlsx, toXlsxMultiSheet, toDocx, toDocxMultiSection, toPdfAsync, toPdfMultiSectionAsync, serveEntityExport, formatExtensions, formatMimeTypes, types |
| `packages/hr-core/src/index.ts` | `@zuiio/hr` — full hr package re-export |
| `packages/hr-supabase/src/index.ts` | Adapter layer over `@zuiio/hr` (Zer-specific Supabase queries) — NOT a barrel |
| `src/lib/query/use-optimistic.ts` | `@zuiio/query` — useOptimisticCreate/Update/Delete |
| `src/lib/query/provider.tsx` | `@zuiio/query` — QueryProvider |
| `src/lib/query/hooks/use-realtime-subscriptions.ts` | `@zuiio/realtime` — wraps useRealtimeMulti with Zer-specific Supabase client and sales→inventory cross-invalidation |

### Zer-Specific Code (NOT in @zuiio)

These files contain domain logic specific to Zer and should **never** be moved to `@zuiio`:

| File | Why Zer-Specific |
|------|-----------------|
| `src/lib/accounting-utils.ts` / `accounting.ts` | Zer's accounting schema and calculation logic |
| `src/lib/action-utils.ts` | FormData-to-create-params mapper (Zer's Server Action pattern) |
| `src/lib/audit.ts` | Zer's audit log schema |
| `src/lib/branches.ts` / `branch-context.tsx` | Zer's branch management |
| `src/lib/branding.ts` | Zer's white-label branding config |
| `src/lib/commissions.ts` | Zer's commission structure |
| `src/lib/constants.ts` | Zer-specific business constants |
| `src/lib/contact-utils.ts` | Zer's contact formatting |
| `src/lib/domain-rules.ts` | Zer-specific business validation (separate from @zuiio/core's generic Mongolian validators) |
| `src/lib/email.ts` | Zer's email templates |
| `src/lib/erp.ts` | Zer's `requireAppContext` server auth helper |
| `src/lib/invoicing.ts` | Zer's invoice logic |
| `src/lib/navigation.ts` | Zer's sidebar nav config |
| `src/lib/notification.ts` | Zer's notification system |
| `src/lib/org-settings.ts` / `org-settings-context.tsx` | Zer's org settings |
| `src/lib/permissions.ts` | Zer's permission system |
| `src/lib/reports.ts` | Zer's reporting engine |
| `src/lib/revalidate.ts` | Zer's cache revalidation strategy |
| `src/lib/shop-cart.ts` | Zer's POS cart state |
| `src/lib/stock-utils.ts` | Zer's inventory management |
| `src/lib/superadmin.ts` | Zer's superadmin utilities |
| `src/lib/use-variant-line-items.ts` | Zer's variant line-item hook |

### Adding New Code

1. **Is it reusable by Tolom too?** → Add it to the appropriate `@zuiio` package
2. **Is it specific to Zer?** → Add it to `src/lib/` as a new file
3. **Are you unsure?** → Start in Zer; extract to `@zuiio` later if/when Tolom needs it

---

## Core Rules

1. **Follow VISION.md.** Architecture, design principles, goals, and constraints live there. This file never overrides it.
2. **Server Actions + FormData.** Zer uses Next.js Server Actions with FormData (not JSON API routes like Tolom). Every mutation is a server action.
3. **Multi-tenancy.** Every table has `organization_id`. Every query is RLS-scoped. Never bypass.
4. **Optimistic by default.** All mutations use `useOptimisticCreate`/`useOptimisticUpdate`/`useOptimisticDelete` from `@zuiio/query`.
5. **Use drawers for create/edit/detail.** Use `SlideInDrawer` / `DrawerLayout` for all side panels.
6. **Test coverage.** Every action, route, and RLS policy has tests.

---

## Forms

All forms use **react-hook-form** + **zod** + **Server Actions**:

```tsx
"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const schema = z.object({ name: z.string().min(1, "Нэр шаардлагатай") });
type Values = z.infer<typeof schema>;

export default function MyForm() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Values>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: Values) => {
    const formData = new FormData();
    formData.append("name", data.name);
    const result = await serverAction(undefined, formData);
    if (result?.error) throw new Error(result.error);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register("name")} />
      {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
      <button type="submit" disabled={isSubmitting}>Хадгалах</button>
    </form>
  );
}
```

**Rules:**
1. Always `onSubmit={handleSubmit(onSubmit)}` — never `form action={...}`
2. Use `register()` for standard inputs, `Controller` for custom components (Combobox, Select)
3. Server errors go in `serverError` useState or `ErrorBanner` component
4. Combine `mutation.isPending` with `isSubmitting` on submit buttons
5. Error messages in Mongolian

---

## Drawers

All create/edit/detail views use slide-in drawers. Use `SlideInDrawer` / `DrawerLayout` from `@/components/ui/`.

### Standard drawer

```tsx
import { SlideInDrawer } from "@/components/ui/slide-in-drawer";
import { DrawerCancel, DrawerFooter, DrawerSubmit } from "@/components/ui/drawer-footer";

<SlideInDrawer open={open} onOpenChange={setOpen} title="Шинэ ..." trigger={<Button>Шинэ ...</Button>}
  footer={<DrawerFooter><DrawerCancel onClick={() => setOpen(false)} /><DrawerSubmit form="my-form" label="Хадгалах" /></DrawerFooter>}>
  <form id="my-form" onSubmit={handleSubmit(onSubmit)}>...</form>
</SlideInDrawer>
```

### Nested drawers

Use `NestedDrawerPanel` from `@/components/ui/nested-drawer-panel` for drawers inside drawers (e.g., variant manager inside product create).

---

## Optimistic Mutations

All CRUD uses `useOptimisticCreate`/`useOptimisticUpdate`/`useOptimisticDelete` from `@zuiio/query`.

```tsx
import { useOptimisticCreate } from "@zuiio/query";
import { entityKeys } from "@/lib/query/keys";

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
  }),
});

// In onSubmit:
mutation.mutate(formData, { onSuccess: () => { setOpen(false); reset(); toast.success("Амжилттай."); } });
```

**Already migrated entities** (DO NOT revert): Products, Categories, Customers, Suppliers, Bundles, Invoices, Discounts, Quotations, Returns, Purchase Orders, Accounts, Journal Entries.

---

## Workflow & Autonomy

### Pipeline

- **Research** → understand the codebase area, existing patterns, dependencies
- **Plan** → break into phases with clear success criteria
- **Implement** → phase by phase, verify each before moving on
- **Validate** → lint, type-check, test, self-review

### Guardrails

- Run `pnpm typecheck && pnpm test` before considering any task complete
- Never merge with failing tests or type errors
- One module at a time
- Atomic commits

### Autonomy Matrix

| Proceed autonomously | Ask first |
|---------------------|-----------|
| Bug fixes with clear root cause | Business logic changes (revenue, visibility) |
| UI adjustments (spacing, loading, tokens) | Schema migrations altering column semantics |
| Type improvements, test additions | Breaking API response shape changes |
| Documentation updates | New external dependencies |
| Adding RLS policies (follow existing patterns) | Auth or authorization changes |

---

## Tools & Commands

```bash
# Development
pnpm dev                      # Dev server (Turbopack)
pnpm build                    # Production build

# Validation
pnpm typecheck                # tsc --noEmit
pnpm validate                 # Full validation
pnpm test                     # Run tests
pnpm lint                     # Biome lint

# Supabase
supabase start                # Local Supabase stack
supabase migration new <name> # Create migration file
supabase gen types typescript --linked > src/lib/database.types.ts  # Regen types
```

---

## Coding Standards

| Element | Convention | Example |
|---------|-----------|---------|
| Files/directories | kebab-case | `invoice-create-drawer.tsx` |
| Components | PascalCase | `InvoiceCreateDrawer` |
| Hooks | `use` prefix | `useInvoiceData` |
| Database tables | snake_case | `invoices`, `organization_id` |
| Server Actions | camelCase verb-noun | `createInvoice` |
| Import types | From `@zuiio/core` or local `types.ts` | Never from auto-generated `database.types.ts` |

---

## Supabase Integration Rules

### RLS Policy Checklist

Every new table **MUST** have all 4 policies:

```sql
ALTER TABLE my_table ENABLE ROW LEVEL SECURITY;
CREATE POLICY "my_table_select" ON my_table FOR SELECT USING (organization_id = get_user_organization_id());
CREATE POLICY "my_table_insert" ON my_table FOR INSERT WITH CHECK (organization_id = get_user_organization_id());
CREATE POLICY "my_table_update" ON my_table FOR UPDATE USING (organization_id = get_user_organization_id()) WITH CHECK (organization_id = get_user_organization_id());
CREATE POLICY "my_table_delete" ON my_table FOR DELETE USING (organization_id = get_user_organization_id());
```

### Service Query Checklist

| Clause | Purpose |
|--------|---------|
| `.eq('organization_id', orgId)` | Multi-tenancy scope |
| `.is('deleted_at', null)` | Soft delete filter |
| `.select('col1, col2, ...')` | Explicit columns — never `select('*')` |

### Auth & Keys

- **Client-side**: `anon` key only (respects RLS)
- **Server-side**: `service_role` key only (bypasses RLS)
- **Never** mix keys

---

## Common Pitfalls

| Issue | Symptom | Fix |
|-------|---------|-----|
| **RLS blocking queries** | Empty results, no error | Add 4 RLS policies + `.eq('organization_id', orgId)` |
| Missing RLS on new table | Data leaks across orgs | Every new table needs SELECT, INSERT, UPDATE, DELETE policies |
| Types not regenerated | Frontend fields missing/wrong | Run `supabase gen types` after EVERY migration |
| Service role in client | Bypasses RLS accidentally | Use anon key in browser, service_role in server only |

---

## Sub-AGENTS.md Reference

| Layer | File |
|-------|------|
| Business logic | `src/lib/services/AGENTS.md` |
| Shared components | `src/components/AGENTS.md` |
| Feature modules | `src/app/(dashboard)/<module>/AGENTS.md` |
