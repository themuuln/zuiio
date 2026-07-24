import { expect, test } from "@playwright/test";
import { createTestBom, gotoBomList } from "./helpers";

/**
 * BOM versioning: creating a second active BOM for the same product
 * should retire the first one.
 *
 * Prerequisites:
 *  - At least one product exists in the test org
 *  - The activateBom RPC retires previous active BOMs for the same product
 */

test.describe
  .serial("BOM versioning", () => {
    const product = "Энержи бар";
    let firstBomName: string;
    let secondBomName: string;

    test("create and activate first BOM", async ({ page }) => {
      firstBomName = `VER1-${Date.now()}`;

      await createTestBom(page, {
        name: firstBomName,
        productName: product,
        items: ["Протеин шейк"],
      });

      // Activate it
      const row = page.locator("tr").filter({ hasText: firstBomName });
      await row.getByRole("button", { name: /идэвхжүүлэх/i }).click();

      const confirmDrawer = page
        .locator('[data-drawer-popup], [role="dialog"]')
        .last();
      await confirmDrawer.getByRole("button", { name: /идэвхжүүлэх/i }).click();

      // Verify active
      await page.reload({ waitUntil: "domcontentloaded" });
      await expect(
        page.locator("tr").filter({ hasText: firstBomName }),
      ).toContainText("Идэвхтэй");
    });

    test("create and activate second BOM for same product", async ({
      page,
    }) => {
      secondBomName = `VER2-${Date.now()}`;

      await createTestBom(page, {
        name: secondBomName,
        productName: product,
        items: ["Протеин шейк"],
      });

      // Should show version 2 in the list
      await expect(page.locator("main")).toContainText("v2");

      // Activate it
      const row = page.locator("tr").filter({ hasText: secondBomName });
      await row.getByRole("button", { name: /идэвхжүүлэх/i }).click();

      const confirmDrawer = page
        .locator('[data-drawer-popup], [role="dialog"]')
        .last();
      await confirmDrawer.getByRole("button", { name: /идэвхжүүлэх/i }).click();

      // Verify new BOM is active
      await page.reload({ waitUntil: "domcontentloaded" });
      await expect(
        page.locator("tr").filter({ hasText: secondBomName }),
      ).toContainText("Идэвхтэй");
    });

    test("first BOM is now retired", async ({ page }) => {
      await gotoBomList(page);

      const firstRow = page.locator("tr").filter({ hasText: firstBomName });
      await expect(firstRow).toContainText("Хуучирсан");
    });

    test("only second BOM shows active status", async ({ page }) => {
      await gotoBomList(page);

      // Use the status filter to confirm
      await page.getByLabel("Төлөвөөр шүүх").click();
      await page.getByRole("option", { name: "Идэвхтэй" }).click();

      await expect(
        page.locator("tr").filter({ hasText: secondBomName }),
      ).toBeVisible();
      await expect(
        page.locator("tr").filter({ hasText: firstBomName }),
      ).not.toBeVisible();
    });
  });
