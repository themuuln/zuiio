import { expect, test } from "@playwright/test";

test.describe("Shop order detail and receipt", () => {
  test("shop history detail page shows not-found for invalid id", async ({
    page,
  }) => {
    await page.goto("/shop/history/invalid-id-12345", {
      waitUntil: "domcontentloaded",
    });

    // Should show not-found state
    await expect(page.getByText("Борлуулалт олдсонгүй").first()).toBeVisible({
      timeout: 10000,
    });
  });

  test("shop receipt page shows not-found for invalid id", async ({ page }) => {
    await page.goto("/shop/receipt/invalid-id-12345", {
      waitUntil: "domcontentloaded",
    });

    // Should show not-found state
    await expect(page.getByText("Баримт олдсонгүй").first()).toBeVisible({
      timeout: 10000,
    });
  });

  test("shop history detail page has back link", async ({ page }) => {
    await page.goto("/shop/history/some-id", {
      waitUntil: "domcontentloaded",
    });

    // Should have back link regardless of whether sale exists
    const backLink = page.getByText("Түүх рүү буцах");
    await expect(backLink).toBeVisible({ timeout: 10000 });
  });

  test("shop receipt page has back link", async ({ page }) => {
    await page.goto("/shop/receipt/some-id", {
      waitUntil: "domcontentloaded",
    });

    // Should have back link regardless of whether sale exists
    const backLink = page.getByText("Түүх рүү буцах");
    await expect(backLink).toBeVisible({ timeout: 10000 });
  });

  test("shop receipt page has print button for valid orders", async ({
    page,
  }) => {
    // First, navigate to shop history to find a valid order
    await page.goto("/shop/history", { waitUntil: "domcontentloaded" });

    // Check if there are any order history items
    const historyRows = page.locator("table a, [role='row'] a, a").filter({
      hasText: /#/,
    });
    const rowCount = await historyRows.count();

    if (rowCount > 0) {
      // Click the first order link
      await historyRows.first().click();
      await page.waitForTimeout(2000);

      // If redirected to receipt, check for print button
      if (page.url().includes("/receipt/")) {
        const printBtn = page.locator("button:has-text('Хэвлэх')").first();
        await expect(printBtn).toBeVisible({ timeout: 5000 });
      }
    }
  });
});
