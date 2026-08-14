# Testing

Active contributors: themuuln

Zer uses Vitest for unit tests and Playwright for end-to-end (E2E) tests. Tests are located in two directories:

- `tests/` — 20 Vitest unit test files
- `e2e/` — 18 Playwright E2E spec files plus helpers and setup

## Unit tests (Vitest)

### Location

All unit tests live in `tests/` at the project root. There are 20 test files covering:

| File | Coverage |
|------|----------|
| `accounting-isolation.test.ts` | Accounting data isolation |
| `adjustments.test.ts` | Stock adjustments |
| `auth.test.ts` | Authentication flows |
| `branch-helpers.test.ts` | Multi-branch helpers |
| `categories.test.ts` | Category CRUD |
| `commissions.test.ts` | Commission calculations |
| `contacts.test.ts` | Contact CRUD |
| `csv.test.ts` | CSV export/import |
| `discount-utils.test.ts` | Discount logic |
| `domain-rules.test.ts` | Domain-specific rules |
| `expenses.test.ts` | Expense CRUD |
| `inventory.test.ts` | Inventory operations |
| `notification.test.ts` | Notification config |
| `optimistic.test.ts` | Optimistic UI helpers |
| `products.test.ts` | Product CRUD |
| `reports.test.ts` | Report generation |
| `security.test.ts` | Security edge cases |
| `shop-cart.test.ts` | Shopping cart logic |
| `stock-movements.test.ts` | Stock movement tracking |
| `suppliers.test.ts` | Supplier CRUD |

### Running unit tests

```bash
# Run all unit tests
pnpm test

# Run with watch mode
pnpm test:watch

# Run with UI
pnpm test:ui

# Run with coverage
pnpm test:coverage

# Run using tsx directly
pnpm test:unit
```

### Test setup

Unit tests use `jsdom` for DOM simulation and `@testing-library/react` for component testing. The Vitest configuration is in `vitest.config.ts` (or `.vitest/` directory) with `@vitejs/plugin-react` and `vite-tsconfig-paths`.

## E2E tests (Playwright)

### Location

E2E tests live in `e2e/` with 18 spec files:

| File | Coverage |
|------|----------|
| `accounting.spec.ts` | Accounting module flows |
| `app-smoke.spec.ts` | App smoke test |
| `cross-area-flows.spec.ts` | Cross-module integration |
| `crud-categories.spec.ts` | Category CRUD |
| `crud-customers.spec.ts` | Customer CRUD |
| `crud-expenses.spec.ts` | Expense CRUD |
| `crud-products.spec.ts` | Product CRUD |
| `crud-suppliers.spec.ts` | Supplier CRUD |
| `feature-gating.spec.ts` | Feature gating tests |
| `notification-settings.spec.ts` | Notification settings |
| `org-members.spec.ts` | Org member management |
| `restock-and-new-features.spec.ts` | Restock flows |
| `restock-deep-flows.spec.ts` | Deep restock scenarios |
| `roles-permissions.spec.ts` | Roles and permissions |
| `security-fixes.spec.ts` | Security regression tests |
| `seed.spec.ts` | Seed data tests |
| `sidebar-navigation.spec.ts` | Sidebar nav tests |
| `test-post-save.spec.ts` | Post-save assertions |

Additionally, `e2e/a11y/` contains accessibility tests using `@axe-core/playwright`.

There is also `e2e/codeceptjs/` directory with CodeceptJS-based AI-assisted tests. These use the CodeceptJS framework with AI healing capabilities rather than Playwright directly.

### Authentication setup

The `e2e/auth.setup.ts` file handles authentication for all E2E tests:

- Reads `E2E_EMAIL` and `E2E_PASSWORD` from environment (falls back to dev credentials).
- Logs in via the login form at `/login`.
- Waits for redirect away from `/login`.
- Saves authenticated storage state to `.auth/user.json`.
- The Playwright config uses a "setup" project that runs before all other tests and shares the authenticated state via `storageState`.

### Shared helpers

`e2e/helpers.ts` provides three reusable helper functions:

- **`openDrawerByText(page, text)`** — Opens a Base UI drawer by clicking the button containing the given text. Uses `page.evaluate` to reliably click through Base UI portals and Radix Slot wrappers.
- **`submitDrawerForm(page, formId)`** — Submits a form inside a Base UI drawer by dispatching a native submit event on the form element. Waits for drawer animation first (1500ms), then waits for server response (3000ms).
- **`setFormField(page, id, value)`** — Sets a form field value using the native value setter + dispatchEvent pattern to ensure React Hook Form captures the change. Dispatches both `input` and `change` events.

### Fixture

`e2e/fixture.ts` exports a custom Playwright test fixture that integrates Midscene AI for AI-assisted element selectors:

```ts
export const test = base.extend(PlaywrightAiFixture({
  waitForNetworkIdleTimeout: 2000,
}));
```

This allows tests to use AI-powered selectors when traditional selectors are difficult.

### Running E2E tests

```bash
# Run all E2E tests
pnpm test:e2e

# Smoke tests only
pnpm test:e2e:smoke

# Navigation tests
pnpm test:e2e:nav

# Accessibility tests
pnpm test:e2e:a11y

# All E2E tests (excluding codeceptjs, fixture, seed, midscene)
pnpm test:e2e:all

# AI-assisted CodeceptJS tests
pnpm test:e2e:ai

# CI suite (typecheck + unit + all E2E + a11y)
pnpm test:ci
```

### Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `E2E_EMAIL` | `themuuln1@gmail.com` | Test user email |
| `E2E_PASSWORD` | `Tolom!11` | Test user password |
| `PLAYWRIGHT_BASE_URL` | `http://localhost:3000` | App base URL |
| `SHOW_BROWSER` | unset | Show browser UI when set |
| `MIDSCENE_MODEL_*` | — | Midscene AI model config |

### Playwright config

The Playwright configuration (`playwright.config.ts`):

- Test directory: `./e2e`
- Ignored: `**/codeceptjs/**`
- Timeout: 90 seconds
- Retries: 1 in CI, 0 locally
- Workers: 1 in CI, 3 locally
- Reports: HTML + Midscene
- Traces: retained on failure
