import { expect, type Locator, type Page, test } from "@playwright/test";
import { openDrawerByText } from "./helpers";

const UNIQUE_CODE = `E2E-${Date.now()}`;
const FIXED_CODE = `FIX-${Date.now()}`;
const TOPUP_CODE = `TOP-${Date.now()}`;
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

async function createGiftCard(page: Page, code: string, balance: string) {
  await page.goto("/gift-cards", { waitUntil: "domcontentloaded" });
  await openDrawerByText(page, "Шинэ бэлгийн карт");
  const drawer = page.locator("[data-drawer-popup]:visible").first();
  await expect(drawer).toBeVisible();

  await drawer.getByPlaceholder("Жишээ: GIFT2024").fill(code);
  await drawer.locator('input[inputmode="decimal"]').fill(balance);
  const submitButton = drawer.getByRole("button", { name: "Хадгалах" });
  await expect(submitButton).toBeEnabled();
  await submitButton.click();

  await expect(
    page.locator("[data-sonner-toast]:visible").first(),
  ).toContainText("Бэлгийн карт амжилттай үүсгэгдсэн.", { timeout: 30_000 });
  await expect(drawer).toBeHidden({ timeout: 30_000 });
}

async function openGiftCardDetail(page: Page, code: string) {
  await page.goto(`/gift-cards?refresh=${Date.now()}`, {
    waitUntil: "domcontentloaded",
  });
  const cardRow = page.locator("main").getByText(code).first();
  await expect(cardRow).toBeVisible({ timeout: 10_000 });
  await cardRow.click();

  const drawer = page.locator("[data-drawer-popup]:visible").last();
  await expect(drawer).toBeVisible({ timeout: 10_000 });
  return drawer;
}

async function assertGiftCardBalance(
  drawer: Locator,
  code: string,
  balance: string,
) {
  await expect(drawer).toContainText(code);
  await expect(drawer.getByText("Үлдэгдэл").first()).toBeVisible();
  await expect(drawer).toContainText(balance);
}

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
    await expect(page.getByText("Хүлээн авагчийн нэр").first()).toBeVisible();
    await expect(
      page.getByText("Хүлээн авагчийн и-мэйл").first(),
    ).toBeVisible();
    await expect(page.getByText("Илгээгчийн нэр").first()).toBeVisible();
    await expect(page.getByText("Дуусах огноо").first()).toBeVisible();
    await expect(page.getByText("Мэдээлэл").first()).toBeVisible();
    await expect(page.getByText("Идэвхтэй").first()).toBeVisible();
  });

  test("create a gift card successfully", async ({ page }) => {
    await createGiftCard(page, UNIQUE_CODE, "50000");
  });

  test("create a fixed gift card and verify in list", async ({ page }) => {
    await createGiftCard(page, FIXED_CODE, "100000");

    await page.goto(`/gift-cards?refresh=${Date.now()}`, {
      waitUntil: "domcontentloaded",
    });
    await expect(page.locator("main")).toContainText(FIXED_CODE, {
      timeout: 10_000,
    });
  });

  test("gift card detail shows balance", async ({ page }) => {
    const detailCode = `DTL-${Date.now()}`;
    await createGiftCard(page, detailCode, "75000");

    const drawer = await openGiftCardDetail(page, detailCode);
    await assertGiftCardBalance(drawer, detailCode, "75,000");
  });

  test("top up a gift card and verify balance", async ({ page }) => {
    await createGiftCard(page, TOPUP_CODE, "20000");

    const drawer = await openGiftCardDetail(page, TOPUP_CODE);
    await assertGiftCardBalance(drawer, TOPUP_CODE, "20,000");
    await expect(drawer.getByText("Олгосон").first()).toBeVisible();
  });

  test("invalid gift card code in checkout shows error", async ({ page }) => {
    await addFirstProductToCart(page);

    await page.goto("/shop/cart", { waitUntil: "domcontentloaded" });
    const checkoutBtn = page.getByRole("button", { name: "Төлбөр тооцоо" });
    await expect(checkoutBtn).toBeVisible({ timeout: 10_000 });
    await checkoutBtn.click();

    const checkoutDrawer = page.locator("[data-drawer-popup]:visible").last();
    const giftCardInput = checkoutDrawer.getByPlaceholder("Картын код оруулах");
    await expect(giftCardInput).toBeVisible({ timeout: 10_000 });
    await giftCardInput.fill("INVALIDGIFT999");
    const applyButton = checkoutDrawer
      .getByRole("button", { name: "Хэрэглэх" })
      .last();
    await expect(applyButton).toBeEnabled();
    await applyButton.click();

    const errorToast = page.locator("[data-sonner-toast]:visible").first();
    await expect(errorToast).toContainText("Бэлгийн карт олдсонгүй.", {
      timeout: 10_000,
    });
  });
});
