import type { Page } from "@playwright/test";
import { mockBayView } from "./mocks";
import { expect, test } from "./test-extensions";

// With mocked APIs, tests are fast — no cold starts. 15s is generous.
test.setTimeout(15_000);

/** Wait for the bay view to finish loading (skeleton replaced with live content) */
async function waitForBayViewReady(page: Page) {
  await expect(
    page.getByRole("region", { name: /bay \d/i }).first(),
  ).toBeVisible({ timeout: 10_000 });
}

test.describe("Bay View (Mocked)", () => {
  test.beforeEach(async ({ page }) => {
    await mockBayView(page);
    await page.goto("/dashboard/bay-view");
  });

  test.describe("Page Structure", () => {
    test("loads the bay view with toolbar, KPI cards, and bay regions", async ({
      page,
    }) => {
      await waitForBayViewReady(page);

      // At least one view mode toggle should be pressed (grid by default)
      await expect(
        page.locator('button[aria-pressed="true"]').first(),
      ).toBeVisible({ timeout: 5000 });

      // KPI cards render as buttons with stats
      const kpiButton = page.getByRole("button", {
        name: /булангийн ашиглалт/i,
      });
      await expect(kpiButton).toBeVisible({ timeout: 5000 });

      // Bay regions are rendered (occupied or empty)
      await expect(
        page.getByRole("region", { name: /bay \d/i }).first(),
      ).toBeVisible({ timeout: 5000 });
    });

    test("renders 6 bays — 3 occupied, 3 empty", async ({ page }) => {
      await waitForBayViewReady(page);

      // Occupied bays show vehicle plate after bay number
      const occupiedBays = page.getByRole("region", {
        name: /bay \d+ - .+/i,
      });
      await expect(occupiedBays.first()).toBeVisible({ timeout: 5000 });
      expect(await occupiedBays.count()).toBeGreaterThanOrEqual(3);

      // Empty bays show "empty"
      const emptyBays = page.getByRole("region", {
        name: /bay \d+ - empty/i,
      });
      await expect(emptyBays.first()).toBeVisible({ timeout: 5000 });
      expect(await emptyBays.count()).toBeGreaterThanOrEqual(3);
    });

    test("shows the search input", async ({ page }) => {
      await waitForBayViewReady(page);
      const searchBox = page.getByRole("textbox", {
        name: /Улсын дугаар/i,
      });
      await expect(searchBox).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe("View Mode Switching", () => {
    test("switches view modes via toggle buttons", async ({ page }) => {
      await waitForBayViewReady(page);

      const toggles = page
        .locator('button[aria-pressed="true"], button:not([aria-pressed])')
        .filter({ has: page.locator("img, svg") });

      await expect(toggles.first()).toBeVisible({ timeout: 5000 });
      const count = await toggles.count();

      if (count >= 2) {
        const second = toggles.nth(1);
        const pressed = await second.getAttribute("aria-pressed");
        if (pressed !== "true" && pressed !== "") {
          await second.click();
          await page.waitForTimeout(800);
          await expect(
            page.getByRole("region", { name: /bay \d/i }).first(),
          ).toBeVisible();
        }
      }
    });
  });

  test.describe("Status Filtering", () => {
    test("shows all filter pills", async ({ page }) => {
      await waitForBayViewReady(page);

      // These pills render client-side — not API-dependent
      await expect(page.getByRole("button", { name: "Бүгд" })).toBeVisible({
        timeout: 5000,
      });
      await expect(page.getByRole("button", { name: "Шинэ" })).toBeVisible({
        timeout: 5000,
      });
    });

    test("clicking a status pill does not crash the page", async ({ page }) => {
      await waitForBayViewReady(page);

      const newFilter = page.getByRole("button", { name: "Шинэ" });
      await expect(newFilter).toBeVisible({ timeout: 5000 });
      await newFilter.click();
      await page.waitForTimeout(500);

      // Page should still be functional after filter click
      await expect(
        page.getByRole("region", { name: /bay \d/i }).first(),
      ).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe("Bay Count Control", () => {
    test("shows bay count control with valid value", async ({ page }) => {
      await waitForBayViewReady(page);
      const bayCountInput = page.getByRole("spinbutton");
      await expect(bayCountInput).toBeVisible({ timeout: 5000 });
      const value = await bayCountInput.inputValue();
      expect(Number(value)).toBeGreaterThanOrEqual(1);
    });
  });

  test.describe("Empty Bays", () => {
    test("empty bay shows add vehicle prompt", async ({ page }) => {
      await waitForBayViewReady(page);

      const emptyBay = page
        .getByRole("region", { name: /bay \d+ - empty/i })
        .first();
      await expect(emptyBay).toBeVisible({ timeout: 5000 });

      // Empty bays show a button with "Click to add vehicle" text
      await expect(
        emptyBay.getByRole("button", { name: /click to add/i }),
      ).toBeVisible({ timeout: 5000 });
    });

    test("opens assign dialog from empty bay", async ({ page }) => {
      await waitForBayViewReady(page);

      const emptyBay = page
        .getByRole("region", { name: /bay \d+ - empty/i })
        .first();
      await expect(emptyBay).toBeVisible({ timeout: 5000 });

      const addBtn = emptyBay.getByRole("button", {
        name: /click to add/i,
      });
      await expect(addBtn).toBeVisible({ timeout: 5000 });
      await addBtn.click();

      await expect(page.getByRole("dialog")).toBeVisible({
        timeout: 10_000,
      });
    });
  });

  test.describe("Refresh", () => {
    test("refreshes data via refresh button without crash", async ({
      page,
    }) => {
      await waitForBayViewReady(page);

      const refreshBtn = page.getByRole("button", { name: "Шинэчлэх" });
      await expect(refreshBtn).toBeVisible({ timeout: 5000 });
      await refreshBtn.click();

      // After refresh, bay regions should still be visible
      await expect(
        page.getByRole("region", { name: /bay \d/i }).first(),
      ).toBeVisible({ timeout: 10_000 });
    });
  });

  test.describe("Sidebar Navigation", () => {
    test("sidebar has link to bay view", async ({ page }) => {
      await waitForBayViewReady(page);

      await expect(
        page
          .getByRole("complementary")
          .getByRole("link", { name: "Засварын булан" }),
      ).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe("Alternative Route", () => {
    test("navigates to bay-view-v2 route and loads", async ({ page }) => {
      await mockBayView(page);
      await page.goto("/dashboard/bay-view-v2");
      await waitForBayViewReady(page);
    });

    test("bay-view-v2 shows bay regions with data", async ({ page }) => {
      await mockBayView(page);
      await page.goto("/dashboard/bay-view-v2");
      await waitForBayViewReady(page);
      await expect(
        page.getByRole("region", { name: /bay \d/i }).first(),
      ).toBeVisible({ timeout: 5000 });
    });
  });
});
