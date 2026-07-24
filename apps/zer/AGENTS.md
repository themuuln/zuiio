<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

# Agent Instructions

## Required reading: @zuiio shared context (inside monorepo)

This project now lives inside the `@zuiio` monorepo at `apps/zer/`. Before coding, load these shared docs:

| File | What it covers |
|------|----------------|
| `../../docs/design.md` | OKLch color tokens, typography, spacing, motion, component conventions, voice & tone |
| `../../docs/vision.md` | Overall zuiio product vision and how we build |
| `../../docs/stack-web.md` | Next.js 16 stack, Instant Navigations, Turbopack config |
| `../../.claude/instructions.md` | Design essentials quick reference + common patterns |
| `../../AGENTS.md` | Monorepo project structure, package map, TypeScript conventions |

**Always read `VISION.md` first** — it is the single source of truth for project direction, architecture, goals, and principles. This file (AGENTS.md) covers operational rules and coding specifics. When in doubt, defer to VISION.md.

---

## @zuiio Shared Packages

**Zer shares 7 packages with Tolom via the `@zuiio` monorepo** (). Before writing any utility, hook, or export code, check if it already exists in `@zuiio`.

### Package Map

| Package | What's Inside | How to Import |
|---|---|---|
| `@zuiio/capture` | Unified error capture: `capture()`, `captureDbError()`, `withDbCapture()` — wraps Sentry + console.error, auto-captures Supabase query errors | `import { capture, withDbCapture } from "@zuiio/capture"` |
| `@zuiio/core` | UUID, errors (AppError hierarchy), timezone (UB), currency formatting, name helpers, array utils (groupBy, chunk, uniqueBy, sumBy, sortBy, mapTableData), date ranges, discount calc, rate limiter, **Mongolian domain validators** (phone/plate/VIN/year), form validation (flattenFieldErrors, ActionState), client/server image optimization, paginate, validation helpers | `import { cn, generateUUID, formatCurrency, ... } from "@zuiio/core"` |

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
| `src/lib/capture.ts` | `@zuiio/capture` — capture, captureDbError, captureRedirectLoop, withDbCapture, setCaptureHandler |
| `src/lib/supabase/query.ts` | `@zuiio/capture` — withDbCapture |

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
| `src/lib/dynamic-drawers.tsx` | Dynamic import wrappers for all drawer components — lazy-loads create/edit/detail drawers on list pages |
| `src/components/ui/optimized-image.tsx` | Smart image component with lazy loading (IntersectionObserver), Supabase storage transformation (?width&format=webp&quality=80), skeleton placeholder, aspect-ratio container |
| `src/components/ui/chart-skeleton.tsx` | Reusable chart loading skeleton for dynamically imported chart components (Card + animated pulse) |
| `src/components/reports/report-charts-dynamic.ts` | Barrel of 6 dynamically imported chart components (ExpenseDonutChart, ProductMarginChart, ProductRevenueChart, FinancialSummaryChart, PendingSalesChart, StockMovementChart) with lazy loading |

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
7. **Design First.** Before writing any new UI page or major component, lock design decisions first (see Design Workflow below).

---

## Design Workflow — Corridor Narrowing

Before coding any new UI, run through these 6 decisions. This prevents "AI slop" where everything looks generic.

### The 6-Round Lock

| Round | Decision | What to Lock |
|-------|----------|-------------|
| R1 | **Genre** | Overall visual direction |
| R2 | **Palette + Type** | Token selection from design.md |
| R3 | **Layout Grid** | Structural approach |
| R4 | **Components** | Which shadcn components, any custom |
| R5 | **Imagery** | Photos, icons, illustrations direction |
| R6 | **Slop Check** | Final guard against generic output |

### How to Apply

1. Read `docs/anti-slop.md` before any UI task
2. Read `docs/taste.md` for project-specific taste rules
3. Check `docs/references/` for relevant competitor/inspiration designs
4. Lock R1-R5 before coding
5. Run R6 after coding — check against banned patterns
6. Run `pnpm design:check` to catch automated issues

### Quick Reference

- Colors: ONLY from `globals.css` tokens (oklch format)
- Typography: Geist Sans (UI) + Instrument Serif (display)
- Icons: Phosphor (regular weight, fill for active)
- Layout: Asymmetric, not everything centered
- Loading: Skeleton, not spinner
- Spacing: 4px grid multiples
- Dark mode: Violet-tinted, not pure black

