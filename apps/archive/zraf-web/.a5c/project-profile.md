# Project Profile: ZRAf

Mongolian driving theory exam prep app — practice questions, mock exams, progress tracking. Client-side only with localStorage persistence.

> Last updated: 2026-06-04T09:23:51.000Z | Version: 1

## Goals

- **productivity** [high]: Ship to tester quickly for feedback (active)
- **quality** [high]: Deploy on Vercel for 1-person testing (active)
- **quality** [high]: Optimize static assets to fit Vercel deployment limits (active)

## Tech Stack

### Languages

- TypeScript (primary)
- CSS (styling)

### Frameworks

- Next.js v16.2.6 [meta-framework]
- React v19.2.4 [UI library]
- Tailwind CSS v4 [utility CSS]
- React Compiler v1.0.0 [build optimization]

### Infrastructure

- Vercel [hosting]

**Build tools:** Next.js (Turbopack), PostCSS

**Package managers:** pnpm

## Architecture

**Pattern:** client-side SPA with static data
**Data flow:** Static JSON → fetch() → LearningEngine → React context → Screens → localStorage

### Modules

| Module | Path | Description |
|--------|------|-------------|
| app | `src/app` | Next.js App Router pages |
| components | `src/components` | 8 screen components + app shell |
| hooks | `src/hooks` | use-learning context provider |
| lib | `src/lib` | Core logic modules |
| data | `public/data` | Static JSON question bank + images |

**Entry points:** `src/app/layout.tsx`, `src/app/page.tsx`

## Team

- **Temuulen** (Solo developer): Full-stack development, Design, Deployment

## Workflows

### development

Local dev
**Triggers:** manual

1. pnpm dev
2. Edit
3. Biome check

### deploy

Push to main triggers Vercel deploy
**Triggers:** git push main

### trunk-based

Work on main, feature branches for bigger changes

## Tools

### Linting

- Biome

### Formatting

- Biome

## CI/CD


## Pain Points

- **medium** [quality]: No test suite
  - Remediation: Add Vitest + Playwright for E2E
- **high** [devops]: Deployment size exceeds Vercel free tier (178MB > 100MB)
  - Remediation: Clean unused assets, compress images
- **low** [devops]: No CI/CD

## Bottlenecks

- Single commit codebase — no granular history at repo-wide
  Impact: Hard to trace feature evolution

## Conventions

### Naming

- **components:** kebab-case files, PascalCase exports
- **hooks:** use-*.tsx
- **lib:** kebab-case

**Import order:** @/ aliases > external

**Error handling:** try-catch with silent fallback

**Testing:** None configured

### Additional Rules

- React Compiler enabled
- suppressHydrationWarning
- All client-side, no RSC

## Repositories

- **undefined** - local [`/Users/themuuln/coding/personal/zraf-web`]

## CLAUDE.md Instructions

- Ship to 1-person tester on Vercel quickly
- Trunk-based workflow
- Autonomous mode
- Vercel deployment target — watch asset sizes
- No CI/CD for now
- No tests — add when ready
- Biome for linting and formatting

## Installed Extensions

- Processes: cradle/project-install
