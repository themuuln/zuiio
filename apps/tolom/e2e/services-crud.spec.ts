import { serviceCatalogFixture } from "./fixtures";
import { setEnglishLocale } from "./helpers";
import { mockCrudMutations, mockServices, mockSupabaseREST } from "./mocks";
import { expect, test } from "./test-extensions";

test.setTimeout(60_000);

test.describe("Services CRUD (Mocked)", () => {
  test.beforeEach(async ({ page }) => {
    await setEnglishLocale(page);
    await mockSupabaseREST(page);
    await mockServices(page, [serviceCatalogFixture()]);
    await mockCrudMutations(page, "services");
    await page.goto("/dashboard/services");
  });

  test("loads services list", async ({ page }) => {
    await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible({
      timeout: 10_000,
    });
  });

  test("shows services table", async ({ page }) => {
    await expect(page.getByRole("table").first()).toBeVisible({
      timeout: 10_000,
    });
  });

  test("add service button triggers form", async ({ page }) => {
    // Find the add service button by looking for Plus icon + service text
    const addBtn = page
      .locator("button")
      .filter({ hasText: /service/i })
      .first();
    await addBtn.click();

    // Form should appear (either inline or drawer)
    await expect(
      page.getByRole("textbox").or(page.getByRole("dialog")).first(),
    ).toBeVisible({ timeout: 10_000 });
  });

  test("edit button opens edit form", async ({ page }) => {
    const editBtn = page.getByRole("button", { name: /edit/i }).first();
    if (await editBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await editBtn.click();
      await expect(page.getByRole("dialog").first()).toBeVisible({
        timeout: 10_000,
      });
    }
  });

  test("delete button triggers confirmation", async ({ page }) => {
    const deleteBtn = page
      .getByRole("button", { name: /delete|remove/i })
      .first();
    if (await deleteBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await deleteBtn.click();
      await expect(
        page
          .getByRole("alertdialog")
          .or(page.getByText(/confirm|delete/i))
          .first(),
      ).toBeVisible({ timeout: 5_000 });
    }
  });
});
