---
title: Testing
desc: Testing strategy and how to run tests
---

# Testing

The project uses three testing layers:

## Unit Tests

Located in `tests/` (`.test.ts` files). Run with tsx/node test runner:

```bash
# Run all unit tests
pnpm test

# Run specific test file
pnpm test tests/products.test.ts
```

Covers: domain logic, discount calculations, stock validation, notification logic, security rules, CSV/XLSX export, commission calculation, inventory validation, and more.

## E2E Tests (Playwright)

Located in `e2e/` (`.spec.ts` files). Uses Playwright for browser testing:

```bash
pnpm test:e2e
```

## AI-Assisted E2E Tests (CodeceptJS + Midscene)

```bash
pnpm test:e2e:ai
```

Uses CodeceptJS with Midscene AI for self-healing E2E tests that describe flows in natural language.
Covers cross-area flows, accounting, dashboard, inventory, and other feature validation.

## Test Structure

```
tests/              # Unit tests (tsx test runner)
├── auth.test.ts
├── categories.test.ts
├── commissions.test.ts
├── contacts.test.ts
├── csv.test.ts
├── discount-utils.test.ts
├── domain-rules.test.ts
├── expenses.test.ts
├── inventory.test.ts
├── notification.test.ts
├── optimistic.test.ts
├── products.test.ts
├── reports.test.ts
├── security.test.ts
├── shop-cart.test.ts
├── stock-movements.test.ts
└── suppliers.test.ts

e2e/                # Playwright E2E tests
├── accounting.spec.ts
└── ... (other .spec.ts files)
```
