import { expect, test } from "@playwright/test";

test.describe("Organization settings", () => {
  test("page loads and shows organization info", async ({ page }) => {
    await page.goto("/settings/organization", {
      waitUntil: "domcontentloaded",
    });

    // Should show the settings title
    await expect(page.getByText("Ерөнхий мэдээлэл").first()).toBeVisible({
      timeout: 10000,
    });

    // Check for key info fields
    await expect(page.getByText("Нэр").first()).toBeVisible();
    await expect(page.getByText("Төрөл").first()).toBeVisible();
    await expect(page.getByText("Валют").first()).toBeVisible();
    await expect(page.getByText("Таны эрх").first()).toBeVisible();
  });
});
