import { setEnglishLocale } from "./helpers";
import { mockAppointments, mockSupabaseREST } from "./mocks";
import { expect, test } from "./test-extensions";

test.setTimeout(60_000);

test.describe("Appointments (Mocked)", () => {
  test.beforeEach(async ({ page }) => {
    await setEnglishLocale(page);
    await mockSupabaseREST(page);
    await mockAppointments(page);
    await page.goto("/dashboard/appointments");
  });

  test.describe("Page Structure", () => {
    test("loads the appointments page", async ({ page }) => {
      // Appointments page has a breadcrumb, not an h1
      await expect(
        page.getByRole("navigation", { name: "breadcrumb" }),
      ).toBeVisible({
        timeout: 10_000,
      });
    });

    test("shows the New Appointment button", async ({ page }) => {
      const btn = page
        .getByRole("button", {
          name: /new appointment|add appointment|create appointment/i,
        })
        .first();
      await expect(btn).toBeVisible();
    });
  });

  test.describe("View Mode", () => {
    test("has view mode toggle", async ({ page }) => {
      await expect(
        page.getByRole("navigation", { name: "breadcrumb" }),
      ).toBeVisible({
        timeout: 10_000,
      });

      // View toggle is icon-only buttons inside a bordered container
      // The container has rounded-lg border — find it near the date picker
      const viewToggle = page
        .locator(".rounded-lg.border")
        .filter({ has: page.locator("button") })
        .first();
      await expect(viewToggle).toBeVisible();
    });

    test("switching view mode does not crash", async ({ page }) => {
      // Click the second icon button in the view toggle (calendar)
      const viewButtons = page.locator(".rounded-lg.border button");
      const calBtn = viewButtons.nth(1);
      await calBtn.click();
      // Page should still be functional after view switch
      await expect(
        page.getByRole("navigation", { name: "breadcrumb" }),
      ).toBeVisible();
    });
  });

  test.describe("Status Filtering", () => {
    test("shows status filter control", async ({ page }) => {
      // The status filter is a combobox/select
      await expect(page.getByRole("combobox").first()).toBeVisible({
        timeout: 10_000,
      });
    });
  });

  test.describe("Empty State", () => {
    test("handles empty appointments list", async ({ page }) => {
      await page.unrouteAll();
      await mockSupabaseREST(page);
      await mockAppointments(page, []);
      await page.goto("/dashboard/appointments");
      // Empty state shows "No appointments" text
      await expect(page.getByText(/no appointments/i)).toBeVisible({
        timeout: 10_000,
      });
    });
  });

  test.describe("Sidebar Navigation", () => {
    test("has Appointments in sidebar", async ({ page }) => {
      // Sidebar uses buttons, not links
      await expect(
        page.getByRole("button", { name: /appointment/i }).first(),
      ).toBeVisible();
    });
  });
});
