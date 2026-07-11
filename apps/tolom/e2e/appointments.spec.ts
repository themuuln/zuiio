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
      await expect(page.getByRole("navigation", { name: "breadcrumb" })).toBeVisible({
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
    test("has list and calendar view options", async ({ page }) => {
      await expect(page.getByRole("navigation", { name: "breadcrumb" })).toBeVisible({
        timeout: 10_000,
      });

      const listBtn = page.getByRole("button", { name: /list/i }).first();
      const calBtn = page.getByRole("button", { name: /calendar/i }).first();
      await expect(listBtn).toBeVisible();
      await expect(calBtn).toBeVisible();
    });

    test("switching to calendar view does not crash", async ({ page }) => {
      const calBtn = page.getByRole("button", { name: /calendar/i }).first();
      await calBtn.click();
      // Page should still be functional after view switch
      await expect(page.getByRole("navigation", { name: "breadcrumb" })).toBeVisible();
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
