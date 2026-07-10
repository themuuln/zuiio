import { setEnglishLocale } from "./helpers";
import { mockSupabaseREST } from "./mocks";
import { expect, test } from "./test-extensions";

test.setTimeout(15_000);

test.describe("Guide (Mocked)", () => {
  test.beforeEach(async ({ page }) => {
    await setEnglishLocale(page);
    await mockSupabaseREST(page);
    await page.goto("/dashboard/guide");
  });

  test("loads the guide page without crashing", async ({ page }) => {
    // Guide page renders VitePress content or redirects to /guide
    await expect(page.locator("body")).toBeVisible({ timeout: 10_000 });
    const url = page.url();
    expect(url).toContain("/guide");
  });
});
