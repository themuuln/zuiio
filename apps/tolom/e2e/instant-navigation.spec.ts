import { setEnglishLocale } from "./helpers";
import {
  mockEstimates,
  mockFinanceOverview,
  mockOrganizations,
  mockOverviewDashboard,
  mockProfile,
  mockSupabaseREST,
} from "./mocks";
import { expect, test } from "./test-extensions";

test.setTimeout(60_000);

test.describe("Instant Navigation", () => {
  test.beforeEach(async ({ page }) => {
    await setEnglishLocale(page);
    await mockSupabaseREST(page);
    await mockProfile(page);
    await mockOrganizations(page);
    // Mock data for all pages we'll visit
    await mockOverviewDashboard(page);
    await mockFinanceOverview(page);
    await mockEstimates(page);
  });

  test("loads dashboard and navigates between sub-pages via sidebar", async ({
    page,
  }) => {
    // Start on dashboard
    await page.goto("/dashboard");
    await expect(page.getByRole("complementary")).toBeVisible({
      timeout: 10_000,
    });

    // Navigate to Finance via sidebar button
    await page
      .getByRole("button", { name: /^finance$/i })
      .first()
      .click();
    await expect(page).toHaveURL(/\/dashboard\/finance/);

    // Navigate to Estimates via sidebar button
    // Estimates is a sub-item under the Finance collapsible group,
    // which is now open because we navigated to /dashboard/finance
    await page.getByRole("button", { name: /^estimates$/i }).click();
    await expect(page).toHaveURL(/\/dashboard\/estimates/);

    // Navigate back to Dashboard via primary sidebar button
    await page
      .getByRole("button", { name: /^dashboard$/i })
      .first()
      .click();
    await expect(page).toHaveURL(/\/dashboard\/?$/);
  });

  test("navigates to Finance page directly and back to Dashboard", async ({
    page,
  }) => {
    await page.goto("/dashboard/finance");
    await expect(page).toHaveURL(/\/dashboard\/finance/);

    // Return to dashboard via sidebar
    await page
      .getByRole("button", { name: /^dashboard$/i })
      .first()
      .click();
    await expect(page).toHaveURL(/\/dashboard\/?$/);
  });
});
