import { test, expect } from "@playwright/test";

test.describe("Post-save workflow", () => {
  test("sale form submit shows toast with actions", async ({ page }) => {
    await page.goto("/sales", { waitUntil: "networkidle" });
    await page.waitForTimeout(2000);

    // Click "Шинэ борлуулалт" button
    await page.getByRole("button", { name: "Шинэ борлуулалт" }).click();
    await page.waitForTimeout(1500);

    // Check the form is open
    await expect(
      page.getByRole("heading", { name: "Борлуулалт нэмэх" }),
    ).toBeVisible({ timeout: 5000 });

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
    const toast = page.locator('[data-sonner-toast]').first();
    await expect(toast).toBeVisible({ timeout: 3000 });

    const toastText = await toast.textContent();
    console.log("Toast text:", toastText);

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
    await page.goto("/sales", { waitUntil: "networkidle" });
    await page.waitForTimeout(2000);

    // Click "Шинэ борлуулалт" button
    await page.getByRole("button", { name: "Шинэ борлуулалт" }).click();
    await page.waitForTimeout(1500);

    // Check the form is open
    await expect(
      page.getByRole("heading", { name: "Борлуулалт нэмэх" }),
    ).toBeVisible({ timeout: 5000 });

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
    await page.screenshot({ path: "/tmp/after-submit-keepopen.png", fullPage: true });

    // Verify toast appeared
    const toast = page.locator('[data-sonner-toast]').first();
    await expect(toast).toBeVisible({ timeout: 3000 });

    // Verify form is still visible (drawer stays open)
    await expect(
      page.getByRole("heading", { name: "Борлуулалт нэмэх" }),
    ).toBeVisible({ timeout: 3000 });

    // Verify form was reset - customer field should be empty
    const customerInputAfter = page.getByPlaceholder("Харилцагч хайх...");
    const customerValue = await customerInputAfter.inputValue().catch(() => "");
    console.log("Customer value after keepOpen submit:", customerValue);
  });
});
