import { setEnglishLocale } from "./helpers";
import {
  mockMechanicsList,
  mockMechanicTimeStatus,
  mockProfile,
  mockSupabaseREST,
} from "./mocks";
import { expect, test } from "./test-extensions";

test.setTimeout(60_000);

test.describe("Mechanic Dashboard (Mocked)", () => {
  test.beforeEach(async ({ page }) => {
    await setEnglishLocale(page);
    await mockSupabaseREST(page);
    await mockProfile(page);
    await mockMechanicsList(page);
    await mockMechanicTimeStatus(page);
    await page.goto("/dashboard/mechanic");
  });

  test("loads the mechanic page without crashing", async ({ page }) => {
    await expect(page.locator("body")).toBeVisible({ timeout: 10_000 });
    expect(page.url()).toContain("/mechanic");
  });

  test("has the sidebar visible", async ({ page }) => {
    await expect(page.getByRole("complementary")).toBeVisible({
      timeout: 10_000,
    });
  });
});
