import { expect, test } from "@playwright/test";

test.describe("SMTP settings", () => {
  test("page loads and shows SMTP configuration", async ({ page }) => {
    await page.goto("/settings/smtp", { waitUntil: "domcontentloaded" });

    await test.step("Verify SMTP page title", async () => {
      await expect(page.getByText("SMTP тохиргоо").first()).toBeVisible({
        timeout: 10000,
      });
    });

    await test.step("Verify SMTP table or empty state", async () => {
      const tableTitle = page.getByText("SMTP бүртгэлүүд");
      await expect(tableTitle).toBeVisible({ timeout: 10000 });
    });
  });

  test("add SMTP form renders with all fields", async ({ page }) => {
    await page.goto("/settings/smtp", { waitUntil: "domcontentloaded" });

    await test.step("Verify form section exists", async () => {
      await expect(page.getByText("Шинэ SMTP бүртгэл нэмэх")).toBeVisible({
        timeout: 10000,
      });
    });

    await test.step("Verify all form fields", async () => {
      await expect(page.getByLabel("Илгээгчийн имэйл")).toBeVisible();
      await expect(page.getByLabel("Илгээгчийн нэр")).toBeVisible();
      await expect(page.getByLabel("Хэрэглэгчийн нэр")).toBeVisible();
      await expect(page.getByLabel("Нууц үг")).toBeVisible();
      await expect(page.getByLabel("Сервер")).toBeVisible();
      await expect(page.getByLabel("Порт")).toBeVisible();
      await expect(page.getByLabel("Тэргүүлэх зэрэг")).toBeVisible();
    });

    await test.step("Verify submit button", async () => {
      await expect(page.getByRole("button", { name: "Нэмэх" })).toBeVisible();
    });
  });

  test("SMTP table shows correct columns", async ({ page }) => {
    await page.goto("/settings/smtp", { waitUntil: "domcontentloaded" });

    await test.step("Verify table column headers", async () => {
      const table = page.locator("table").first();
      const tableVisible = await table.isVisible().catch(() => false);

      if (tableVisible) {
        await expect(
          page.getByRole("columnheader", { name: "Имэйл" }),
        ).toBeVisible();
        await expect(
          page.getByRole("columnheader", { name: "Төлөв" }),
        ).toBeVisible();
        await expect(
          page.getByRole("columnheader", { name: "Өдрийн тоо" }),
        ).toBeVisible();
        await expect(
          page.getByRole("columnheader", { name: "Тэргүүлэх" }),
        ).toBeVisible();
      }
    });
  });
});
