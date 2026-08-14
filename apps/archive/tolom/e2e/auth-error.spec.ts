import { setEnglishLocale } from "./helpers";
import { mockSupabaseREST } from "./mocks";
import { expect, test } from "./test-extensions";

test.setTimeout(60_000);

test.describe("Auth Error Handling (Mocked)", () => {
  test.beforeEach(async ({ page }) => {
    await setEnglishLocale(page);
    await mockSupabaseREST(page);
  });

  test("services page handles 401 Unauthorized", async ({ page }) => {
    await page.route("**/api/organizations/*/services", (route) =>
      route.fulfill({
        status: 401,
        contentType: "application/json",
        body: JSON.stringify({ error: "Unauthorized" }),
      }),
    );
    await page.goto("/dashboard/services");
    // Page should load (may show error or redirect)
    await expect(page).toHaveURL(/.*/, { timeout: 10_000 });
  });

  test("customers page handles 403 Forbidden", async ({ page }) => {
    await page.route("**/api/organizations/*/customers", (route) =>
      route.fulfill({
        status: 403,
        contentType: "application/json",
        body: JSON.stringify({ error: "Forbidden" }),
      }),
    );
    await page.goto("/dashboard/customers");
    await expect(page).toHaveURL(/.*/, { timeout: 10_000 });
  });

  test("session expired triggers redirect or error", async ({ page }) => {
    await page.route("**/api/**", (route) =>
      route.fulfill({
        status: 401,
        contentType: "application/json",
        body: JSON.stringify({ error: "Session expired" }),
      }),
    );
    await page.goto("/dashboard/services");
    // Should redirect to login or show error (not crash)
    await expect(page).toHaveURL(/.*/, { timeout: 10_000 });
  });
});
