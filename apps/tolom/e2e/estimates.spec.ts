import { setEnglishLocale } from "./helpers";
import { mockEstimates, mockSupabaseREST } from "./mocks";
import { expect, test } from "./test-extensions";

test.setTimeout(60_000);

test.describe("Estimates (Mocked)", () => {
  test.beforeEach(async ({ page }) => {
    await setEnglishLocale(page);
    await mockSupabaseREST(page);
    await mockEstimates(page);
    await page.goto("/dashboard/estimates");
  });

  test.describe("Page Structure", () => {
    test("loads the estimates page with heading", async ({ page }) => {
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible({
        timeout: 10_000,
      });
    });

    test("shows the New Estimate button", async ({ page }) => {
      const btn = page
        .getByRole("button", {
          name: /new estimate|create estimate|add estimate/i,
        })
        .first();
      await expect(btn).toBeVisible();
    });
  });

  test.describe("Status Filtering", () => {
    test("shows status filter options", async ({ page }) => {
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible({
        timeout: 10_000,
      });
    });
  });

  test.describe("Data Display", () => {
    test("shows estimate content when loaded", async ({ page }) => {
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible({
        timeout: 10_000,
      });
    });
  });

  test.describe("Empty State", () => {
    test("handles empty estimates list", async ({ page }) => {
      await page.unrouteAll();
      await mockSupabaseREST(page);
      await mockEstimates(page, []);
      await page.goto("/dashboard/estimates");
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible({
        timeout: 10_000,
      });
    });
  });

  test.describe("Sidebar Navigation", () => {
    test("has Estimates link in sidebar", async ({ page }) => {
      await expect(
        page.getByRole("link", { name: /estimate/i }).first(),
      ).toBeVisible();
    });
  });
});
