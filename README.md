# @zuiio — Mongolian Business Software

**Private monorepo** serving two Mongolian business apps: **Zer** (SMB ERP) and **Tolom** (auto repair shop management), plus the **Zuiio company website**.

```
zuiio/
├── apps/
│   └── website/       ← Company website (Next.js 16, Tailwind v4, shadcn/ui)
├── packages/          ← 10 shared packages
│   ├── branding/      ← Design tokens (OKLch colors, typography, spacing)
│   ├── config/        ← Shared tsconfig
│   ├── core/          ← Formatting, validation, timezone, domain rules
│   ├── export/        ← CSV, XLSX, DOCX, PDF generation
│   ├── hooks/         ← Generic React hooks
│   ├── hr/            ← Mongolian payroll: tax, insurance, overtime
│   ├── offline/       ← Mutation queue engine, IndexedDB persister
│   ├── query/         ← React Query provider + optimistic CRUD hooks
│   ├── realtime/      ← Supabase Realtime hooks
│   └── ui/            ← Pure utility components (HighlightText, formatting)
├── templates/         ← Project boilerplate (React Native starter)
├── docs/              ← Design system, stacks, vision
├── README.md
└── AGENTS.md          ← Project instructions (used by pi)
```

## Quick start

```bash
pnpm install
pnpm exec tsc --noEmit   # Type-check all packages
pnpm test                # Run tests (packages with vitest)
```

### Website

```bash
cd apps/website
pnpm dev                 # next dev --turbopack (http://localhost:3000)
pnpm build               # next build
```

## Design system

[`docs/design.md`](docs/design.md) — full reference for OKLch colors, fluid typography, motion, spacing, and component conventions. All tokens are defined in [`packages/branding/globals.css`](packages/branding/globals.css).

## Consumers

```
zer/                     ← sibling repo, uses @zuiio/* packages
tolom/                   ← sibling repo, uses @zuiio/* packages
```

Both consume via `file:` protocol:

```json
"@zuiio/core": "file:../zuiio/packages/core"
```

Each consumer clones as a sibling directory of `zuiio/` and references shared packages without publishing to npm.
