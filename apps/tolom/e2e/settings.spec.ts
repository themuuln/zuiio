import { setEnglishLocale } from "./helpers";
import { mockProfile, mockSettingsOrg, mockSupabaseREST } from "./mocks";
import { expect, test } from "./test-extensions";

test.setTimeout(60_000);

test.describe("Settings (Mocked)", () => {
  test.beforeEach(async ({ page }) => {
    await setEnglishLocale(page);
    await mockSupabaseREST(page);
    await mockProfile(page);
    await mockSettingsOrg(page);
    await page.goto("/dashboard/settings");
  });

  test.describe("Page Structure", () => {
    test("loads the settings page with heading", async ({ page }) => {
      await expect(page.getByText("Settings").first()).toBeVisible({
        timeout: 10_000,
      });

      await expect(
        page.locator('[id^="settings-section-"]').first(),
      ).toBeVisible({ timeout: 10_000 });
    });
  });

  test.describe("Organization Card", () => {
    test("shows organization name at top of general section", async ({
      page,
    }) => {
      const generalSection = page.locator("#settings-section-general");
      await expect(generalSection).toBeVisible({ timeout: 10_000 });

      // The OrganizationCard renders the org name from the mock
      await expect(generalSection.getByText("TOLOM E2E Test")).toBeVisible({
        timeout: 10_000,
      });
    });
  });

  test.describe("Sub-sidebar Navigation", () => {
    test("shows settings sub-sidebar with section buttons", async ({
      page,
    }) => {
      // Sub-sidebar is a nav element with aria-label "Settings navigation"
      const subSidebar = page.getByRole("navigation", {
        name: "Settings navigation",
      });
      await expect(subSidebar).toBeVisible({ timeout: 10_000 });

      // The general section button is active by default
      await expect(
        subSidebar.getByRole("button", { name: "General" }).first(),
      ).toBeVisible();

      // Other section buttons exist
      await expect(
        subSidebar.getByRole("button", { name: "Branches" }).first(),
      ).toBeVisible();
    });

    test("highlights active section via aria-current", async ({ page }) => {
      const subSidebar = page.getByRole("navigation", {
        name: "Settings navigation",
      });
      await expect(subSidebar).toBeVisible({ timeout: 10_000 });

      // The "General" button should be the active section
      const generalButton = subSidebar
        .getByRole("button", { name: "General" })
        .first();
      await expect(generalButton).toHaveAttribute("aria-current", "true");
    });
  });

  test.describe("Payment Settings", () => {
    test("payments section is rendered on the page", async ({ page }) => {
      const paymentsSection = page.locator("#settings-section-payments");
      await expect(paymentsSection).toBeVisible({ timeout: 10_000 });
    });
  });

  test.describe("Commission Rules", () => {
    test("commission rules section is rendered on the page", async ({
      page,
    }) => {
      const commissionSection = page.locator("#settings-section-commission");
      await expect(commissionSection).toBeVisible({ timeout: 10_000 });
    });
  });

  test.describe("Branches", () => {
    test("branches section is rendered on the page", async ({ page }) => {
      const branchesSection = page.locator("#settings-section-branches");
      await expect(branchesSection).toBeVisible({ timeout: 10_000 });
    });
  });

  test.describe("Save Button", () => {
    test("has a save button in the general form", async ({ page }) => {
      // The general section form renders a submit button with text "Save"
      await expect(
        page
          .locator("#settings-section-general")
          .getByRole("button", { name: "Save" })
          .first(),
      ).toBeVisible({ timeout: 10_000 });
    });
  });

  test.describe("Sidebar Navigation", () => {
    test("has sidebar navigation visible", async ({ page }) => {
      await expect(page.getByRole("complementary")).toBeVisible();
    });
  });
});
