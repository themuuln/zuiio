---
name: testing-patterns
description: Tolom testing patterns — Vitest unit/integration tests, Playwright E2E tests, Supabase mocking, auth setup, shadcn selectors, test file organization, and CI conventions. Use when writing tests, fixing flaky tests, setting up test infrastructure, or reviewing test coverage.
---

# Testing Patterns

Every service, API route, and RLS policy has tests. Ship tests with implementation.

---

## Test Types

| Type | Tool | What It Tests | Location |
|------|------|---------------|----------|
| Unit | Vitest | Service functions, utilities, stores | `src/**/*.test.ts` |
| Integration | Vitest | API routes with mocked Supabase | `src/**/*.test.ts` |
| E2E | Playwright | Full user flows in browser | `e2e/**/*.spec.ts` |

---

## Vitest Setup

### Config

```ts
// vitest.config.mts
export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup-tests.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    css: true,
    coverage: {
      provider: "v8",
      thresholds: {
        statements: 40,
        branches: 30,
        functions: 50,
        lines: 40,
      },
    },
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});
```

### Running Tests

```bash
npm run test              # Run all tests
npm run test -- --watch   # Watch mode
npm run test -- --run src/lib/services/customer-service.test.ts  # Single file
```

---

## Unit Test Pattern

### Service Tests

```tsx
import type { SupabaseClient } from "@supabase/supabase-js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockSupabaseClient } from "@/test/mocks/supabase";
import { getCustomer, createCustomer } from "./customer-service";

// Mock external dependencies
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));
vi.mock("@/lib/cache/with-cache", () => ({
  withCache: vi.fn((_key, fn) => fn()),
}));
vi.mock("@/lib/audit", () => ({
  createAuditLog: vi.fn().mockResolvedValue({ success: true, id: "audit-1" }),
}));
vi.mock("next/cache", () => ({
  revalidateTag: vi.fn(),
}));

describe("getCustomer", () => {
  const mockClient = createMockSupabaseClient() as unknown as SupabaseClient;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns customer when found", async () => {
    mockClient.from("customers").single.mockResolvedValueOnce({
      data: { id: "c1", first_name: "Bat", phone: "99112233" },
      error: null,
    });

    const result = await getCustomer(mockClient, "c1", "org-1");

    expect(result.id).toBe("c1");
    expect(result.first_name).toBe("Bat");
  });

  it("throws NotFoundError when customer doesn't exist", async () => {
    mockClient.from("customers").single.mockResolvedValueOnce({
      data: null,
      error: { message: "not found" },
    });

    await expect(
      getCustomer(mockClient, "nonexistent", "org-1"),
    ).rejects.toThrow("Customer not found");
  });

  it("validates required fields", async () => {
    await expect(
      createCustomer(mockClient, "org-1", { firstName: "" }, "user-1"),
    ).rejects.toThrow("At least one identifying field");
  });
});
```

### Mock Client Pattern

```tsx
import { createMockSupabaseClient } from "@/test/mocks/supabase";

const mockClient = createMockSupabaseClient();

// Override what a query returns
mockClient.from("customers").single.mockResolvedValueOnce({
  data: { id: "c1", first_name: "Bat" },
  error: null,
});

// Chain multiple calls
mockClient
  .from("customers")
  .maybeSingle
  .mockResolvedValueOnce({ data: null, error: null })  // first call (check dup)
  .mockResolvedValueOnce({ data: { id: "existing" }, error: null }); // second call
```

### Store Tests

```tsx
import { describe, expect, it, beforeEach } from "vitest";
import { useWorkOrderStore } from "./work-order-store";

describe("workOrderStore", () => {
  beforeEach(() => {
    useWorkOrderStore.setState({ selectedIds: [], drawerOpen: false });
  });

  it("toggles selection", () => {
    const { toggleSelection } = useWorkOrderStore.getState();
    toggleSelection("wo-1");
    expect(useWorkOrderStore.getState().selectedIds).toContain("wo-1");
  });

  it("opens drawer with work order", () => {
    const { openDrawer } = useWorkOrderStore.getState();
    openDrawer("wo-1");
    expect(useWorkOrderStore.getState().drawerOpen).toBe(true);
    expect(useWorkOrderStore.getState().selectedWorkOrderId).toBe("wo-1");
  });
});
```

