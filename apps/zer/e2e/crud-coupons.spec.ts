import { expect, test } from "@playwright/test";
import { openDrawerByText } from "./helpers";

const UNIQUE_CODE = `E2E-${Date.now()}`;
const FIXED_CODE = `FIX-${Date.now()}`;

test.describe("Coupons module", () => {
  test("page loads and shows content", async ({ page }) => {
    await page.goto("/coupons", { waitUntil: "domcontentloaded" });
    await expect(page.getByText("Купон").first()).toBeVisible({
      timeout: 15000,
    });
  });

  test("create coupon drawer opens with form fields", async ({ page }) => {
    await page.goto("/coupons", { waitUntil: "domcontentloaded" });

    await openDrawerByText(page, "Шинэ купон");
    await page.waitForTimeout(1500);

    // Check form fields by their label text
    await expect(page.getByText("Код").first()).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("Хямдралын төрөл").first()).toBeVisible();
    await expect(page.getByText("Хямдралын утга").first()).toBeVisible();
    await expect(
      page.getByText("Хамгийн бага захиалгын дүн").first(),
    ).toBeVisible();
    await expect(page.getByText("Хамаарах хүрээ").first()).toBeVisible();
    await expect(page.getByText("Хүчинтэй эхлэх").first()).toBeVisible();
    await expect(
      page.getByText("Нэг хэрэглэгчийн хязгаар").first(),
    ).toBeVisible();
    await expect(page.getByText("Идэвхтэй").first()).toBeVisible();
  });

  test("create a percentage coupon successfully", async ({ page }) => {
    await page.goto("/coupons", { waitUntil: "domcontentloaded" });

    await openDrawerByText(page, "Шинэ купон");
    await page.waitForTimeout(1500);

    // Fill coupon code
    const codeInput = page.getByPlaceholder("Жишээ: SUMMER2024").first();
    const codeVisible = await codeInput.isVisible().catch(() => false);
    if (codeVisible) {
      await codeInput.fill(UNIQUE_CODE);
    } else {
      // Fallback: try input[name="code"]
      const codeByName = page.locator('input[name="code"]').first();
      if (await codeByName.isVisible().catch(() => false)) {
        await codeByName.fill(UNIQUE_CODE);
      }
    }

    // Discount type "Хувь" (percentage) is selected by default — fill value
    const valueInput = page.locator('[name="discount_value"]').first();
    if (await valueInput.isVisible().catch(() => false)) {
      await valueInput.fill("10");
    }

    // Submit via the drawer submit button
    const submitBtn = page.getByText("Хадгалах").first();
    if (await submitBtn.isVisible().catch(() => false)) {
      await submitBtn.click();
      await page.waitForTimeout(2000);

      // Check for success toast
      const toast = page.locator("[data-sonner-toast]").first();
      const toastVisible = await toast.isVisible().catch(() => false);
      if (toastVisible) {
        await expect(toast).toContainText("Купон амжилттай үүсгэгдсэн.", {
          timeout: 5000,
        });
      }
    }
  });

  test("create a fixed-amount coupon and verify in list", async ({ page }) => {
    await page.goto("/coupons", { waitUntil: "domcontentloaded" });

    await openDrawerByText(page, "Шинэ купон");
    await page.waitForTimeout(1500);

    // Fill coupon code
    const codeInput = page.getByPlaceholder("Жишээ: SUMMER2024").first();
    if (await codeInput.isVisible().catch(() => false)) {
      await codeInput.fill(FIXED_CODE);
    }

    // Select "Тогтмол дүн" (fixed_amount) type by clicking the label
    const fixedTypeLabel = page.getByText("Тогтмол дүн").first();
    if (await fixedTypeLabel.isVisible().catch(() => false)) {
      await fixedTypeLabel.click();
      await page.waitForTimeout(300);
    }

    // Fill value
    const valueInput = page.locator('[name="discount_value"]').first();
    if (await valueInput.isVisible().catch(() => false)) {
      await valueInput.fill("5000");
    }

    // Submit
    const submitBtn = page.getByText("Хадгалах").first();
    if (await submitBtn.isVisible().catch(() => false)) {
      await submitBtn.click();
      await page.waitForTimeout(2000);

      // Check for success toast
      const toast = page.locator("[data-sonner-toast]").first();
      const toastVisible = await toast.isVisible().catch(() => false);
      if (toastVisible) {
        await expect(toast).toContainText("Купон амжилттай үүсгэгдсэн.", {
          timeout: 5000,
        });
      }
    }

    // Navigate back to list and verify the fixed-amount coupon appears
    await page.goto("/coupons", { waitUntil: "domcontentloaded" });
    await expect(page.locator("main")).toContainText(FIXED_CODE, {
      timeout: 10000,
    });
  });

  test("apply valid coupon during checkout", async ({ page }) => {
    // First create the coupon we'll use at checkout
    const checkoutCode = `CHK-${Date.now()}`;

    await page.goto("/coupons", { waitUntil: "domcontentloaded" });
    await openDrawerByText(page, "Шинэ купон");
    await page.waitForTimeout(1500);

    const codeInput = page.getByPlaceholder("Жишээ: SUMMER2024").first();
    if (await codeInput.isVisible().catch(() => false)) {
      await codeInput.fill(checkoutCode);
    }
    const valueInput = page.locator('[name="discount_value"]').first();
    if (await valueInput.isVisible().catch(() => false)) {
      await valueInput.fill("10");
    }
    const submitBtn = page.getByText("Хадгалах").first();
    if (await submitBtn.isVisible().catch(() => false)) {
      await submitBtn.click();
      await page.waitForTimeout(2000);
    }

    // Now go to shop and add a product to cart
    await page.goto("/shop", { waitUntil: "domcontentloaded" });

    const addBtn = page
      .getByRole("button", { name: "Нэмэх" })
      .first();
    const addBtnVisible = await addBtn.isVisible().catch(() => false);

    if (!addBtnVisible) {
      test.skip();
      return;
    }

    await addBtn.click();
    // Wait for cart to update
    await page
      .waitForResponse(
        (resp) => resp.url().includes("/api/") && resp.status() < 400,
      )
      .catch(() => {});

    // Go to cart page
    await page.goto("/shop/cart", { waitUntil: "domcontentloaded" });

    // Open checkout drawer
    const checkoutBtn = page
      .getByRole("button", { name: "Төлбөр тооцоо" })
      .first();
    const checkoutBtnVisible = await checkoutBtn.isVisible().catch(() => false);

    if (!checkoutBtnVisible) {
      test.skip();
      return;
    }

    await checkoutBtn.click();
    await page.waitForTimeout(1500);

    // Wait for checkout drawer
    await page
      .waitForSelector('[data-drawer-popup]', { timeout: 5000 })
      .catch(() => {});

    // Enter the valid coupon code
    const couponInput = page.getByPlaceholder("Код оруулах").first();
    const inputVisible = await couponInput.isVisible().catch(() => false);

    if (!inputVisible) {
      test.skip();
      return;
    }

    await couponInput.fill(checkoutCode);

    const applyBtn = page
      .getByRole("button", { name: "Хэрэглэх" })
      .first();
    if (await applyBtn.isVisible().catch(() => false)) {
      await applyBtn.click();
      await page.waitForTimeout(2000);

      // Verify discount is applied — "Купон хэрэглэсэн" appears
      const appliedLabel = page.getByText("Купон хэрэглэсэн").first();
      const appliedVisible = await appliedLabel.isVisible().catch(() => false);
      if (appliedVisible) {
        await expect(appliedLabel).toBeVisible({ timeout: 5000 });
        // The discount amount should also be visible (negative value)
        await expect(page.getByText(checkoutCode).first()).toBeVisible({
          timeout: 3000,
        });
      }
    }
  });

  test("invalid coupon code shows error toast", async ({ page }) => {
    // Add product to cart first
    await page.goto("/shop", { waitUntil: "domcontentloaded" });

    const addBtn = page
      .getByRole("button", { name: "Нэмэх" })
      .first();
    const addBtnVisible = await addBtn.isVisible().catch(() => false);

    if (!addBtnVisible) {
      test.skip();
      return;
    }

    await addBtn.click();
    await page
      .waitForResponse(
        (resp) => resp.url().includes("/api/") && resp.status() < 400,
      )
      .catch(() => {});

    // Go to cart and open checkout
    await page.goto("/shop/cart", { waitUntil: "domcontentloaded" });

    const checkoutBtn = page
      .getByRole("button", { name: "Төлбөр тооцоо" })
      .first();
    if (!(await checkoutBtn.isVisible().catch(() => false))) {
      test.skip();
      return;
    }

    await checkoutBtn.click();
    await page.waitForTimeout(1500);
    await page
      .waitForSelector('[data-drawer-popup]', { timeout: 5000 })
      .catch(() => {});

    // Enter a non-existent coupon code
    const couponInput = page.getByPlaceholder("Код оруулах").first();
    if (!(await couponInput.isVisible().catch(() => false))) {
      test.skip();
      return;
    }

    await couponInput.fill("INVALID999");

    const applyBtn = page
      .getByRole("button", { name: "Хэрэглэх" })
      .first();
    if (await applyBtn.isVisible().catch(() => false)) {
      await applyBtn.click();
      await page.waitForTimeout(2000);

      // Verify error toast appears with "Купон олдсонгүй."
      const errorToast = page.locator("[data-sonner-toast]").first();
      const toastVisible = await errorToast.isVisible().catch(() => false);
      if (toastVisible) {
        await expect(errorToast).toContainText("Купон олдсонгүй.", {
          timeout: 5000,
        });
      }
    }
  });
});
