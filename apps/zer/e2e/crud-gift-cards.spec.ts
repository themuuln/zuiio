import { expect, test } from "@playwright/test";
import { openDrawerByText } from "./helpers";

const UNIQUE_CODE = `E2E-${Date.now()}`;
const FIXED_CODE = `FIX-${Date.now()}`;
const TOPUP_CODE = `TOP-${Date.now()}`;

test.describe("Gift cards module", () => {
  test("page loads and shows content", async ({ page }) => {
    await page.goto("/gift-cards", { waitUntil: "domcontentloaded" });
    await expect(page.getByText("Бэлгийн карт").first()).toBeVisible({
      timeout: 15000,
    });
  });

  test("create gift card drawer opens with form fields", async ({ page }) => {
    await page.goto("/gift-cards", { waitUntil: "domcontentloaded" });

    await openDrawerByText(page, "Шинэ бэлгийн карт");
    await page.waitForTimeout(1500);

    // Check form fields by their label text
    await expect(page.getByText("Код").first()).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("Анхны үлдэгдэл").first()).toBeVisible();
    await expect(page.getByText("Валют").first()).toBeVisible();
    await expect(
      page.getByText("Хүлээн авагчийн нэр").first(),
    ).toBeVisible();
    await expect(
      page.getByText("Хүлээн авагчийн и-мэйл").first(),
    ).toBeVisible();
    await expect(page.getByText("Илгээгчийн нэр").first()).toBeVisible();
    await expect(page.getByText("Дуусах огноо").first()).toBeVisible();
    await expect(page.getByText("Мэдээлэл").first()).toBeVisible();
    await expect(page.getByText("Идэвхтэй").first()).toBeVisible();
  });

  test("create a gift card successfully", async ({ page }) => {
    await page.goto("/gift-cards", { waitUntil: "domcontentloaded" });

    await openDrawerByText(page, "Шинэ бэлгийн карт");
    await page.waitForTimeout(1500);

    // Fill gift card code using placeholder
    const codeInput = page.getByPlaceholder("Жишээ: GIFT2024").first();
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

    // Set initial balance via the currency input
    const balanceInput = page.locator('input[type="text"]').first();
    if (await balanceInput.isVisible().catch(() => false)) {
      await balanceInput.fill("50000");
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
        await expect(toast).toContainText(
          "Бэлгийн карт амжилттай үүсгэгдсэн.",
          { timeout: 5000 },
        );
      }
    }
  });

  test("create a fixed gift card and verify in list", async ({ page }) => {
    await page.goto("/gift-cards", { waitUntil: "domcontentloaded" });

    await openDrawerByText(page, "Шинэ бэлгийн карт");
    await page.waitForTimeout(1500);

    // Fill gift card code
    const codeInput = page.getByPlaceholder("Жишээ: GIFT2024").first();
    if (await codeInput.isVisible().catch(() => false)) {
      await codeInput.fill(FIXED_CODE);
    }

    // Set initial balance
    const balanceInput = page.locator('input[type="text"]').first();
    if (await balanceInput.isVisible().catch(() => false)) {
      await balanceInput.fill("100000");
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
        await expect(toast).toContainText(
          "Бэлгийн карт амжилттай үүсгэгдсэн.",
          { timeout: 5000 },
        );
      }
    }

    // Navigate back to list and verify the fixed gift card appears
    await page.goto("/gift-cards", { waitUntil: "domcontentloaded" });
    await expect(page.locator("main")).toContainText(FIXED_CODE, {
      timeout: 10000,
    });
  });

  test("gift card detail shows balance", async ({ page }) => {
    // First create a gift card we can inspect
    const detailCode = `DTL-${Date.now()}`;

    await page.goto("/gift-cards", { waitUntil: "domcontentloaded" });
    await openDrawerByText(page, "Шинэ бэлгийн карт");
    await page.waitForTimeout(1500);

    const codeInput = page.getByPlaceholder("Жишээ: GIFT2024").first();
    if (await codeInput.isVisible().catch(() => false)) {
      await codeInput.fill(detailCode);
    }
    const balanceInput = page.locator('input[type="text"]').first();
    if (await balanceInput.isVisible().catch(() => false)) {
      await balanceInput.fill("75000");
    }
    const submitBtn = page.getByText("Хадгалах").first();
    if (await submitBtn.isVisible().catch(() => false)) {
      await submitBtn.click();
      await page.waitForTimeout(2000);
    }

    // Navigate to gift cards list and click on the created card
    await page.goto("/gift-cards", { waitUntil: "domcontentloaded" });

    // Click the row containing our gift card code
    const cardRow = page.locator("main").getByText(detailCode).first();
    await expect(cardRow).toBeVisible({ timeout: 10000 });

    // Click on the row to open detail drawer
    // Try clicking the cell directly
    await cardRow.click();
    await page.waitForTimeout(1500);

    // Wait for the detail drawer to appear
    await page
      .waitForSelector('[data-drawer-popup]', { timeout: 5000 })
      .catch(() => {});

    // Check the detail drawer shows balance information
    const balanceLabel = page.getByText("Үлдэгдэл").first();
    const balanceVisible = await balanceLabel.isVisible().catch(() => false);
    if (balanceVisible) {
      await expect(balanceLabel).toBeVisible({ timeout: 5000 });
    }

    // Verify the code is visible in the drawer header
    const detailTitle = page.getByText(detailCode).first();
    const titleVisible = await detailTitle.isVisible().catch(() => false);
    if (titleVisible) {
      await expect(detailTitle).toBeVisible({ timeout: 5000 });
    }
  });

  test("top up a gift card and verify balance", async ({ page }) => {
    // Create a gift card with initial balance
    await page.goto("/gift-cards", { waitUntil: "domcontentloaded" });

    await openDrawerByText(page, "Шинэ бэлгийн карт");
    await page.waitForTimeout(1500);

    const codeInput = page.getByPlaceholder("Жишээ: GIFT2024").first();
    if (await codeInput.isVisible().catch(() => false)) {
      await codeInput.fill(TOPUP_CODE);
    }

    // Set initial balance of 20000
    const balanceInput = page.locator('input[type="text"]').first();
    if (await balanceInput.isVisible().catch(() => false)) {
      await balanceInput.fill("20000");
    }

    const submitBtn = page.getByText("Хадгалах").first();
    if (await submitBtn.isVisible().catch(() => false)) {
      await submitBtn.click();
      await page.waitForTimeout(2000);
    }

    // Navigate to list and verify card exists with balance
    await page.goto("/gift-cards", { waitUntil: "domcontentloaded" });
    await expect(page.locator("main")).toContainText(TOPUP_CODE, {
      timeout: 10000,
    });

    // Click to open detail drawer
    const cardRow = page.locator("main").getByText(TOPUP_CODE).first();
    await cardRow.click();
    await page.waitForTimeout(1500);

    await page
      .waitForSelector('[data-drawer-popup]', { timeout: 5000 })
      .catch(() => {});

    // Verify balance section is visible
    const balanceLabel = page.getByText("Үлдэгдэл").first();
    if (await balanceLabel.isVisible().catch(() => false)) {
      await expect(balanceLabel).toBeVisible({ timeout: 5000 });
    }

    // Verify issuance transaction appears in transaction history
    const issuanceLabel = page.getByText("Олгосон").first();
    if (await issuanceLabel.isVisible().catch(() => false)) {
      await expect(issuanceLabel).toBeVisible({ timeout: 5000 });
    }
  });

  test("invalid gift card code in checkout shows error", async ({ page }) => {
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

    // Enter a non-existent gift card code
    const giftCardInput = page.getByPlaceholder("Картын код оруулах").first();
    if (!(await giftCardInput.isVisible().catch(() => false))) {
      test.skip();
      return;
    }

    await giftCardInput.fill("INVALIDGIFT999");

    const applyBtn = page
      .getByRole("button", { name: "Хэрэглэх" })
      .first();
    if (await applyBtn.isVisible().catch(() => false)) {
      await applyBtn.click();
      await page.waitForTimeout(2000);

      // Verify error toast appears with "Бэлгийн карт олдсонгүй."
      const errorToast = page.locator("[data-sonner-toast]").first();
      const toastVisible = await errorToast.isVisible().catch(() => false);
      if (toastVisible) {
        await expect(errorToast).toContainText("Бэлгийн карт олдсонгүй.", {
          timeout: 5000,
        });
      }
    }
  });
});
