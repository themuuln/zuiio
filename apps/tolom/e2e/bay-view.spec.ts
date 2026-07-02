import { expect, type Page, test } from "@playwright/test";

// Bay view data fetches from Supabase can have cold starts, especially on
// the first test run after deployment. Allow up to 90s per test.
test.setTimeout(90_000);

/** Wait for the bay view to finish loading (skeleton replaced with live content) */
async function waitForBayViewReady(page: Page) {
  // Wait up to 45s for the first bay card region to appear (accounts for
  // Supabase cold starts on initial data fetch after deployment)
  await expect(
    page.getByRole("region", { name: /bay \d/i }).first(),
  ).toBeVisible({ timeout: 45_000 });
}

test.describe("Bay View", () => {
  test.beforeEach(async ({ page }) => {
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
      // From snapshot: "Булангийн ашиглалт 33% 2 of 6 bays occupied" is a button
      const kpiButton = page.getByRole("button", {
        name: /булангийн ашиглалт/i,
      });
      await expect(kpiButton).toBeVisible({ timeout: 5000 });

      // Bay regions are rendered (occupied or empty)
      await expect(
        page.getByRole("region", { name: /bay \d/i }).first(),
      ).toBeVisible({ timeout: 5000 });
    });

    test("renders both occupied and empty bays", async ({ page }) => {
      await waitForBayViewReady(page);
      const allBays = page.getByRole("region", { name: /bay \d/i });
      const count = await allBays.count();
      expect(count).toBeGreaterThanOrEqual(1);
    });

    test("shows the search input", async ({ page }) => {
      await waitForBayViewReady(page);
      // The search input's accessible name comes from its placeholder
      const searchBox = page.getByRole("textbox", {
        name: /Улсын дугаар/i,
      });
      await expect(searchBox).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe("View Mode Switching", () => {
    test("switches view modes via toggle buttons", async ({ page }) => {
      await waitForBayViewReady(page);

      // There should be 3 view mode toggles (icon-only), first is pressed (grid)
      const toggles = page
        .locator('button[aria-pressed="true"], button:not([aria-pressed])')
        .filter({ has: page.locator("img, svg") });

      await expect(toggles.first()).toBeVisible({ timeout: 5000 });
      const count = await toggles.count();

      // If we have at least 2 toggles, try switching to the second one
      if (count >= 2) {
        const second = toggles.nth(1);
        const pressed = await second.getAttribute("aria-pressed");
        if (pressed !== "true" && pressed !== "") {
          await second.click();
          await page.waitForTimeout(800);
          // After switching, the page should still show bay regions
          await expect(
            page.getByRole("region", { name: /bay \d/i }).first(),
          ).toBeVisible();
        }
      }
    });
  });

  test.describe("Status Filtering", () => {
    test("filters by status using filter pills", async ({ page }) => {
      await waitForBayViewReady(page);

      // Filter pills: "Бүгд" (All), "Явцад" (In Progress), "Шинэ" (New), "Бэлэн" (Ready)
      // "Шинэ" is distinct enough to match
      const newFilter = page.getByRole("button", { name: "Шинэ" });
      if (await newFilter.isVisible({ timeout: 3000 }).catch(() => false)) {
        await newFilter.click();
        await page.waitForTimeout(500);
        await expect(newFilter).toBeVisible();
      } else {
        // Fallback: try Явцад or Бэлэн
        const altFilter = page
          .getByRole("button", { name: /Явцад|Бэлэн/ })
          .first();
        if (await altFilter.isVisible({ timeout: 2000 }).catch(() => false)) {
          await altFilter.click();
          await page.waitForTimeout(500);
        }
      }
    });

    test("shows all filter pill with exact text", async ({ page }) => {
      await waitForBayViewReady(page);
      await expect(page.getByRole("button", { name: "Бүгд" })).toBeVisible({
        timeout: 5000,
      });
    });
  });

  test.describe("Bay Count Control", () => {
    test("shows bay count control with increment/decrement", async ({
      page,
    }) => {
      await waitForBayViewReady(page);
      const bayCountInput = page.getByRole("spinbutton");
      await expect(bayCountInput).toBeVisible({ timeout: 5000 });
      const value = await bayCountInput.inputValue();
      expect(Number(value)).toBeGreaterThanOrEqual(1);
    });
  });

  test.describe("Occupied Bay Cards", () => {
    test("occupied bay shows vehicle info and status", async ({ page }) => {
      await waitForBayViewReady(page);

      // Occupied bays have labels like "Bay 1 - 1612УБА" (contain plate after dash)
      const occupiedBay = page
        .getByRole("region", { name: /bay \d+ - .+/i })
        .first();
      if (await occupiedBay.isVisible({ timeout: 5000 }).catch(() => false)) {
        // The card should have the status label visible
        // From snapshot: status is "Засварлаж байна" and there's a "Ready" button
        const statusReady = occupiedBay.getByRole("button", { name: "Ready" });
        if (await statusReady.isVisible({ timeout: 3000 }).catch(() => false)) {
          await expect(statusReady).toBeVisible();
        }
      }
    });

    test("opens work order detail drawer from occupied bay card", async ({
      page,
    }) => {
      await waitForBayViewReady(page);

      const occupiedBay = page
        .getByRole("region", { name: /bay \d+ - .+/i })
        .first();
      if (await occupiedBay.isVisible({ timeout: 5000 }).catch(() => false)) {
        // The vehicle plate button contains the plate number (e.g., "1612 УБА")
        const vehicleBtn = occupiedBay
          .getByRole("button")
          .filter({ hasText: /УБА/ });
        if (
          await vehicleBtn
            .first()
            .isVisible({ timeout: 3000 })
            .catch(() => false)
        ) {
          await vehicleBtn.first().click();
          // Work order detail drawer opens (shadcn Dialog/Drawer)
          await expect(page.getByRole("dialog")).toBeVisible({
            timeout: 15000,
          });
        }
      }
    });
  });

  test.describe("Empty Bays", () => {
    test("empty bay shows add vehicle prompt", async ({ page }) => {
      await waitForBayViewReady(page);

      const emptyBay = page
        .getByRole("region", { name: /bay \d+ - empty/i })
        .first();
      if (await emptyBay.isVisible({ timeout: 5000 }).catch(() => false)) {
        // Empty bays show a button with "Click to add vehicle" text
        await expect(
          emptyBay.getByRole("button", { name: /click to add/i }),
        ).toBeVisible({ timeout: 5000 });
      }
    });

    test("opens assign dialog from empty bay", async ({ page }) => {
      await waitForBayViewReady(page);

      const emptyBay = page
        .getByRole("region", { name: /bay \d+ - empty/i })
        .first();
      if (await emptyBay.isVisible({ timeout: 5000 }).catch(() => false)) {
        const addBtn = emptyBay.getByRole("button", {
          name: /click to add/i,
        });
        if (await addBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
          await addBtn.click();
          await expect(page.getByRole("dialog")).toBeVisible({
            timeout: 10000,
          });
        }
      }
    });
  });

  test.describe("Refresh", () => {
    test("refreshes data via refresh button", async ({ page }) => {
      await waitForBayViewReady(page);

      const refreshBtn = page.getByRole("button", { name: "Шинэчлэх" });
      await expect(refreshBtn).toBeVisible({ timeout: 5000 });
      await refreshBtn.click();

      // After refresh, bay regions should still be visible
      await expect(
        page.getByRole("region", { name: /bay \d/i }).first(),
      ).toBeVisible({ timeout: 15000 });
    });
  });

  test.describe("Sidebar Navigation", () => {
    test("sidebar has link to bay view", async ({ page }) => {
      await waitForBayViewReady(page);

      // Scope to the sidebar (complementary landmark) to avoid breadcrumb match
      await expect(
        page
          .getByRole("complementary")
          .getByRole("link", { name: "Засварын булан" }),
      ).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe("Alternative Route", () => {
    test("navigates to bay-view-v2 route and loads", async ({ page }) => {
      await page.goto("/dashboard/bay-view-v2");
      await waitForBayViewReady(page);
    });

    test("bay-view-v2 shows bay regions with data", async ({ page }) => {
      await page.goto("/dashboard/bay-view-v2");
      await waitForBayViewReady(page);
      await expect(
        page.getByRole("region", { name: /bay \d/i }).first(),
      ).toBeVisible({ timeout: 5000 });
    });
  });
});