### Screenshot Feedback Loop

After building UI, verify visually — not just that it compiles, but that it looks right:

1. Take a screenshot of the new/changed page (use browser tools or `impeccable` skill)
2. Evaluate against taste.md — does it match encouraged patterns?
3. Run anti-slop checklist — check against banned patterns
4. Check hierarchy — squint test: is there one clear focal point?
5. Check dark mode — violet-tinted backgrounds, not pure black
6. Fix issues — if any banned pattern found, rewrite before shipping

Use `impeccable critique <page>` for structured design review, or manually screenshot + evaluate.

---

## Debugging

Zer has a multi-layer debugging system. Every error should be captured, never silently swallowed.

### How to capture errors

```ts
import { capture, captureDbError, withDbCapture } from "@zuiio/capture";

// Generic error capture (console.error + Sentry)
capture(error, { context: "Dashboard profile query" });

// Supabase query error with structured tags
captureDbError("missing_column", "getProfile", error);

// Auto-capture Supabase query errors (best — catches every path)
const { data, error } = await withDbCapture("getProfile",
  supabase.from("profiles").select("*").single()
);
```

**Every Supabase query should use `withDbCapture()`** — it's the only way to guarantee errors aren't silently swallowed when the caller only destructures `{ data }`.

### Where errors appear

| Source | When | How to check |
|--------|------|-------------|
| `pnpm dev` terminal | Immediately | Visible in the running terminal — look for `[capture]` |
| `.next/dev/logs/next-development.log` | Immediately | JSON log file in `.next/` |
| Next.js runtime diagnostics | On request | Query the runtime diagnostic endpoint |
| Sentry dashboard | Production | `sentry.io` — requires `NEXT_PUBLIC_SENTRY_DSN` in `.env.local` |
| Browser DevTools | Client-side errors | Console tab in browser |

### Redirect loop protection

The proxy middleware (`src/lib/supabase/proxy.ts`) detects repeated redirects and breaks the loop after 3 attempts within 30 seconds. This prevents the blank-screen-from-infinite-redirect bug.

### Org settings safety

`checkOrgSetting()` in `src/lib/org-settings.ts` returns `false` (feature denied) on query failure — a missing column will NOT silently enable every feature.

### Debugging checklist (run these first)

When investigating a bug:
1. Check the `pnpm dev` terminal for `[capture]` lines
2. Check `cat .next/dev/logs/next-development.log | grep "\[capture\]"`
3. Check Supabase logs
4. Check Supabase MCP logs (`mcp__supabase_get_logs`)
5. Open the browser and check console + network tab
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


### Checkout drawer (footer-driven submit)

The checkout drawer lifts the submit button into the `SlideInDrawer` footer:

```tsx
// CheckoutDrawer — manages footer state
const [formState, setFormState] = useState({ isFormValid: false, isPending: false, totalAmount: 0 });

<SlideInDrawer
  footer={
    <button type="submit" form="checkout-form"
      disabled={!formState.isFormValid || formState.isPending}
      className={cn(buttonVariants({ variant: "default", size: "lg" }), "h-14 w-full")}>
      {formState.isPending ? "..." : `Борлуулалт үүсгэх (${formState.totalAmount}₮)`}
    </button>
  }
>
  <CheckoutForm onStateChange={setFormState} ... />
</SlideInDrawer>
```

**Rules:**
1. Form gets `id="checkout-form"`; footer button uses `form="checkout-form"`
2. `onStateChange` reports `{ isFormValid, isPending, totalAmount }` from inside the form
3. Use `buttonVariants()` for consistent styling when not using `DrawerSubmit` directly
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
- **Verify at runtime** → use `next-dev-loop` skill (agent-browser) after every edit that changes behavior — confirm the page renders, no console errors, no new React warnings
- **Validate** → lint, type-check, test, self-review

### Guardrails

- Run `pnpm build` before considering any task complete — it gates type-check and Cache Components validation in one pass
- **After every edit that changes UI or behavior:** verify at runtime with `next-dev-loop` (see Pipeline above)
- Never merge with failing builds, tests, or type errors

### Autonomy Matrix

| Proceed autonomously | Ask first |
|---------------------|-----------|
| Bug fixes with clear root cause | Business logic changes (revenue, visibility) |
| UI adjustments (spacing, loading, tokens) | Schema migrations altering column semantics |
| Type improvements, test additions | Breaking API response shape changes |
| Documentation updates | New external dependencies |
| Adding RLS policies (follow existing patterns) | Auth or authorization changes |

