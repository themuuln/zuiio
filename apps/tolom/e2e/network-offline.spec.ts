import { setEnglishLocale } from "./helpers";
import { mockSupabaseREST } from "./mocks";
import { expect, test } from "./test-extensions";

test.setTimeout(15_000);

test.describe("Network Offline Handling (Mocked)", () => {
  test.beforeEach(async ({ page }) => {
    await setEnglishLocale(page);
    await mockSupabaseREST(page);
  });

  test("services page handles network failure gracefully", async ({ page }) => {
    await page.route("**/api/organizations/**", (route) =>
      route.abort("failed"),
    );
    await page.goto("/dashboard/services");
    await expect(
      page
        .getByRole("heading", { level: 1 })
        .or(page.getByText(/error|failed|network|offline/i))
        .first(),
    ).toBeVisible({ timeout: 10_000 });
  });

  test("customers page handles network failure gracefully", async ({
    page,
  }) => {
    await page.route("**/api/organizations/**", (route) =>
      route.abort("failed"),
    );
    await page.goto("/dashboard/customers");
    await expect(
      page
        .getByRole("heading", { level: 1 })
        .or(page.getByText(/error|failed|network|offline/i))
        .first(),
    ).toBeVisible({ timeout: 10_000 });
  });

  test("page recovers after network restoration", async ({ page }) => {
    // First load fails
    await page.route("**/api/organizations/*/services", (route) =>
      route.abort("failed"),
    );
    await page.goto("/dashboard/services");
    await expect(
      page
        .getByRole("heading", { level: 1 })
        .or(page.getByText(/error|failed|network|offline/i))
        .first(),
    ).toBeVisible({ timeout: 10_000 });

    // Restore network and reload
    await page.unroute("**/api/organizations/*/services");
    await page.reload();
    await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible({
      timeout: 10_000,
    });
  });
});
