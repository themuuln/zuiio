# @zuiio — Project Instructions (for AI agents)

> **⚠️ Required reading for AI agents:** Before writing any code, load these files for full context:
>
> 1. `docs/design.md` — design tokens (OKLch colors, typography, spacing, motion, component conventions)
> 2. `docs/vision.md` — product vision and how we build
> 3. `docs/stack-web.md` — Next.js 16 stack (when working on web apps)
> 4. `docs/stack-mobile.md` — React Native + Expo stack (when working on mobile apps)
>
> You MUST read these before starting any significant task. This file (`AGENTS.md`) covers project structure, package map, and conventions.

**Private monorepo** serving Mongolian business apps: **Zer** (SMB ERP), **Tolom** (auto repair shop management), **Zuiio ID** (central SSO), and the **Zuiio company website**.

## Directory Structure

```
zuiio/
├── packages/        ← 12 shared @zuiio/* packages
├── apps/
│   ├── zuiio-id/    ← Central identity app (Next.js 16, id.zuiio.com)
│   ├── website/     ← Company website (Next.js 16, Tailwind v4)
│   ├── zer/         ← SMB ERP app
│   │   └── packages/branding/  ← @zer/branding
│   ├── tolom/       ← Auto repair app
│   │   └── packages/{config,supabase}  ← @tolom/*
│   └── agent-gateway/ ← Multi-tenant AI agent gateway (Telegram bots)
├── docs/            ← Design system, stacks, vision, architecture
├── .claude/         ← AI agent instructions
├── README.md
└── AGENTS.md        ← Project instructions (this file)
```

## Apps

| App | Stack | Description | dev command |
|-----|-------|-------------|-------------|
| `zuiio-id` | Next.js 16 + Supabase | Central identity SSO (id.zuiio.com) | `cd apps/zuiio-id && pnpm dev` |
| `website` | Next.js 16, Tailwind v4 | Company site | `cd apps/website && pnpm dev` |
| `zer` | Next.js 16 + Supabase | SMB ERP | `cd apps/zer && pnpm dev` |
| `tolom` | Next.js 16 + Supabase | Auto repair management | `cd apps/tolom && pnpm dev` |
| `agent-gateway` | Next.js 16 + Supabase + Telegram | Multi-tenant AI agent gateway for Telegram bots | `cd apps/agent-gateway && pnpm dev` |

Each app has its own `AGENTS.md` with app-specific rules. Read them when working in that app.

## Agent Gateway

Multi-tenant AI agent gateway at `apps/agent-gateway/`. Connects Telegram bots to Zer/Tolom business data via LLM-powered tools.

**Key architecture:**
- Org isolation: `orgId` resolved from DB (telegram_links / custom_bots), never from LLM output
- Provider pattern: DeepSeek primary, OpenAI fallback; each provider owns the tool-calling loop
- Tools execute against Supabase with service-role privileges, MUST filter by `orgId`
- Mongolian-first: all user-facing text is in Mongolian

**Documentation:** `apps/agent-gateway/README.md` and `apps/agent-gateway/docs/`

**Consumes:** `@zuiio/ai-agent`, `@zuiio/capture`, `@zuiio/core` (workspace packages)

## Packages

