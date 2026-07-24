import { expect, test } from "@playwright/test";

const EMPLOYEE_NAME = `E2E-Тест-${Date.now()}`;

test.describe("HR / Employee management", () => {
  test("page loads and shows employee management shell", async ({ page }) => {
    await page.goto("/hr", { waitUntil: "domcontentloaded" });

    // Page shell should show the title
    await expect(
      page.getByRole("heading", { name: "Ажилтны бүртгэл" }).first(),
    ).toBeVisible({ timeout: 15000 });

    // Should show either "Ажилтан бүртгэх" button or empty state
    const createBtn = page.getByText("Ажилтан бүртгэх").first();
    const emptyState = page.getByText("Ажилтан бүртгэгдээгүй");
    await expect(createBtn.or(emptyState).first()).toBeVisible({
      timeout: 10000,
    });
  });

  test("create employee drawer opens with form fields", async ({ page }) => {
    await page.goto("/hr", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);

    // Click "Ажилтан бүртгэх" button
    const createBtn = page.getByText("Ажилтан бүртгэх").first();
    await expect(createBtn).toBeVisible({ timeout: 10000 });
    await createBtn.click();
    await page.waitForTimeout(1500);

    // Drawer should open with heading
    await expect(
      page.getByRole("heading", { name: "Ажилтан бүртгэх" }).first(),
    ).toBeVisible({ timeout: 5000 });

    // The employee form uses react-hook-form register(), so inputs have name/id
    await expect(page.getByText("Нэр").first()).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("Албан тушаал").first()).toBeVisible();
    await expect(page.getByText("Хэлтэс").first()).toBeVisible();
    await expect(page.getByText("Ажилд орсон огноо").first()).toBeVisible();
    await expect(page.getByText("Гэрээний төрөл").first()).toBeVisible();
    await expect(page.getByText("Үндсэн цалин (₮)").first()).toBeVisible();
    await expect(page.getByText("Цалингийн төрөл").first()).toBeVisible();

    // Submit button should exist
    await expect(page.getByRole("button", { name: "Хадгалах" })).toBeVisible({
      timeout: 5000,
    });
  });

  test("create a new employee and verify it appears", async ({ page }) => {
    await page.goto("/hr", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);

    // Open create drawer
    const createBtn = page.getByText("Ажилтан бүртгэх").first();
    await expect(createBtn).toBeVisible({ timeout: 10000 });
    await createBtn.click();
    await page.waitForTimeout(1500);

    // Fill the form — inputs have name attributes from react-hook-form register()
    const nameInput = page.locator('input[name="full_name"]');
    if (await nameInput.isVisible().catch(() => false)) {
      await nameInput.fill(EMPLOYEE_NAME);
    } else {
      // Fallback: fill the first visible text input in the drawer
      await page
        .locator("[data-drawer-popup] input:not([type])")
        .first()
        .fill(EMPLOYEE_NAME);
    }

    // Fill position
    const posInput = page.locator('input[name="position"]');
    if (await posInput.isVisible().catch(() => false)) {
      await posInput.fill("Кассчин");
    }

    // Fill department
    const deptInput = page.locator('input[name="department"]');
    if (await deptInput.isVisible().catch(() => false)) {
      await deptInput.fill("Борлуулалт");
    }

    // Fill hire date
    const dateInput = page.locator('input[name="hire_date"]');
    if (await dateInput.isVisible().catch(() => false)) {
      await dateInput.fill("2026-01-15");
    }

    // Fill base salary
    const salaryInput = page.locator('input[name="base_salary"]');
    if (await salaryInput.isVisible().catch(() => false)) {
      await salaryInput.fill("1200000");
    }

    // Fill bank account (optional)
    const bankInput = page.locator('input[name="bank_account"]');
    if (await bankInput.isVisible().catch(() => false)) {
      await bankInput.fill("5000000000");
    }

    // Submit the form
    await page.getByRole("button", { name: "Хадгалах" }).click();
    await page.waitForTimeout(3000);

    // Verify the new employee appears in the table
    await page.goto("/hr", { waitUntil: "domcontentloaded" });
    await expect(page.getByText(EMPLOYEE_NAME).first()).toBeVisible({
      timeout: 15000,
    });
  });

  test("created employee visible in list", async ({ page }) => {
    await page.goto("/hr", { waitUntil: "domcontentloaded" });
    // The employee created in the previous test should still exist
    await expect(page.getByText(EMPLOYEE_NAME).first()).toBeVisible({
      timeout: 15000,
    });
  });

  test("employee table has correct columns when data exists", async ({
    page,
  }) => {
    await page.goto("/hr", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);

    // Check if table exists
    const table = page.locator("table").first();
    const tableVisible = await table.isVisible().catch(() => false);

    if (tableVisible) {
      // Should have correct employee column headers
      await expect(page.locator('th:has-text("Нэр")').first()).toBeVisible({
        timeout: 5000,
      });
      await expect(
        page.locator('th:has-text("Албан тушаал")').first(),
      ).toBeVisible({ timeout: 5000 });
      await expect(page.locator('th:has-text("Хэлтэс")').first()).toBeVisible({
        timeout: 5000,
      });
      await expect(
        page.locator('th:has-text("Гэрээний төрөл")').first(),
      ).toBeVisible({ timeout: 5000 });
      await expect(page.locator('th:has-text("Цалин")').first()).toBeVisible({
        timeout: 5000,
      });
      await expect(page.locator('th:has-text("Төлөв")').first()).toBeVisible({
        timeout: 5000,
      });
    } else {
      // Might be empty state — at least verify the page still renders
      await expect(
        page.getByRole("heading", { name: "Ажилтны бүртгэл" }).first(),
      ).toBeVisible({ timeout: 5000 });
    }
  });
});
