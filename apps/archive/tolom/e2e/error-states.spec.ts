import { setEnglishLocale } from "./helpers";
import { mockSupabaseREST } from "./mocks";
import { expect, test } from "./test-extensions";

test.setTimeout(60_000);

test.describe("Error States (Mocked)", () => {
  test.beforeEach(async ({ page }) => {
    await setEnglishLocale(page);
    await mockSupabaseREST(page);
  });

  test("services page handles API failure gracefully", async ({ page }) => {
    await page.route("**/api/organizations/*/services", (route) =>
      route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ error: "Internal server error" }),
      }),
    );
    await page.goto("/dashboard/services");
    // Page should load without crashing
    await expect(
      page
        .getByRole("heading", { level: 1 })
        .or(page.getByText(/error|failed|something/i))
        .first(),
    ).toBeVisible({ timeout: 10_000 });
  });

  test("services page shows empty state when no services", async ({ page }) => {
    // Empty list
    await page.route("**/api/organizations/*/services", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([]),
      }),
    );
    await page.goto("/dashboard/services");
    await expect(
      page
        .getByRole("heading", { level: 1 })
        .or(page.getByText(/no service|empty|no data/i))
        .first(),
    ).toBeVisible({ timeout: 10_000 });
  });

  test("customers page handles API failure gracefully", async ({ page }) => {
    await page.route("**/api/organizations/*/customers", (route) =>
      route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ error: "Database connection failed" }),
      }),
    );
    await page.goto("/dashboard/customers");
    await expect(
      page
        .getByRole("heading", { level: 1 })
        .or(page.getByText(/error|failed|something/i))
        .first(),
    ).toBeVisible({ timeout: 10_000 });
  });

  test("work orders page handles API failure gracefully", async ({ page }) => {
    await page.route("**/api/organizations/*/work-orders", (route) =>
      route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ error: "Query timeout" }),
      }),
    );
    await page.goto("/dashboard/work-orders");
    await expect(
      page
        .getByRole("heading", { level: 1 })
        .or(page.getByText(/error|failed|something/i))
        .first(),
    ).toBeVisible({ timeout: 10_000 });
  });
});