| Package | Layer | Description | Dependencies |
|---------|-------|-------------|--------------|
| `branding` | Framework-agnostic | OKLch design tokens, globals.css source of truth | — |
| `config` | Build | Shared tsconfig extended by all packages | — |
| `core` | Framework-agnostic | Formatting, validation, errors, timezone, domain rules, UUID, form validation, **lookup utilities: `createLookup()` `createAggregatedLookup()`** (O(1) Map builders replacing array.find) | date-fns |
| `auth` | React | `SupabaseAuthProvider`, `useAuth`, `useSession`, `useRequireAuth`, **`startZuiioSso()` `exchangeZuiioSsoCode()` `ZUIIO_OIDC_PROVIDER`** (SSO federation adapter) | @supabase/supabase-js, react |
| `hooks` | React | `useDebounce` `useDisclosure` `useCopyToClipboard` `useFuzzySearch` `useOnlineStatus` `useLocalStorage` `useIntersectionObserver`, **`useLookup()` `useAggregatedLookup()`** (memoized Map hooks) | react |
| `query` | React/Next | React Query provider + optimistic CRUD hooks (FormData + JSON) | @tanstack/react-query, react |
| `realtime` | React/Next | Supabase Realtime hooks: useRealtime, useRealtimeMulti | @supabase/supabase-js, @tanstack/react-query, react |
| `ui` | React | HighlightText, toastRetry, form input props, Mongolian phone/plate formatting | react, sonner |
| `offline` | Framework-agnostic | Mutation queue engine, IndexedDB persister, useOfflineMutation | idb, react |
| `hr` | Framework-agnostic | Mongolian payroll: income tax, social insurance, overtime, salary | — |
| `export` | Framework-agnostic | CSV, XLSX (ExcelJS), DOCX (docx), PDF (pdf-lib) generation + serveEntityExport | exceljs, docx, pdf-lib, @pdf-lib/fontkit |
| `capture` | Framework-agnostic | Sentry error capture wrapper with Supabase integration | @sentry/nextjs |
| `ai-agent` | Framework-agnostic | LLM client, tool-calling loop, provider abstraction | — |

## Consumer Projects

All apps consume `@zuiio/*` packages via `workspace:*` protocol inside this monorepo:

```json
"@zuiio/core": "workspace:*"
```

## Development Workflow

### Runtime verification

