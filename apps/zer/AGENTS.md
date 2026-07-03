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

**Zer shares 7 packages with Tolom via the `@zuiio` monorepo** (`/Users/themuuln/coding/personal/zuiio/`). Before writing any utility, hook, or export code, check if it already exists in `@zuiio`.

### Package Map

| Package | What's Inside | How to Import |
|---|---|---|
| `@zuiio/capture` | Unified error capture: `capture()`, `captureDbError()`, `withDbCapture()` — wraps Sentry + console.error, auto-captures Supabase query errors | `import { capture, withDbCapture } from "@zuiio/capture"` |
| `@zuiio/core` | UUID, errors (AppError hierarchy), timezone (UB), currency formatting, name helpers, array utils, date ranges, discount calc, rate limiter, **Mongolian domain validators** (phone/plate/VIN/year), form validation (flattenFieldErrors, ActionState), paginate, validation helpers | `import { cn, generateUUID, formatCurrency, ... } from "@zuiio/core"` |

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
| Next.js MCP (`/_next/mcp`) | On request | Query the runtime diagnostic endpoint |
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
3. Query `/api/debug/health` if it exists
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
- **Verify at runtime** → use `next-dev-loop` skill (agent-browser + `/_next/mcp`) after every edit that changes behavior — confirm the page renders, no console errors, no new React warnings
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
| **Supabase error silently swallowed** | Null data, silent redirect | `capture()` or `withDbCapture()` every query — `console.error` + Sentry ensures errors never hide behind null checks |

---

## Sub-AGENTS.md Reference

| Layer | File |
|-------|------|
| Business logic | `src/lib/services/AGENTS.md` |
| Shared components | `src/components/AGENTS.md` |
| Feature modules | `src/app/(dashboard)/<module>/AGENTS.md` |

