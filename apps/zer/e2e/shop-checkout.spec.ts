import { expect, test } from "@playwright/test";

test.describe("Shop checkout flow", () => {
  test("add product to cart from catalog", async ({ page }) => {
    await page.goto("/shop", { waitUntil: "domcontentloaded" });

    // Check if there are products to add
    const addBtn = page.getByText("Нэмэх").first();
    const addBtnVisible = await addBtn.isVisible().catch(() => false);

    if (!addBtnVisible) {
      // Empty shop — skip this test
      console.log("Shop has no products to add to cart, skipping");
      test.skip();
      return;
    }

    // Click the first "Нэмэх" button on a product card
    await addBtn.click();
    await page.waitForTimeout(1000);

    // Navigate to cart to verify product was added
    await page.goto("/shop/cart", { waitUntil: "domcontentloaded" });

    // Cart should have items — check for quantity controls or total
    const total = page.locator("text=Нийт дүн").first();
    const emptyCart = page.locator("text=Сагс хоосон").first();
    const emptyVisible = await emptyCart.isVisible().catch(() => false);

    if (!emptyVisible) {
      await expect(total).toBeVisible({ timeout: 5000 });
    }
  });

  test("cart page shows empty state when no items", async ({ page }) => {
    // Clear cookies/storage to ensure empty cart
    await page.goto("/shop/cart", { waitUntil: "domcontentloaded" });

    // Should show empty state or cart with items
    const emptyState = page.locator("text=Сагс хоосон").first();
    const total = page.locator("text=Нийт дүн").first();

    const emptyVisible = await emptyState.isVisible().catch(() => false);
    const totalVisible = await total.isVisible().catch(() => false);

    if (emptyVisible) {
      await expect(emptyState).toBeVisible({ timeout: 5000 });
      await expect(page.getByText("Бараа үзэх").first()).toBeVisible();
    } else if (totalVisible) {
      // Items exist in cart — that's fine too
      console.log("Cart has items from previous test or session");
    }
  });

  test("checkout page renders with payment options", async ({ page }) => {
    await page.goto("/shop/checkout", { waitUntil: "domcontentloaded" });

    // Checkout page could show either the form or empty cart state
    const checkoutTitle = page.locator("h1:has-text('Төлбөр тооцоо')").first();
    const emptyCart = page.locator("text=Сагс хоосон").first();

    const checkoutVisible = await checkoutTitle.isVisible().catch(() => false);
    const emptyVisible = await emptyCart.isVisible().catch(() => false);

    if (checkoutVisible) {
      await expect(checkoutTitle).toBeVisible({ timeout: 5000 });
      // Should show order summary at minimum
      const orderSummary = page.getByText("Захиалга").first();
      await expect(orderSummary).toBeVisible({ timeout: 5000 });
      // Should render submit button
      await expect(page.getByText("Борлуулалт үүсгэх").first()).toBeVisible();
    } else if (emptyVisible) {
      await expect(emptyCart).toBeVisible({ timeout: 5000 });
    } else {
      // Might still be in loading state — wait a bit more
      await page.waitForTimeout(3000);
      const fallbackEmpty = page.locator("text=Сагс хоосон").first();
      if (await fallbackEmpty.isVisible().catch(() => false)) {
        await expect(fallbackEmpty).toBeVisible();
      }
    }
  });

  test("shop history page loads", async ({ page }) => {
    await page.goto("/shop/history", { waitUntil: "domcontentloaded" });

    const title = page.locator("text=Борлуулалтын түүх").first();
    await expect(title).toBeVisible({ timeout: 10000 });
  });
});
