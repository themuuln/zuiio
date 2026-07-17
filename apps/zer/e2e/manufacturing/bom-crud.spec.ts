import { expect, test } from "@playwright/test";
import { createTestBom, deleteTestBom, gotoBomList } from "./helpers";

/**
 * BOM create → read → update → activate lifecycle.
 *
 * Tests the full draft lifecycle in sequence:
 * create a BOM, verify it in the list, open the detail drawer,
 * edit it, and finally activate it.
 */

test.describe
  .serial("BOM CRUD lifecycle", () => {
    let bomName: string;

    test("create a draft BOM and verify it appears in list", async ({
      page,
    }) => {
      bomName = `E2E-BOM-${Date.now()}`;

      const created = await createTestBom(page, {
        name: bomName,
        productName: "Энержи бар",
        items: ["Протеин шейк"],
      });

      await expect(page.locator("main")).toContainText(created);
      // Draft status badge
      await expect(page.locator("main")).toContainText("Ноорог");
    });

    test("draft BOM shows edit and activate actions", async ({ page }) => {
      await gotoBomList(page);

      const row = page.locator("tr").filter({ hasText: bomName });
      await expect(row).toBeVisible();

      await expect(row.getByRole("button", { name: /засах/i })).toBeVisible();
      await expect(
        row.getByRole("button", { name: /идэвхжүүлэх/i }),
      ).toBeVisible();
    });

    test("open detail drawer and verify BOM info", async ({ page }) => {
      await gotoBomList(page);

      const row = page.locator("tr").filter({ hasText: bomName });
      await row.getByRole("button", { name: /харах/i }).click();

      // Detail drawer shows the BOM name and draft status
      const drawer = page
        .locator('[data-drawer-popup], [role="dialog"]')
        .first();
      await expect(drawer).toBeVisible();
      await expect(drawer).toContainText(bomName);
      await expect(drawer).toContainText("Ноорог");
    });

    test("edit BOM name via edit drawer", async ({ page }) => {
      await gotoBomList(page);

      const updatedName = `${bomName}-edited`;

      // Click Засах on the row
      const row = page.locator("tr").filter({ hasText: bomName });
      await row.getByRole("button", { name: /засах/i }).click();

      // The edit drawer opens — locate the name field and update it
      const drawer = page
        .locator('[data-drawer-popup], [role="dialog"]')
        .first();
      await expect(drawer).toBeVisible();

      const nameInput = drawer.getByLabel("Нэр");
      await nameInput.clear();
      await nameInput.fill(updatedName);

      // Submit the edit form
      await drawer
        .getByRole("button", { name: /хадгалах|засах|үүсгэх/i })
        .click();

      // Verify updated name in list
      await page.reload({ waitUntil: "domcontentloaded" });
      await expect(page.locator("main")).toContainText(updatedName);

      bomName = updatedName;
    });

    test("activate BOM and verify status changes to active", async ({
      page,
    }) => {
      await gotoBomList(page);

      const row = page.locator("tr").filter({ hasText: bomName });
      await row.getByRole("button", { name: /идэвхжүүлэх/i }).click();

      // Confirm activation in the confirmation dialog
      const confirmDrawer = page
        .locator('[data-drawer-popup], [role="dialog"]')
        .last();
      await expect(confirmDrawer).toBeVisible();

      // The confirmation dialog asks "BOM-ыг идэвхжүүлэх үү?"
      await confirmDrawer.getByRole("button", { name: /идэвхжүүлэх/i }).click();

      // Verify status changed
      await page.reload({ waitUntil: "domcontentloaded" });
      const updatedRow = page.locator("tr").filter({ hasText: bomName });
      await expect(updatedRow).toContainText("Идэвхтэй");
    });

    test("active BOM hides edit and activate buttons", async ({ page }) => {
      await gotoBomList(page);

      const row = page.locator("tr").filter({ hasText: bomName });
      await expect(row).toBeVisible();

      // Draft-only actions should be gone
      await expect(
        row.getByRole("button", { name: /засах/i }),
      ).not.toBeVisible();
      await expect(
        row.getByRole("button", { name: /идэвхжүүлэх/i }),
      ).not.toBeVisible();
    });

    test.afterAll(async ({ browser }) => {
      // Cleanup: delete the test BOM if it still exists as draft
      const page = await browser.newPage();
      await page.goto("/login", { waitUntil: "domcontentloaded" });
      // Attempt cleanup — the BOM may already be active and immovable
      await deleteTestBom(page, bomName).catch(() => {});
      await page.close();
    });
  });
