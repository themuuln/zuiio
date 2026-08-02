import { expect, type Page, test } from "@playwright/test";

/**
 * Select the first available product from the sale form's product browser.
 */
async function selectFirstProduct(page: Page, rowIndex = 0) {
  const productButton = page
    .getByRole("button", { name: "Бараа сонгох" })
    .nth(rowIndex);
  await expect(productButton).toBeVisible({ timeout: 10_000 });
  await productButton.click();

  await expect(page.getByPlaceholder("Бүтээгдэхүүн хайх...")).toBeVisible({
    timeout: 10_000,
  });

  const firstProductCard = page
    .locator('button[type="button"]')
    .filter({ hasText: "₮" })
    .first();
  await expect(firstProductCard).toBeVisible({ timeout: 10_000 });
  await firstProductCard.click();
}
async function openSaleDrawer(page: Page) {
  const trigger = page.getByRole("button", { name: "Шинэ борлуулалт" });
  const heading = page.getByRole("heading", { name: "Борлуулалт нэмэх" });

  await expect(trigger).toBeVisible({ timeout: 10_000 });
  await expect
    .poll(
      async () => {
        if (await heading.isVisible()) return true;
        try {
          await trigger.click({ timeout: 1_000 });
        } catch {
          // The trigger can be temporarily covered while the page hydrates.
        }
        return await heading.isVisible();
      },
      { timeout: 15_000, intervals: [100, 250, 500] },
    )
    .toBe(true);
}

test.describe("Post-save workflow", () => {
  test("sale form submit shows toast with actions", async ({ page }) => {
    await page.goto("/sales", { waitUntil: "domcontentloaded" });
    await openSaleDrawer(page);
    await selectFirstProduct(page, 0);

    await page.getByRole("button", { name: "Борлуулалт хадгалах" }).click();

    const toast = page.locator("[data-sonner-toast]").first();
    await expect(toast).toBeVisible({ timeout: 30_000 });
    await expect(toast).toContainText("Борлуулалт амжилттай");
    await expect(toast).toContainText("₮");
    await expect(
      page.getByRole("button", { name: "Дэлгэрэнгүй" }).first(),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Дахин бүртгэх" }).first(),
    ).toBeVisible();
  });

  test("drawer closes after sale is saved", async ({ page }) => {
    await page.goto("/sales", { waitUntil: "domcontentloaded" });
    await openSaleDrawer(page);
    await selectFirstProduct(page, 0);

    await page.getByRole("button", { name: "Борлуулалт хадгалах" }).click();

    await expect(page.locator("[data-sonner-toast]").first()).toBeVisible({
      timeout: 30_000,
    });
    await expect(
      page.getByRole("heading", { name: "Борлуулалт нэмэх" }),
    ).toBeHidden({ timeout: 10_000 });
    await expect(
      page.getByRole("button", { name: "Шинэ борлуулалт" }),
    ).toBeVisible({ timeout: 10_000 });
  });
});
