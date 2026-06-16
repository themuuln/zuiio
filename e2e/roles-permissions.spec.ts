import { expect, test } from "@playwright/test";

/**
 * E2E test for Roles & Permissions feature.
 *
 * Prerequisites:
 *   - App must be running (npm run dev)
 *   - PLAYWRIGHT_BASE_URL env var or default http://localhost:3000
 *   - A valid test user session (uses dev login credentials)
 *   - The test user must be an org owner (has roles.manage permission)
 *
 * Run: npm run test:e2e
 */

const DEV_EMAIL = "themuuln1@gmail.com";
const DEV_PASSWORD = "Tolom!11";

test.describe("Roles & Permissions", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[name="email"]', DEV_EMAIL);
    await page.fill('input[name="password"]', DEV_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/$/);
  });

  test("shows roles card on settings page", async ({ page }) => {
    await page.goto("/settings");

    await expect(
      page.getByRole("heading", { name: /Үүрэг, эрхүүд/i }),
    ).toBeVisible();

    const manageLink = page.getByRole("link", { name: /Үүрэг, эрхүүд удирдах/i });
    await expect(manageLink).toBeVisible();
    await expect(manageLink).toHaveAttribute("href", "/settings/roles");
  });

  test("roles page shows existing roles", async ({ page }) => {
    await page.goto("/settings/roles");

    // Should show the roles heading
    await expect(
      page.getByRole("heading", { name: /Үүрэг, эрхүүд/i }),
    ).toBeVisible();

    // Should show the default roles (owner, admin, staff)
    await expect(
      page.getByRole("button", { name: /owner/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /admin/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /staff/i }),
    ).toBeVisible();
  });

  test("selecting a role shows permission groups", async ({ page }) => {
    await page.goto("/settings/roles");

    // Click on the admin role
    await page.getByRole("button", { name: /admin/i }).first().click();

    // Should show permission groups with the permission editor area
    await expect(page.getByText(/эрх сонгогдсон/i)).toBeVisible();

    // Should show resource group labels
    await expect(page.getByText(/Бүтээгдэхүүн/i)).toBeVisible();
    await expect(page.getByText(/Борлуулалт/i)).toBeVisible();
    await expect(page.getByText(/Гишүүд/i)).toBeVisible();
    await expect(page.getByText(/Удирдлага/i)).toBeVisible();
  });

  test("admins do not have roles.manage permission", async ({ page }) => {
    await page.goto("/settings/roles");

    // Click on admin role
    await page.getByRole("button", { name: /admin/i }).first().click();

    // "Үүрэг, эрхүүдийг удирдах" should NOT be checked
    // It's under "Удирдлага" group which contains roles.manage, settings.manage, etc.
    // We can check that roles.manage (Үүрэг, эрхүүдийг удирдах) is not highlighted
    const roleManageButton = page
      .locator("text=Үүрэг, эрхүүдийг удирдах")
      .first();

    // Admin should not have roles.manage — the button should not have the primary class
    await expect(roleManageButton).not.toHaveClass(/bg-primary/);
  });

  test("can create a new custom role", async ({ page }) => {
    await page.goto("/settings/roles");

    // Click the create button
    await page.getByRole("button", { name: /Шинэ/i }).click();

    // Fill the form in the drawer
    await page.fill('input[id="name"]', "Тест эрх");

    // Submit
    await page.getByRole("button", { name: /Үүсгэх/i }).click();

    // The new role should appear in the list
    await expect(
      page.getByRole("button", { name: /Тест эрх/i }),
    ).toBeVisible({ timeout: 5000 });
  });

  test("can toggle a permission for a custom role", async ({ page }) => {
    await page.goto("/settings/roles");

    // Click on admin role to edit
    await page.getByRole("button", { name: /admin/i }).first().click();

    // Find the "Тайлан удирдах" permission button under "Удирдлага" group
    // and toggle it if it's selected
    const permButton = page.locator("text=Тайлан удирдах").first();
    const isSelected = await permButton.evaluate((el) =>
      el.classList.contains("bg-primary/10"),
    );

    // Toggle it
    await permButton.click();

    // Verify the state changed
    if (isSelected) {
      await expect(permButton).not.toHaveClass(/bg-primary\/10/);
    } else {
      await expect(permButton).toHaveClass(/bg-primary\/10/);
    }

    // Click save
    await page.getByRole("button", { name: /Хадгалах/i }).click();

    // Should show success (no error)
    await expect(page.getByText(/Алдаа/i)).not.toBeVisible();
  });

  test("users page shows role badges", async ({ page }) => {
    await page.goto("/settings/users");

    await expect(
      page.getByRole("heading", { name: /Хэрэглэгчид/i }),
    ).toBeVisible();

    // Should see role badges for members
    // The current user should have a visible badge
    await expect(page.locator("text=Та").first()).toBeVisible();
  });

  test("clicking new role button opens drawer with form", async ({
    page,
  }) => {
    await page.goto("/settings/roles");

    // Click the "Шинэ" button
    await page.getByRole("button", { name: /Шинэ/i }).click();

    // Should see the form inside the drawer panel
    await expect(page.getByLabel(/Үүргийн нэр/i)).toBeVisible();
    await expect(page.getByLabel(/Тайлбар/i)).toBeVisible();

    // Close via the drawer close button
    const closeButton = page.locator('button[aria-label="Close"]');
    if (await closeButton.isVisible()) {
      await closeButton.click();
    }
  });
});
