import { setEnglishLocale } from "./helpers";
import { mockPrewarm, mockServiceReminders, mockSupabaseREST } from "./mocks";
import { expect, test } from "./test-extensions";

test.setTimeout(60_000);

test.describe("Service Reminders (Mocked)", () => {
  test.beforeEach(async ({ page }) => {
    await mockSupabaseREST(page);
    await setEnglishLocale(page);
    await mockServiceReminders(page);
    await mockPrewarm(page);
    await page.goto("/dashboard/service-reminders");
  });

  test.describe("Page Structure", () => {
    test("loads the service reminders page with heading", async ({ page }) => {
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible({
        timeout: 10_000,
      });
    });

    test("shows the Add Schedule button", async ({ page }) => {
      const btn = page
        .getByRole("button", {
          name: /add schedule|new schedule|add reminder/i,
        })
        .first();
      await expect(btn).toBeVisible();
    });
  });

  test.describe("Tabs", () => {
    test("shows schedules tab", async ({ page }) => {
      await expect(
        page.getByRole("tab", { name: /schedule/i }).first(),
      ).toBeVisible();
    });

    test("shows reminder logs tab", async ({ page }) => {
      await expect(
        page.getByRole("tab", { name: /log/i }).first(),
      ).toBeVisible();
    });

    test("switching to logs tab does not crash", async ({ page }) => {
      const logsTab = page.getByRole("tab", { name: /log/i }).first();
      if (await logsTab.isVisible()) {
        await logsTab.click();
        await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      }
    });
  });

  test.describe("Empty State", () => {
    test("handles empty schedules list", async ({ page }) => {
      await page.unrouteAll();
      await mockSupabaseREST(page);
      await mockServiceReminders(page, []);
      await page.goto("/dashboard/service-reminders");
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible({
        timeout: 10_000,
      });
    });
  });

  test.describe("Sidebar Navigation", () => {
    test("has Service Reminders link in sidebar", async ({ page }) => {
      await expect(
        page.getByRole("button", { name: /^service reminders$/i }).first(),
      ).toBeVisible();
    });
  });
});
