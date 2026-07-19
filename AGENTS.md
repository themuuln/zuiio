# @zuiio — Project Instructions (for AI agents)

**Private monorepo** for Zuiio, a Mongolian software company. Products: **Zer** (SMB ERP), **Tolom** (auto repair), **Tumurch** (gym platform), **Tamga** (horse management), **Zuiio ID** (central SSO), plus the company website and internal tools.

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

## Local Supabase

Supabase local dev runs via colima (Docker alternative, no Docker Desktop):
```bash
colima start --cpu 4 --memory 8    # If not running
supabase start --exclude studio,imgproxy,inbucket,vector,logflare,edge-runtime,meta  # ~2 min
supabase status                     # Check it's up
supabase stop                       # When done
```

## Build & Performance

- **pnpm ONLY** — never suggest Bun or npm
- **Never run `pnpm build`** (builds all packages — slow). Always use filtered builds: `pnpm build:zer`, `pnpm build:tolom`
- **turbo.json `env` list**: only `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_AUTH_TOKEN`, `SENTRY_DSN`. Adding unrelated vars invalidates cache for ALL packages — the #1 cause of slow rebuilds
- Server-only vars (POSTGRES_*, SMTP_*, SUPABASE_*) go in `passThroughEnv`, not `env`
- `typecheck` and `lint` run in parallel — use `pnpm check`
- Every app's build script MUST include `NODE_OPTIONS='--max-old-space-size=12288' next build`
- Turbopack is the default bundler — do NOT force Webpack
- Barrel file imports (`export *`) force Next.js to analyze entire packages — use named imports

```bash
pnpm build:zer                   # Build one app
pnpm check                       # Typecheck + lint in parallel
pnpm turbo run build --filter='./apps/*' --filter='./packages/*'  # CI full build
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
- Use pnpm and app-scoped commands (`pnpm build:zer`, not `pnpm build`)
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
- Use npm or Bun in this monorepo
- Run unfiltered root-wide build for normal validation
- Manually edit generated Supabase type files
- Bypass RLS or omit `organization_id` scoping
- Expose service-role credentials to client code
- Run destructive SQL or production data repairs without explicit approval
- Disable tests/lint rules or add broad suppressions
- Modify `vendor/`, `dist/`, `build/` directly
- Force-push the default branch

## On-Demand Documentation

Deeper docs are in `docs/` — load only when relevant:
- `docs/architecture/` — system architecture, design decisions
- `docs/development/` — build performance, package authoring, debugging guides
- `docs/org.yaml` — org catalog (source of truth for product info)
- Each app: `apps/<name>/AGENTS.md` — app-specific rules (nearest-file-wins)
- Each package: `packages/<name>/AGENTS.md` — package-specific rules

### Working on an app
- **Zuiio ID** → `apps/zuiio-id/AGENTS.md`
- **Zer** → `apps/zer/AGENTS.md`
- **Tolom** → `apps/tolom/AGENTS.md`
- **Agent Gateway** → `apps/agent-gateway/AGENTS.md`
- **Website** → `apps/website/AGENTS.md`
- **Onoo** → `apps/onoo/AGENTS.md`
- **Tamga** → `apps/tamga/AGENTS.md`
- **Tumurch** → `apps/tumurch/AGENTS.md`
- **Khosuud** → `apps/khosuud/AGENTS.md`
- **Zim** → `apps/zim/AGENTS.md`
- **Zerbu** → `apps/zerbu/AGENTS.md`
- **Zer App** → `apps/zer-app/AGENTS.md`
- **Tolom Mobile** → `apps/tolom-mobile/AGENTS.md`
- **Tamga Web** → `apps/tamga-web/AGENTS.md`
- **Zraf Web** → `apps/zraf-web/AGENTS.md`
- **Tumurch RN** → `apps/tumurch-rn/AGENTS.md`

### Working on a package
- **@zuiio/core** → `packages/core/AGENTS.md`
- **@zuiio/hooks** → `packages/hooks/AGENTS.md`
- **@zuiio/query** → `packages/query/AGENTS.md`
- **@zuiio/ui** → `packages/ui/AGENTS.md`
- **@zuiio/realtime** → `packages/realtime/AGENTS.md`
- **@zuiio/offline** → `packages/offline/AGENTS.md`
- **@zuiio/hr** → `packages/hr/AGENTS.md`
- **@zuiio/export** → `packages/export/AGENTS.md`
- **@zuiio/capture** → `packages/capture/AGENTS.md`
- **@zuiio/ai-agent** → `packages/ai-agent/AGENTS.md`
- **@zuiio/branding** → `packages/branding/AGENTS.md`
- **@zuiio/config** → `packages/config/AGENTS.md`
- **@zuiio/auth** → `packages/auth/AGENTS.md`
- **@zuiio/oidc** → `packages/oidc/AGENTS.md`
- **@zuiio/i18n** → `packages/i18n/AGENTS.md`
- **@zuiio/supabase** → `packages/supabase/AGENTS.md`
- **@zuiio/search** → `packages/search/AGENTS.md`
- **@zuiio/sdk** → `packages/sdk/AGENTS.md`

**Package APIs change across versions. Always use current docs, never training data.**

## CLI Multi-Account Profiles

This monorepo uses multiple Supabase and Vercel accounts. **Do NOT use plain `vercel` or `supabase`** — always use the profile aliases.

### Quick reference

| App / task | Vercel | Supabase profile |
|------------|--------|-----------------|
| Most apps | `v` (zerone) | `s` (zerone) |
| tolom, tolom-mobile | `v-tolom` | `s-themuln` |
| zuiio-id | `v-themuuln6` | `s` (zerone) |

### Commands

```bash
# One-off — use for a single command
v-tolom deploy
v-themuuln6 deploy
s-yesprice projects list

# Session switch — use before a block of commands
as-tolom        # sets both Vercel + Supabase to tolom's accounts
v whoami        # themulnofficial-9829
v deploy

as-zerone       # switch back to default
v whoami        # themuuln
```

### Per-app mapping

See `.cli-profiles.json` for the full mapping of each app to its Vercel account and Supabase project ref.

### Troubleshooting

- Vercel tokens are stored in pass (`personal/vercel/<name>`) and loaded at shell start via `.zshrc`
- Supabase profiles are stored in native keychain, managed via `supabase login --name <profile>`
- If a profile is missing: run `source ~/.zshrc` then check with `v-<name> whoami` or `supabase --profile <name> projects list`
