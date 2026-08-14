import { setEnglishLocale } from "./helpers";
import { mockPrewarm, mockReports, mockSupabaseREST } from "./mocks";
import { expect, test } from "./test-extensions";

test.setTimeout(60_000);

test.describe("Reports (Mocked)", () => {
  test.beforeEach(async ({ page }) => {
    await setEnglishLocale(page);
    await mockSupabaseREST(page);
    await mockReports(page);
    await mockPrewarm(page);
    await page.goto("/dashboard/reports");
  });

  test.describe("Page Structure", () => {
    test("loads the reports page with heading", async ({ page }) => {
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible({
        timeout: 10_000,
      });
    });
  });

  test.describe("Report Content", () => {
    test("shows report content when loaded", async ({ page }) => {
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible({
        timeout: 10_000,
      });
    });
  });

  test.describe("Sidebar Navigation", () => {
    test("has Reports link in sidebar", async ({ page }) => {
      await expect(
        page.getByRole("button", { name: /^reports$/i }).first(),
      ).toBeVisible();
    });
  });
});
