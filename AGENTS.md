# @zuiio — Project Instructions (for AI agents)

**Private platform repository** for Zuiio, a Mongolian software company. Product applications live in independent sibling repositories. This repository owns shared `@zuiio/*` packages and platform tooling.

## Communication & Domain Language

Always speak in ASD-STE100 Simplified Technical English.

- Use short, clear sentences.
- Prefer active voice and simple verb forms.
- Avoid ambiguity, hedging words, and complex noun clusters.
- One meaning per word; keep terminology consistent.

Always read any `CONTEXT.md` files that exist in the project (or relevant subdirectories).
Use the ubiquitous language defined in those files for all domain terms, concepts, names, and descriptions.
Treat CONTEXT.md definitions as the source of truth for terminology.
When several CONTEXT.md files apply, the nearest one wins for its own scope.
When you introduce a new domain term or name, propose adding it to the relevant CONTEXT.md.

## Shared Context (load by task type)

| Task type | Load this doc |
|-----------|---------------|
| UI / design work | `docs/design.md` |
| Product / architecture decision | `docs/vision.md` |
| Web app (Next.js) | `docs/stack-web.md` |
| Mobile app (React Native) | `docs/stack-mobile.md` |

Always read `docs/vision.md` first for significant tasks — it is the single source of truth for direction and principles.

## FastGate — Verification Contract

**Before declaring any change complete, you MUST run `npm run verify`.**

**Implementation loop:** run the affected product repository's own tests. In this repository, use package-scoped checks. Never run a product app through the platform workspace.

This runs typecheck → lint → unit tests with coverage gating (FastGate).
If any gate fails, diagnose → fix → re-run verify (max 3 attempts).
If still RED after 3 attempts, ESCALATE — do NOT work around the gate.

Report EXACTLY:
- What commands ran and their exit codes
- What passed / what failed / what was blocked
- Do NOT claim "tests pass" without running them
- Do NOT inflate partial verification into blanket success
- Do NOT skip coverage thresholds or claim "good enough"

The verify script runs `turbo run typecheck lint test:coverage --continue`.
For the full gate (CI), run `npm run audit` which adds E2E tests.

**Rules of engagement:**
1. The author never grades the author. Verification must be external and deterministic.
2. A test runner returning non-zero exit code cannot be argued into green.
3. Coverage thresholds exist to prevent untested code — respect them.


## Build & Performance

- **pnpm ONLY** — never suggest Bun or npm
- **Never run `pnpm build`** (builds all packages — slow). Use `pnpm --filter <package> build` for one package.
- **turbo.json `env` list**: only `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_AUTH_TOKEN`, `SENTRY_DSN`. Adding unrelated vars invalidates cache for ALL packages — the #1 cause of slow rebuilds
- Server-only vars (POSTGRES_*, SMTP_*, SUPABASE_*) go in `passThroughEnv`, not `env`
- `typecheck` and `lint` run in parallel — use `pnpm check`
- Every app's build script MUST include `NODE_OPTIONS='--max-old-space-size=12288' next build`
- Turbopack is the default bundler — do NOT force Webpack
- Barrel file imports (`export *`) force Next.js to analyze entire packages — use named imports

```bash
pnpm --filter @zuiio/core build  # Build one package
pnpm check                       # Typecheck + lint in parallel
pnpm turbo run build --filter='./packages/*'  # Build shared packages
```

## Conventions

### Adding utilities
1. Framework-agnostic, no React → `@zuiio/core` or new package
2. React hook → `@zuiio/hooks` (generic) or `@zuiio/query` (TanStack Query)
3. Mongolian business logic → `@zuiio/core` (validation) or `@zuiio/hr` (payroll)
4. UI component → each project's own `src/components/`. Only pure utilities go in `@zuiio/ui`

### Supabase Types (NEVER manually patch)
After migrations, regenerate using CLI or MCP. **NEVER manually edit `database.types.ts`**. If auth fails, stop and ask user to run `supabase login`. After generating, run `biome check --write`.

