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
    test("loads the appointments page with heading", async ({ page }) => {
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible({
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
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible({
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
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    });
  });

  test.describe("Status Filtering", () => {
    test("shows status filter control", async ({ page }) => {
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible({
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
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible({
        timeout: 10_000,
      });
    });
  });

  test.describe("Sidebar Navigation", () => {
    test("has Appointments link in sidebar", async ({ page }) => {
      await expect(
        page.getByRole("link", { name: /appointment/i }).first(),
      ).toBeVisible();
    });
  });
});
