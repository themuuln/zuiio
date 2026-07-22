# Оноо — Basketball Operating System

**Mongolia's first end-to-end basketball platform.** Trusted game records, live statistics, player development, league operations, and athlete storytelling — all in one system.

> Баскетболын үйл ажиллагааны бүрэн систем. Тоглолтын найдвартай бүртгэл, шууд статистик, тоглогчийн хөгжил, лигийн үйл ажиллагаа.

---

## Brandbook & Design System

> [Full design system documentation →](docs/DESIGN.md)

Onoo's visual language is **dark, powerful, and broadcast-inspired** — a near-black canvas that makes every stat feel like a highlight-reel moment.

**Color palette:** Vibrant orange primary × purple secondary on a near-black canvas.
**Typography:** Oswald (condensed athletic), Inter (clean Cyrillic), JetBrains Mono (tabular stats).
**Philosophy:** Stats as story, not spreadsheet. Every number feels like a highlight reel.

The design system covers:
- Color system with full OKLch token tables
- Surface hierarchy (card, elevated, hovered)
- Typography scale and usage rules
- Spacing, border radius, shadow system
- Motion tokens and animation patterns
- Component patterns (shadcn/ui on Base UI)
- Sport-specific components (player hero card, court motif, live game center)
- Player showcase — Onoo's signature surface

---

## Features

> [Complete features list with status →](docs/FEATURES.md)

### Shipped — What's Live Now

| Area | Features |
|------|----------|
| **Player profiles** | Hero card with animated stats, season arc charts, shooting profile, career milestones, radar vs league average, game summaries, stat error reporting |
| **Teams** | Team pages with roster grid, photo/logo onboarding, player placeholders |
| **Standings & leaders** | League standings, visual leader podiums |
| **Game tracking** | Offline-first tracker, append-only event journal, auto box score derivation |
| **Trust & accuracy** | Evidence-backed corrections, verified projections, command-authorized mutations, tenant-isolated RLS |
| **Design** | Dark-first theme, 360px responsive, Mongolian-first UI, cold-start empty states |

### In Progress

Ruleset-bound vocabulary, tracker handoff UI, ops console, consent & takedown, integration tests.

### Up Next

Game recaps, shareable stat cards, OG images, sponsor placements, awards & MVP races, live game center, standings redesign, player comparison, search, SEO.

### Backlog

Team operations, academy management (student enrollment, attendance, payments, guardians), unified athlete journey, federation network.

---

## Product Vision

Onoo exists to give every basketball organization one operational system, every game a trusted record, and every athlete a continuous story from development to competition.

**Core promises:**

- **100% final-score accuracy** — zero unrecoverable tracker events
- **Zero gate on viewing** — every public surface is free, no login
- **Mongolian-first** — UI, stats, and summaries in Mongolian
- **Mobile-first** — every surface works at 360px width
- **Cold-start friendly** — every screen looks intentional with zero games
- **Private by default** — guardian, medical, and payment data never leaks

→ [Full vision document →](docs/VISION.md)

---

## Architecture

```
Tracker (journal) → Events → Commands → Derived tables → Public views → Public pages
```

- **Append-only** event journal — never delete or rewrite `stat_events`
- **Command-authorized** mutations — no direct browser writes to protected tables
- **Curated public views** (`v_public_*`) — public pages never read tables directly
- **Tenant-isolated** — every row scoped to organization or league

→ [Full architecture doc →](docs/ARCHITECTURE.md)

---

## Technical Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript (strict) |
| UI | shadcn/ui + Tailwind CSS v4 |
| State | TanStack Query |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Mobile | Expo (planned) |

---

## All Docs

| Document | What it covers |
|----------|---------------|
| [📐 DESIGN.md](docs/DESIGN.md) | **Brandbook** — color system, typography, components, motion, player showcase |
| [✨ FEATURES.md](docs/FEATURES.md) | **Features** — shipped, in progress, up next, backlog |
| [🎯 VISION.md](docs/VISION.md) | Product vision, design principles, success measures, scope boundaries |
| [🗺️ ROADMAP.md](docs/ROADMAP.md) | Detailed roadmap by phase with completion tracking |
| [🏗️ ARCHITECTURE.md](docs/ARCHITECTURE.md) | System architecture, data flow, security model |
| [📋 gaps.md](docs/gaps.md) | Feature gap analysis and prioritization |
| [📖 runbook.md](docs/runbook.md) | Game-day operational procedures |
| [📝 tasks/](docs/tasks/INDEX.md) | Detailed implementation tasks by phase |
| [📋 plans/](docs/plans/) | Execution specs with file paths, steps, done-criteria |
| [🔬 features/](docs/features/) | Deep-dive feature research and design docs |

---

## Status

**Phase:** League-first paid pilot
**Platform:** Web-first (mobile native deferred)
**Region:** Mongolia — Улаанбаатар

_Last updated: 2026-07-22_