### Dependencies
- Runtime deps in `dependencies` (private monorepo, not `peerDependencies`)
- `react` + `@types/react` in `devDependencies` (consumers provide React 19)
- No circular deps between packages

### Current Library Docs
Always fetch current docs — training data is stale. Use `npx ctx7@latest docs <libraryId> "<question>"` for Next.js, Supabase SSR, TanStack Query, shadcn/ui.

## Permission Boundaries

### ✅ Always
- Read the nearest `AGENTS.md` and source/tests being changed
- Use pnpm and package-scoped commands (`pnpm --filter <package> build`, not `pnpm build`)
- Preserve tenant isolation, RLS, and authorization boundaries
- Run diagnostics on changed files, then targeted tests
- Runtime-check every user-visible change
- Regenerate generated artifacts using documented generators

### ⚠️ Ask First
- Add, remove, or upgrade dependencies
- Apply migrations to remote database, run backfills, or modify production data
- Change authentication, authorization, RLS, or tenant-scoping
- Change financial, inventory, or business semantics
- Introduce new public package API or breaking API response shape
- Change shared architecture across apps/packages
- Commit, push, deploy, or change production environment (unless explicitly requested)

### 🚫 Never
- Commit secrets, credentials, `.env` files, keys, or tokens
- Use npm or Bun in this platform repository
- Run unfiltered root-wide build for normal validation
- Manually edit generated Supabase type files
- Bypass RLS or omit `organization_id` scoping
- Expose service-role credentials to client code
- Run destructive SQL or production data repairs without explicit approval
- Disable tests/lint rules or add broad suppressions
- Modify `vendor/`, `dist/`, `build/` directly
- Force-push the default branch

## On-Demand Documentation

The platform repository contains shared documentation and package instructions:
- `docs/agent-reference.md` — CLI profiles and platform commands
- `docs/architecture/` — package and platform design decisions
- `docs/development/` — package authoring and debugging guides
- `docs/org.yaml` — product catalog
- Each package: `packages/<name>/AGENTS.md`

Product-specific instructions live in the corresponding sibling repository.
**Package APIs change across versions. Always use current docs, never training data.**

## CLI Multi-Account Profiles

This platform repository uses multiple Supabase and Vercel accounts for package and product operations. Do not use plain `vercel` or `supabase`; use the configured profile aliases.

- **Vercel:** `v` / `v-tolom` / `v-themuuln6`
- **Supabase:** use **`supa`** (`~/.local/bin/supa`)

Product repositories own their deployment and database commands. Their profile mapping is documented in each product repository.


## Log-Based Debugging

Use production logs to debug issues before diving into code. Two sources available:

### Quick start
- **Vercel**: `v logs --project <app> --level error --since 2h` (use the correct profile alias — `v` / `v-tolom` / `v-themuuln6`; `v whoami` to confirm)
- **Supabase**: Supabase MCP `get_logs` — `service: auth|postgres|api|storage|edge-function|realtime`
- Full command catalog, service table, and the 5-step debugging workflow: `docs/agent-reference.md#log-based-debugging`

## Code Review Rules
- **FastGate**: never claim a change complete without `npm run verify` (typecheck → lint → tests with coverage) — the author never grades the author; non-zero exit codes cannot be argued green.
- **Tenant isolation**: every query RLS-scoped by `organization_id`; never bypass RLS, never expose service-role to client code, never drop `org` scoping.
- **Generated types**: never manually edit `database.types.ts`; regenerate after migrations; keep `turbo.json` `env` list untouched (cache-invalidating).
- **Dependencies**: pnpm only; runtime deps in `dependencies`; no new/upgraded deps without approval; no barrel re-exports (`export *`).
- **Clean cutover**: no dead code, shims, or compatibility layers; migrate every caller in the same change.
