# Task 6: Adopt `"use cache"` on dashboard sections

**⚠️ HIGHEST-RISK TASK. A mistake here can leak one organization's data to another. Read this entire file, then read the mandatory docs, before writing any code. If anything in the docs contradicts this plan, follow the docs and report the discrepancy. If you are unsure at any point, stop and report rather than guess.**

Read `docs/performance/README.md` ground rules first.

## Background

`next.config.ts` already has `cacheComponents: true` and four `cacheLife` profiles (`realtime`, `frequent`, `standard`, `reference` — lines 29–34). But `src/` contains **zero** `"use cache"` directives (verified), so nothing is actually cached: every dashboard visit re-runs auth + org lookup + every section query.

## Mandatory pre-reading (do not skip)

1. `node_modules/next/dist/docs/` — the bundled docs for THIS Next.js version. Read everything about `use cache`, `cacheLife`, `cacheTag`, `revalidateTag`/`updateTag`, and `use cache: private`. The project CLAUDE.md warns this Next version has breaking changes vs. training data.
2. `src/lib/revalidate.ts` — the project already has `revalidateEntityTag(entity, orgId)` which calls `revalidateTag(\`${entity}:${orgId}\`)`. Your cache tags MUST use this exact `entity:orgId` format so existing helpers work.

## Safety rules (non-negotiable)

1. **Never call `cookies()`, `headers()`, or any auth/session read inside a `"use cache"` scope.** Resolve auth and `organizationId` OUTSIDE the cached function and pass `organizationId` in as a parameter. (The build should reject cookie access inside `use cache` — but do not rely on that.)
2. **`organizationId` must be a parameter of every cached function.** Cache keys are derived from arguments; an org-scoped function without an orgId argument serves one org's data to everyone. This is the data-leak failure mode.
3. **Every query inside a cached function must filter `.eq("organization_id", organizationId)`** — same as everywhere else in the codebase.
4. **Every cached function gets a `cacheTag`** in `entity:orgId` format (e.g. `cacheTag(\`sales:${organizationId}\`)`) and a `cacheLife` profile from `next.config.ts`.
5. The Supabase client used inside a cached function cannot be the cookie-bound request client (rule 1). Check how `src/lib/supabase/` creates clients and whether an admin/service client exists (look for `service_role` usage under `src/lib/supabase/` and `src/lib/superadmin.ts`). Inside the cached function use that non-request-bound client — this bypasses RLS, which is exactly why rules 2–3 are mandatory. If no such server-side client exists, create one small helper in `src/lib/supabase/` marked `import "server-only"`, following the existing client-creation patterns in that directory.

## Scope — exactly three dashboard sections, nothing else

Cache the data fetching (not the auth) of these components in `src/app/(dashboard)/_sections/`:

| Section | cacheLife profile | cacheTag(s) |
|---------|-------------------|-------------|
| `monthly-trend-section.tsx` | `standard` | `sales:${orgId}` |
| `quick-shortcuts.tsx` | `frequent` | `products:${orgId}`, `contacts:${orgId}` |
| `recent-sales.tsx` | `frequent` | `sales:${orgId}` |

(If Task 1 already converted `quick-shortcuts.tsx` to an RPC, cache that RPC call.)

### Pattern

For each section, extract the data fetching into a cached function in the same file (or a sibling `*.data.ts`):

```ts
import { unstable_cacheLife as cacheLife, unstable_cacheTag as cacheTag } from "next/cache";
// ^ Check the bundled docs for the correct import names in this Next version —
//   they may be stable (`cacheLife`/`cacheTag` from "next/cache") already.

async function getMonthlyTrend(organizationId: string) {
  "use cache";
  cacheLife("standard");
  cacheTag(`sales:${organizationId}`);

  const supabase = createCacheSafeClient(); // non-request-bound client, see safety rule 5
  const { data } = await withDbCapture(
    "dashboard_monthly_trend",
    supabase
      .from("sales")
      .select("…same columns as before…")
      .eq("organization_id", organizationId)
      // …same filters as before…
  );
  return data ?? [];
}
```

The component resolves auth/org **outside** the cached function (as it does today) and then calls `getMonthlyTrend(organizationId)`.

## Wire invalidation into mutations

Cached sales data must refresh when a sale is created. Find the server actions that mutate sales, products, and contacts:

```bash
grep -rln "revalidateEntity\|revalidateEntities" src/app --include="actions.ts" | head -20
```

In each action that mutates one of the cached entities (`sales` — shop checkout + sales actions; `products`; `contacts`), add alongside the existing revalidation:

```ts
revalidateEntityTag("sales", ctx.organizationId);
```

(using the helper from `src/lib/revalidate.ts`; match entity to what the action changes). Do not remove the existing `revalidateEntity(...)` path-based calls.

## Mandatory verification — cross-org isolation test

This is the whole point of the safety rules. Do all of these:

1. **Unit-level:** add a test (Vitest, following existing test patterns in the repo) asserting that each cached data function passes `organizationId` into the query filter — e.g. mock the Supabase client and assert `.eq("organization_id", <given id>)` was called.
2. **Runtime, two orgs:** you need two test organizations. If seed data / test accounts for two orgs exist (check `supabase/seed.sql` or ask in your report), log into org A, load the dashboard, then log into org B (different browser profile/incognito) and load the dashboard. Org B must NEVER see org A's numbers, even transiently. If you cannot arrange two orgs, say so in your report and mark the task as needs-human-verification — do not skip silently.
3. **Freshness:** create a sale in the shop, return to the dashboard: within the `frequent` profile's revalidate window (30s) — or immediately, if the checkout action got the `revalidateEntityTag` wiring — Recent Sales must show the new sale.
4. `pnpm build` must pass — Cache Components validation runs in the build and will catch `cookies()`-inside-cache mistakes.

## Do NOT

- Do not add `"use cache"` to layouts, `dashboard-fetcher.tsx`, auth code, or anything outside the three listed sections.
- Do not use `"use cache: private"` in this task.
- Do not cache anything keyed by user (only org-keyed section data).
- Do not "fix" unrelated code you encounter.

## Definition of done

- [ ] Bundled Next docs read; any deviations from this plan documented
- [ ] Three sections cached with correct profile + `entity:orgId` tags; orgId is a parameter everywhere
- [ ] No `cookies()`/`headers()`/auth reads inside any `"use cache"` scope
- [ ] Mutation actions call `revalidateEntityTag` for affected entities
- [ ] Cross-org isolation verified (unit test + two-org runtime check, or explicitly flagged needs-human-verification)
- [ ] Freshness check passed
- [ ] `pnpm lint && pnpm typecheck && pnpm test && pnpm build` all pass
