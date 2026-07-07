# Contributing to @zuiio

Welcome to the @zuiio monorepo. This guide covers development setup, workflows, and conventions.

## Quick Start

```bash
# Clone the monorepo
git clone --recursive <repo-url> zuiio
cd zuiio

# Install dependencies
pnpm install

# Start all apps in parallel
pnpm dev

# Type-check everything
pnpm exec tsc --noEmit
```

## Prerequisites

- **Node.js** 20+ (use `mise` or `fnm`)
- **pnpm** 9+ (corepack enable)
- **Git** with submodules support

## Monorepo Structure

```
zuiio/
├── apps/              ← Individual products (Next.js, Expo)
├── packages/          ← Shared @zuiio/* packages
├── docs/              ← Design system, architecture, deployment
├── AGENTS.md          ← AI agent instructions
└── CONTRIBUTING.md    ← This file
```

## Development Workflow

### 1. Working on an app

```bash
cd apps/<app-name>
pnpm dev              # Start dev server
```

Each app has its own `AGENTS.md` with specific rules. **Read it before coding.**

### 2. Working on a shared package

```bash
cd packages/<package-name>
# Edit src/*.ts
# The package is consumed via workspace:* — changes are immediate
```

Each package has `AGENTS.md` and `README.md`. Read both before modifying.

### 3. Adding a new package

1. Create `packages/<name>/package.json` with `@zuiio/<name>` name
2. Create `src/index.ts` as the single export entry
3. Create `tsconfig.json` extending `@zuiio/config/tsconfig`
4. Create `README.md` with usage docs
5. Create `AGENTS.md` with AI agent docs
6. Add to consuming apps as `"@zuiio/<name>": "workspace:*"`

### 4. Adding a new app

1. Create `apps/<name>/` with Next.js or Expo
2. Add workspace dependency: `"@zuiio/core": "workspace:*"`
3. Create `AGENTS.md` with app-specific rules
4. Add to root `AGENTS.md` Apps table

## Conventions

### TypeScript

- **Strict mode** via `@zuiio/config/tsconfig`
- **`interface` over `type`** for object shapes
- **`as const` over `enum`**
- **Named exports only** (except Next.js `page.tsx`/`layout.tsx`)
- **No `any`** — use `unknown` and narrow

### Git

- **Conventional commits**: `feat:`, `fix:`, `docs:`, `chore:`
- **One logical change per commit**
- **Never force-push main/master**
- **Run diagnostics before pushing**: `pnpm exec tsc --noEmit && pnpm lint`

### Code Style

- **Biome** formatter (tabs, double quotes)
- **Semantic color tokens** only (`bg-primary`, `text-muted-foreground`)
- **4px spacing grid** — multiples of 4px only
- **`gap-*` with flex**, `size-*` when width == height

### UI

- **shadcn/ui** for components (Radix UI + Tailwind)
- **react-hook-form + zod** for forms
- **TanStack Query** for server state
- **Optimistic UI** for all user-facing mutations

### Testing

- **Vitest** for unit tests
- **Playwright** for E2E tests
- **Test files in same commit** as implementation
- **Test behavior**, not current state

## Package Guidelines

### What belongs in `@zuiio/*`

✅ **Good candidates:**
- Framework-agnostic utilities (formatting, validation, errors)
- React hooks used by 2+ apps
- Shared UI primitives (form inputs, toast utilities)
- Business logic shared between Zer and Tolom

❌ **Bad candidates:**
- App-specific components (buttons, drawers, tables)
- Supabase client config (project-specific)
- i18n translation files (app-specific)
- Domain-specific adapters (hr-supabase)

### Package structure

```
packages/<name>/
├── package.json      # name: "@zuiio/<name>"
├── tsconfig.json     # extends "@zuiio/config/tsconfig"
├── README.md         # Human-readable docs
├── AGENTS.md         # AI agent docs
└── src/
    ├── index.ts      # Public barrel — only export what consumers need
    └── *.ts          # Implementation files
```

## Debugging

### Error capture

```ts
import { capture, withDbCapture } from "@zuiio/capture";

// Generic error
capture(error, { context: "Dashboard query" });

// Supabase query (best — catches every path)
const { data, error } = await withDbCapture("getQuery",
  supabase.from("table").select("*")
);
```

### Runtime verification

After every edit that changes UI or behavior:
1. Check `pnpm dev` terminal for errors
2. Verify page renders correctly
3. Check browser console for warnings
4. Run `pnpm exec tsc --noEmit` for type errors

## AI Agents

This monorepo is optimized for AI coding agents. Key files:

| File | Purpose |
|------|---------|
| `AGENTS.md` | Root instructions, package map, conventions |
| `apps/*/AGENTS.md` | App-specific rules |
| `packages/*/AGENTS.md` | Package-specific rules |
| `packages/*/README.md` | Human-readable package docs |

**Before coding:**
1. Read the relevant `AGENTS.md` for your task
2. Check if the utility already exists in `@zuiio/*`
3. Follow the conventions in this file

**After coding:**
1. Update `AGENTS.md` if you added new exports
2. Update `README.md` if you changed public API
3. Run `pnpm exec tsc --noEmit && pnpm lint`

## Getting Help

- **Architecture questions**: Read `docs/ARCHITECTURE.md`
- **Design tokens**: Read `docs/DESIGN-SYSTEM.md`
- **Deployment**: Read `docs/DEPLOYMENT.md`
- **App-specific help**: Read the app's `AGENTS.md`
