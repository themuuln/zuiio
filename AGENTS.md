# @zuiio — Project Instructions (for AI agents)

> **⚠️ Required reading for AI agents:** Before writing any code, load these files for full context:
>
> 1. `docs/design.md` — design tokens (OKLch colors, typography, spacing, motion, component conventions)
> 2. `docs/vision.md` — product vision and how we build
> 3. `docs/stack-web.md` — Next.js 16 stack (when working on web apps)
> 4. `docs/stack-mobile.md` — React Native + Expo stack (when working on mobile apps)
> 5. `.claude/instructions.md` — design essentials and common patterns (quick reference)
>
> You MUST read these before starting any significant task. This file (`AGENTS.md`) covers project structure, package map, and conventions.

**Private monorepo** (`/Users/themuuln/coding/personal/zuiio/`) serving two Mongolian business apps: **Zer** (HR + accounting) and **Tolom** (auto repair shop management), plus the **Zuiio company website**.

## Directory Structure

```
zuiio/
├── packages/       ← 10 shared packages (branding, config, core, hooks, query, realtime, ui, offline, hr, export)
├── apps/
│   └── website/    ← Company website (Next.js 16, Tailwind v4, shadcn New York)
├── docs/           ← Design system, stacks, vision
├── templates/      ← Project boilerplate
├── README.md       ← Human-facing entry point
└── AGENTS.md       ← Project instructions (this file)
```

## Apps

| App | Stack | Description |
|-----|-------|-------------|
| `website` | Next.js 16, Tailwind v4, shadcn New York | Company website — home, products, pricing, blog, about |

### Website commands

```bash
cd apps/website
pnpm dev          # next dev --turbopack
pnpm build        # next build
```

## Packages

| Package | Layer | Description | Dependencies |
|---------|-------|-------------|--------------|
| `branding` | Framework-agnostic | OKLch design tokens, globals.css source of truth | — |
| `config` | Build | Shared tsconfig extended by all packages | — |
| `core` | Framework-agnostic | Formatting, validation, errors, timezone, domain rules, UUID, form validation | date-fns |
| `hooks` | React | Generic hooks: useDebounce, useDisclosure, useCopyToClipboard, etc. | react |
| `query` | React/Next | React Query provider + optimistic CRUD hooks (FormData + JSON) | @tanstack/react-query, react |
| `realtime` | React/Next | Supabase Realtime hooks: useRealtime, useRealtimeMulti | @supabase/supabase-js, @tanstack/react-query, react |
| `ui` | React | HighlightText, toastRetry, form input props, Mongolian phone/plate formatting | react, sonner |
| `offline` | Framework-agnostic | Mutation queue engine, IndexedDB persister, useOfflineMutation | idb, react |
| `hr` | Framework-agnostic | Mongolian payroll: income tax, social insurance, overtime, salary | — |
| `export` | Framework-agnostic | CSV, XLSX (ExcelJS), DOCX (docx), PDF (pdf-lib) generation + serveEntityExport | exceljs, docx, pdf-lib, @pdf-lib/fontkit |

## Consumer Projects

```
zuiio/           ← this repo
├── packages/    ← 10 shared packages
zer/             ← sibling repo, uses 7 packages
tolom/           ← sibling repo, uses 7 packages
```

Both consumers use `file:` protocol for cross-monorepo dependencies:

```json
"@zuiio/core": "file:../zuiio/packages/core"
```

## Conventions

### Adding a new function/utility

1. **Framework-agnostic, no React** → `@zuiio/core` or a new package
2. **React hook** → `@zuiio/hooks` (generic) or `@zuiio/query` (TanStack Query)
3. **Mongolian business logic** → `@zuiio/core/src/domain-rules.ts` (validation) or `@zuiio/hr` (payroll)
4. **UI component** → Not here. UI lives in each project's `src/components/`. Only pure utilities go in `@zuiio/ui`

### Package structure

Every package follows:

```
packages/<name>/
├── package.json      # name: "@zuiio/<name>", main: "./src/index.ts"
├── tsconfig.json     # extends "@zuiio/config/tsconfig"
└── src/
    ├── index.ts      # Public barrel — only export what consumers need
    └── *.ts          # Implementation files
```

### TypeScript

- Strict mode (via `@zuiio/config/tsconfig`)
- `noUncheckedIndexedAccess: true`
- All packages checked together: `pnpm exec tsc --noEmit`

### Dependencies

- **Runtime deps** go in `dependencies` (not `peerDependencies`) — this is a private monorepo
- **React packages**: `react` + `@types/react` in `devDependencies` (consumers provide React 19)
- **No circular deps** between packages

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
| 30+ IDB store names (Tolom's idb-store.ts) | Domain-specific schema |
