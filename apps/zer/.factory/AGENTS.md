# Next.js Profile

Auto-loaded when working in a Next.js project.

## Stack

- **Framework**: Next.js 15+ App Router
- **Database**: Supabase (PostgreSQL)
- **UI**: shadcn/ui (with Base UI `@base-ui/react` support) + Tailwind CSS v4
- **State**: React Query for server state
- **Forms**: react-hook-form + zod
- **Package Manager**: pnpm

## Commands

- `pnpm dev` — Start dev server
- `pnpm build` — Production build
- `pnpm test` — Run tests
- `pnpm validate:types` — TypeScript check
- `pnpm validate:lint` — Lint check

## Coding Conventions

- Server Components by default, client components only when needed
- kebab-case for files, PascalCase for components
- Semantic color tokens only (`bg-primary`, `text-muted-foreground`)
- Optimistic UI for all mutations (React Query onMutate → onError → onSettled)
- i18n: always update both locale files
- Before editing UI components, invoke the matching skill (`shadcn-patterns` or `base-ui-patterns`) — the skill contains mandatory doc-fetching instructions

## Documentation-First Coding (NON-NEGOTIABLE)

Before writing ANY code that uses an external library or framework, you MUST fetch current docs. Training data is stale — API signatures, conventions, and patterns change between versions. Skipping this step is the #1 source of bugs in AI-generated code.

### Next.js

1. CALL `context7___resolve-library-id` with query "next.js app router"
2. CALL `context7___query-docs` with the resolved ID and your specific query
3. READ `node_modules/next/dist/docs/` for version-specific deprecation notices
4. Only then write code

### Supabase

1. FETCH `https://supabase.com/changelog.md` and scan for `breaking-change` tags
2. CALL `context7___resolve-library-id` with query "supabase javascript"
3. CALL `context7___query-docs` with the resolved ID and your specific query
4. Only then write code

### shadcn/ui

1. CALL `shadcn___view_items_in_registries` with the component names
2. CALL `shadcn___get_item_examples_from_registries` for usage examples with full code
3. CALL `context7___resolve-library-id` + `context7___query-docs` for shadcn/ui patterns
4. Only then write code

### Base UI (`@base-ui/react`)

1. CALL `context7___resolve-library-id` with query "base-ui react @base-ui/react"
2. CALL `context7___query-docs` with the resolved ID and component query
3. Only then write code

### TanStack Query

1. CALL `context7___resolve-library-id` with query "tanstack react query"
2. CALL `context7___query-docs` with the resolved ID and your specific query
3. Only then write code

Agents that skip live-doc fetching WILL generate code with deprecated or incorrect API patterns. This rule is MANDATORY for ALL library code.

## Skills & Auto-Invocation

The following skills are installed and should be automatically invoked via `Skill(<name>)` when working on related tasks:

| Skill                   | Auto-Trigger Condition                                                                                                                           |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `react-nextjs-patterns` | Whenever building React/Next.js features — use for composition, hooks, memoization, code splitting, error boundaries                             |
| `shadcn-patterns`       | When working with shadcn/ui components — forms, dialogs, tables, theming, toasts                                                                 |
| `base-ui-patterns`      | When working with Base UI (`@base-ui/react`) components — unstyled compound components, render props, data-attribute styling, animation patterns |
| `supabase-patterns`     | When writing database queries, auth logic, RLS policies, real-time subscriptions, or storage code                                                |
| `tailwind-patterns`     | When styling UI — responsive design, dark mode, layouts, typography, animations                                                                  |
| `frontend-design`       | When starting a new page, layout, or app — injects aesthetic direction before any code is written                                                |
| `nextjs-log-analyzer`   | When the user shares server log timing output or reports slow routes                                                                             |
| `web-tester`            | When the user asks to run performance tests, benchmarks, or "auto test"                                                                          |
| `ai-slop-remover`       | After generating or editing TSX/TS files — clean up verbose comments, redundant error handling, over-engineered patterns                         |
| `shadcn`                | When installing new shadcn/ui components — provides CLI commands and setup                                                                       |

**Policy**: When the session task matches an auto-trigger condition above, invoke the skill automatically before proceeding. Do not wait for the user to ask.

## Profile-Specific Hooks

- `biome format --write` runs automatically on .ts/.tsx/.js/.jsx file edits (PostToolUse)

## Active MCPs

- supabase — DB queries and schema inspection
- shadcn — Component installation and updates
- playwright — E2E testing
- vercel — Deployment management
