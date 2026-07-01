# @zuiio — Shared Packages for Zer + Tolom

**Private monorepo** (`/Users/themuuln/coding/personal/zuiio/`) serving two Mongolian business apps: **Zer** (HR + accounting) and **Tolom** (auto repair shop management).

## Packages

| Package | Layer | Description | Dependencies |
|---------|-------|-------------|--------------|
| `config` | Build | Shared tsconfig extended by all packages | — |
| `core` | Framework-agnostic | Formatting, validation, errors, timezone, domain rules, UUID, form validation | date-fns |
| `hooks` | React | Generic hooks: useDebounce, useDisclosure, useCopyToClipboard, etc. | react |
| `query` | React/Next | React Query provider + optimistic CRUD hooks (FormData + JSON) | @tanstack/react-query, react |
| `realtime` | React/Next | Supabase Realtime hooks: useRealtime, useRealtimeMulti | @supabase/supabase-js, @tanstack/react-query, react |
| `ui` | React | HighlightText, toastRetry, form input props, Mongolian phone/plate formatting | react, sonner |
| `offline` | Framework-agnostic | Mutation queue engine, IndexedDB persister, useOfflineMutation | idb, react |
| `hr` | Framework-agnostic | Mongolian payroll: income tax, social insurance, overtime, salary | — |
| `export` | Framework-agnostic | CSV, XLSX (ExcelJS), DOCX (docx), PDF (pdf-lib) generation + serveEntityExport | exceljs, docx, pdf-lib, @pdf-lib/fontkit |

## Consumer Projects

```
zuiio/           ← this repo
├── packages/    ← 9 shared packages
zer/             ← sibling repo, uses 7 packages
tolom/           ← sibling repo, uses 7 packages
```

Both consumers use `file:` protocol for cross-monorepo dependencies:
```json
"@zuiio/core": "file:../zuiio/packages/core"
```

## Conventions

### Adding a new function/utility

1. **Framework-agnostic, no React** → `@zuiio/core` or a new package
2. **React hook** → `@zuiio/hooks` (generic) or `@zuiio/query` (TanStack Query)
3. **Mongolian business logic** → `@zuiio/core/src/domain-rules.ts` (validation) or `@zuiio/hr` (payroll)
4. **UI component** → Not here. UI lives in each project's `src/components/`. Only pure utilities go in `@zuiio/ui`

### Package structure

Every package follows:
```
packages/<name>/
├── package.json      # name: "@zuiio/<name>", main: "./src/index.ts"
├── tsconfig.json     # extends "@zuiio/config/tsconfig"
└── src/
    ├── index.ts      # Public barrel — only export what consumers need
    └── *.ts          # Implementation files
```

### TypeScript

- Strict mode (via `@zuiio/config/tsconfig`)
- `noUncheckedIndexedAccess: true`
- All packages checked together: `pnpm exec tsc --noEmit`

### Dependencies

- **Runtime deps** go in `dependencies` (not `peerDependencies`) — this is a private monorepo
- **React packages**: `react` + `@types/react` in `devDependencies` (consumers provide React 19)
- **No circular deps** between packages

## Commands

```bash
pnpm install                # Install all deps
pnpm exec tsc --noEmit      # Type-check all packages
pnpm test                   # Run tests (in packages with vitest)
```

## What NOT to put here

| Leaves in project | Why |
|-------------------|-----|
| Domain-specific DB adapters (hr-supabase) | Schema-dependent |
| UI components (Buttons, Drawers, Tables) | Each project has its own design system |
| Supabase client config | Project-specific auth + keys |
| i18n translation files | Project-specific copy |
| Branding/theming | Project-specific visual identity |
| 30+ IDB store names (Tolom's idb-store.ts) | Domain-specific schema |
