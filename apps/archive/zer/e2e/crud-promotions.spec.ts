import { expect, test } from "@playwright/test";
import { openDrawerByText } from "./helpers";

const UNIQUE_NAME = `E2E-Promo-${Date.now()}`;

test.describe("Promotions module", () => {
  test("page loads and shows content", async ({ page }) => {
    await page.goto("/promotions", { waitUntil: "domcontentloaded" });
    await expect(page.getByText("Сурталчилгаа").first()).toBeVisible({
      timeout: 15000,
    });
  });

  test("create drawer opens with form fields", async ({ page }) => {
    await page.goto("/promotions", { waitUntil: "domcontentloaded" });

    await openDrawerByText(page, "Шинэ урамшуулал");
    await page.waitForTimeout(1500);

    // Check form fields by their label text
    await expect(page.getByText("Нэр").first()).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("Төрөл").first()).toBeVisible();
    await expect(page.getByText("Эрэмбэ").first()).toBeVisible();
    await expect(page.getByText("Давхцуулах").first()).toBeVisible();
    await expect(page.getByText("Хүчинтэй эхлэх").first()).toBeVisible();
    await expect(page.getByText("Хүчинтэй дуусах").first()).toBeVisible();
    await expect(page.getByText("Ашиглах хязгаар").first()).toBeVisible();
    await expect(page.getByText("Идэвхтэй").first()).toBeVisible();
    await expect(page.getByText("Нөхцөлүүд").first()).toBeVisible();
    await expect(page.getByText("Урамшуулалууд").first()).toBeVisible();
  });

  test("create a promotion successfully", async ({ page }) => {
    await page.goto("/promotions", { waitUntil: "domcontentloaded" });

    await openDrawerByText(page, "Шинэ урамшуулал");
    const drawer = page.locator("[data-drawer-popup]:visible").first();
    await expect(drawer).toBeVisible();

    await drawer
      .getByPlaceholder("Жишээ: Зуны супер урамшуулал")
      .fill(UNIQUE_NAME);

    await drawer.getByRole("button", { name: "Нөхцөл нэмэх" }).click();
    const conditionInput = drawer.getByPlaceholder("Тоо");
    await expect(conditionInput).toBeVisible();
    await conditionInput.fill("2");

    await drawer.getByRole("button", { name: "Урамшуулал нэмэх" }).click();
    const rewardValueInput = drawer
      .locator('input[type="number"][placeholder="0"]')
      .last();
    await expect(rewardValueInput).toBeVisible();
    await rewardValueInput.fill("10");

    await drawer.getByRole("button", { name: "Хадгалах" }).click();

    const toast = page.locator("[data-sonner-toast]:visible").first();
    await expect(toast).toContainText("Урамшуулал амжилттай үүсгэгдсэн.", {
      timeout: 10_000,
    });
    await expect(drawer).toBeHidden({ timeout: 10_000 });

    await page.goto(`/promotions?refresh=${Date.now()}`, {
      waitUntil: "domcontentloaded",
    });
    await expect(page.locator("main")).toContainText(UNIQUE_NAME, {
      timeout: 10_000,
    });
  });
});
