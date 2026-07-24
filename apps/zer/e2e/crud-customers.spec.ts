import { expect, test } from "@playwright/test";
import { openDrawerByText, submitDrawerForm } from "./helpers";

const NAME = `CUS-${Date.now()}`;

test.describe("Customers CRUD", () => {
  test("create customer via drawer", async ({ page }) => {
    await page.goto("/customers", { waitUntil: "domcontentloaded" });

    await test.step("Open create drawer and fill form", async () => {
      await openDrawerByText(page, "Харилцагч бүртгэх");
      await expect(page.getByLabel("Нэр")).toBeVisible({ timeout: 5000 });

      await page.getByLabel("Нэр").fill(NAME);
      await page.getByLabel("Утас").fill("99112233");
      await page.getByLabel("Имэйл").fill(`cus-${Date.now()}@test.mn`);
    });

    await test.step("Submit and verify in list", async () => {
      await submitDrawerForm(page, "customer-form");

      await page.goto("/customers", { waitUntil: "domcontentloaded" });
      await expect(page.locator("main")).toContainText(NAME, {
        timeout: 10000,
      });
    });
  });

  test("created customer visible in list", async ({ page }) => {
    await page.goto("/customers", { waitUntil: "domcontentloaded" });
    await expect(page.locator("main")).toContainText(NAME, { timeout: 15000 });
  });
});
