import { setEnglishLocale } from "./helpers";
import { mockOrganizationDetail, mockProfile, mockSupabaseREST } from "./mocks";
import { expect, test } from "./test-extensions";

test.setTimeout(15_000);

test.describe("Organization (Mocked)", () => {
  test.beforeEach(async ({ page }) => {
    await setEnglishLocale(page);
    await mockSupabaseREST(page);
    await mockProfile(page);
    await mockOrganizationDetail(page);
    await page.goto("/dashboard/organization");
  });

  test.describe("Page Structure", () => {
    test("loads the organization page without crashing", async ({ page }) => {
      await expect(page.locator("body")).toBeVisible({ timeout: 10_000 });
      expect(page.url()).toContain("/organization");
    });
  });

  test.describe("Sidebar Navigation", () => {
    test("has organization link in sidebar", async ({ page }) => {
      await expect(
        page
          .getByRole("complementary")
          .getByText(/organization/i)
          .first(),
      ).toBeVisible({ timeout: 10_000 });
    });
  });
});

test.describe("Organization Sub-Routes (Mocked)", () => {
  test.describe("Members Route", () => {
    test("loads the members page without crashing", async ({ page }) => {
      await setEnglishLocale(page);
      await mockSupabaseREST(page);
      await mockProfile(page);
      await mockOrganizationDetail(page);
      await page.goto("/dashboard/organization/members");
      await expect(page.locator("body")).toBeVisible({ timeout: 10_000 });
    });
  });

  test.describe("Roles Route", () => {
    test("loads the roles page without crashing", async ({ page }) => {
      await setEnglishLocale(page);
      await mockSupabaseREST(page);
      await mockProfile(page);
      await mockOrganizationDetail(page);
      await page.goto("/dashboard/organization/roles");
      await expect(page.locator("body")).toBeVisible({ timeout: 10_000 });
    });
  });

  test.describe("Devices Route", () => {
    test("loads the devices page without crashing", async ({ page }) => {
      await setEnglishLocale(page);
      await mockSupabaseREST(page);
      await mockProfile(page);
      await mockOrganizationDetail(page);
      await page.goto("/dashboard/organization/devices");
      await expect(page.locator("body")).toBeVisible({ timeout: 10_000 });
    });
  });
});
