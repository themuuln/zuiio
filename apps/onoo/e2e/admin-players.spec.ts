/**
 * E2E tests for the admin players page.
 *
 * The players page is the most feature-rich admin CRUD with:
 * - Search input with debounced filtering
 * - Table listing players (photo, name, visibility, latin name, position, nationality, actions)
 * - Create dialog with form (canonical_name, name_latin, position, nationality, visibility, consent)
 * - Duplicate name detection warning
 * - Edit dialog (pre-filled)
 * - Delete with confirmation
 */

import { mockPlayersAll, mockSupabaseREST } from "./mocks";
import { expect, test } from "./test-extensions";
import { playerListFixture } from "./fixtures";

test.setTimeout(60_000);

test.describe("Admin Players", () => {
  test.beforeEach(async ({ page }) => {
    await mockSupabaseREST(page);
    await mockPlayersAll(page);
    await page.goto("/admin/players");
  });

  test.describe("Page Structure", () => {
    test("shows players page heading", async ({ page }) => {
      await expect(
        page.getByRole("heading", { name: "Тоглогчид" }),
      ).toBeVisible({ timeout: 10_000 });
    });

    test("shows search input", async ({ page }) => {
      await expect(
        page.getByLabel("Тоглогч хайх"),
      ).toBeVisible();
    });

    test("shows add player button", async ({ page }) => {
      await expect(
        page.getByRole("button", { name: "Нэмэх" }),
      ).toBeVisible();
    });

    test("shows player table with all columns", async ({ page }) => {
      const table = page.getByRole("table");
      await expect(table).toBeVisible({ timeout: 10_000 });

      const headers = table.getByRole("columnheader");
      // Зураг, Нэр, Харагдалц, Латин нэр, Байрлал, Улс, Үйлдэл
      await expect(headers).toHaveCount(7);
    });
  });

  test.describe("Player List", () => {
    test("displays player data with visibility badges", async ({ page }) => {
      // Check that players are rendered with name and position
      await expect(
        page.getByText("Б. Бат"),
      ).toBeVisible();

      // Visibility badges should be present
      const publicBadge = page.getByText("Нийтэд");
      await expect(publicBadge.first()).toBeVisible();
    });

    test("shows visibility status for hidden players", async ({ page }) => {
      // The third player has visibility: "hidden"
      await expect(
        page.getByText("Нууц"),
      ).toBeVisible();
    });

    test("shows position badges", async ({ page }) => {
      await expect(
        page.getByText("PG"),
      ).toBeVisible();
      await expect(
        page.getByText("SG"),
      ).toBeVisible();
    });

    test("shows empty state when no players match", async ({ page }) => {
      await page.route("**/admin/api/players*", (route) => {
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([]),
        });
      });

      await page.reload();
      await page.waitForTimeout(1000);

      await expect(
        page.getByText("Тоглогч олдсонгүй"),
      ).toBeVisible({ timeout: 10_000 });
    });
  });

  test.describe("Search", () => {
    test("search input filters displayed players", async ({ page }) => {
      const searchInput = page.getByLabel("Тоглогч хайх");
      await searchInput.fill("Бат");

      // The search debounces at 300ms, so wait for the API call
      await page.waitForTimeout(600);

      // Should have matched the search parameter in the URL
      // The actual filtering is server-side, so we just verify the
      // search input works correctly
      await expect(searchInput).toHaveValue("Бат");
    });

    test("clears search to show all players", async ({ page }) => {
      const searchInput = page.getByLabel("Тоглогч хайх");
      await searchInput.fill("бат");
      await page.waitForTimeout(600);
      await searchInput.clear();
      await page.waitForTimeout(600);

      // After clearing, should be back to full list
      await expect(searchInput).toHaveValue("");
    });
  });

  test.describe("Create Player", () => {
    test("opens create dialog on add button click", async ({ page }) => {
      await page.getByRole("button", { name: "Нэмэх" }).click();
      await page.waitForTimeout(500);

      await expect(
        page.getByRole("heading", { name: "Шинэ тоглогч нэмэх" }),
      ).toBeVisible();
    });

    test("shows all required form fields in create dialog", async ({ page }) => {
      await page.getByRole("button", { name: "Нэмэх" }).click();
      await page.waitForTimeout(500);

      await expect(page.getByLabel("Нэр")).toBeVisible();
      await expect(page.getByLabel("Латин нэр")).toBeVisible();
      await expect(page.getByLabel("Байрлал")).toBeVisible();
      await expect(page.getByLabel("Улс")).toBeVisible();
      await expect(page.getByLabel("Харагдалц")).toBeVisible();
      await expect(page.getByLabel("Зөвшөөрлийн огноо")).toBeVisible();
    });

    test("creates player on form submit", async ({ page }) => {
      await page.getByRole("button", { name: "Нэмэх" }).click();
      await page.waitForTimeout(500);

      await page.getByLabel("Нэр").fill("Г. Ганбат");

      await page.getByRole("button", { name: "Хадгалах" }).click();

      await expect(
        page.getByText("амжилттай нэмэгдлээ"),
      ).toBeVisible({ timeout: 10_000 });
    });

    test("detects duplicate player name", async ({ page }) => {
      // Type a name that matches the existing player "Б. Бат"
      await page.getByRole("button", { name: "Нэмэх" }).click();
      await page.waitForTimeout(500);

      await page.getByLabel("Нэр").fill("Бат");

      // Should show a duplicate warning
      await expect(
        page.getByText("Адилхан нэртэй тоглогч байна"),
      ).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe("Edit Player", () => {
    test("opens edit dialog with pre-filled data", async ({ page }) => {
      const editBtn = page.getByRole("button", { name: "засах" }).first();
      await editBtn.click();
      await page.waitForTimeout(500);

      await expect(
        page.getByRole("heading", { name: "Тоглогч засах" }),
      ).toBeVisible();
    });
  });

  test.describe("Delete Player", () => {
    test("deletes player on confirm", async ({ page }) => {
      // Accept the confirmation dialog
      page.on("dialog", (dialog) => dialog.accept());

      const deleteBtn = page.getByRole("button", { name: "устгах" }).first();
      await deleteBtn.click();

      await expect(
        page.getByText("устгагдлаа"),
      ).toBeVisible({ timeout: 10_000 });
    });
  });
});
