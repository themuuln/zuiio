import type { Page } from "@playwright/test";
import { openDrawerByText, submitDrawerForm } from "../helpers";

// ── Re-export shared helpers for convenience ────────────────────────────────
export { openDrawerByText, submitDrawerForm };

// ── BOM-specific helpers ────────────────────────────────────────────────────

const BOM_PREFIX = `BOM-${Date.now()}`;

/** Create a BOM via the create drawer and verify it appears in the list. */
export async function createTestBom(
  page: Page,
  opts: {
    name?: string;
    productName?: string;
    /** Names of products to add as BOM items. At least 1 required. */
    items?: string[];
  } = {},
) {
  const name =
    opts.name ?? `${BOM_PREFIX}-${Math.random().toString(36).slice(2, 6)}`;
  const items = opts.items ?? ["Протеин шейк"];

  await page.goto("/bom", { waitUntil: "domcontentloaded" });

  // Open create drawer via the page-level button
  await openDrawerByText(page, "Шинэ BOM");
  await page.waitForSelector('[data-drawer-popup], [role="dialog"]', {
    timeout: 5000,
  });

  // Fill name
  await page.getByLabel("Нэр").fill(name);

  // Select product via combobox — use evaluate to bypass Base UI Drawer + Combobox portal conflicts
  if (opts.productName) {
    // Click the input to open the dropdown, then use evaluate to select
    const productCombo = page.getByPlaceholder("Бүтээгдэхүүн сонгох...");
    await productCombo.click();
    // Use evaluate to find and click the matching option in the portal
    const selected = await page.evaluate((name) => {
      const options = document.querySelectorAll('[role="option"]');
      for (const opt of options) {
        if (opt.textContent?.trim() === name) {
          (opt as HTMLElement).click();
          return "found";
        }
      }
      return "not found";
    }, opts.productName);
    if (selected !== "found") {
      console.log(
        `[createTestBom] Product option "${opts.productName}" not found`,
      );
    }
  }

  // Add BOM items
  for (const itemName of items) {
    // Click "Нэмэх" button to add an item row
    await page.getByText("Нэмэх").click();
    // Click material combobox to open dropdown
    const materialCombo = page.getByPlaceholder("Материал сонгох...").last();
    await materialCombo.click();
    // Use evaluate to find and click the matching option
    const found = await page.evaluate((name) => {
      const options = document.querySelectorAll('[role="option"]');
      for (const opt of options) {
        if (opt.textContent?.trim() === name) {
          (opt as HTMLElement).click();
          return "found";
        }
      }
      return "not found";
    }, itemName);
    if (found !== "found") {
      console.log(`[createTestBom] Material option "${itemName}" not found`);
    }
  }

  // Submit the form
  await submitDrawerForm(page, "bom-create-form");

  // Verify the BOM appears in the list
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.locator("main").waitFor({ state: "visible" });

  return name;
}

/** Delete a BOM by name via the actions column. Only works for draft BOMs. */
export async function deleteTestBom(page: Page, bomName: string) {
  await page.goto("/bom", { waitUntil: "domcontentloaded" });
  const row = page.locator("tr").filter({ hasText: bomName });
  if (await row.isVisible().catch(() => false)) {
    await row.getByRole("button", { name: /устгах/i }).click();
    // Confirm deletion if a confirmation dialog appears
    const confirmBtn = page.getByRole("button", { name: /устгах/i }).last();
    if (await confirmBtn.isVisible().catch(() => false)) {
      await confirmBtn.click();
    }
  }
}

/** Navigate to the BOM list page. */
export async function gotoBomList(page: Page) {
  await page.goto("/bom", { waitUntil: "domcontentloaded" });
  await page.locator("main").waitFor({ state: "visible" });
}
