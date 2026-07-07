# @zuiio/config

Shared TypeScript configuration extended by all packages in the monorepo.

## Exports

| File | Purpose |
|------|---------|
| `tsconfig.json` | Base TypeScript config with strict settings |
| `tsconfig.base.json` | Minimal base config |

## Usage

Every package extends this config:

```json
// packages/core/tsconfig.json
{
  "extends": "@zuiio/config/tsconfig"
}
```

## Key Settings

- `strict: true`
- `noUncheckedIndexedAccess: true`
- `noEmit: true` (type-checking only)
- `incremental: true`

## Conventions

- **All packages must extend** `@zuiio/config/tsconfig`
- **Never modify** `tsconfig.base.json` without updating all consumers
- **Type-check all packages**: `pnpm exec tsc --noEmit` from monorepo root
