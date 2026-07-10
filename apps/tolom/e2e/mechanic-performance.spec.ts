import { setEnglishLocale } from "./helpers";
import { mockSupabaseREST } from "./mocks";
import { expect, test } from "./test-extensions";

test.setTimeout(15_000);

test.describe("Mechanic Performance (Mocked)", () => {
  test.beforeEach(async ({ page }) => {
    await setEnglishLocale(page);
    await mockSupabaseREST(page);
    await page.goto("/dashboard/mechanic-performance");
  });

  test("loads mechanic performance page without crashing", async ({ page }) => {
    await expect(page.locator("body")).toBeVisible({ timeout: 10_000 });
    expect(page.url()).toContain("/mechanic-performance");
  });

  test("has the sidebar visible", async ({ page }) => {
    await expect(page.getByRole("complementary")).toBeVisible({
      timeout: 10_000,
    });
  });
});
