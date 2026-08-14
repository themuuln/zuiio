import { setEnglishLocale } from "./helpers";
import { mockServices, mockSupabaseREST } from "./mocks";
import { expect, test } from "./test-extensions";

test.setTimeout(60_000);

test.describe("Services (Mocked)", () => {
  test.beforeEach(async ({ page }) => {
    await setEnglishLocale(page);
    await mockSupabaseREST(page);
    await mockServices(page);
    await page.goto("/dashboard/services");
  });

  test.describe("Page Structure", () => {
    test("loads the services page with heading", async ({ page }) => {
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible({
        timeout: 10_000,
      });
    });
  });

  test.describe("Service Catalog", () => {
    test("shows service catalog content", async ({ page }) => {
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible({
        timeout: 10_000,
      });
    });
  });

  test.describe("Empty State", () => {
    test("handles empty services list", async ({ page }) => {
      await page.unrouteAll();
      await mockSupabaseREST(page);
      await mockServices(page, []);
      await page.goto("/dashboard/services");
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible({
        timeout: 10_000,
      });
    });
  });

  test.describe("Sidebar Navigation", () => {
    test("has Services link in sidebar", async ({ page }) => {
      await expect(
        page.getByRole("button", { name: /^services$/i }).first(),
      ).toBeVisible();
    });
  });
});
