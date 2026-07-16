import { expect, test } from "@playwright/test";
import { openDrawerByText } from "./helpers";

test.describe("Products module", () => {
  test("create drawer renders all form fields", async ({ page }) => {
    await page.goto("/products", { waitUntil: "domcontentloaded" });

    await test.step("Open create drawer", async () => {
      await openDrawerByText(page, "Шинэ бүтээгдэхүүн");
    });

    await test.step("Verify form fields are visible", async () => {
      await expect(page.getByLabel("Нэр")).toBeVisible({ timeout: 10000 });
      await expect(page.getByLabel("SKU")).toBeVisible();
      await expect(page.getByLabel("Өртөг")).toBeVisible();
      await expect(page.getByLabel("Үнийн дүн")).toBeVisible();
      await expect(page.getByLabel("Одоохон агуулахад")).toBeVisible();
      await expect(page.getByLabel("Доод нөөц")).toBeVisible();
      await expect(
        page.getByRole("button", { name: "Хадгалах" }),
      ).toBeVisible();
    });
  });

  test("page loads correctly", async ({ page }) => {
    await page.goto("/products", { waitUntil: "domcontentloaded" });
    await expect(page.getByText("Бүтээгдэхүүн").first()).toBeVisible({
      timeout: 15000,
    });
  });
});
