import { expect, test } from "@playwright/test";

test.describe("Commissions module", () => {
  test("page loads and shows commission section", async ({ page }) => {
    await page.goto("/commissions", { waitUntil: "domcontentloaded" });

    // Page shell should render
    await expect(page.getByText("Комисс").first()).toBeVisible({
      timeout: 10000,
    });

    // Should show either the staff cards section or empty state
    const staffHeading = page.getByText("Ажилтнуудын комисс");
    const emptyState = page.getByText("Комиссын мэдээлэл байхгүй");

    await expect(staffHeading.or(emptyState).first()).toBeVisible({
      timeout: 10000,
    });
  });

  test("payout history section is present when commission data exists", async ({
    page,
  }) => {
    await page.goto("/commissions", { waitUntil: "domcontentloaded" });

    const main = page.locator("main");
    const emptyState = main
      .getByRole("heading", { name: "Комиссын мэдээлэл байхгүй", exact: true })
      .first();
    const staffHeading = main
      .getByRole("heading", { name: "Ажилтнуудын комисс", exact: true })
      .first();
    await expect(staffHeading.or(emptyState).first()).toBeVisible({
      timeout: 15000,
    });

    const emptyVisible = await emptyState.isVisible();

    if (emptyVisible) {
      // No commission data — payout history section is not rendered
      await expect(emptyState).toBeVisible({ timeout: 5000 });
    } else {
      // Commission data exists — payout history should be visible
      const historyHeading = page.getByText("Төлөлтийн түүх");
      await expect(historyHeading).toBeVisible({ timeout: 10000 });

      // Should show either payout history table or empty state
      const emptyHistory = page.getByText("Төлөлтийн түүх байхгүй");
      const tableHeader = page.locator("th:has-text('Огноо')");
      await expect(emptyHistory.or(tableHeader).first()).toBeVisible({
        timeout: 5000,
      });
    }
  });

  test("staff cards render when commission data exists", async ({ page }) => {
    await page.goto("/commissions", { waitUntil: "domcontentloaded" });

    // Wait for data to load
    await page.waitForTimeout(2000);

    // Check if staff cards exist
    const cards = page.locator("button:has-text('₮')");
    const cardCount = await cards.count();

    if (cardCount > 0) {
      // If staff cards exist, they should show metrics
      const firstCard = cards.first();
      await expect(firstCard).toBeVisible({ timeout: 5000 });

      // Click a staff card to verify drill-down opens
      await firstCard.click();
      await page.waitForTimeout(1000);

      // Should show staff drill-down with unpaid items or "all paid"
      const drillDown = page.getByText("төлөгдөөгүй комисс");
      const allPaid = page.getByText("Бүгд төлөгдсөн");

      // Either drill-down shows or cards stay visible
      const drillVisible = await drillDown.isVisible().catch(() => false);
      const allPaidVisible = await allPaid.isVisible().catch(() => false);
      expect(drillVisible || allPaidVisible).toBeTruthy();
    }
  });
});
