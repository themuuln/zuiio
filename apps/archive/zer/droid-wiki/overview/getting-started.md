# Getting started

## Prerequisites

- Node.js 20+
- pnpm (recommended) or npm
- Supabase CLI (for local development)

## Setup

```bash
git clone <repo-url>
cd zer
pnpm install
```

## Supabase setup

Copy `.env.local.example` to `.env.local` and fill in your Supabase project credentials.

```bash
# Start local Supabase (optional)
npx supabase start

# Or link to an existing project
npx supabase link --project-ref <project-ref>
npx supabase db push
```

## Run the dev server

```bash
pnpm dev
# → http://localhost:3000
```

## Build for production

```bash
pnpm build
pnpm start
```

## Run tests

```bash
# TypeScript check
pnpm typecheck

# Unit tests (Vitest)
pnpm test:unit

# E2E tests (Playwright)
pnpm test:e2e

# All tests
pnpm test:all     # typecheck + unit + vitest
pnpm test:ci      # full CI suite including E2E
```

## Key scripts

| Script           | Purpose                         |
| ---------------- | ------------------------------- |
| `pnpm dev`       | Start dev server with Turbopack |
| `pnpm build`     | Production build                |
| `pnpm lint`      | Biome check                     |
| `pnpm format`    | Biome format                    |
| `pnpm typecheck` | TypeScript check                |
| `pnpm test:unit` | Unit tests                      |
| `pnpm test:e2e`  | Playwright E2E tests            |
| `pnpm test:ci`   | Full CI suite                   |
