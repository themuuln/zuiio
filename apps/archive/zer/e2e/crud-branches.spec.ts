import { expect, type Page, test } from "@playwright/test";

test.describe("Branches module", () => {
  async function isOnBranchPage(page: Page) {
    // Wait for potential client-side redirect after hydration
    await page.waitForTimeout(3000);
    return page.url().includes("/settings/branches");
  }

  test("page loads and shows branch list or empty state", async ({ page }) => {
    await page.goto("/settings/branches", { waitUntil: "domcontentloaded" });

    // Org may redirect if has_multi_branch is disabled (can be client-side)
    if (await isOnBranchPage(page)) {
      await expect(page.getByText("Салбарууд").first()).toBeVisible({
        timeout: 10000,
      });

      // Should show either "Салбарын жагсаалт" or empty state
      const listTitle = page.getByText("Салбарын жагсаалт");
      const emptyState = page.getByText("Салбар бүртгэгдээгүй");
      await expect(listTitle.or(emptyState).first()).toBeVisible({
        timeout: 10000,
      });
    }
  });

  test("create branch dialog opens with form fields", async ({ page }) => {
    await page.goto("/settings/branches", { waitUntil: "domcontentloaded" });

    // Skip if org doesn't have multi-branch enabled
    if (!(await isOnBranchPage(page))) {
      test.skip();
      return;
    }

    // Click "Шинэ салбар" button
    const createBtn = page.getByText("Шинэ салбар").first();
    await expect(createBtn).toBeVisible({ timeout: 5000 });
    await createBtn.click();
    await page.waitForTimeout(1000);

    // Dialog should open with form
    await expect(page.getByText("Шинэ салбар").first()).toBeVisible({
      timeout: 5000,
    });

    // Form fields should exist
    await expect(page.locator("input#name")).toBeVisible({ timeout: 5000 });
    await expect(page.locator("input#address")).toBeVisible({ timeout: 5000 });
    await expect(page.locator("input#phone")).toBeVisible({ timeout: 5000 });
    await expect(page.locator("input#email")).toBeVisible({ timeout: 5000 });

    // Submit button should exist
    const submitBtn = page.getByRole("button", { name: "Салбар үүсгэх" });
    await expect(submitBtn).toBeVisible({ timeout: 5000 });
  });

  test("branch table shows correct columns when data exists", async ({
    page,
  }) => {
    await page.goto("/settings/branches", { waitUntil: "domcontentloaded" });

    // Skip if org doesn't have multi-branch enabled
    if (!(await isOnBranchPage(page))) {
      test.skip();
      return;
    }

    // Wait for data to load
    await page.waitForTimeout(2000);

    // Check if table exists
    const table = page.locator("table").first();
    const tableVisible = await table.isVisible().catch(() => false);

    if (tableVisible) {
      // Should have correct column headers
      await expect(page.locator("th:has-text('Нэр')")).toBeVisible({
        timeout: 5000,
      });
      await expect(page.locator("th:has-text('Хаяг')")).toBeVisible({
        timeout: 5000,
      });
      await expect(page.locator("th:has-text('Утас')")).toBeVisible({
        timeout: 5000,
      });
      await expect(page.locator("th:has-text('Төлөв')")).toBeVisible({
        timeout: 5000,
      });
      await expect(page.locator("th:has-text('Үйлдэл')")).toBeVisible({
        timeout: 5000,
      });
    }
  });
});
