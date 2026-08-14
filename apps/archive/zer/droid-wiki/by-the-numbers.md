# By the numbers

Active contributors: themuuln

_Data collected on 2026-06-21_

## Codebase size

### Lines of code by language

Estimated breakdown of the ~67,000 total lines across the project:

```mermaid
---
config:
  title: Lines of code by language
---
xychart-beta
  x-title "Language"
  y-title "Lines"
  y-min 0
  y-max 60000
  bars [
    {x: "TypeScript/TSX", y: 52000},
    {x: "SQL", y: 4136},
    {x: "CSS", y: 177},
    {x: "JSON", y: 200},
    {x: "Other (config, docs, etc.)", y: 10000}
  ]
```

### Source file counts

| Category | Count |
|----------|-------|
| Total source files (`src/`) | 434 |
| TypeScript (`.ts`) | 107 |
| TypeScript React (`.tsx`) | 325 |
| CSS files | 1 |
| Migration files (`.sql`) | 32 |
| Test files (Vitest, in `tests/`) | 20 |
| E2E spec files (Playwright, in `e2e/`) | 18 |

### Lines of code by directory

| Directory | Files | Lines |
|-----------|-------|-------|
| `src/app/` | 208 | 28,750 |
| `src/components/` | 164 | 25,703 |
| `src/lib/` | 58 | 8,496 |
| `src/hooks/` | 3 | 133 |
| `tests/` (unit tests) | 20 | 3,669 |
| `e2e/` (E2E tests) | 18+ | 3,129 |
| `supabase/migrations/` | 32 | 4,136 |

### Average file sizes

| Directory | Avg lines/file |
|-----------|---------------|
| `src/app/` | ~138 |
| `src/components/` | ~157 |
| `src/lib/` | ~146 |
| `src/hooks/` | ~44 |

## Git activity

- **Total commits**: 145
- **Commits in last 30 days** (2026-05-21 to 2026-06-21): **143**
- **Contributors**: 1 (Temuulen Undrakhbayar)
- **Repository age**: <2 weeks (first commit: 2026-05-22)

### Author distribution

| Author | Commits | Percentage |
|--------|---------|------------|
| Temuulen Undrakhbayar | 145 | 100% |

### Bot-attributed commits

All 145 commits are authored by Temuulen Undrakhbayar (`zerone.offical@gmail.com`). There are no bot-attributed commits in the commit history.

## Test coverage

- **Unit tests**: 20 files covering accounting, auth, commissions, contacts, CSV, discounts, domain rules, expenses, inventory, notifications, optimistic UI, products, reports, security, shopping cart, stock movements, suppliers.
- **E2E tests**: 18 spec files covering all major modules, CRUD operations, cross-area flows, role-based access, feature gating, accessibility.
- **Test-to-source ratio**: ~41 test files for ~434 source files (1:10.6).

## Technology splits

- **TypeScript/TSX**: ~78% of all code
- **SQL (migrations)**: ~6%
- **CSS**: ~0.3%
- **JSON config**: ~0.3%
- **Other (docs, config files, test files, etc.)**: ~15%
