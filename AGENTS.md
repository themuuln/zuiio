# @zuiio — Project Instructions (for AI agents)

> **⚠️ Required reading for AI agents:** Before writing any code, load these files for full context:
>
> 1. `docs/design.md` — design tokens (OKLch colors, typography, spacing, motion, component conventions)
> 2. `docs/vision.md` — product vision and how we build
> 3. `docs/stack-web.md` — Next.js 16 stack (when working on web apps)
> 4. `docs/stack-mobile.md` — React Native + Expo stack (when working on mobile apps)
>
> You MUST read these before starting any significant task. This file (`AGENTS.md`) covers project structure, package map, and conventions.

**Private monorepo** serving Mongolian business apps: **Zer** (SMB ERP), **Tolom** (auto repair shop management), and the **Zuiio company website**.

## Directory Structure

```
zuiio/
├── packages/        ← 12 shared @zuiio/* packages
├── apps/
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

## Tasks (Agent Router)

Use this section to find the right context for your task. Read the linked file before proceeding.

### Working on an app

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
| `branding` | zer, tolom | OKLch design tokens, globals.css |
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
