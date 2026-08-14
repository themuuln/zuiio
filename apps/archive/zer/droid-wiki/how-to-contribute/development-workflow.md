# Development workflow

Active contributors: themuuln

## Git workflow

Zer uses a simple Git workflow with a single main branch. All development happens directly on main with working tree modifications.

- **main** — The default and only branch. Always deployable.
- **Working tree** — Changes are made directly on the working tree. No feature branches or pull requests are used in the current workflow.

## Commit style

Commits follow conventional commit format:

```
type(scope): description
```

Types used in this project:

| Type | Usage |
|------|-------|
| `feat` | New feature |
| `fix` | Bug fix |
| `refactor` | Code restructuring |
| `chore` | Build, tooling, dependencies |
| `docs` | Documentation |
| `test` | Tests |
| `perf` | Performance improvement |

Examples from the commit history:

```
feat: add barcode scanner button to new sale product selector
fix: resolve TypeScript build errors across multiple files
fix: add missing barcode and image_url fields
```

## Before committing

Run the validation suite:

```bash
pnpm typecheck    # TypeScript strict mode check
pnpm lint         # Biome lint
pnpm format       # Biome format
pnpm test:unit    # Vitest unit tests
```

Husky pre-commit hooks run Biome check on staged files. If hooks fail, fix the reported issues and try again.

## Development cycle

1. Make changes directly on the working tree.
2. Run validation checks listed above.
3. Commit with a descriptive conventional-commit message.
4. Push to the remote.

## Hotfixes

Hotfixes follow the same process: fix on the working tree, commit, push. No separate hotfix branches.
