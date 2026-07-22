# Оноо — Basketball Operating System

**Mongolia's first end-to-end basketball platform.** Trusted game records, live statistics, player development, league operations, and athlete storytelling — all in one system.

> Баскетболын үйл ажиллагааны бүрэн систем. Тоглолтын найдвартай бүртгэл, шууд статистик, тоглогчийн хөгжил, лигийн үйл ажиллагаа.

---

## What is Onoo?

Onoo connects the full basketball lifecycle:

| For | Onoo delivers |
|-----|---------------|
| **Leagues** | Trusted game records, verified statistics, audience dashboards, sponsorship proof |
| **Teams & clubs** | Roster management, game tracking, season analytics, operational tools |
| **Academies** | Program management, enrollment, attendance, player development tracking |
| **Players** | One trusted identity across competitions, shareable athlete profiles, career history |
| **Families & fans** | Live scores, player stats, standings, game recaps — free, no signup |
| **Scorekeepers** | Mobile-first game tracker with offline support, revision workflow, paper fallback |
| **Scouts** | Verified career statistics, English export, athlete comparison |

---

## Design Philosophy

Onoo's visual language is **dark, powerful, and broadcast-inspired** — a near-black canvas that makes every stat feel like a highlight-reel moment.

- **Color:** Vibrant orange primary × purple secondary on a dark canvas
- **Typography:** Oswald (condensed athletic), Inter (clean Cyrillic), JetBrains Mono (tabular stats)
- **Philosophy:** Stats as story, not spreadsheet

→ [Full design system →](docs/DESIGN.md)

---

## Current Roadmap

### Phase 1 — Trusted data foundation ✅ *(in progress)*
Clean V2 schema, event journal with proven provenance, revisioned approval workflow, durable tracker with offline support, command-authorized mutations, game-day runbook.

### Phase 2 — Player showcase 🟡 *(active)*
Hero identity card with animated stat numbers, season arc charts, photo/logo onboarding kit, player comparison, team identity pages, consent & takedown.

### Phase 3 — Discovery & league surfaces
Home page with tonight's games, redesigned standings with form guide, visual leader podiums, player comparison, team pages with roster grid.

### Phase 4 — Shareability & reach
Shareable game recaps, embeddable player cards, English export for scouts, SEO, sponsor placements.

### Phase 5 — Live experience
Live game center with real-time scores, play-by-play feed, live stat lines via Supabase Realtime.

### Phase 6 — Shop & commerce
Merchandise catalogue, checkout, payment integration (QPay).

### Phase 7 — Team insights
Read-only team analysis from trusted competition data — first team-facing module.

→ [Full roadmap with checkboxes →](docs/ROADMAP.md)

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

## Key Docs

| Document | What it covers |
|----------|---------------|
| [DESIGN.md](docs/DESIGN.md) | Color system, typography, components, motion |
| [VISION.md](docs/VISION.md) | Product vision, design principles, success measures |
| [ROADMAP.md](docs/ROADMAP.md) | Feature roadmap by phase with completion tracking |
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | System architecture, data flow, security model |
| [gaps.md](docs/gaps.md) | Feature gap analysis and prioritization |
| [runbook.md](docs/runbook.md) | Game-day operational procedures |
| [tasks/](docs/tasks/INDEX.md) | Detailed implementation tasks by phase |
| [plans/](docs/plans/) | Execution specs with file paths, steps, done-criteria |
| [features/](docs/features/) | Deep-dive feature research and design docs |

---

## Status

**Phase:** League-first paid pilot
**Platform:** Web-first (mobile native deferred)
**Region:** Mongolia — Улаанбаатар

_Last updated: 2026-07-22_
