import { expect, type Page, test } from "@playwright/test";
import { openDrawerByText } from "./helpers";

const UNIQUE_CODE = `E2E-${Date.now()}`;
const FIXED_CODE = `FIX-${Date.now()}`;

async function addFirstProductToCart(page: Page) {
  await page.goto("/shop", { waitUntil: "domcontentloaded" });
  const addBtn = page.getByRole("button", { name: "Нэмэх" }).first();
  await expect(addBtn).toBeVisible({ timeout: 15_000 });
  await expect
    .poll(
      async () => {
        const readCartLength = async () =>
          page.evaluate(() => {
            const raw = sessionStorage.getItem("zer-shop-cart");
            if (!raw) return 0;
            const parsed: unknown = JSON.parse(raw);
            return Array.isArray(parsed) ? parsed.length : 0;
          });
        const currentLength = await readCartLength();
        if (currentLength > 0) return currentLength;
        await addBtn.click({ timeout: 1_000 }).catch(() => {});
        return readCartLength();
      },
      { timeout: 10_000, intervals: [100, 250, 500] },
    )
    .toBeGreaterThan(0);
}

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
    const drawer = page.locator("[data-drawer-popup]:visible").first();
    await expect(drawer).toBeVisible();

    await drawer.getByPlaceholder("Жишээ: SUMMER2024").fill(UNIQUE_CODE);
    await drawer.locator('[name="discount_value"]').fill("10");

    const submitBtn = drawer.getByRole("button", { name: "Хадгалах" });
    await expect(submitBtn).toBeVisible();
    await submitBtn.click();

    const toast = page.locator("[data-sonner-toast]:visible").first();
    await expect(toast).toContainText("Купон амжилттай үүсгэгдсэн.", {
      timeout: 10_000,
    });
    await expect(drawer).toBeHidden({ timeout: 10_000 });
  });

  test("create a fixed-amount coupon and verify in list", async ({ page }) => {
    await page.goto("/coupons", { waitUntil: "domcontentloaded" });

    await openDrawerByText(page, "Шинэ купон");
    const drawer = page.locator("[data-drawer-popup]:visible").first();
    await expect(drawer).toBeVisible();

    await drawer.getByPlaceholder("Жишээ: SUMMER2024").fill(FIXED_CODE);
    await drawer.getByText("Тогтмол дүн").click();
    await drawer.locator('[name="discount_value"]').fill("5000");

    const submitBtn = drawer.getByRole("button", { name: "Хадгалах" });
    await expect(submitBtn).toBeVisible();
    await submitBtn.click();

    const toast = page.locator("[data-sonner-toast]:visible").first();
    await expect(toast).toContainText("Купон амжилттай үүсгэгдсэн.", {
      timeout: 10_000,
    });
    await expect(drawer).toBeHidden({ timeout: 10_000 });

    await page.goto(`/coupons?refresh=${Date.now()}`, {
      waitUntil: "domcontentloaded",
    });
    await expect(page.locator("main")).toContainText(FIXED_CODE, {
      timeout: 10_000,
    });
  });

  test("apply valid coupon during checkout", async ({ page }) => {
    const checkoutCode = `CHK-${Date.now()}`;

    await page.goto("/coupons", { waitUntil: "domcontentloaded" });
    await openDrawerByText(page, "Шинэ купон");
    const drawer = page.locator("[data-drawer-popup]:visible").first();
    await expect(drawer).toBeVisible();
    await drawer.getByPlaceholder("Жишээ: SUMMER2024").fill(checkoutCode);
    await drawer.locator('[name="discount_value"]').fill("10");
    await drawer.getByRole("button", { name: "Хадгалах" }).click();
    await expect(
      page.locator("[data-sonner-toast]:visible").first(),
    ).toContainText("Купон амжилттай үүсгэгдсэн.", { timeout: 10_000 });
    await expect(drawer).toBeHidden({ timeout: 10_000 });

    await addFirstProductToCart(page);

    await page.goto("/shop/cart", { waitUntil: "domcontentloaded" });
    const checkoutBtn = page.getByRole("button", { name: "Төлбөр тооцоо" });
    await expect(checkoutBtn).toBeVisible({ timeout: 10_000 });
    await checkoutBtn.click();

    const checkoutDrawer = page.locator("[data-drawer-popup]:visible").last();
    const couponInput = checkoutDrawer.getByPlaceholder("Код оруулах").first();
    await expect(couponInput).toBeVisible({ timeout: 10_000 });
    await couponInput.fill(checkoutCode);
    await checkoutDrawer
      .getByRole("button", { name: "Хэрэглэх" })
      .first()
      .click();

    await expect(checkoutDrawer.getByText("Купон хэрэглэсэн")).toBeVisible({
      timeout: 10_000,
    });
    await expect(checkoutDrawer.getByText(checkoutCode)).toBeVisible();
  });

  test("invalid coupon code shows error toast", async ({ page }) => {
    await addFirstProductToCart(page);

    await page.goto("/shop/cart", { waitUntil: "domcontentloaded" });
    const checkoutBtn = page.getByRole("button", { name: "Төлбөр тооцоо" });
    await expect(checkoutBtn).toBeVisible({ timeout: 10_000 });
    await checkoutBtn.click();

    const checkoutDrawer = page.locator("[data-drawer-popup]:visible").last();
    const couponInput = checkoutDrawer.getByPlaceholder("Код оруулах").first();
    await expect(couponInput).toBeVisible({ timeout: 10_000 });
    await couponInput.fill("INVALID999");
    await checkoutDrawer
      .getByRole("button", { name: "Хэрэглэх" })
      .first()
      .click();

    const errorToast = page.locator("[data-sonner-toast]:visible").first();
    await expect(errorToast).toContainText("Купон олдсонгүй.", {
      timeout: 10_000,
    });
  });
});