<!-- NEXT-AGENTS-MD-START -->[Next.js Docs Index]|root: ./node_modules/next/dist/docs|STOP. What you remember about Next.js is WRONG for this project. Always search docs and read before any task.|If docs missing, run this command first: npx @next/codemod agents-md --output AGENTS.md|01-app:{04-glossary.md}|01-app/01-getting-started:{01-installation.md,02-project-structure.md,03-layouts-and-pages.md,04-linking-and-navigating.md,05-server-and-client-components.md,06-fetching-data.md,07-mutating-data.md,08-caching.md,09-revalidating.md,10-error-handling.md,11-css.md,12-images.md,13-fonts.md,14-metadata-and-og-images.md,15-route-handlers.md,16-proxy.md,17-deploying.md,18-upgrading.md}|01-app/02-guides:{adopting-partial-prefetching.md,ai-agents.md,analytics.md,authentication.md,backend-for-frontend.md,caching-without-cache-components.md,cdn-caching.md,ci-build-caching.md,content-security-policy.md,css-in-js.md,custom-server.md,data-security.md,debugging.md,deploying-to-platforms.md,draft-mode.md,environment-variables.md,forms.md,how-revalidation-works.md,incremental-static-regeneration-cache-components.md,incremental-static-regeneration.md,instant-navigation.md,instrumentation.md,interactive-apps.md,internationalization.md,json-ld.md,lazy-loading.md,local-development.md,mcp.md,mdx.md,memory-usage.md,migrating-to-cache-components.md,multi-tenant.md,multi-zones.md,open-telemetry.md,package-bundling.md,ppr-platform-guide.md,prefetching.md,preserving-ui-state.md,preventing-flash-before-hydration.md,production-checklist.md,progressive-web-apps.md,public-static-pages.md,redirecting.md,rendering-philosophy.md,runtime-prefetching.md,sass.md,scripts.md,self-hosting.md,server-actions.md,single-page-applications.md,static-exports.md,streaming.md,tailwind-v3-css.md,third-party-libraries.md,videos.md,view-transitions.md}|01-app/02-guides/migrating:{app-router-migration.md,from-create-react-app.md,from-vite.md}|01-app/02-guides/testing:{cypress.md,jest.md,playwright.md,vitest.md}|01-app/02-guides/upgrading:{codemods.md,version-14.md,version-15.md,version-16.md}|01-app/03-api-reference:{07-edge.md,08-turbopack.md}|01-app/03-api-reference/01-directives:{use-cache-private.md,use-cache-remote.md,use-cache.md,use-client.md,use-server.md}|01-app/03-api-reference/02-components:{font.md,form.md,image.md,link.md,script.md}|01-app/03-api-reference/03-file-conventions/01-metadata:{app-icons.md,manifest.md,opengraph-image.md,robots.md,sitemap.md}|01-app/03-api-reference/03-file-conventions/02-route-segment-config:{dynamicParams.md,instant.md,maxDuration.md,preferredRegion.md,prefetch.md,runtime.md}|01-app/03-api-reference/03-file-conventions:{default.md,dynamic-routes.md,error.md,forbidden.md,instrumentation-client.md,instrumentation.md,intercepting-routes.md,layout.md,loading.md,mdx-components.md,middleware.md,not-found.md,page.md,parallel-routes.md,proxy.md,public-folder.md,route-groups.md,route.md,src-folder.md,template.md,unauthorized.md}|01-app/03-api-reference/04-functions:{after.md,cacheLife.md,cacheTag.md,catchError.md,connection.md,cookies.md,draft-mode.md,fetch.md,forbidden.md,generate-image-metadata.md,generate-metadata.md,generate-sitemaps.md,generate-static-params.md,generate-viewport.md,headers.md,image-response.md,io.md,next-request.md,next-response.md,next-root-params.md,not-found.md,permanentRedirect.md,redirect.md,refresh.md,revalidatePath.md,revalidateTag.md,unauthorized.md,unstable_cache.md,unstable_noStore.md,unstable_rethrow.md,updateTag.md,use-link-status.md,use-params.md,use-pathname.md,use-report-web-vitals.md,use-router.md,use-search-params.md,use-selected-layout-segment.md,use-selected-layout-segments.md,userAgent.md}|01-app/03-api-reference/05-config/01-next-config-js:{adapterPath.md,allowedDevOrigins.md,appDir.md,assetPrefix.md,authInterrupts.md,basePath.md,cacheComponents.md,cacheHandlers.md,cacheLife.md,compress.md,crossOrigin.md,cssChunking.md,deploymentId.md,devIndicators.md,distDir.md,env.md,expireTime.md,exportPathMap.md,generateBuildId.md,generateEtags.md,headers.md,htmlLimitedBots.md,httpAgentOptions.md,images.md,incrementalCacheHandlerPath.md,inlineCss.md,instrumentationClientInject.md,logging.md,mdxRs.md,onDemandEntries.md,optimizePackageImports.md,output.md,outputHashSalt.md,pageExtensions.md,partialPrefetching.md,poweredByHeader.md,prefetchInlining.md,productionBrowserSourceMaps.md,proxyClientMaxBodySize.md,reactCompiler.md,reactMaxHeadersLength.md,reactStrictMode.md,redirects.md,rewrites.md,sassOptions.md,serverActions.md,serverComponentsHmrCache.md,serverExternalPackages.md,staleTimes.md,staticGeneration.md,taint.md,trailingSlash.md,transpilePackages.md,turbopack.md,turbopackFileSystemCache.md,turbopackIgnoreIssue.md,turbopackLocalPostcssConfig.md,turbopackMemoryEviction.md,typedRoutes.md,typescript.md,urlImports.md,useLightningcss.md,viewTransition.md,webVitalsAttribution.md,webpack.md}|01-app/03-api-reference/05-config:{02-typescript.md,03-eslint.md}|01-app/03-api-reference/06-cli:{create-next-app.md,next.md}|01-app/03-api-reference/07-adapters:{01-configuration.md,02-creating-an-adapter.md,03-api-reference.md,04-testing-adapters.md,05-routing-with-next-routing.md,06-implementing-ppr-in-an-adapter.md,07-runtime-integration.md,08-invoking-entrypoints.md,09-output-types.md,10-routing-information.md,11-use-cases.md}|02-pages/01-getting-started:{01-installation.md,02-project-structure.md,04-images.md,05-fonts.md,06-css.md,11-deploying.md}|02-pages/02-guides:{analytics.md,authentication.md,babel.md,ci-build-caching.md,content-security-policy.md,css-in-js.md,custom-server.md,debugging.md,draft-mode.md,environment-variables.md,forms.md,incremental-static-regeneration.md,instrumentation.md,internationalization.md,lazy-loading.md,mdx.md,multi-zones.md,open-telemetry.md,package-bundling.md,post-css.md,preview-mode.md,production-checklist.md,redirecting.md,sass.md,scripts.md,self-hosting.md,static-exports.md,tailwind-v3-css.md,third-party-libraries.md}|02-pages/02-guides/migrating:{app-router-migration.md,from-create-react-app.md,from-vite.md}|02-pages/02-guides/testing:{cypress.md,jest.md,playwright.md,vitest.md}|02-pages/02-guides/upgrading:{codemods.md,version-10.md,version-11.md,version-12.md,version-13.md,version-14.md,version-9.md}|02-pages/03-building-your-application/01-routing:{01-pages-and-layouts.md,02-dynamic-routes.md,03-linking-and-navigating.md,05-custom-app.md,06-custom-document.md,07-api-routes.md,08-custom-error.md}|02-pages/03-building-your-application/02-rendering:{01-server-side-rendering.md,02-static-site-generation.md,04-automatic-static-optimization.md,05-client-side-rendering.md}|02-pages/03-building-your-application/03-data-fetching:{01-get-static-props.md,02-get-static-paths.md,03-get-server-side-props.md,05-client-side.md}|02-pages/03-building-your-application/06-configuring:{12-error-handling.md}|02-pages/04-api-reference:{06-edge.md,08-turbopack.md}|02-pages/04-api-reference/01-components:{font.md,form.md,head.md,image-legacy.md,image.md,link.md,script.md}|02-pages/04-api-reference/02-file-conventions:{instrumentation.md,proxy.md,public-folder.md,src-folder.md}|02-pages/04-api-reference/03-functions:{get-initial-props.md,get-server-side-props.md,get-static-paths.md,get-static-props.md,next-request.md,next-response.md,use-params.md,use-report-web-vitals.md,use-router.md,use-search-params.md,userAgent.md}|02-pages/04-api-reference/04-config/01-next-config-js:{adapterPath.md,allowedDevOrigins.md,assetPrefix.md,basePath.md,bundlePagesRouterDependencies.md,compress.md,crossOrigin.md,deploymentId.md,devIndicators.md,distDir.md,env.md,exportPathMap.md,generateBuildId.md,generateEtags.md,headers.md,httpAgentOptions.md,images.md,logging.md,onDemandEntries.md,optimizePackageImports.md,output.md,pageExtensions.md,poweredByHeader.md,productionBrowserSourceMaps.md,proxyClientMaxBodySize.md,reactStrictMode.md,redirects.md,rewrites.md,serverExternalPackages.md,trailingSlash.md,transpilePackages.md,turbopack.md,typescript.md,urlImports.md,useLightningcss.md,webVitalsAttribution.md,webpack.md}|02-pages/04-api-reference/04-config:{01-typescript.md,02-eslint.md}|02-pages/04-api-reference/05-cli:{create-next-app.md,next.md}|02-pages/04-api-reference/06-adapters:{01-configuration.md,02-creating-an-adapter.md,03-api-reference.md,04-testing-adapters.md,05-routing-with-next-routing.md,06-implementing-ppr-in-an-adapter.md,07-runtime-integration.md,08-invoking-entrypoints.md,09-output-types.md,10-routing-information.md,11-use-cases.md}|03-architecture:{accessibility.md,fast-refresh.md,nextjs-compiler.md,supported-browsers.md}|04-community:{01-contribution-guide.md,02-rspack.md}<!-- NEXT-AGENTS-MD-END -->
