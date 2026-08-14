import { setEnglishLocale } from "./helpers";
import { mockSupabaseREST } from "./mocks";
import { expect, test } from "./test-extensions";

test.setTimeout(60_000);

test.describe("Payroll (Mocked)", () => {
  test.beforeEach(async ({ page }) => {
    await setEnglishLocale(page);
    await mockSupabaseREST(page);
    await page.goto("/dashboard/payroll");
  });

  test("loads payroll page", async ({ page }) => {
    await expect(
      page
        .getByRole("heading", { level: 1 })
        .or(page.getByText(/payroll|salary|wage/i))
        .first(),
    ).toBeVisible({ timeout: 10_000 });
  });

  test("shows payroll content", async ({ page }) => {
    await expect(
      page.getByText(/payroll|mechanic|salary|hours|commission/i).first(),
    ).toBeVisible({ timeout: 10_000 });
  });
});
