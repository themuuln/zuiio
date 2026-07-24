# Performance Optimization Plan

Audit date: 2026-07-18. All file paths and line numbers below were verified against the codebase on that date. If a line number has drifted, search for the quoted code instead — do not guess.

## Why the app feels slow (root causes, verified)

1. **Unbounded queries** — most list pages fetch every row (no `.limit()`), and the dashboard downloads the entire `products` table to compute two aggregate numbers.
2. **PPR/Cache Components enabled but unused** — `next.config.ts` has `cacheComponents: true` and four `cacheLife` profiles, but there are **zero** `"use cache"` directives in `src/`. Every page is fully dynamic.
3. **recharts (~200KB) in client bundles** — `src/components/ui/chart.tsx` and the public report page import recharts statically.
4. **Context re-render cascades** — `OrgSettingsProvider` value objects are recreated on every render, re-rendering every consumer.
5. **Realtime over-invalidation** — every `sales` table change refetches the entire (unbounded) inventory list.

## Task files — execute in this order

| # | File | Risk | Independent? |
|---|------|------|--------------|
| 1 | [01-query-limits-and-dashboard-rpc.md](./01-query-limits-and-dashboard-rpc.md) | Medium (migration) | Yes |
| 2 | [02-context-memoization-and-react-compiler.md](./02-context-memoization-and-react-compiler.md) | Low | Yes |
| 3 | [03-chart-bundle-splitting.md](./03-chart-bundle-splitting.md) | Low | Yes |
| 4 | [04-realtime-invalidation-scoping.md](./04-realtime-invalidation-scoping.md) | Low | Yes |
| 5 | [05-misc-quick-wins.md](./05-misc-quick-wins.md) | Low–Medium | Yes |
| 6 | [06-cache-directives.md](./06-cache-directives.md) | **HIGH — read the safety section first** | Do last |

Tasks 1–5 are independent; run each in its own session/branch. Task 6 (cache directives) has cross-tenant data-leak risk if done wrong — it is deliberately last, has mandatory pre-reading, and must not be attempted casually.

## Ground rules for every task (non-negotiable)

These mirror `apps/zer/CLAUDE.md`. Violating them blocks CI.

1. **Every Supabase query** uses `withDbCapture("label", query)` from `@zuiio/capture`.
2. **Never** `console.error` in catch blocks — use `capture(e, { context: "..." })`.
3. **Never** `as any` / `as never`.
4. Server Actions use `ctx.supabase` from `requireActionContext()`, never `createClient()`.
5. Error messages shown to users are in **Mongolian**.
6. Migrations: after writing the file, apply it to the remote project via the Supabase MCP (`mcp__supabase_execute_sql`), record it in `supabase_migrations.schema_migrations`, then regenerate types into **both** `src/lib/database.types.ts` and `src/lib/supabase/types.ts` (see CLAUDE.md "Type Generation"). Never hand-edit type files. If Supabase MCP/CLI auth fails, **stop and ask the user** — do not work around it.
7. Touch only the files listed in your task doc. If you believe another file must change, say so in your report instead of changing it.

## Verification gate (run before declaring any task done)

```bash
cd apps/zer
pnpm lint        # biome + capture-check
pnpm typecheck   # tsc --noEmit
pnpm test        # vitest
pnpm build       # gates type-check + Cache Components validation
```

All four must pass. If `pnpm build` fails on something unrelated to your change, report it — do not "fix" unrelated code.
