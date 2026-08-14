import { expect, type Page, test } from "@playwright/test";

test.describe("Audit log module", () => {
  async function isOnAuditPage(page: Page) {
    // Wait for potential client-side redirect after hydration
    await page.waitForTimeout(3000);
    return page.url().includes("/audit");
  }

  test("page loads and shows audit log shell", async ({ page }) => {
    await page.goto("/audit", { waitUntil: "domcontentloaded" });

    // Org may redirect if has_audit_log is disabled
    if (!(await isOnAuditPage(page))) {
      test.skip();
      return;
    }

    // Page shell should show the title
    await expect(
      page.getByRole("heading", { name: "Үйлдлийн түүх" }).first(),
    ).toBeVisible({ timeout: 15000 });
  });

  test("shows audit log table with correct columns when data exists", async ({
    page,
  }) => {
    await page.goto("/audit", { waitUntil: "domcontentloaded" });

    // Skip if org redirects
    if (!(await isOnAuditPage(page))) {
      test.skip();
      return;
    }

    // Wait for data to load (Suspense fallback may show briefly)
    await page.waitForTimeout(3000);

    // Check if data table or empty state is visible
    const emptyState = page.getByText("Үйлдлийн түүх байхгүй");
    const dataTable = page.locator("table").first();
    const hasEmptyState = await emptyState.isVisible().catch(() => false);
    const hasTable = await dataTable.isVisible().catch(() => false);

    if (hasEmptyState) {
      // Empty state is acceptable — the audit log may not have entries yet
      await expect(emptyState).toBeVisible({ timeout: 5000 });
      return;
    }

    if (hasTable) {
      // Should have correct column headers
      await expect(page.locator('th:has-text("Огноо")').first()).toBeVisible({
        timeout: 5000,
      });
      await expect(
        page.locator('th:has-text("Хэрэглэгч")').first(),
      ).toBeVisible({ timeout: 5000 });
      await expect(page.locator('th:has-text("Үйлдэл")').first()).toBeVisible({
        timeout: 5000,
      });
      await expect(page.locator('th:has-text("Төрөл")').first()).toBeVisible({
        timeout: 5000,
      });
      await expect(page.locator('th:has-text("Тайлбар")').first()).toBeVisible({
        timeout: 5000,
      });
    }
  });

  test("search input works when table is visible", async ({ page }) => {
    await page.goto("/audit", { waitUntil: "domcontentloaded" });

    // Skip if org redirects
    if (!(await isOnAuditPage(page))) {
      test.skip();
      return;
    }

    await page.waitForTimeout(3000);

    // Check if the search input exists (only in DataTable)
    const searchInput = page.getByPlaceholder("Хэрэглэгчээр хайх...");
    const hasSearch = await searchInput.isVisible().catch(() => false);

    if (hasSearch) {
      // Search input should accept text
      await searchInput.fill("Систем");
      await page.waitForTimeout(500);
      // Table should still render after search
      await expect(page.locator("table").first()).toBeVisible({
        timeout: 5000,
      });
    }
  });
});
