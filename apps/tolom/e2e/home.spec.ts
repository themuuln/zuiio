import { expect, test } from "@playwright/test";

test.describe("Landing Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("renders the hero section with title and CTA", async ({ page }) => {
    // Hero heading should be visible
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: /operating system for auto service/i,
      }),
    ).toBeVisible();

    // Primary CTA — there are multiple "Start Free Trial" buttons, take the first
    await expect(
      page.getByRole("button", { name: "Start Free Trial" }).first(),
    ).toBeVisible();
  });

  test("displays the navigation bar with brand and links", async ({ page }) => {
    await expect(page.getByRole("navigation")).toBeVisible();

    // Brand link in the header
    await expect(
      page.getByRole("banner").getByRole("link", { name: "TOLOM" }),
    ).toBeVisible();

    // Pricing link in nav (scoped to navigation, not footer)
    await expect(
      page.getByRole("navigation").getByRole("link", { name: "Pricing" }),
    ).toBeVisible();
  });

  test("shows features section", async ({ page }) => {
    const featuresSection = page.locator("#features");
    await featuresSection.scrollIntoViewIfNeeded();
    await expect(featuresSection).toBeVisible();
  });

  test("shows pricing section with tiers", async ({ page }) => {
    await page
      .getByRole("heading", { name: /pricing/i })
      .first()
      .scrollIntoViewIfNeeded();

    // Should show Mongolian tugrik pricing
    await expect(page.getByText(/₮/).first()).toBeVisible();
  });

  test("has a working footer with links", async ({ page }) => {
    const footer = page.locator("footer");
    await footer.scrollIntoViewIfNeeded();
    await expect(footer).toBeVisible();

    await expect(footer.getByText(/© 2026 TOLOM/)).toBeVisible();
    await expect(footer.getByRole("link", { name: "FAQ" })).toBeVisible();
    await expect(footer.getByRole("link", { name: "Pricing" })).toBeVisible();
  });
});
