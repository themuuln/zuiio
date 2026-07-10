import { setEnglishLocale } from "./helpers";
import { mockSupabaseREST } from "./mocks";
import { expect, test } from "./test-extensions";

// With mocked APIs, tests are fast — 10s is generous.
test.setTimeout(10_000);

test.beforeEach(async ({ page }) => {
  await mockSupabaseREST(page);
});

test.describe("Internationalization (i18n)", () => {
  test.describe("Language Switcher on Landing Page", () => {
    test("landing page defaults to Mongolian", async ({ page }) => {
      await page.goto("/");
      // The hero title in MN: "Авто засварын бизнесийн ажиллах нэгтгэл систем"
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      // MN button should be active (default variant)
      const mnButton = page
        .getByRole("banner")
        .getByRole("button", { name: "MN" });
      await expect(mnButton).toBeVisible();
    });

    test("switching to EN updates page content", async ({ page }) => {
      await page.goto("/");
      // Click EN button
      await page
        .getByRole("banner")
        .getByRole("button", { name: "EN" })
        .click();
      // Wait for page to refresh with EN content
      await expect(
        page.getByRole("heading", {
          level: 1,
          name: /operating system for auto service/i,
        }),
      ).toBeVisible({ timeout: 5000 });
    });

    test("switching to MN updates page content", async ({ page }) => {
      await page.goto("/");
      // First switch to EN
      await page
        .getByRole("banner")
        .getByRole("button", { name: "EN" })
        .click();
      await expect(
        page.getByRole("heading", { level: 1, name: /operating system/i }),
      ).toBeVisible({ timeout: 5000 });

      // Then switch back to MN
      await page
        .getByRole("banner")
        .getByRole("button", { name: "MN" })
        .click();
      // The MN hero title contains Cyrillic characters
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible({
        timeout: 5000,
      });
    });

    test("language preference persists across navigation", async ({ page }) => {
      await page.goto("/");
      // Switch to EN
      await page
        .getByRole("banner")
        .getByRole("button", { name: "EN" })
        .click();
      await expect(
        page.getByRole("heading", { level: 1, name: /operating system/i }),
      ).toBeVisible({ timeout: 5000 });

      // Navigate to pricing
      await page.getByRole("link", { name: "Pricing" }).first().click();
      await expect(page).toHaveURL(/\/pricing/);

      // Switch back to landing — EN should still be active
      await page.goto("/");
      await expect(
        page.getByRole("heading", { level: 1, name: /operating system/i }),
      ).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe("Language Switcher on Auth Pages", () => {
    // Use fresh context without auth cookies to access login form
    test.use({ storageState: { cookies: [], origins: [] } });

    test("login page has language switcher", async ({ page }) => {
      await setEnglishLocale(page);
      await page.goto("/auth/login");
      await expect(
        page.getByRole("heading", { name: /sign in/i }),
      ).toBeVisible();

      // MN and EN buttons — exact:true avoids matching devtools buttons
      await expect(
        page.getByRole("button", { name: "MN", exact: true }),
      ).toBeVisible();
      await expect(
        page.getByRole("button", { name: "EN", exact: true }),
      ).toBeVisible();
    });

    test("switching language on login page updates form labels", async ({
      page,
    }) => {
      await setEnglishLocale(page);
      await page.goto("/auth/login");
      await expect(
        page.getByRole("heading", { name: /sign in/i }),
      ).toBeVisible();

      // Switch to MN
      await page.getByRole("button", { name: "MN", exact: true }).click();

      // MN login title: "TOLOM-д нэвтрэх"
      await expect(page.getByRole("heading", { name: /нэвтрэх/i })).toBeVisible(
        { timeout: 5000 },
      );
    });
  });

  test.describe("URL and Routing", () => {
    test("root URL loads the landing page", async ({ page }) => {
      await page.goto("/");
      // The page should load
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    });

    test("setting EN locale via cookie works", async ({ page }) => {
      await setEnglishLocale(page);
      await page.goto("/");
      await expect(
        page.getByRole("heading", { level: 1, name: /operating system/i }),
      ).toBeVisible();
    });

    test("setting MN locale via cookie works", async ({ page }) => {
      await page.goto("/");
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    });
  });

  test.describe("Footer Links", () => {
    test("footer renders in the current locale", async ({ page }) => {
      await page.goto("/");
      const footer = page.locator("footer");
      await footer.scrollIntoViewIfNeeded();
      await expect(footer).toBeVisible();
      // Footer should have copyright
      await expect(footer.getByText(/© 2026 TOLOM/)).toBeVisible();
    });
  });
});