---


## PPR Pattern (Cache Components)

Zer uses the PPR rendering pattern: components always render their outer structure and skeleton-load data values inline. Error states are inline banners, not page-replacing early returns.

Key files: `next.config.ts` has `cacheComponents: true`. `PageShell` accepts `loading`/`error`/`onRetry` props. `ErpDataTable` accepts `loading` prop with inline skeleton rows.

Rule: Never early-return for loading or error. Always render the full structure with inline skeleton/error states.
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

## 🚨 ENFORCED RULES (block `npm run lint`)

These rules are checked by `npm run lint` and **block CI**. Do not suppress or bypass them.

### Rule 1: Never `console.error` in catch blocks — use `capture()` instead

```ts
+ // ❌ BLOCKED by lint
catch (e) { console.error('Query failed:', e); }
.catch(console.error)

+ // ✅ Required
catch (e) { capture(e, { context: 'my_func' }); }
.catch((e) => capture(e, { context: 'my_func' }));
```

The script `scripts/capture-check.mjs` runs as part of `npm run lint` and scans every `.ts`/`.tsx` file. Any `console.error` preceded by `catch` within 3 lines is a violation. Use `capture()` from `@zuiio/capture`.

### Rule 2: Every Supabase query must use `withDbCapture()`

```ts
+ // ❌ Silent error swallowing
const { data } = await supabase.from('products').select('*');

+ // ✅ Required
const { data, error } = await withDbCapture('products_list',
  supabase.from('products').select('*')
);
```

### Rule 3: Server Actions use `ctx.supabase` from `requireActionContext()`, never `createClient()`

```ts
+ // ❌
const supabase = await createClient();

+ // ✅
const { supabase } = ctx;
```

### Rule 4: Never `as any` or `as never` — extend generated types

```ts
+ // ❌ BLOCKED (biome lint)
const db = ctx.supabase as any;

+ // ✅
const db: SupabaseClient<Database> = ctx.supabase;
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

### Migration Deployment

Every Supabase schema change **MUST** be applied to the remote project before the task is considered done:

1. After writing a migration file, apply it remotely via `mcp__supabase_execute_sql` (use `ADD COLUMN IF NOT EXISTS` / `CREATE TABLE IF NOT EXISTS` for idempotency)
2. Record the migration in `supabase_migrations.schema_migrations` so the local CLI stays in sync
3. Verify with `mcp__supabase_list_migrations` that the new migration appears in the applied list

If the Supabase MCP tools are unavailable or return auth errors, **stop and ask the user to re-authenticate** via `supabase login` + `supabase link --project-ref <ref>` before continuing. Do not skip remote deployment — unapplied migrations produce `[supabase] 400` errors with `column does not exist` (SQLCODE 42703) on every affected page load.
### Type Generation Auth

After every migration, types **MUST** be regenerated: `supabase gen types typescript --project-id <ref> > src/lib/database.types.ts`

If `supabase gen types` fails with a 403 or auth error, **stop immediately and ask the user to run `supabase login`** in their terminal. Do NOT attempt workarounds (manual type patching, MCP queries, type stubs). The CLI auth must be fixed first — a corrupted or missing types file breaks every `.from()` call at build time.

---

## Common Pitfalls

| Issue | Symptom | Fix |
|-------|---------|-----|
| **RLS blocking queries** | Empty results, no error | Add 4 RLS policies + `.eq('organization_id', orgId)` |
| Missing RLS on new table | Data leaks across orgs | Every new table needs SELECT, INSERT, UPDATE, DELETE policies |
| Types not regenerated | Frontend fields missing/wrong | Run `supabase gen types` after EVERY migration |
| Service role in client | Bypasses RLS accidentally | Use anon key in browser, service_role in server only |
| **Supabase error silently swallowed** | Null data, silent redirect | `capture()` or `withDbCapture()` every query — `console.error` + Sentry ensures errors never hide behind null checks |

---

## Sub-AGENTS.md Reference

| Layer | File |
|-------|------|
| Business logic | `src/lib/services/AGENTS.md` |
| Shared components | `src/components/AGENTS.md` |
| Feature modules | `src/app/(dashboard)/<module>/AGENTS.md` |

