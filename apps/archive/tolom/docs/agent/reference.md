# Tolom — Agent Reference

Reference material for agents. Load only when relevant; not injected by default.

## Commands

```bash
pnpm dev                    # Dev server (Turbopack)
pnpm build                  # Production build
pnpm validate               # tsc --noEmit --incremental + biome check src/
pnpm validate:types         # Type-check only
pnpm validate:lint          # Biome lint only
pnpm lint                   # Biome check only
pnpm test                   # Vitest unit/integration
pnpm test:e2e               # Playwright E2E
pnpm update-types           # Regenerate Supabase types after migration
```

**Pre-merge:** `pnpm lint && npx tsc --noEmit && pnpm build && pnpm test`
**E2E speed:** Always use production build for E2E. Dev mode lazily compiles (8-9s first request).


---

---

## Local Supabase (Integration Tests)

Integration tests (`src/lib/__tests__/integration/`) require a local Supabase stack via colima:

```bash
# Start colima (macOS Docker runtime, ~1s if already running)
colima start --cpu 4 --memory 8

# Start Supabase (skip services not needed for testing)
supabase start --exclude studio,imgproxy,inbucket,vector,logflare,edge-runtime,meta

# Run full suite with local Supabase credentials
export SUPABASE_URL=http://127.0.0.1:54361
export SUPABASE_ANON_KEY=$(supabase status | sed -n '/Publishable/{n;s/.*│ //;s/ │//;p}')
export SUPABASE_SERVICE_ROLE_KEY=$(supabase status | sed -n '/Secret/{n;s/.*│ //;s/ │//;p}')
npx vitest run

# Stop when done
supabase stop
```

**Key details:**
- The `--exclude` list avoids ports conflicts with other projects. `inbucket` is excluded by default — if a port conflict occurs, stop the other project first: `supabase stop --project-id <name>`.
- Migrations (166 files in `supabase/migrations/`) are applied automatically on `supabase start`.
- Starting fresh: `supabase stop` then `supabase start` resets the DB to a clean migration state.
- One Supabase project can run at a time per port range. If another project is running, stop it first.
- pgTAP RLS tests exist in `supabase/tests/` — run with `supabase test db`. The `pgtap` extension is pre-installed in the local DB.
---

---

## Inline Skeleton Pattern (loading UI)
 **This app uses Inline Skeleton loading, NOT general spinner/skeleton-screen loading.**
 
 ### What it means
 
 The component's full shell renders immediately — layout, containers, cards, icons, and **labels as real text**. Only the dynamic data-bound **values** show `<Skeleton>` placeholders.
 
 ```
 ✅ Correct (Inline Skeleton):        ❌ Wrong (General / Full-page skeleton):
 ┌─────────────────────────┐          ┌─────────────────────────┐
 │ Total Revenue           │          │                         │
 │ ▓▓▓▓▓▓▓▓               │  value   │   ┌─────────────────┐   │
 │ ▓▓ ▓▓▓ ↑ ▓▓▓           │  shimmer │   │ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │   │
 │ ────────                │          │   │ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │   │
 │ Active Work Orders      │  label   │   │ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │   │
 │ ▓▓▓▓                    │  real    │   └─────────────────┘   │
 └─────────────────────────┘  text    │                         │
                                       │  (entire surface =     │
                                       │   skeleton blocks)     │
                                       └─────────────────────────┘
 ```
 
 ### Rules
 
 1. **NEVER gate rendering behind `if (loading) return <FullSkeleton>`.** The component tree renders immediately — pass a `loading` prop to data-bound slots, not an early return.
 
 2. **Labels are real text, not skeleton.** A KPI card with `label="Total Revenue"` shows that label as real rendered text on frame 1. Only the `value` (number/currency) gets skeletonized.
 
 3. **Every data-display component needs a `loading` variant.** Each card, stat, metric, and value display must accept `loading?: boolean` and render a `<Skeleton>` in place of the value when loading:
    ```tsx
    // ✅ Correct — label is always visible, value is skeletonized
    <Card>
      <CardHeader>
        <CardTitle>Total Revenue</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-24" />
        ) : (
          <span className="text-2xl font-bold">{value}</span>
        )}
      </CardContent>
    </Card>
    ```
 
 4. **Use `<Skeleton>` from `@/components/ui/skeleton`, never a spinner for inline values.** No `Loader2`, `CircularProgressIndicator`, or `<div>Loading...</div>` for data slots. `<Skeleton>` is the only inline loading primitive.
 
 5. **The page shell renders on frame 1.** `loading.tsx` at the page level is only for the very first ever load (Server Component data fetch). After that, client-side navigation always shows the rendered layout with inline skeletons.
 
 6. **Layout-preserving loading:** After the first successful data load, never blank out the layout during refetches — use `keepPreviousData` (React Query) or a `hasLoadedOnce` ref to keep the UI alive and show skeletons only in the transitioning data slots.
 
 ### Current state
 
 **Dashboard (`_dashboard-client.tsx`)** — ✅ Correct. "Always render page structure, skeleton-load values." KPI cards, secondary stats, and chart areas all render the layout with `<Skeleton>` in value slots.
 
 **Admin pages (`dashboard/admin/page.tsx`, `sellers/page.tsx`, `marketing/page.tsx`)** — ❌ Wrong. Uses `if (loading) return <Skeleton>` which replaces the entire page shell. Must be migrated.
 
 ### Migration checklist (for pages that are wrong)
 
 When fixing a page that uses `if (loading) return <Skeleton...>`:
 1. Remove the early `if (loading) return` block
 2. Render the full component tree unconditionally
 3. Pass `loading` to each data-display child that needs it
 4. Ensure labels/icons/structural text are always real rendered elements
 5. Keep `<Skeleton>` only where dynamic values appear

---

