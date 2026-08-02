import { expect, test } from "@playwright/test";
import { openDrawerByText } from "./helpers";

const POST_TITLE = `E2E Блог нийтлэл ${Date.now()}`;
const POST_CONTENT = `Автомат шалгалтын агуулга ${Date.now()}`;
const EDITED_TITLE = `${POST_TITLE} (зассан)`;

/**
 * Blog module E2E.
 *
 * Covers admin CRUD: list loads, create a post (draft), publish it via
 * toggle, edit it, and delete it.
 */
test.describe("Blog module", () => {
  test("page loads", async ({ page }) => {
    await page.goto("/blog", { waitUntil: "domcontentloaded" });
    await expect(page.getByText("Блог").first()).toBeVisible({
      timeout: 15000,
    });
  });

  test("create a blog post as draft", async ({ page }) => {
    await page.goto("/blog", { waitUntil: "domcontentloaded" });

    await openDrawerByText(page, "Шинэ нийтлэл");
    const drawer = page.locator("[data-drawer-popup]:visible").first();
    await expect(drawer).toBeVisible();

    await drawer.getByPlaceholder("Нийтлэлийн гарчиг").fill(POST_TITLE);
    await drawer
      .getByPlaceholder("Нийтлэлийн үндсэн агуулга")
      .fill(POST_CONTENT);

    const submitBtn = drawer.getByRole("button", { name: "Хадгалах" });
    await expect(submitBtn).toBeVisible();
    await submitBtn.click();

    const toast = page.locator("[data-sonner-toast]:visible").first();
    await expect(toast).toContainText("Нийтлэл амжилттай үүсгэгдсэн.", {
      timeout: 15_000,
    });
    await expect(drawer).toBeHidden({ timeout: 10_000 });

    // Draft appears in the list with "Үгүй" publish state
    await page.goto(`/blog?refresh=${Date.now()}`, {
      waitUntil: "domcontentloaded",
    });
    await expect(page.locator("main")).toContainText(POST_TITLE, {
      timeout: 10_000,
    });
  });

  test("publish, edit, and delete a blog post", async ({ page }) => {
    // Create the post first (needs a fresh one per run to stay isolated)
    await page.goto("/blog", { waitUntil: "domcontentloaded" });
    await openDrawerByText(page, "Шинэ нийтлэл");
    const createDrawer = page.locator("[data-drawer-popup]:visible").first();
    await createDrawer.getByPlaceholder("Нийтлэлийн гарчиг").fill(POST_TITLE);
    await createDrawer
      .getByPlaceholder("Нийтлэлийн үндсэн агуулга")
      .fill(POST_CONTENT);
    await createDrawer.getByRole("button", { name: "Хадгалах" }).click();
    await expect(
      page.locator("[data-sonner-toast]:visible").first(),
    ).toContainText("Нийтлэл амжилттай үүсгэгдсэн.", { timeout: 15_000 });
    await expect(createDrawer).toBeHidden({ timeout: 10_000 });

    // Publish via the row switch
    await page.goto(`/blog?refresh=${Date.now()}`, {
      waitUntil: "domcontentloaded",
    });
    const row = page.locator("main").getByText(POST_TITLE).first();
    await expect(row).toBeVisible({ timeout: 10_000 });
    const toggle = row
      .locator("xpath=ancestor::tr")
      .locator('[role="switch"]')
      .first();
    await toggle.click();
    const toast = page.locator("[data-sonner-toast]:visible").first();
    await expect(toast).toContainText("нээлттэй боллоо", { timeout: 15_000 });

    // Edit the title
    await page.goto(`/blog?refresh=${Date.now()}`, {
      waitUntil: "domcontentloaded",
    });
    const editRow = page.locator("main").getByText(POST_TITLE).first();
    await expect(editRow).toBeVisible({ timeout: 10_000 });
    await editRow
      .locator("xpath=ancestor::tr")
      .getByRole("button", { name: "" })
      .nth(1)
      .click();
    const editDrawer = page.locator("[data-drawer-popup]:visible").first();
    await expect(editDrawer).toBeVisible({ timeout: 10_000 });
    await editDrawer.getByPlaceholder("Нийтлэлийн гарчиг").fill(EDITED_TITLE);
    await editDrawer.getByRole("button", { name: "Хадгалах" }).click();
    await expect(
      page.locator("[data-sonner-toast]:visible").first(),
    ).toContainText("Нийтлэл шинэчлэгдсэн.", { timeout: 15_000 });

    // Delete via confirm dialog
    await page.goto(`/blog?refresh=${Date.now()}`, {
      waitUntil: "domcontentloaded",
    });
    const deleteRow = page.locator("main").getByText(EDITED_TITLE).first();
    await expect(deleteRow).toBeVisible({ timeout: 10_000 });
    page.on("dialog", (dialog) => dialog.accept());
    await deleteRow
      .locator("xpath=ancestor::tr")
      .getByRole("button", { name: "" })
      .nth(2)
      .click();
    await expect(
      page.locator("[data-sonner-toast]:visible").first(),
    ).toContainText("Нийтлэл устгагдлаа.", { timeout: 15_000 });
  });
});
