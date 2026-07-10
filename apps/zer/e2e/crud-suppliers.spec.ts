import { expect, test } from "@playwright/test";
import { openDrawerByText, submitDrawerForm } from "./helpers";

const NAME = `SUP-${Date.now()}`;

test.describe("Suppliers CRUD", () => {
  test("create supplier via drawer", async ({ page }) => {
    await page.goto("/suppliers", { waitUntil: "domcontentloaded" });

    await openDrawerByText(page, "Нийлүүлэгч бүртгэх");
    await expect(page.locator('input[name="name"]')).toBeVisible({
      timeout: 5000,
    });

    await page.locator('input[name="name"]').fill(NAME);
    await page.locator('input[name="phone"]').fill("99112233");
    await page.locator('input[name="email"]').fill(`sup-${Date.now()}@test.mn`);

    await submitDrawerForm(page, "supplier-form");

    await page.goto("/suppliers", { waitUntil: "domcontentloaded" });
    await expect(page.locator("main")).toContainText(NAME, { timeout: 10000 });
  });

  test("created supplier visible in list", async ({ page }) => {
    await page.goto("/suppliers", { waitUntil: "domcontentloaded" });
    await expect(page.locator("main")).toContainText(NAME, { timeout: 15000 });
  });
});
