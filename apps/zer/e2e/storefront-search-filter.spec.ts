import { expect, test } from "@playwright/test";

/**
 * Public storefront catalog search + filter E2E, backed by the committed
 * fixture (apps/zer/supabase/seed.sql — slug `storefront-e2e-test`).
 *
 * Covers: search narrowing the catalog (debounced q param), category chip
 * filtering, and pagination with a filter active.
 *
 * Runs unauthenticated (public routes) with an empty storage state so the
 * org-staff session from the main project never interferes.
 */
const SEEDED_SLUG = "storefront-e2e-test";
const CATEGORY_HOME_ID = "20000000-0000-4000-8000-000000000002"; // Гэр ахуй

// Override the project storage state: these are public, unauthenticated flows.
test.use({ storageState: { cookies: [], origins: [] } });

/** True when the seeded org publishes at least one product. */
async function seededOrgHasCatalog(
  page: import("@playwright/test").Page,
): Promise<boolean> {
  return page.evaluate(async (slug) => {
    const url = "http://127.0.0.1:54326";
    const res = await fetch(`${url}/rest/v1/rpc/get_public_products`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: "anon" },
      body: JSON.stringify({ p_slug: slug, p_page: 1, p_page_size: 1 }),
    });
    if (!res.ok) return false;
    const data = (await res.json()) as { total?: number };
    return (data.total ?? 0) > 0;
  }, SEEDED_SLUG);
}

test.describe("Storefront search + filter (seeded org)", () => {
  test("search narrows the catalog via the debounced q param", async ({
    page,
  }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    test.skip(
      !(await seededOrgHasCatalog(page)),
      `seed missing — run apps/zer/supabase/seed.sql on the local stack`,
    );

    await page.goto(`/${SEEDED_SLUG}/products`, {
      waitUntil: "domcontentloaded",
    });
    await page.getByPlaceholder("Нэр, тайлбар...").fill("Бүтээгдэхүүн 30");

    await page.waitForURL(/\?q=/, { timeout: 15_000 });
    // Only one product matches; the result line reflects the filter
    await expect(page.getByText("1 бүтээгдэхүүн олдлоо")).toBeVisible();
    await expect(page.getByText("Бүтээгдэхүүн 30").first()).toBeVisible();
    await expect(page.getByText("Бүтээгдэхүүн 29")).toHaveCount(0);
  });

  test("category chip filters the catalog by category", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    test.skip(
      !(await seededOrgHasCatalog(page)),
      `seed missing — run apps/zer/supabase/seed.sql on the local stack`,
    );

    await page.goto(`/${SEEDED_SLUG}/products`, {
      waitUntil: "domcontentloaded",
    });
    await page.getByRole("button", { name: /Гэр ахуй/ }).click();

    await page.waitForURL(/category=/, { timeout: 15_000 });
    // Гэр ахуй holds 15 plain products + the variant product
    await expect(page.getByText("16 бүтээгдэхүүн олдлоо")).toBeVisible();
    await expect(page.getByText("Цамц (Варианттай)").first()).toBeVisible();
    // Even-numbered products belong to Хүнс and must disappear
    await expect(page.getByText("Бүтээгдэхүүн 2", { exact: true })).toHaveCount(
      0,
    );

    // The URL carries the real category id from the seed
    expect(page.url()).toContain(`category=${CATEGORY_HOME_ID}`);
  });

  test("pagination works with the search filter active", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    test.skip(
      !(await seededOrgHasCatalog(page)),
      `seed missing — run apps/zer/supabase/seed.sql on the local stack`,
    );

    await page.goto(`/${SEEDED_SLUG}/products`, {
      waitUntil: "domcontentloaded",
    });
    // "Бүтээгдэхүүн" matches all 30 plain products → 2 pages
    await page.getByPlaceholder("Нэр, тайлбар...").fill("Бүтээгдэхүүн");

    await page.waitForURL(/\?q=/, { timeout: 15_000 });
    await expect(page.getByText("30 бүтээгдэхүүн олдлоо")).toBeVisible();
    await expect(page.getByText("1 / 2")).toBeVisible();

    await page.getByRole("button", { name: /Дараах/ }).click();
    await page.waitForURL(/page=2/, { timeout: 15_000 });
    // Lexicographic order: page 2 holds Бүтээгдэхүүн 4 … Бүтээгдэхүүн 9
    await expect(page.getByText("2 / 2")).toBeVisible();
    await expect(page.getByText("Бүтээгдэхүүн 4").first()).toBeVisible();
    // The filter stays active on page 2
    await expect(page.getByText("30 бүтээгдэхүүн олдлоо")).toBeVisible();
  });
});