- **After every edit that changes UI or behavior**, verify the page still works at runtime — not just that it compiles.
- Use the `next-dev-loop` skill (installed in each app's `.agents/skills/`): verify with `agent-browser` (real Chrome view).
- Check four things: compiles, runs without errors, behaves as intended, no regressions in React tree.
- Requires: `next dev` running with Turbopack, and `agent-browser >= 0.31.1` (`npm i -g agent-browser@latest`).
## Build & Performance

### Package manager

- **pnpm ONLY** — never suggest switching to Bun or npm
- Bun has 5+ critical monorepo bugs (dedup failures, hangs, workspace compatibility) that break this codebase
- pnpm's content-addressable store saves 68% disk vs npm/Bun in this 18-package monorepo
- pnpm v12 (Rust engine) is coming and will match Bun's install speed — wait for it

### Build commands

- **Never run `pnpm build`** (builds all 17 packages/apps — slow, most are legacy)
- **Always use filtered builds:** `pnpm build:zer`, `pnpm build:tolom`, `pnpm build:website`, `pnpm build:zuiio-id`
- For CI full builds: `pnpm turbo run build --filter='./apps/*' --filter='./packages/*'`
- Package tsc builds (ai-agent, capture, core) are fast (~2s each); Next.js `next build` is the bottleneck

### turbo.json rules

- **DO NOT add env vars** to the `env` list unless they affect build output (NEXT_PUBLIC_*, Sentry plugin)
- Server-only vars (POSTGRES_*, SMTP_*, SUPABASE_*) go in `passThroughEnv` — they're passed through but don't break cache
- The current `env` list has exactly 3 vars: `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_AUTH_TOKEN`, `SENTRY_DSN`
- Adding unrelated vars to `env` invalidates cache for ALL packages — this is the #1 cause of slow rebuilds
- `typecheck` and `lint` run in parallel (no `^build` dependency) — use `pnpm check` to run both

### Next.js build config

- Every app's `package.json` build script MUST include: `NODE_OPTIONS='--max-old-space-size=12288' next build`
- Without this, large builds (zer, tolom) can OOM on 8GB machines
- Turbopack is the default bundler in Next.js 16 — do NOT force Webpack unless there's a specific plugin reason
- Sentry wrapping (`withSentryConfig`) adds ~10-30s to build — only use where error tracking is critical (zer, tolom already have it)
- PWA plugin (`withPWA`) only on zer — do NOT add to other apps

### What slows builds down

- **Sentry source map upload** — adds 10-30s per app; only include `SENTRY_AUTH_TOKEN` in env if building for deploy
- **Barrel file imports** (`export * from "./index"`) — can force Next.js to analyze entire packages; use named imports instead
- **Missing NODE_OPTIONS** — causes OOM kills on large builds, which look like "build took forever" but are actually crashes
- **Full `turbo run build`** — builds ALL 17 packages including legacy ones with broken builds; always use `--filter`

### Quick reference

```bash
# Build just one app (fastest — only builds that app + its deps)
pnpm build:zer
pnpm build:tolom
pnpm build:website
pnpm build:zuiio-id

# Typecheck + lint in parallel (no build needed)
pnpm check

# Full build (CI only — builds everything that can build)
pnpm turbo run build --filter='./apps/*' --filter='./packages/*'

# See what turbo would build without running it
pnpm turbo run build --filter=zer --dry
```


## Conventions

### Adding a new function/utility

1. **Framework-agnostic, no React** → `@zuiio/core` or a new package
2. **React hook** → `@zuiio/hooks` (generic) or `@zuiio/query` (TanStack Query)
3. **Mongolian business logic** → `@zuiio/core` (validation) or `@zuiio/hr` (payroll)
4. **UI component** → Each project has its own `src/components/`. Only pure utilities go in `@zuiio/ui` (form utilities, Mongolian formatting)
5. **⚠️ After adding any new export:** Update the Packages table above — add the new function/hook name to its package's Description column so agents discover it without reading every source file. Also add or update a `README.md` in the package root.

### Package structure

Every package follows:

```
packages/<name>/
├── package.json      # name: "@zuiio/<name>", main: "./src/index.ts"
├── tsconfig.json     # extends "@zuiio/config/tsconfig"
├── README.md         # Human-readable docs
├── AGENTS.md         # AI agent docs
└── src/
    ├── index.ts      # Public barrel — only export what consumers need
    └── *.ts          # Implementation files
```

### TypeScript

- Strict mode (via `@zuiio/config/tsconfig`)
- `noUncheckedIndexedAccess: true`
- All packages checked together: `pnpm exec tsc --noEmit`


### Supabase Type Generation (NEVER manually patch)

After every database migration, types **MUST** be regenerated using CLI or MCP — **NEVER manually edit `database.types.ts` or `supabase/types.ts`**:

```bash
# Option 1: Supabase CLI (preferred)
cd apps/<app> && supabase gen types typescript --project-id <ref> --schema public > src/lib/database.types.ts
cp src/lib/database.types.ts src/lib/supabase/types.ts

# Option 2: Supabase MCP (if CLI auth is broken)
# Use mcp__supabase_zer_generate_typescript_types, then save output to both files
```

**Two type files exist per app** — both must be updated:
- `src/lib/database.types.ts` — canonical Supabase-generated types
- `src/lib/supabase/types.ts` — copy used by `createClient()` (imports from `./types`)

After generating, run `biome check --write` to fix formatting (Supabase CLI outputs without semicolons).

If type generation fails with auth errors, **stop and ask the user to run `supabase login`**. Do NOT manually patch types — stale types cause build failures on CI.

### Dependencies

- **Runtime deps** go in `dependencies` (not `peerDependencies`) — this is a private monorepo
- **React packages**: `react` + `@types/react` in `devDependencies` (consumers provide React 19)
- **No circular deps** between packages

### Library & Framework Docs

**Always use current docs** for any library/package/framework question. Do NOT rely on training data — it may be outdated.

```bash
# Find the library
npx ctx7@latest library <name> "<your question>"

# Fetch docs
npx ctx7@latest docs <libraryId> "<your question>"
```

**Key docs to fetch:**
- Next.js 16.3: `npx ctx7@latest docs /vercel/next.js "your question"`
- Supabase SSR: `npx ctx7@latest docs /supabase/ssr "your question"`
- TanStack Query: `npx ctx7@latest docs /tanstack/query "your question"`
- shadcn/ui: `npx ctx7@latest docs /shadcn-ui "your question"`

**Why:** APIs change fast. Next.js 16 deprecated `middleware.ts` → `proxy.ts`. Supabase SSR changed cookie patterns. Training data is 6+ months stale.
## Commands

```bash
pnpm install                # Install all deps
pnpm exec tsc --noEmit      # Type-check all packages
pnpm test                   # Run tests (in packages with vitest)
```

## What NOT to put here

| Leaves in project | Why |
|-------------------|-----|
| Domain-specific DB adapters (hr-supabase) | Schema-dependent |
| UI components (Buttons, Drawers, Tables) | Each project has its own design system |
| Supabase client config | Project-specific auth + keys |
| i18n translation files | Project-specific copy |
| Branding/theming | Project-specific visual identity |

## Tasks (Agent Router)

Use this section to find the right context for your task. Read the linked file before proceeding.

### Working on an app

- **Zuiio ID (central SSO)** → `apps/zuiio-id/AGENTS.md`
- **Zer (SMB ERP)** → `apps/zer/AGENTS.md`
- **Tolom (auto repair)** → `apps/tolom/AGENTS.md`
- **Agent Gateway (Telegram bot)** → `apps/agent-gateway/AGENTS.md`
- **Website (company site)** → `apps/website/AGENTS.md`

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

### Common tasks

- **Add a new utility** → See "Adding a new function/utility" in Conventions
- **Add a new tool to agent-gateway** → `apps/agent-gateway/docs/ADDING_TOOLS.md`
- **Add a new AI provider** → `apps/agent-gateway/docs/ADDING_PROVIDERS.md`
- **Add a new messaging channel** → `apps/agent-gateway/docs/ADDING_CHANNELS.md`
- **Understand the architecture** → `apps/agent-gateway/docs/ARCHITECTURE.md`

## Project Relationships

How the apps and packages connect:

| App | Consumes | Purpose |
|-----|----------|---------|
| `zer` | core, hooks, query, ui, realtime, offline, hr, export, branding | SMB ERP with full feature set |
| `tolom` | core, hooks, query, ui, realtime, offline, hr, export, branding | Auto repair management |
| `agent-gateway` | ai-agent, capture, core | Telegram AI bot connecting to zer/tolom |
| `zuiio-id` | auth, branding, core | Central identity SSO |
| `website` | core | Company marketing site |

| Package | Used By | Purpose |
|---------|---------|---------|
| `core` | all apps | Formatting, validation, errors, lookups, domain rules |
| `hooks` | zer, tolom | React hooks (debounce, disclosure, fuzzy search, lookups) |
| `query` | zer, tolom | TanStack Query provider + optimistic CRUD |
| `ui` | zer, tolom | Form utilities, Mongolian formatting |
| `realtime` | zer, tolom | Supabase Realtime subscriptions |
| `offline` | zer, tolom | IndexedDB mutation queue for offline support |
| `hr` | zer, tolom | Mongolian payroll calculations |
| `export` | zer, tolom | CSV/XLSX/DOCX/PDF generation |
| `capture` | agent-gateway | Sentry error capture wrapper |
| `ai-agent` | agent-gateway | LLM client + tool-calling loop |
| `auth` | zuiio-id | SSO federation adapter (startZuiioSso, exchangeCode) |
| `branding` | zer, tolom, zuiio-id | OKLch design tokens, globals.css |
## Advanced Agent Patterns

### Just-in-Time Context Loading

Don't preload everything — load context dynamically as needed:

```bash
# Find a utility by name
pnpm exec tsc --listFiles | grep <utility-name>

# Check if a function exists in @zuiio
grep -r "export.*functionName" packages/*/src/

# Read specific docs when needed
# Don't read all docs upfront — read only what's relevant to your current task
```

**Rule:** If you can discover it by searching code/docs, don't read it upfront. Load on demand.

### Compaction (Long-Running Tasks)

For tasks spanning >10 files or >30 minutes:

1. **Create a task notes file:** `docs/notes/<task-name>.md`
2. **Log key decisions:** What was changed and why
3. **Reference in commit messages:** "See docs/notes/<task-name>.md"
4. **Compact context:** Summarize progress every 10 file changes

**Why:** Agents lose context on long tasks. Notes preserve coherence across sessions.

### Delegation Patterns

| Pattern | When to Use | How |
|---------|-------------|-----|
| **Explore** | Codebase discovery, finding patterns | Use `task` subagent with `agent: "explore"` |
| **Test** | Writing tests | Use `task` subagent with `agent: "tester"` |
| **Review** | Code review | Use `task` subagent with `agent: "reviewer"` |
| **Plan** | Complex multi-file changes | Use `task` subagent with `agent: "plan"` |

**When NOT to delegate:**
- Simple file edits (<5 files)
- Quick fixes (<10 minutes)
- Tasks requiring full context

### Token Efficiency

1. **Don't read entire files** — use `read` with offset/limit
2. **Don't grep blindly** — use `grep` with specific patterns
3. **Don't run full test suites** — run only tests you modified
4. **Don't read all docs** — read only what's relevant to your task

**Expected savings:** -30% token usage, +10% agent performance

---

## Package Documentation — READ BEFORE CODING

Before using ANY npm package from `package.json`, verify current API against the package's own documentation. **Never hardcode API patterns from training data.**

**Discovery order:**
1. Check `node_modules/<pkg>/package.json` for `llms`, `llmsFull`, or `mcpServer` fields → use those URLs as primary docs
2. Check `node_modules/<pkg>/AGENTS.md` or `node_modules/<pkg>/SKILL.md` → read for API guidance
3. If neither exists, fetch current docs from the web before writing code

**Key packages across apps:**
| Package | Docs Source |
|---------|------------|
| `@tanstack/react-query` | https://tanstack.com/query/latest/docs/framework/react/overview |
| `@tanstack/react-table` | https://tanstack.com/table/latest/docs/introduction |
| `@supabase/supabase-js` | `node_modules/@supabase/supabase-js/AGENTS.md` (per-package) |
| `@supabase/ssr` | https://supabase.com/docs/guides/auth/server-side/nextjs |
| `zod` | `node_modules/zod/AGENTS.md` + `llms` field in package.json |
| `react-hook-form` | https://react-hook-form.com/docs/useform |
| `next` | `node_modules/next/dist/docs/` (bundled) |

**This is not optional.** Package APIs change across versions. Training data is stale by definition.

---
---

# Zuiio ID — App-Specific Guide

Centralized identity and SSO system for the Zuiio ecosystem. One account, one login, every product. Serves as the OIDC provider for Zer, Tolom, and all future products.

## App Commands

```bash
pnpm dev              # Start dev server (Turbopack)
pnpm build            # Production build (NODE_OPTIONS='--max-old-space-size=12288')
pnpm lint             # Biome check
pnpm format           # Biome format --write
pnpm typecheck        # tsc --noEmit
pnpm test             # vitest run
pnpm test:watch       # vitest (watch mode)
pnpm clean:dev        # Purge Turbopack caches
```

## App Stack

- **Next.js 16.3** (App Router, Turbopack, Cache Components, PPR, React Compiler)
- **React 19** with Server Components, Server Actions, `useActionState`
- **Supabase** Auth (GoTrue OAuth: Google, Apple; email/password; Passkeys/WebAuthn; MFA/TOTP)
- **Supabase SSR** (`@supabase/ssr` v0.10.3) — cookie-based session management
- **Tailwind CSS v4** — `@theme` directive, OKLCh color tokens, dark mode via `.dark` class
- **React Hook Form** + **Zod** validation (`@hookform/resolvers`)
- **jose** — JWKS verification for Apple ID tokens
- **next-themes** — system/light/dark theme switching
- **sonner** — toast notifications
- **Biome** — linting + formatting
- **Vitest** — testing framework
- `@zuiio/auth`, `@zuiio/branding`, `@zuiio/core` — workspace packages

## Architecture & Data Flow

### SSO Flow (Product → Zuiio ID → Product)

```
┌──────────┐    OIDC redirect     ┌──────────────┐    Supabase PKCE    ┌──────────┐
│ Zer/Tolom│ ──────────────────→  │  Zuiio ID    │ ─────────────────→  │ Supabase │
│          │ ←──────────────────  │  (this app)  │ ←─────────────────  │  GoTrue  │
└──────────┘   continuation token └──────────────┘   session cookie    └──────────┘
                                    ↑ consent page
                                    ↑ login/signup/mfa
```

1. **Product initiates SSO** → redirects to Zuiio ID with `authorization_id`
2. **proxy.ts** runs on every request → creates Supabase server client → calls `getClaims()` for JWT refresh
3. **User authenticates** via email/password, Google, Apple, or Passkey
4. **Consent page** shows if product requests new authorization; remembered grants auto-redirect
5. **Callback** (`/auth/callback`) exchanges PKCE code → verifies continuation token → redirects to product
6. **Session persists** via HttpOnly cookies; proxy refreshes on every navigation

### Server vs Client Split

| Layer | Pattern |
|---|---|
| **Server Components** | Pages (`page.tsx`) — fetch user/profile, redirect if unauthenticated |
| **Server Actions** | `actions.ts` files — all mutations (login, signup, profile update, MFA, sessions) |
| **Client Components** | Forms (`*-form.tsx`) — interactive UI, `useActionState`, OAuth SDK integration |
| **Route Handlers** | `/api/*` — consent decision, grant/session revocation |
| **proxy.ts** | Session-refresh middleware (exported `proxy()` + `config.matcher`) |

### Key Design Decisions

- **`getClaims()` over `getSession()`** — proxy always validates JWT against JWKS keys, never trusts raw cookie claims
- **Continuation tokens** — HMAC-signed (`sha256`), 15-minute TTL, ties auth flows back to originating product
- **Host-only cookies** — no cross-subdomain sharing; SSO seamlessness comes from redirect flows
- **No account enumeration** — `resetPasswordForEmail` returns success regardless of email existence
- **Audit logging** — `sso_audit_events` table via service-role admin client; failures never block user flows

## Key Directories

```
src/
├── app/
│   ├── layout.tsx              # Root layout: Geist font, ThemeProvider, Toaster
│   ├── page.tsx                # Home — shows profile if logged in, redirects to /login
│   ├── globals.css             # Tailwind v4 theme tokens (light + dark), animations
│   ├── theme-provider.tsx      # next-themes provider (class-based dark mode)
│   ├── (auth)/                 # Auth route group (centered card layout)
│   │   ├── layout.tsx          # Auth shell: centered max-w-sm, Zuiio wordmark
│   │   ├── login/              # Email/password + Google + Apple + Passkey sign-in
│   │   ├── signup/             # Registration with full name, username, email, password
│   │   ├── account/            # Profile management, sessions, MFA, passkeys, logout
│   │   ├── forgot-password/    # Password reset request
│   │   ├── reset-password/     # Password reset confirmation
│   │   ├── logout/             # Sign-out handler
│   │   ├── mfa/verify/         # TOTP MFA verification page
│   │   ├── oauth/consent/      # OAuth consent screen (remembered grants auto-redirect)
│   │   ├── error/              # Auth error display (Mongolian, structured error codes)
│   │   └── theme-toggle.tsx    # Floating dark/light/system toggle (bottom-right)
│   ├── auth/callback/          # OAuth callback: PKCE exchange → continuation → redirect
│   └── api/
│       ├── oauth/decision/     # POST: approve/deny consent (SDK-based, skipBrowserRedirect)
│       └── account/
│           ├── revoke-grant/   # POST: revoke OAuth grant by client_id
│           └── revoke-session/ # POST: revoke session by session_id
├── lib/
│   ├── errors.ts               # Centralized AuthErrorCode type + localized messages
│   ├── supabase/
│   │   ├── env.ts              # getSupabaseEnv(), getServiceRoleKey() — env validation
│   │   ├── server.ts           # createClient() (cookie-based) + createAdminClient() (service-role)
│   │   ├── client.ts           # createBrowserSupabaseClient() with passkey support
│   │   └── audit.ts            # auditEvent(), auditOAuthError(), extractIp/extractUserAgent
│   └── auth/
│       ├── action-state.ts     # AuthActionState interface (shared contract for all actions)
│       ├── continuation.ts     # HMAC-signed continuation tokens (sign/verify/validate redirect)
│       ├── passkey.ts          # isPasskeySupported(), error messages, cancellation detection
│       └── google-nonce.ts     # SHA-256 nonce pair generation for Google Identity Services
├── proxy.ts                    # Session-refresh proxy (runs on every navigation)
└── types/
    └── oauth-globals.d.ts      # Window-level type declarations for Google GIS + Apple Sign In SDKs
```

## App Code Conventions

### Server Actions Pattern

Every mutation follows the same contract:

```typescript
// actions.ts — always "use server"
import type { AuthActionState } from "@/lib/auth/action-state";

export async function actionName(
  _previous: AuthActionState | undefined,
  formData: FormData,
): Promise<AuthActionState> {
  // 1. Extract + validate fields
  // 2. Return { fieldErrors } on validation failure
  // 3. Call Supabase
  // 4. Return { formError } on auth failure
  // 5. Return { redirectTo } on success
}
```

Client forms consume via `useActionState`:
```typescript
const [state, formAction, isPending] = useActionState(actionName, undefined);
```

### Client Component Pattern

- Marked `"use client"` at top of file
- Import Server Action directly, pass to `<form action={formAction}>`
- `useActionState` for form state; `useRouter` for navigation on success
- OAuth SDKs (Google, Apple) loaded via `<Script>` tags + type declarations in `oauth-globals.d.ts`

### Error Handling

- All auth errors use `AuthErrorCode` union type from `lib/errors.ts`
- Server Actions return structured `{ fieldErrors, formError, redirectTo }` — never throw
- Audit failures are caught and logged to console, never propagate
- Client-side passkey errors mapped via `getPasskeyErrorMessage()` with Mongolian strings

### Naming Conventions

- **Files**: `kebab-case` for components (`login-form.tsx`), `camelCase` for utilities (`action-state.ts`)
- **Components**: PascalCase (`LoginForm`, `ThemeProvider`)
- **Actions**: camelCase (`login`, `signInWithGoogle`, `updateProfile`)
- **Types**: PascalCase interfaces (`AuthActionState`, `ContinuationPayload`)
- **Route groups**: Parenthesized `(auth)` for shared layout
- **API routes**: `route.ts` with named HTTP method exports (`GET`, `POST`)

### Styling

- **Tailwind v4** with `@theme` directive — all design tokens defined in `globals.css`
- **Dark mode**: `.dark` class on `<html>`, toggled by `next-themes`; inline script in `<head>` prevents flash
- **OKLCh colors** — all color tokens are `oklch()` values; light and dark variants in `@layer base`
- **No box-shadows** — flat depth design using borders and tinted backgrounds only
- **Custom utilities**: `.animate-fade-in`, `.animate-slide-up`, `.animate-shake`, `.active-scale`
- **Reduced motion**: all animations disabled via `@media (prefers-reduced-motion: reduce)`

### Data Validation

- Server Actions validate inline with manual checks (not Zod schemas for form actions)
- Zod available via `@hookform/resolvers` for form-level validation
- Username regex: `^[a-z0-9][a-z0-9._-]*[a-z0-9]$` (3–32 chars)
- Password minimum: 8 characters

## App Environment Variables

```bash
# Required — Supabase project
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321        # or production URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key          # server-only, never in bundle

# Required — App identity
NEXT_PUBLIC_SITE_URL=http://localhost:3000               # production: https://id.zuiiotech.com
ZUIIO_CONTINUATION_SECRET=change-me-in-production        # HMAC secret, generate: openssl rand -hex 32
```

Social providers (Google, Apple) are configured in the Supabase Dashboard, not via env vars.

## App Important Files

| File | Purpose |
|---|---|
| `src/proxy.ts` | Session-refresh proxy — runs on every request, refreshes JWT via `getClaims()` |
| `src/lib/auth/continuation.ts` | HMAC-signed tokens linking auth flows to originating products |
| `src/lib/supabase/server.ts` | `createClient()` (user) + `createAdminClient()` (service-role) |
| `src/lib/errors.ts` | 23 `AuthErrorCode` values with Mongolian messages |
| `src/lib/auth/action-state.ts` | `AuthActionState` — the shared contract for all Server Actions |
| `src/app/auth/callback/route.ts` | OAuth callback: PKCE exchange + continuation redirect |
| `src/app/api/oauth/decision/route.ts` | Consent decision endpoint (approve/deny) |
| `src/types/oauth-globals.d.ts` | Global type declarations for Google GIS + Apple Sign In SDKs |
| `config/sso-products.ts` | Shared product catalog (13 products, `@config/*` path alias) |
| `supabase/config.toml` | Local Supabase config (GoTrue, Passkeys, WebAuthn) |
| `docs/DESIGN.md` | Full design system specification |

## App Testing & QA

- **Framework**: Vitest (configured at workspace root)
- **Test files**: `*.test.ts` co-located with source (e.g., `src/lib/auth/passkey.test.ts`, `google-nonce.test.ts`)
- **Run**: `pnpm test` (single run) or `pnpm test:watch` (watch mode)
- **Coverage**: Not explicitly configured — run `pnpm test` to verify no regressions after edits
- **Linting**: `biome check` via `pnpm lint`
- **Type checking**: `tsc --noEmit` via `pnpm typecheck`

## App Runtime & Tooling

- **Package manager**: pnpm (v11.10.0, specified in `package.json` `packageManager` field)
- **Node**: 18+ required (Next.js 16 requirement)
- **Build**: Turbopack (default in Next.js 16), `NODE_OPTIONS='--max-old-space-size=12288'`
- **TypeScript**: strict mode, `noUncheckedIndexedAccess: true`, bundler module resolution
- **Path aliases**: `@/*` → `./src/*`, `@config/*` → `../../config/*` (shared SSO product catalog)
- **Font**: Geist Sans + Geist Mono (loaded via `next/font/google`)
- **Icons**: `@phosphor-icons/react` (EyeIcon, EyeSlashIcon, FingerprintSimpleIcon)
- **No Sentry**: error tracking not configured for this app (auth errors are user-facing, not runtime exceptions)

## Supabase Schema (4 migrations)

| Migration | Table | Purpose |
|---|---|---|
| `00001_profiles.sql` | `profiles` | User profiles (full_name, username, avatar_url) |
| `00002_product_catalog.sql` | `product_catalog` | Registered OAuth clients (Zer, Tolom, etc.) |
| `00003_rls_reserved_and_catalog.sql` | RLS policies | Reserved username protection, catalog access |
| `00004_sso_audit_events.sql` | `sso_audit_events` | Audit trail (consent, grants, sessions, MFA) |

After migrations, regenerate types:
```bash
supabase gen types typescript --project-id <ref> --schema public > src/lib/database.types.ts
```

## SSO Product Registration

Products are defined in `config/sso-products.ts` (shared across monorepo via `@config/*` alias). Each product has:

```typescript
{
  id: "zer",                          // ProductId union member
  displayName: "Zer",
  authMode: "sso",                    // "sso" | "none"
  appRoots: ["https://zer.zuiiotech.com"],
  callbackPath: "/auth/callback",     // Always this value
  ssoStartPath: "/auth/sso",          // Always this value
  mobileCallbackUrl?: "zuiio-zer://auth/callback",  // Deep link for mobile
}
```

To add a new product: add its `ProductId` to the union and entry to `SSO_PRODUCTS` array in `config/sso-products.ts`.

## App Key Behaviors

- **Flash prevention**: Inline `<script>` in `<head>` reads `localStorage("theme")` + `prefers-color-scheme` to set `.dark`/`.light` class before paint
- **Last provider tracking**: `last_provider` HttpOnly cookie tracks which auth method the user last used (shown as primary button)
- **Onboarding flow**: New users without a `username` in `profiles` are redirected to `/account` to set one
- **Remembered consent**: If a grant already exists for a product, consent page auto-redirects without user interaction
- **MFA enforcement**: Users with verified TOTP factors must re-verify (AAL2) for consent decisions
- **Passkeys**: WebAuthn with discoverable credentials; browser-native UX, Supabase handles challenge/verify

<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.
<!-- END:nextjs-agent-rules -->
