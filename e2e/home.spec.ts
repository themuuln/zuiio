import { test, expect } from "@playwright/test";

test.describe("Landing Page", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the Mongolian locale (default redirect)
    await page.goto("/mn");
  });

  test("renders the hero section with title and CTAs", async ({ page }) => {
    // Hero section should be visible
    const hero = page.locator("section").first();
    await expect(hero).toBeVisible();

    // Should have sign up and features CTAs
    const signUpLink = page.getByRole("link", { name: /sign up|бүртгүүлэх/i });
    await expect(signUpLink.first()).toBeVisible();
  });

  test("displays the navigation bar", async ({ page }) => {
    const nav = page.getByRole("navigation");
    await expect(nav).toBeVisible();

    // TOLOM brand should be visible
    await expect(page.getByText("TOLOM")).toBeVisible();
  });

  test("shows features section", async ({ page }) => {
    // Scroll to features section
    const featuresSection = page.locator("#features");
    await featuresSection.scrollIntoViewIfNeeded();
    await expect(featuresSection).toBeVisible();
  });

  test("shows pricing section with tiers", async ({ page }) => {
    // Scroll to pricing section
    await page
      .getByText(/pricing|үнэ/i)
      .first()
      .scrollIntoViewIfNeeded();

    // Should show pricing cards
    await expect(page.getByText(/₮|month|сар/i).first()).toBeVisible();
  });

  test("has a working footer with links", async ({ page }) => {
    const footer = page.locator("footer");
    await footer.scrollIntoViewIfNeeded();
    await expect(footer).toBeVisible();

    // Footer should have copyright text
    await expect(footer.getByText(/©|2025|2026/i)).toBeVisible();
  });
});
