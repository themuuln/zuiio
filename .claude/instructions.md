# Zuiio — AI Agent Instructions

You are coding on the **@zuiio** monorepo. Before starting any task, you MUST read the following files to understand the project's design system, stack conventions, and vision.

## Required reading (at session start)

| File | What it contains | Priority |
|------|------------------|----------|
| `AGENTS.md` | Project structure, package map, TypeScript conventions, monorepo rules | **Always** |
| `docs/design.md` | OKLch color tokens, typography scale, spacing, shadows, motion, component conventions, voice & tone | **Always** |
| `docs/vision.md` | Product vision, how we build, what we won't do | **Always when building features** |
| `docs/stack-web.md` | Next.js 16 config, Instant Navigations, Turbopack settings | **When working on web apps** |
| `docs/stack-mobile.md` | React Native + Expo recommended stack | **When working on mobile apps** |
| `templates/boilerplate/README.md` | Package-by-package rationale for mobile stacks | **When scaffolding new apps** |
| `apps/zer/AGENTS.md` | Zer-specific conventions (HR, accounting) | **When working in apps/zer** |
| `apps/tolom/AGENTS.md` | Tolom-specific conventions (repair shop) | **When working in apps/tolom** |

## Design system essentials (in brief)

These are the most-used rules. See `docs/design.md` for full reference.

- **Colors**: Always OKLch. Violet `oklch(0.50 0.26 275)` primary, Teal `oklch(0.70 0.16 195)` accent. Never raw hex.
- **Spacing**: 4px base unit. Multiples only: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96.
- **Typography**: Geist Sans (UI), Instrument Serif (display), Geist Mono (code).
- **Motion**: Never animate `width`/`height` — use `transform` + `opacity`. Respect `prefers-reduced-motion`.
- **Radius**: sm 4px, md 8px (default), lg 12px, xl 16px.
- **Icons**: `@phosphor-icons/react`, `regular` weight default, `fill` for active states.
- **Surfaces**: 3-layer — base (background), raised (card+shadow-sm), floating (popover+shadow-lg).
- **Mongolian**: Full Mongolian (Cyrillic) UI. Locale `mn_MN`.

## Common patterns

- UI components live in each app's `src/components/`, not in `@zuiio/ui`. `@zuiio/ui` is for pure utility components only (HighlightText, formatting helpers).
- Framework-agnostic logic → `@zuiio/core`. React hooks → `@zuiio/hooks`. Mongolian payroll → `@zuiio/hr`.
- Runtime deps go in `dependencies`, not `peerDependencies` (private monorepo).
- `noUncheckedIndexedAccess: true` — always account for `undefined` on indexed access.
- `file:` protocol for consumers: `"@zuiio/core": "file:../zuiio/packages/core"`.
- `pnpm exec tsc --noEmit` to type-check all packages together.

## Runtime verification (applies to all Next.js apps)

- **After every edit that changes UI or behavior**, verify the page still works at runtime using the `next-dev-loop` skill.
- The skill cross-checks `/_next/mcp` (Next.js framework view: compilation, routes, server errors) against `agent-browser` (real Chrome: DOM, console, network, React fiber).
- Requires: `next dev` running with Turbopack, and `agent-browser >= 0.31.1`.
- Check: compiles, runs without errors, behaves as intended, no React-level regressions.
