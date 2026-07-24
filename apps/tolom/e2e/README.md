# Tolom E2E Testing

## Commands

```bash
pnpm test:e2e                    # Run all E2E tests
pnpm test:e2e --grep "pattern"   # Run matching tests
```

## Key Rules

1. **Always use production build for E2E** — dev mode lazily compiles (8-9s first request)
2. **Tests are mocked by default** — external services blocked
3. **Co-located fixtures** — `tests/fixtures/` or `e2e/fixtures/`
4. **Resource blocking** — block analytics, external APIs in test setup
5. **Parallel sharding** — tests can run in parallel unless they share state
6. **Auth setup** — `auth.setup.ts` handles login before test suite

## Test Structure

```
e2e/
├── *.spec.ts          # Test files
├── fixtures/          # Shared test data
├── helpers/           # Test utilities
└── auth.setup.ts      # Auth configuration
```

## Writing Tests

- Use `page` from Playwright fixtures
- Prefer data-testid selectors over text selectors
- Wait for network idle before asserting
- Use `expect` for assertions, not manual checks
