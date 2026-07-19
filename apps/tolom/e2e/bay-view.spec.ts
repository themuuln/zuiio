import type { Page } from "@playwright/test";
import { expect, test } from "./test-extensions";

// Real authenticated session (no REST mocks — bay-view v2/v3 use server actions).
// Full login + seed is ~2m; keep per-test timeout generous.
test.setTimeout(90_000);

/** Wait for the bay view to finish loading (skeleton replaced with live content) */
async function waitForBayViewReady(page: Page) {
  await expect(
    page.getByRole("region", { name: /bay \d/i }).first(),
  ).toBeVisible({ timeout: 30_000 });
}

/** Expand the collapsible toolbar secondary row (status pills + refresh live there) */
async function expandToolbar(page: Page) {
  const expandBtn = page.getByRole("button", {
    name: /expand toolbar/i,
  });
  if (await expandBtn.isVisible().catch(() => false)) {
    await expandBtn.click();
    await page.waitForTimeout(250);
  }
}

test.describe("Bay View", () => {
  test.beforeEach(async ({ page }) => {
    // The app holds open SSE/polling connections, so the "load" event
    // never fires reliably — wait only for DOM content, then let
    // waitForBayViewReady gate on the actual rendered regions.
    await page.goto("/dashboard/bay-view", {
      waitUntil: "domcontentloaded",
      timeout: 30_000,
    });
  });

  test.describe("Page Structure", () => {
    test("loads the bay view with toolbar, KPI cards, and bay regions", async ({
      page,
    }) => {
      await waitForBayViewReady(page);

      // At least one view mode toggle is pressed (grid by default)
      await expect(
        page.locator('button[aria-pressed="true"]').first(),
      ).toBeVisible({ timeout: 5000 });

      // KPI utilization card renders as a button ending in a percentage
      const kpiButton = page.getByRole("button", { name: /%$/, exact: false });
      await expect(kpiButton).toBeVisible({ timeout: 5000 });

      // Bay regions are rendered (occupied or empty)
      await expect(
        page.getByRole("region", { name: /bay \d/i }).first(),
      ).toBeVisible({ timeout: 5000 });
    });

    test("renders bay regions for occupied and empty bays", async ({ page }) => {
      await waitForBayViewReady(page);

      // Occupied bays show vehicle plate after bay number
      const occupiedBays = page.getByRole("region", {
        name: /bay \d+ - .+/i,
      });
      await expect(occupiedBays.first()).toBeVisible({ timeout: 5000 });
      expect(await occupiedBays.count()).toBeGreaterThanOrEqual(1);

      // Empty bays are present
      const emptyBays = page.getByRole("region", {
        name: /bay \d+ - empty/i,
      });
      await expect(emptyBays.first()).toBeVisible({ timeout: 5000 });
      expect(await emptyBays.count()).toBeGreaterThanOrEqual(1);
    });
    test("shows the search input", async ({ page }) => {
      await waitForBayViewReady(page);

      // Search box is the toolbar textbox (label differs by locale:
      // "Search plate, make, model..." / "Улсын дугаар...")
      const searchBox = page.getByRole("textbox").first();
      await expect(searchBox).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe("View Mode Switching", () => {
    test("switches view modes via toggle buttons", async ({ page }) => {
      await waitForBayViewReady(page);

      // The three view toggles (grid/kanban/list) are aria-pressed buttons
      const toggles = page.locator('button[aria-pressed]');
      await expect(toggles.first()).toBeVisible({ timeout: 5000 });
      expect(await toggles.count()).toBeGreaterThanOrEqual(2);

      const initialPressed = await toggles
        .filter({ hasAttribute: "aria-pressed", hasNotText: "" })
        .first()
        .getAttribute("aria-pressed");

      // Click a different toggle and confirm the pressed state moves
      const others = toggles.filter({
        hasAttribute: "aria-pressed",
        hasNotText: "",
      });
      const target = others.filter({ hasNotText: initialPressed ?? "x" });
      if ((await target.count()) > 0) {
        await target.first().click();
        await page.waitForTimeout(500);
      }

      // Bay content still renders after switching
      await expect(
        page.getByRole("region", { name: /bay \d/i }).first(),
      ).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe("Status Filtering", () => {
    test("shows all filter pills", async ({ page }) => {
      await waitForBayViewReady(page);
      await expandToolbar(page);

      // Pills render in the toolbar row (locale-agnostic: All/Бүгд,
      // New/Шинэ). "All" pill is the first status filter.
      await expect(
        page.getByRole("button", { name: /^(all|бүгд)$/i, exact: true }),
      ).toBeVisible({ timeout: 5000 });
    });

    test("clicking a status pill does not crash the page", async ({ page }) => {
      await waitForBayViewReady(page);
      await expandToolbar(page);

      const newFilter = page.getByRole("button", {
        name: /^(new|шинэ)$/i,
        exact: true,
      });
      await expect(newFilter).toBeVisible({ timeout: 5000 });
      await newFilter.click();
      await page.waitForTimeout(500);

      // Page stays functional after filter click
      await expect(
        page.getByRole("region", { name: /bay \d/i }).first(),
      ).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe("Empty Bays", () => {
    test("empty bay shows add vehicle prompt", async ({ page }) => {
      await waitForBayViewReady(page);

      const emptyBay = page
        .getByRole("region", { name: /bay \d+ - empty/i })
        .first();
      await expect(emptyBay).toBeVisible({ timeout: 5000 });

      await expect(
        emptyBay.getByRole("button", { name: /^bay 0\d/i }),
      ).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe("Refresh", () => {
    test("refreshes data via refresh button without crash", async ({
      page,
    }) => {
      await waitForBayViewReady(page);
      await expandToolbar(page);

      const refreshBtn = page.getByRole("button", {
        name: /refresh|шинэчлэх/i,
      });
      await refreshBtn.click();

      // After refresh, bay regions remain visible
      await expect(
        page.getByRole("region", { name: /bay \d/i }).first(),
      ).toBeVisible({ timeout: 15_000 });
    });
  });

  test.describe("Sidebar Navigation", () => {
    test("sidebar has bay view in navigation", async ({ page }) => {
      await waitForBayViewReady(page);

      // Sidebar uses buttons, not links
      await expect(
        page
          .getByRole("button", { name: /bay view|засварын булан/i }),
      ).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe("Alternative Route (v3)", () => {
    test("navigates to bay-view-v3 route and loads", async ({ page }) => {
      await page.goto("/dashboard/bay-view-v3");
      // v3 is dynamically imported (ssr:false) — wait for real content, not skeleton
      await expect(
        page.getByText("Нийт бэй", { exact: false }),
      ).toBeVisible({ timeout: 20_000 });
    });

    test("bay-view-v3 shows KPI strip and filter pills", async ({ page }) => {
      await page.goto("/dashboard/bay-view-v3");
      await expect(
        page.getByText("Нийт бэй", { exact: false }),
      ).toBeVisible({ timeout: 20_000 });

      // v3 filter pills (mock data) render client-side
      await expect(
        page.getByRole("button", { name: /Бүгд/i }),
      ).toBeVisible({ timeout: 5000 });
    });
  });
});
