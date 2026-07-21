import { test, expect } from "@playwright/test";

test.describe("Home page", () => {
  test("should display the app title", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Friday")).toBeVisible();
    await expect(page.getByText("Game night, zero friction")).toBeVisible();
  });

  test("should show create and join options", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("button", { name: /create room/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /join room/i })).toBeVisible();
  });

  test("should show error for invalid room code", async ({ page }) => {
    await page.goto("/");
    const input = page.getByLabel("Room code");
    await input.fill("ab");
    await page.getByRole("button", { name: /join room/i }).click();
    await expect(page.getByText("Room code must be exactly 4 letters")).toBeVisible();
  });
});
