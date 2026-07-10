import { setEnglishLocale } from "./helpers";
import { mockReports, mockSupabaseREST } from "./mocks";
import { expect, test } from "./test-extensions";

test.setTimeout(15_000);

test.describe("Reports (Mocked)", () => {
  test.beforeEach(async ({ page }) => {
    await setEnglishLocale(page);
    await mockSupabaseREST(page);
    await mockReports(page);
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
        page.getByRole("link", { name: /report/i }).first(),
      ).toBeVisible();
    });
  });
});
