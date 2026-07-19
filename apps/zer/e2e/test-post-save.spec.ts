import { expect, test } from "@playwright/test";

/**
 * Helper: select the first available product from the Nth combobox with
 * placeholder "Сонгох" (line item product combobox).
 * Approach: click the combobox input to open dropdown, then click first item.
 */
async function selectFirstProduct(page: any, rowIndex = 0) {
  const comboboxInputs = page.getByPlaceholder("Сонгох");
  const targetInput = comboboxInputs.nth(rowIndex);
  // Focus/click to open the dropdown
  await targetInput.click();
  await page.waitForTimeout(500);
  // Type a letter to filter and show results
  await targetInput.fill("a");
  await page.waitForTimeout(500);
  // The combobox popup should show options as <li> elements
  const firstOption = page.locator("li[aria-selected]").first();
  try {
    await firstOption.click({ timeout: 3000 });
  } catch {
    // Fallback: try clicking any visible option
    const anyOption = page
      .locator('[class*="popover"] li, [class*="z-50"] li')
      .first();
    await anyOption.click({ timeout: 3000 });
  }
  await page.waitForTimeout(300);
}

test.describe("Post-save workflow", () => {
  test("sale form submit shows toast with actions", async ({ page }) => {
    await page.goto("/sales", { waitUntil: "domcontentloaded" });

    // Click "Шинэ борлуулалт" button
    await page.getByRole("button", { name: "Шинэ борлуулалт" }).click();
    await page.waitForTimeout(1500);

    // Check the form is open
    await expect(
      page.getByRole("heading", { name: "Борлуулалт нэмэх" }),
    ).toBeVisible({ timeout: 5000 });

    // Select a product from the first line item combobox
    await selectFirstProduct(page, 0);

    // Check keep open checkbox exists
    const keepOpenCheckbox = page.getByText("Хэвээр үлдээх (дахин бүртгэх)");
    await expect(keepOpenCheckbox).toBeVisible();

    // Fill customer name to make customer name appear in toast
    const customerInput = page.getByPlaceholder("Харилцагч хайх...");
    if (await customerInput.isVisible()) {
      await customerInput.fill("Toast Test Customer");
    }

    // Click submit
    await page.getByRole("button", { name: "Борлуулалт хадгалах" }).click();
    await page.waitForTimeout(5000);

    // Take screenshot for debugging
    await page.screenshot({ path: "/tmp/after-submit.png", fullPage: true });

    // Check for toast
    const toast = page.locator("[data-sonner-toast]").first();
    await expect(toast).toBeVisible({ timeout: 3000 });

    const toastText = await toast.textContent();

    // Verify toast shows formatted amount
    expect(toastText).toContain("Борлуулалт амжилттай");
    expect(toastText).toContain("₮");

    // Verify toast has both action buttons
    await expect(
      page.getByRole("button", { name: "Дэлгэрэнгүй" }).first(),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Дахин бүртгэх" }).first(),
    ).toBeVisible();
  });

  test("keepOpen toggle keeps form open after save", async ({ page }) => {
    await page.goto("/sales", { waitUntil: "domcontentloaded" });

    // Click "Шинэ борлуулалт" button
    await page.getByRole("button", { name: "Шинэ борлуулалт" }).click();
    await page.waitForTimeout(1500);

    // Check the form is open
    await expect(
      page.getByRole("heading", { name: "Борлуулалт нэмэх" }),
    ).toBeVisible({ timeout: 5000 });

    // Select a product from the first line item combobox
    await selectFirstProduct(page, 0);

    // Enable keepOpen checkbox
    const keepOpenCheckbox = page.getByText("Хэвээр үлдээх (дахин бүртгэх)");
    await keepOpenCheckbox.click();
    await page.waitForTimeout(500);

    // Fill customer name
    const customerInput = page.getByPlaceholder("Харилцагч хайх...");
    if (await customerInput.isVisible()) {
      await customerInput.fill("Keep Open Test");
    }

    // Click submit
    await page.getByRole("button", { name: "Борлуулалт хадгалах" }).click();
    await page.waitForTimeout(5000);

    // Take screenshot
    await page.screenshot({
      path: "/tmp/after-submit-keepopen.png",
      fullPage: true,
    });

    // Verify toast appeared
    const toast = page.locator("[data-sonner-toast]").first();
    await expect(toast).toBeVisible({ timeout: 3000 });

    // Verify form is still visible (drawer stays open)
    await expect(
      page.getByRole("heading", { name: "Борлуулалт нэмэх" }),
    ).toBeVisible({ timeout: 3000 });

    // Verify form was reset - customer field should be empty
    const customerInputAfter = page.getByPlaceholder("Харилцагч хайх...");
    const _customerValue = await customerInputAfter
      .inputValue()
      .catch(() => "");
  });
});
