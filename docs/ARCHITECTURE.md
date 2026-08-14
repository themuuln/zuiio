# zuiio — Architecture

A pnpm monorepo for Zuiio: Mongolian B2B platforms (ERP, POS, service management) and
consumer apps under one codebase. All apps share `@zuiio/*` packages via `workspace:*`.

---

## Repository Layout

```
zuiio/
├── apps/
│   ├── agent-gateway/    Telegram AI bot — Next.js 16, Cloudflare
│   ├── website/          Company marketing site — Next.js 16, i18n (mn/en)
│   └── ...               Experimental apps (zerbu, tumurch, tamga-web, zoa, etc.)
├── packages/
│   ├── config/           Shared tsconfig base (devDep for all packages)
│   ├── branding/         Design tokens (OKLch colors, typography, spacing)
│   ├── core/             Formatting, validation, timezone, domain rules
│   ├── hooks/            Generic React hooks (useLookup, useDebounce, etc.)
│   ├── query/            TanStack Query provider + optimistic CRUD hooks
│   ├── realtime/         Supabase Realtime → cache invalidation
│   ├── offline/          IndexedDB mutation queue for offline-first
│   ├── supabase/         Query builders, auth helpers, error mapping
│   ├── capture/          Unified error capture (Sentry + console.error)
│   ├── ui/               Pure utility components (HighlightText, formatting)
│   ├── hr/               Mongolian payroll: НДШ, ХХОАТ, overtime
│   ├── export/           CSV, XLSX, DOCX, PDF generation
│   ├── ai-agent/         DeepSeek Flash integration
│   └── auth/             Supabase auth helpers
├── docs/                 Design system, stack references, vision
└── templates/            Boilerplate (React Native starter)
```

---

## Package Dependency Graph

```
config ───────────────────── (devDep for all packages)

core → hooks → offline → query
             ↗
         hooks

Leaf packages (no @zuiio runtime deps):
  branding, capture, hr, export, ai-agent, supabase, ui
```

Key relationships:
- `@zuiio/hooks` peer-depends on `@zuiio/core` (formatting, validation)
- `@zuiio/query` depends on `hooks` + `offline` (mutation queue integration)
- `@zuiio/realtime` peer-depends on `@tanstack/react-query` (cache invalidation)
- `@zuiio/config` exports only tsconfig — every package imports it as a devDep

---

## App → Package Map

zer and tolom moved to standalone repos (`themuuln/zer`, `themuuln/tolom`) and consume `@zuiio/*` from npm (0.1.x).

| Package | agent-gw | website |
|---------|:--------:|:-------:|
| `@zuiio/core` | ✓ | — |
| `@zuiio/capture` | ✓ | — |
| `@zuiio/ai-agent` | ✓ | — |

`website` is standalone — no `@zuiio/*` dependencies. Uses only `next-intl` and Tailwind.

---

## Stack

| Concern | Technology |
|---------|-----------|
| Framework | Next.js 16 (Turbopack, Cache Components, Instant Navigations) |
| Database + Auth | Supabase (Postgres, RLS, SSR, Realtime) |
| Data fetching | TanStack Query v5 (useQuery, useMutation, persist-client) |
| UI components | shadcn/ui + Radix UI + Tailwind CSS v4 |
| Forms | react-hook-form + Zod v4 |
| Error tracking | Sentry via `@zuiio/capture` handler |
| Lint / Format | Biome (replaces ESLint + Prettier) |
| Testing | Vitest (unit), Playwright (E2E), Percy (visual) |
| Package manager | pnpm 11 with `workspace:*` protocol |
| Language | TypeScript 5–6, strict, `noUncheckedIndexedAccess` |

---

## Shared Patterns

### Org Isolation
Every query and mutation is scoped to `organization_id`. `@zuiio/supabase` provides
`withOrgScope(query, orgId)` which applies `.eq("organization_id", orgId)`. Server routes
enforce this via RLS + `withOrgScope`/`withBranchFilter`. No query escapes org scope.

### Optimistic UI
`@zuiio/query` exports `useOrgMutation` — one factory combining fetch, offline queueing,
optimistic cache updates, rollback on failure, toast feedback, and query invalidation.
Apps write ~5 lines instead of ~40 per mutation.

### Error Capture
`@zuiio/capture` provides framework-agnostic `capture(error, context)`. Apps wire Sentry
once via `setCaptureHandler()`. Every error path calls `capture()` — never raw
`console.error`. Pre-commit hook enforces this with `capture-check.mjs`.

### Offline-First (Tolom)
`@zuiio/offline` manages an IndexedDB-backed mutation queue. Mutations queue locally when
offline and replay on reconnect. Only Tolom uses this today; other apps can adopt without
changes to shared packages.

### Realtime Sync
`@zuiio/realtime` subscribes to Supabase Realtime channels and invalidates TanStack Query
caches on changes — keeping all connected clients in sync without polling.

---

## Design Decisions

1. **`workspace:*` over npm publishing.** Packages consumed by reference, not published.
   External sibling repos use `file:` protocol references.
2. **Peer deps for framework coupling.** React/TanStack Query packages declare peerDeps
   to avoid duplicate React instances in the bundle.
3. **`@zuiio/config` exports only tsconfig.** Shares TypeScript compiler options across
   all packages. No runtime code.
4. **Biome over ESLint + Prettier.** Single tool for lint + format. Faster, fewer configs.
5. **Turbopack everywhere.** All apps use `next dev --turbopack`. Local PostCSS config
   resolution is critical for monorepo CSS isolation.
6. **Capture as a side-effect protocol.** `setCaptureHandler` called once per app. All
   downstream code uses `capture()` without knowing whether Sentry is configured.
7. **Brand tokens in CSS, not JS.** OKLch colors, fluid typography, and spacing live as
   CSS custom properties in `@zuiio/branding/globals.css`. No JS token runtime.
8. **Offline-first is opt-in per app.** Only Tolom currently uses `@zuiio/offline`.
   Other apps can adopt incrementally.
