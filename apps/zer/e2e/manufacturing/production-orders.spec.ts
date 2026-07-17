import { expect, test } from "@playwright/test";

/**
 * Production order creation and stage flow.
 *
 * ⚠️  These tests require the production orders UI at /production
 *     (Phase 2: src/app/(dashboard)/production/).  The tests document
 *     the expected behavior and will fail until that page is built.
 *
 * Run conditionally:
 *   npx playwright test e2e/manufacturing/production-orders.spec.ts
 *
 * Expected statuses and their Mongolian labels:
 *   Хүлээгдэж буй   → pending
 *   Боловсруулж буй   → in_progress
 *   Дууссан           → completed
 */

const STAGE_COUNT = 5;

test.describe
  .serial("Production order lifecycle", () => {
    let orderName: string;

    test("create a new production order", async ({ page }) => {
      await page.goto("/production", { waitUntil: "domcontentloaded" });

      orderName = `PO-${Date.now()}`;

      // Open create drawer
      await page
        .getByRole("button", { name: /шинэ захиалга|үүсгэх/i })
        .first()
        .click();

      const drawer = page
        .locator('[data-drawer-popup], [role="dialog"]')
        .first();
      await expect(drawer).toBeVisible();

      // Fill required fields
      await drawer.getByLabel("Бүтээгдэхүүн").click();
      await drawer
        .getByRole("option", { name: /тест|туршилт/i })
        .first()
        .click();

      await drawer.getByLabel("BOM").click();
      await drawer.getByRole("option").first().click();

      await drawer.getByLabel("Тоо ширхэг").fill("10");

      await drawer.getByLabel("Салбар").click();
      await drawer.getByRole("option").first().click();

      // Submit
      await drawer.getByRole("button", { name: /үүсгэх|хадгалах/i }).click();

      // Verify pending status
      await page.reload({ waitUntil: "domcontentloaded" });
      await expect(page.locator("main")).toContainText("Хүлээгдэж буй");
    });

    test("start the production order", async ({ page }) => {
      await page.goto("/production", { waitUntil: "domcontentloaded" });

      // Open the order detail
      const row = page
        .locator("tr")
        .filter({ hasText: "Хүлээгдэж буй" })
        .first();
      await row.getByRole("button", { name: /харах|деталь/i }).click();

      const drawer = page
        .locator('[data-drawer-popup], [role="dialog"]')
        .first();
      await expect(drawer).toBeVisible();

      // Click start
      await drawer.getByRole("button", { name: /эхлүүлэх/i }).click();

      // Verify status changed
      await expect(drawer).toContainText("Боловсруулж буй");
    });

    test("advance through all production stages", async ({ page }) => {
      await page.goto("/production", { waitUntil: "domcontentloaded" });

      // Open the in-progress order
      const row = page
        .locator("tr")
        .filter({ hasText: "Боловсруулж буй" })
        .first();
      await row.getByRole("button", { name: /харах|деталь/i }).click();

      const drawer = page
        .locator('[data-drawer-popup], [role="dialog"]')
        .first();
      await expect(drawer).toBeVisible();

      // Click "Дараагийн шат" (next stage) STAGE_COUNT times
      for (let i = 0; i < STAGE_COUNT; i++) {
        await drawer.getByRole("button", { name: /дараагийн шат/i }).click();
        // Wait for the stage indicator to update
        await page.waitForTimeout(500);
      }

      // All stages should now be complete — the "complete" button should be available
      await expect(
        drawer.getByRole("button", { name: /дуусгах/i }),
      ).toBeVisible();
    });

    test("complete the production order", async ({ page }) => {
      await page.goto("/production", { waitUntil: "domcontentloaded" });

      const row = page
        .locator("tr")
        .filter({ hasText: "Боловсруулж буй" })
        .first();
      await row.getByRole("button", { name: /харах|деталь/i }).click();

      const drawer = page
        .locator('[data-drawer-popup], [role="dialog"]')
        .first();
      await expect(drawer).toBeVisible();

      // Complete
      await drawer.getByRole("button", { name: /дуусгах/i }).click();

      // Confirm if prompted
      const confirmBtn = drawer.getByRole("button", {
        name: /баталгаажуулах|тийм/i,
      });
      if (await confirmBtn.isVisible().catch(() => false)) {
        await confirmBtn.click();
      }

      // Verify completed status
      await page.reload({ waitUntil: "domcontentloaded" });
      await expect(page.locator("main")).toContainText("Дууссан");
    });
  });
