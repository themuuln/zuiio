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
    await expect(
      page.getByText("Нөхцөлүүд").first(),
    ).toBeVisible();
    await expect(
      page.getByText("Урамшуулалууд").first(),
    ).toBeVisible();
  });

  test("create a promotion successfully", async ({ page }) => {
    await page.goto("/promotions", { waitUntil: "domcontentloaded" });

    await openDrawerByText(page, "Шинэ урамшуулал");
    await page.waitForTimeout(1500);

    // Fill promotion name
    const nameInput = page.getByPlaceholder(
      "Жишээ: Зуны супер урамшуулал",
    ).first();
    const nameVisible = await nameInput.isVisible().catch(() => false);
    if (nameVisible) {
      await nameInput.fill(UNIQUE_NAME);
    } else {
      // Fallback: try input[name="name"]
      const nameByName = page.locator('input[name="name"]').first();
      if (await nameByName.isVisible().catch(() => false)) {
        await nameByName.fill(UNIQUE_NAME);
      }
    }

    // Add a condition
    const addConditionBtn = page.getByText("Нөхцөл нэмэх").first();
    if (await addConditionBtn.isVisible().catch(() => false)) {
      await addConditionBtn.click();
      await page.waitForTimeout(300);
    }

    // Fill condition value (default: min_quantity, gte)
    const conditionInputs = page.locator(
      '[class*="rounded-lg"][class*="border-border"] input[type="text"]',
    );
    const firstConditionInput = conditionInputs.first();
    if (await firstConditionInput.isVisible().catch(() => false)) {
      await firstConditionInput.fill("2");
    }

    // Add a reward
    const addRewardBtn = page.getByText("Урамшуулал нэмэх").first();
    if (await addRewardBtn.isVisible().catch(() => false)) {
      await addRewardBtn.click();
      await page.waitForTimeout(300);
    }

    // Fill reward value (default: percentage_discount)
    const rewardInputs = page.locator(
      '[class*="space-y-2"] input[type="number"]',
    );
    // The first number input in rewards section
    const rewardValueInput = rewardInputs.first();
    if (await rewardValueInput.isVisible().catch(() => false)) {
      await rewardValueInput.fill("10");
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
          "Урамшуулал амжилттай үүсгэгдсэн.",
          { timeout: 5000 },
        );
      }
    }

    // Navigate back to list and verify the promotion appears
    await page.goto("/promotions", { waitUntil: "domcontentloaded" });
    await expect(page.locator("main")).toContainText(UNIQUE_NAME, {
      timeout: 10000,
    });
  });
});
