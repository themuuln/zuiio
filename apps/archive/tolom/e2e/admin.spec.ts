import { setEnglishLocale } from "./helpers";
import { mockAdminAll, mockProfile, mockSupabaseREST } from "./mocks";
import { expect, test } from "./test-extensions";

test.setTimeout(60_000);

test.describe("Admin Sellers (Mocked)", () => {
  test.beforeEach(async ({ page }) => {
    await setEnglishLocale(page);
    await mockSupabaseREST(page);
    await mockProfile(page);
    await mockAdminAll(page);
    await page.goto("/dashboard/admin/sellers");
  });

  test.describe("Page Structure", () => {
    test("loads the admin sellers page", async ({ page }) => {
      await expect(
        page
          .getByRole("heading", { level: 1 })
          .or(page.getByRole("heading", { level: 2 }))
          .first(),
      ).toBeVisible({ timeout: 10_000 });
    });
  });

  test.describe("Admin Content", () => {
    test("shows admin-related content", async ({ page }) => {
      await expect(
        page
          .getByRole("heading", { level: 1 })
          .or(page.getByRole("heading", { level: 2 }))
          .first(),
      ).toBeVisible({ timeout: 10_000 });
    });
  });
});
