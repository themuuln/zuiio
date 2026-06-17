import { expect, test } from "@playwright/test";

/**
 * E2E test for Org Members Management (invite + remove).
 *
 * Prerequisites:
 *   - App must be running (npm run dev)
 *   - PLAYWRIGHT_BASE_URL env var or default http://localhost:3000
 *   - Auth setup must have run (saves storage to .auth/user.json)
 *   - The test user must have members.invite and members.remove permissions
 *
 * Run: npm run test:e2e
 */

test.describe("Org Members Management", () => {
  test("shows members list on /settings/users", async ({ page }) => {
    await page.goto("/settings/users");

    await expect(
      page.getByRole("heading", { name: /Хэрэглэгчид/i }),
    ).toBeVisible();

    // Should show at least one member (current user badge "Та")
    await expect(page.getByText("Та", { exact: true })).toBeVisible();
  });

  test("shows invite button when user has permission", async ({ page }) => {
    await page.goto("/settings/users");

    const inviteButton = page.getByRole("button", {
      name: /Гишүүн урих/i,
    });
    await expect(inviteButton).toBeVisible();
  });

  test("opens invite dialog when clicking invite button", async ({ page }) => {
    await page.goto("/settings/users");

    await page.getByRole("button", { name: /Гишүүн урих/i }).click();

    // Invite dialog should be visible
    await expect(
      page.getByRole("heading", { name: /Гишүүн урих/i }),
    ).toBeVisible();

    // Should have an email input
    await expect(page.getByPlaceholder("user@example.com")).toBeVisible();

    // Should have a submit button
    await expect(page.getByRole("button", { name: /Урих/i })).toBeVisible();
  });

  test("invite submit button is disabled with empty email", async ({
    page,
  }) => {
    await page.goto("/settings/users");

    await page.getByRole("button", { name: /Гишүүн урих/i }).click();

    // Submit button should be disabled when email is empty
    const submitButton = page.getByRole("button", { name: /Урих/i });
    await expect(submitButton).toBeDisabled();
  });

  test("can type email in invite dialog", async ({ page }) => {
    await page.goto("/settings/users");

    await page.getByRole("button", { name: /Гишүүн урих/i }).click();

    const emailInput = page.getByPlaceholder("user@example.com");
    await emailInput.fill("test@example.com");

    // Submit button should now be enabled
    const submitButton = page.getByRole("button", { name: /Урих/i });
    await expect(submitButton).toBeEnabled();
  });

  test("shows error toast for invalid email on invite", async ({ page }) => {
    await page.goto("/settings/users");

    await page.getByRole("button", { name: /Гишүүн урих/i }).click();

    const emailInput = page.getByPlaceholder("user@example.com");
    await emailInput.fill("not-an-email");
    await page.getByRole("button", { name: /Урих/i }).click();

    // Should show error toast
    await expect(page.getByText(/Зөв и-мэйл хаяг оруулна уу/i)).toBeVisible({
      timeout: 5000,
    });
  });

  test("shows member rows with avatars and names", async ({ page }) => {
    await page.goto("/settings/users");

    // Find member rows inside the divide-y container
    const memberRows = page.locator(".divide-y > div");
    const count = await memberRows.count();

    // Should have at least 1 member (the current user)
    expect(count).toBeGreaterThanOrEqual(1);

    // First member should be visible
    await expect(memberRows.first()).toBeVisible();
  });

  test("can open remove confirmation dialog on another member", async ({
    page,
  }) => {
    await page.goto("/settings/users");

    // The current user row should be highlighted with "Та" badge
    const currentUserBadge = page.getByText("Та", { exact: true });
    await expect(currentUserBadge).toBeVisible();

    // Check if there are multiple members
    const memberRows = page.locator(".divide-y > div");
    const count = await memberRows.count();

    test.skip(count <= 1, "need at least 2 members to test removal dialog");

    // Click the first non-self member's trash button (svg icon inside button)
    const removeButton = memberRows.nth(1).locator("button:has(svg)");
    await removeButton.click();

    // Remove confirmation dialog should appear
    await expect(
      page.getByRole("heading", { name: /Гишүүн хасах/i }),
    ).toBeVisible();

    // Should have cancel and confirm buttons
    await expect(page.getByRole("button", { name: /Буцах/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Хасах/i })).toBeVisible();
  });
});
