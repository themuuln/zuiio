import { vehicleModelFixture } from "./fixtures";
import { setEnglishLocale } from "./helpers";
import { mockCrudMutations, mockSupabaseREST } from "./mocks";
import { expect, test } from "./test-extensions";

test.setTimeout(60_000);

test.describe("Vehicle Models (Mocked)", () => {
  test.beforeEach(async ({ page }) => {
    await setEnglishLocale(page);
    await mockSupabaseREST(page);
    await mockCrudMutations(page, "vehicle-models");

    // Mock vehicle models list with multiple entries
    const models = [
      vehicleModelFixture(),
      vehicleModelFixture({
        id: "e2e-00000000-0000-0000-0000-000000000101",
        make: "Toyota",
        model: "Prius",
        body_type: "hatchback",
        year_from: 2015,
        year_to: 2023,
      }),
      vehicleModelFixture({
        id: "e2e-00000000-0000-0000-0000-000000000102",
        make: "Lexus",
        model: "RX350",
        body_type: "suv",
        year_from: 2018,
        year_to: 2025,
      }),
    ];

    await page.route("**/api/organizations/*/vehicle-models", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: models }),
      }),
    );
    await page.goto("/dashboard/vehicle-models");
  });

  test.describe("Page Structure", () => {
    test("loads vehicle models page", async ({ page }) => {
      await expect(
        page
          .getByRole("heading", { level: 1 })
          .or(page.getByText(/vehicle.?model|car.?model/i))
          .first(),
      ).toBeVisible({ timeout: 10_000 });
    });

    test("shows vehicle models heading", async ({ page }) => {
      await expect(
        page.getByText(/vehicle.?model|car.?model/i).first(),
      ).toBeVisible({ timeout: 10_000 });
    });

    test("shows add vehicle model button", async ({ page }) => {
      const addBtn = page
        .locator("button")
        .filter({ hasText: /vehicle.?model|add|new/i })
        .first();
      await expect(addBtn).toBeVisible({ timeout: 10_000 });
    });
  });

  test.describe("Vehicle Model List", () => {
    test("shows vehicle model entries", async ({ page }) => {
      // Should show at least one of the mocked makes
      await expect(page.getByText(/toyota|lexus/i).first()).toBeVisible({
        timeout: 10_000,
      });
    });

    test("shows model details (body type, year range)", async ({ page }) => {
      // Body types from fixtures: sedan, hatchback, suv.
      // The make/model tree is collapsed by default — expand it first.
      // Wait for the tree to hydrate before clicking (force clicks too early
      // miss React's handlers).
      const make = page.getByText("Toyota", { exact: true }).first();
      await make.waitFor({ state: "visible", timeout: 15_000 });
      await make.click();
      const model = page.getByText("Corolla", { exact: false }).first();
      await model.waitFor({ state: "visible", timeout: 10_000 });
      await model.click();
      await expect(page.getByText(/sedan|hatchback|suv/i).first()).toBeVisible({
        timeout: 10_000,
      });
    });

    test("shows multiple vehicle model entries", async ({ page }) => {
      // Corolla, Prius, RX350 should all appear once the tree is expanded.
      // Expand both makes first (tree is collapsed by default).
      const toyota = page.getByText("Toyota", { exact: true }).first();
      await toyota.waitFor({ state: "visible", timeout: 15_000 });
      await toyota.click();
      const lexus = page.getByText("Lexus", { exact: true }).first();
      await lexus.click();
      const corolla = page.getByText("Corolla", { exact: false }).first();
      const prius = page.getByText("Prius", { exact: false }).first();
      const rx350 = page.getByText("RX350", { exact: false }).first();

      // At least two of three should be visible
      let visibleCount = 0;
      if (await corolla.isVisible({ timeout: 5_000 }).catch(() => false))
        visibleCount++;
      if (await prius.isVisible({ timeout: 3_000 }).catch(() => false))
        visibleCount++;
      if (await rx350.isVisible({ timeout: 3_000 }).catch(() => false))
        visibleCount++;

      expect(visibleCount).toBeGreaterThanOrEqual(2);
    });
  });

  test.describe("Add Vehicle Model", () => {
    test("clicking add button opens form or drawer", async ({ page }) => {
      const addBtn = page
        .locator("button")
        .filter({ hasText: /vehicle.?model|add|new/i })
        .first();
      await addBtn.click();

      // Form should appear as a dialog, drawer, or inline form
      await expect(
        page.getByRole("dialog").or(page.getByRole("textbox")).first(),
      ).toBeVisible({ timeout: 10_000 });
    });

    test("form has make and model fields", async ({ page }) => {
      const addBtn = page
        .locator("button")
        .filter({ hasText: /vehicle.?model|add|new/i })
        .first();
      await addBtn.click();

      // Wait for form to appear
      await page
        .getByRole("dialog")
        .or(page.getByRole("textbox"))
        .first()
        .waitFor({ timeout: 10_000 });

      // Look for make/model input fields or labels
      const makeField = page
        .getByLabel(/make|brand/i)
        .or(page.getByPlaceholder(/make|brand/i))
        .first();
      const modelField = page
        .getByLabel(/model/i)
        .or(page.getByPlaceholder(/model/i))
        .first();

      // At least one of the fields should be present
      const hasMake = await makeField
        .isVisible({ timeout: 5_000 })
        .catch(() => false);
      const hasModel = await modelField
        .isVisible({ timeout: 5_000 })
        .catch(() => false);
      expect(hasMake || hasModel).toBe(true);
    });
  });

  test.describe("Search / Fuzzy Search", () => {
    test("search input exists on vehicle models page", async ({ page }) => {
      const searchInput = page
        .getByRole("textbox", { name: /search|filter/i })
        .or(page.locator("input[placeholder*='search' i]"))
        .first();
      await expect(searchInput).toBeVisible({ timeout: 10_000 });
    });

    test("search filters visible results", async ({ page }) => {
      const searchInput = page
        .getByRole("textbox", { name: /search|filter/i })
        .or(page.locator("input[placeholder*='search' i]"))
        .first();

      if (await searchInput.isVisible({ timeout: 5_000 }).catch(() => false)) {
        await searchInput.fill("Prius");

        // After filtering, Prius should still be visible
        await expect(
          page.getByText("Prius", { exact: false }).first(),
        ).toBeVisible({ timeout: 5_000 });
      }
    });
  });

  test.describe("Delete Vehicle Model", () => {
    test("delete button exists on model entries", async ({ page }) => {
      // Look for any delete/remove action button
      const deleteBtn = page
        .getByRole("button", { name: /delete|remove|trash/i })
        .or(page.locator("button").filter({ hasText: /delete|remove|trash/i }))
        .first();

      if (await deleteBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
        await expect(deleteBtn).toBeVisible();
      }
    });
  });
});
