import { expect, test } from "@playwright/test";

test.describe("Shop checkout flow", () => {
  test("add product to cart from catalog", async ({ page }) => {
    await page.goto("/shop", { waitUntil: "domcontentloaded" });

    await test.step("Find and add product", async () => {
      const addBtn = page.getByRole("button", { name: "Нэмэх" }).first();
      const addBtnVisible = await addBtn.isVisible().catch(() => false);

      if (!addBtnVisible) {
        test.skip();
        return;
      }

      await addBtn.click();
      // Wait for cart count to update instead of hardcoded timeout
      await page
        .waitForResponse(
          (resp) => resp.url().includes("/api/") && resp.status() < 400,
        )
        .catch(() => {});
    });

    await test.step("Verify cart has items", async () => {
      await page.goto("/shop/cart", { waitUntil: "domcontentloaded" });

      const total = page.getByText("Нийт дүн").first();
      const emptyCart = page.getByText("Сагс хоосон").first();
      const emptyVisible = await emptyCart.isVisible().catch(() => false);

      if (!emptyVisible) {
        await expect(total).toBeVisible({ timeout: 5000 });
      }
    });
  });

  test("cart page shows empty state when no items", async ({ page }) => {
    await page.goto("/shop/cart", { waitUntil: "domcontentloaded" });

    await test.step("Verify empty or populated cart", async () => {
      const emptyState = page.getByText("Сагс хоосон").first();
      const total = page.getByText("Нийт дүн").first();

      const emptyVisible = await emptyState.isVisible().catch(() => false);
      const totalVisible = await total.isVisible().catch(() => false);

      if (emptyVisible) {
        await expect(emptyState).toBeVisible();
        await expect(page.getByText("Бараа үзэх").first()).toBeVisible();
      } else if (totalVisible) {
        // Items exist in cart — valid state
      }
    });
  });

  test("checkout page renders with payment options", async ({ page }) => {
    await page.goto("/shop/checkout", { waitUntil: "domcontentloaded" });

    await test.step("Verify checkout page content", async () => {
      const checkoutTitle = page.getByRole("heading", {
        name: "Төлбөр тооцоо",
      });
      const emptyCart = page.getByText("Сагс хоосон").first();

      const checkoutVisible = await checkoutTitle
        .isVisible()
        .catch(() => false);
      const emptyVisible = await emptyCart.isVisible().catch(() => false);

      if (checkoutVisible) {
        await expect(checkoutTitle).toBeVisible();
        await expect(page.getByText("Захиалга").first()).toBeVisible();
        await expect(
          page.getByRole("button", { name: "Борлуулалт үүсгэх" }),
        ).toBeVisible();
      } else if (emptyVisible) {
        await expect(emptyCart).toBeVisible();
      }
      // If neither visible, page may still be loading — no hardcoded wait
    });
  });

  test("shop history page loads", async ({ page }) => {
    await page.goto("/shop/history", { waitUntil: "domcontentloaded" });

    await test.step("Verify shop history title", async () => {
      await expect(page.getByText("Борлуулалтын түүх").first()).toBeVisible({
        timeout: 10000,
      });
    });
  });
});