### What to Mock

| Mock | When |
|------|------|
| `@/lib/supabase/server` | Every service test (provides mock client) |
| `@/lib/audit` | When testing mutation side effects |
| `next/cache` | When testing `revalidateTag` calls |
| `@/lib/cache/with-cache` | When testing cached queries |
| `fetch` | When testing API routes directly |

### What NOT to Mock

| Don't Mock | Why |
|------------|-----|
| The service function itself | That's what you're testing |
| `react-hook-form` | Test form behavior, not the library |
| `zod` schemas | Test validation logic directly |
| External APIs you actually call | Use MSW or mock at the fetch level |

---

## Playwright E2E Setup

### Config

```ts
// playwright.config.ts
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 4 : 2,
  globalSetup: "./e2e/global-setup.ts",
  use: {
    baseURL: "http://localhost:3000",
    storageState: "e2e/.auth/user.json",  // Reuse auth session
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "on-first-retry",
  },
  webServer: {
    command: `PORT=3000 npm run build && PORT=3000 npm run start`,
    url: "http://localhost:3000",
    timeout: 180_000,
    reuseExistingServer: true,
  },
});
```

### Auth Setup

```ts
// e2e/global-setup.ts
import { chromium } from "@playwright/test";
import { loginAndSaveState } from "./helpers";

export default async function globalSetup() {
  const browser = await chromium.launch();
  const context = await browser.newContext({ baseURL: "http://localhost:3000" });
  const page = await context.newPage();
  await loginAndSaveState(context, page);
  await browser.close();
}
```

### Login Helper

```ts
// e2e/helpers.ts
const TEST_EMAIL = process.env.E2E_EMAIL ?? "dev@example.com";
const TEST_PASSWORD = process.env.E2E_PASSWORD ?? "DevPass123!";
const TEST_PIN = process.env.E2E_PIN ?? "1234";

export async function loginViaUI(page: Page) {
  await page.goto("/mn/auth/login");
  await page.getByRole("textbox", { name: /email/i }).fill(TEST_EMAIL);
  await page.getByRole("textbox", { name: "Password *" }).fill(TEST_PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await waitForUrlNotMatching(page, ["/auth/login"]);

  if (page.url().includes("/auth/select-organization")) {
    await page.getByRole("textbox", { name: /pin/i }).fill(TEST_PIN);
    await page.getByRole("button", { name: /verify|continue/i }).click();
    await waitForUrlNotMatching(page, ["/auth/select-organization"]);
  }
}
```

---

## E2E Test Pattern

```ts
import { expect, test } from "@playwright/test";
import { loginViaUI } from "./helpers";

test.describe("Customer Management", () => {
  test.beforeEach(async ({ page }) => {
    await loginViaUI(page);
    await page.goto("/en/dashboard/customers");
    await page.locator('h1, [data-slot="empty"]').first().waitFor({ timeout: 15000 });
  });

  test("renders the customers page heading", async ({ page }) => {
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("Add Customer button opens creation sheet", async ({ page }) => {
    await page.getByRole("button", { name: /add customer/i }).click();
    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 10000 });
  });

  test("Cancel button closes the sheet", async ({ page }) => {
    await page.getByRole("button", { name: /add customer/i }).click();
    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 10000 });

    await page.getByRole("dialog").getByRole("button", { name: /cancel/i }).click();
    await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 5000 });
  });
});
```

---

## shadcn Selectors

**Never use CSS classes** — use ARIA roles and `data-*` attributes:

| Component | Selector | Avoid |
|-----------|----------|-------|
| Dialog | `page.getByRole("dialog")` | `.modal-content` |
| Dropdown | `page.locator('[data-state="open"]')` | `.select-trigger` |
| Popover | `page.getByRole("dialog").filter({ hasText: "..." })` | `.popover-content` |
| Combobox | `getByRole("combobox")` + `getByRole("option")` | `.combobox-input` |
| Checkbox | `getByRole("checkbox")` + `isChecked()` | `input[type=checkbox]` |
| Tabs | `getByRole("tab", { name: "..." })` | `[data-slot="tab"]` |
| Button | `getByRole("button", { name: /pattern/i })` | `.btn-primary` |
| Heading | `getByRole("heading", { level: 1 })` | `h1` (too broad) |
| Input | `getByRole("textbox", { name: /label/i })` | `input[name="field"]` |
| Table | `getByRole("table")` | `.data-table` |

### Key Attributes

```tsx
[data-state="open"|"closed"|"checked"]
[role="dialog"|"tooltip"|"option"|"tab"]
[aria-expanded]
[aria-selected]
[data-slot="card"|"button"|"input"]
```

---

## E2E Test Organization

```
e2e/
├── global-setup.ts          # Auth login, runs once
├── helpers.ts               # loginViaUI, expectHeading, etc.
├── .auth/
│   └── user.json            # Saved auth state (gitignored)
├── auth.spec.ts             # Login, registration, password reset
├── customers.spec.ts        # Customer CRUD flows
├── vehicles.spec.ts         # Vehicle management
├── home.spec.ts             # Dashboard home
├── navigation.spec.ts       # Sidebar navigation
└── i18n.spec.ts             # Language switching
```

### Test Naming

```ts
test.describe("Feature Name", () => {
  test.describe("Sub-feature", () => {
    test("does expected behavior", async ({ page }) => { ... });
  });
});
```

---

## Route Mocking (Playwright MCP)

For testing error states without server changes:

```
# Mock API failure
playwright_browser_route pattern='**/api/customers' status=500

# Mock empty response
playwright_browser_route pattern='**/rest/v1/customers*' status=200 body='[]'

# Mock rate limit
playwright_browser_route pattern='**/auth/**' status=429

# Clean up
playwright_browser_unroute
```

---

## Running E2E

```bash
# Full suite
npm run test:e2e

# Single file
npx playwright test e2e/customers.spec.ts

# Debug mode (headed browser)
npx playwright test --debug

# UI mode (interactive)
npx playwright test --ui
```

---

## Coverage Thresholds

| Metric | Threshold | Enforced |
|--------|-----------|----------|
| Statements | 40% | CI |
| Branches | 30% | CI |
| Functions | 50% | CI |
| Lines | 40% | CI |

### Checking Coverage

```bash
npm run test -- --coverage
```

---

## Anti-Patterns

| Anti-Pattern | Why It's Wrong | Fix |
|---|---|---|
| Testing implementation details | Brittle, breaks on refactor | Test behavior/outcomes |
| CSS class selectors in E2E | Breaks on restyle | Use ARIA roles and `data-*` |
| Login in every test file | Slow, flaky | Use `global-setup.ts` auth |
| `page.waitForTimeout(5000)` | Flaky, slow | Use `waitFor` with condition |
| Testing without mock client | Hits real DB, slow, data pollution | Always use `createMockSupabaseClient` |
| No `beforeEach` cleanup | Tests leak state | Clear mocks and reset store |
| Empty test files | False coverage | Delete or implement |
| `test.skip` without reason | Hidden gaps | Always explain why |

---

## Validation Checklist

Before merging test code:

- [ ] Service tests exist for every function in `src/lib/services/`
- [ ] API route tests exist for every route
- [ ] Tests use `createMockSupabaseClient` (not real DB)
- [ ] E2E uses ARIA roles, not CSS selectors
- [ ] Auth session reused via `global-setup.ts`
- [ ] `beforeEach` clears mocks and resets state
- [ ] No `waitForTimeout` — use proper waits
- [ ] Test names describe behavior: `it("returns customer when found")`
- [ ] Coverage thresholds met: `npm run test -- --coverage`
- [ ] No `test.skip` without documented reason
