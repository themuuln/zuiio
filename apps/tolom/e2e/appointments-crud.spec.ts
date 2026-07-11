import { appointmentFixture } from "./fixtures";
import { setEnglishLocale } from "./helpers";
import { mockAppointments, mockCrudMutations, mockSupabaseREST } from "./mocks";
import { expect, test } from "./test-extensions";

test.setTimeout(60_000);

test.describe("Appointments CRUD (Mocked)", () => {
  test.beforeEach(async ({ page }) => {
    await setEnglishLocale(page);
    await mockSupabaseREST(page);
    await mockAppointments(page, [appointmentFixture({ status: "scheduled" })]);
    await mockCrudMutations(page, "appointments");
    await page.goto("/dashboard/appointments");
  });

  test("loads appointments list", async ({ page }) => {
    await expect(
      page
        .getByRole("heading", { level: 1 })
        .or(page.getByText(/appointment/i))
        .first(),
    ).toBeVisible({ timeout: 10_000 });
  });

  test("shows appointments content", async ({ page }) => {
    await expect(
      page.getByText(/appointment|schedule|calendar/i).first(),
    ).toBeVisible({ timeout: 10_000 });
  });

  test("new appointment button triggers form", async ({ page }) => {
    const newBtn = page
      .locator("button")
      .filter({ hasText: /appointment/i })
      .first();
    await newBtn.click();
    await expect(
      page
        .getByRole("dialog")
        .or(page.getByText(/vehicle|customer|date|time/i))
        .first(),
    ).toBeVisible({ timeout: 10_000 });
  });
});
