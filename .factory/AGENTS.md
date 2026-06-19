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
- Load `shadcn-patterns` or `base-ui-patterns` SKILL.md before editing UI components, depending on which library the component uses

## Skills & Auto-Invocation

The following skills are installed and should be automatically invoked via `Skill(<name>)` when working on related tasks:

| Skill | Auto-Trigger Condition |
|---|---|
| `react-nextjs-patterns` | Whenever building React/Next.js features — use for composition, hooks, memoization, code splitting, error boundaries |
| `shadcn-patterns` | When working with shadcn/ui components — forms, dialogs, tables, theming, toasts |
| `base-ui-patterns` | When working with Base UI (`@base-ui/react`) components — unstyled compound components, render props, data-attribute styling, animation patterns |
| `supabase-patterns` | When writing database queries, auth logic, RLS policies, real-time subscriptions, or storage code |
| `tailwind-patterns` | When styling UI — responsive design, dark mode, layouts, typography, animations |
| `frontend-design` | When starting a new page, layout, or app — injects aesthetic direction before any code is written |
| `nextjs-log-analyzer` | When the user shares server log timing output or reports slow routes |
| `web-tester` | When the user asks to run performance tests, benchmarks, or "auto test" |
| `ai-slop-remover` | After generating or editing TSX/TS files — clean up verbose comments, redundant error handling, over-engineered patterns |
| `shadcn` | When installing new shadcn/ui components — provides CLI commands and setup |

**Policy**: When the session task matches an auto-trigger condition above, invoke the skill automatically before proceeding. Do not wait for the user to ask.

## Profile-Specific Hooks
- `biome format --write` runs automatically on .ts/.tsx/.js/.jsx file edits (PostToolUse)

## Active MCPs
- supabase — DB queries and schema inspection
- shadcn — Component installation and updates
- playwright — E2E testing
- vercel — Deployment management
