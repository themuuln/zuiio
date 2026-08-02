import { expect, test } from "@playwright/test";
import { openDrawerByText, submitDrawerForm } from "./helpers";

const NAME = `CUS-${Date.now()}`;
const SEEDED_NAME = "E2E Customer";

test.describe("Customers CRUD", () => {
  test("create customer via drawer", async ({ page }) => {
    await page.goto("/customers", { waitUntil: "domcontentloaded" });

    await test.step("Open create drawer and fill form", async () => {
      await openDrawerByText(page, "Харилцагч бүртгэх");
      await expect(page.getByPlaceholder("Болд Цэцгээ")).toBeVisible({
        timeout: 5000,
      });

      await page.getByPlaceholder("Болд Цэцгээ").fill(NAME);
      await page.getByPlaceholder("+976 9911-2233").fill("99112233");
      await page
        .getByPlaceholder("bold@example.com")
        .fill(`cus-${Date.now()}@test.mn`);
    });

    await test.step("Submit and verify in list", async () => {
      await submitDrawerForm(page, "customer-form");

      await page.goto(`/customers?refresh=${Date.now()}`, {
        waitUntil: "domcontentloaded",
      });
      await expect(page.locator("main").last()).toContainText(NAME, {
        timeout: 10000,
      });
    });
  });

  test("seeded customer visible in list", async ({ page }) => {
    await page.goto(`/customers?refresh=${Date.now()}`, {
      waitUntil: "domcontentloaded",
    });
    await expect(page.locator("main").last()).toContainText(SEEDED_NAME, {
      timeout: 15_000,
    });
  });
});
