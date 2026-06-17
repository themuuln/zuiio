import { expect, test } from "@playwright/test";

/**
 * E2E test for Roles & Permissions feature.
 *
 * Prerequisites:
 *   - App must be running (npm run dev)
 *   - PLAYWRIGHT_BASE_URL env var or default http://localhost:3000
 *   - Auth setup must have run (saves storage to .auth/user.json)
 *   - The test user must be an org owner (has roles.manage permission)
 *
 * Run: npm run test:e2e
 */

test.describe("Roles & Permissions", () => {
  test("shows roles card on settings page", async ({ page }) => {
    await page.goto("/settings");

    // CardTitle renders as a <div>, not a heading element
    await expect(page.getByText("Үүрэг, эрхүүд").first()).toBeVisible();

    // Should have a button to manage roles
    const manageButton = page.getByRole("button", {
      name: /Үүрэг, эрхүүд удирдах/i,
    });
    await expect(manageButton).toBeVisible();
  });

  test("can open roles drawer from settings", async ({ page }) => {
    await page.goto("/settings");

    // Click the roles manage button
    await page.getByRole("button", { name: /Үүрэг, эрхүүд удирдах/i }).click();

    // Wait for the roles drawer to appear
    await expect(
      page.getByRole("heading", { name: /Үүрэг, эрхүүд/i }),
    ).toBeVisible();
  });

  test("roles drawer shows existing roles", async ({ page }) => {
    // Navigate to settings which opens the drawer via ?roles=true
    await page.goto("/settings?roles=true");

    // The roles drawer should be visible
    await expect(
      page.getByRole("heading", { name: /Үүрэг, эрхүүд/i }),
    ).toBeVisible();

    // Should show role buttons with role names
    await expect(page.getByRole("button", { name: /owner/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /manager/i })).toBeVisible();
  });

  test("selecting a role shows permission editor", async ({ page }) => {
    await page.goto("/settings?roles=true");

    // Click on the owner role
    await page.getByRole("button", { name: /owner/i }).first().click();

    // Use .first() to avoid strict mode violations on duplicate text
    await expect(page.getByText(/Бүтээгдэхүүн/i).first()).toBeVisible();
    await expect(page.getByText(/Борлуулалт/i).first()).toBeVisible();
    await expect(page.getByText(/Гишүүд/i).first()).toBeVisible();
    await expect(page.getByText(/Удирдлага/i).first()).toBeVisible();
  });

  test("clicking new role button opens drawer with form", async ({ page }) => {
    await page.goto("/settings?roles=true");

    // Click the "Шинэ" button to create a new role
    await page.getByRole("button", { name: /Шинэ/i }).click();

    // Should see the form inside the drawer panel
    await expect(page.getByLabel(/Үүргийн нэр/i)).toBeVisible();
    await expect(page.getByLabel(/Тайлбар/i)).toBeVisible();
  });

  test("navigating to /settings/roles auto-opens the drawer", async ({
    page,
  }) => {
    // The page redirects to /settings?roles=true which opens the roles drawer
    await page.goto("/settings/roles", { waitUntil: "networkidle" });

    // Verify the drawer content is visible
    await expect(
      page.getByRole("heading", { name: /Үүрэг, эрхүүд/i }),
    ).toBeVisible({ timeout: 10000 });
  });
});
