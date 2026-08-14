# Tooling

Active contributors: themuuln

## Biome (lint + format)

Zer uses [Biome](https://biomejs.dev/) v2.2.0 for both linting and formatting.

Configuration in `biome.json`:
- Indent: 2 spaces
- Lint: recommended rules + Next.js + React domain rules
- VCS: enabled with git, uses `.gitignore`
- Organize imports on save

Commands:

```bash
pnpm lint          # biome check
pnpm format        # biome format --write
```

Pre-commit hooks run Biome on staged files via lint-staged:
```json
{
  "*.{ts,tsx,js,jsx,mjs,cjs}": ["biome check --no-errors-on-unmatched"],
  "*.{json,css,md}": ["biome check --no-errors-on-unmatched"]
}
```

Biome overrides relax rules for UI components (`src/components/ui/`):
- `noExplicitAny` off
- `noArrayIndexKey` off
- `noDangerouslySetInnerHtml` off
- Accessibility rules off

## Next.js 16 Turbopack

The dev server runs on Next.js 16.2.6 with Turbopack:

```bash
pnpm dev    # next dev
pnpm build  # next build
pnpm start  # next start
```

## pnpm (package manager)

The project uses pnpm as the package manager. All dependency scripts should use pnpm commands.

```bash
pnpm install   # Install dependencies
pnpm add <pkg> # Add a dependency
pnpm update    # Update dependencies
```

## Husky git hooks

Husky v9 handles pre-commit hooks. On commit, lint-staged runs Biome check on staged files.

```bash
pnpm prepare  # Install husky (runs automatically on pnpm install)
```

## TypeScript strict mode

TypeScript is configured in strict mode. Key settings from `tsconfig.json`:

- `strict: true`
- `noUncheckedIndexedAccess: true`
- `noUnusedLocals: true`
- `noUnusedParameters: true`
- `exactOptionalPropertyTypes: false`
- Path aliases: `@/*` maps to `src/*`

TypeScript version: ^5.9.3

```bash
pnpm typecheck  # tsc --noEmit
```

## Additional tools

| Tool | Purpose |
|------|---------|
| `vitest` | Unit testing framework (v3.2.6) |
| `@playwright/test` | E2E testing framework (v1.61.0) |
| `@midscene/web` | AI-assisted test selectors for Playwright |
| `codeceptjs` | Alternative E2E framework with AI healing |
| `@axe-core/playwright` | Accessibility testing |
| `react-grab` | UI element grabbing tool |
| `dotenv` | Environment variable loading |
| `wait-on` | Wait for resources before tests |

## Validation commands

```bash
# Full validation suite
pnpm typecheck   # TypeScript check
pnpm lint        # Biome lint
pnpm format      # Biome format
pnpm test        # Vitest unit tests

# CI pipeline
pnpm test:ci     # typecheck + unit + E2E + a11y
```
