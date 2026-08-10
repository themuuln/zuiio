import type { Page } from "@playwright/test";
import { expect, test } from "@playwright/test";

/**
 * TRUE guest checkout E2E — the whole flow with NO session at all.
 *
 * Backed by the committed fixture (apps/zer/supabase/seed.sql — slug
 * `storefront-e2e-test`). Runs with an empty storage state (no cookies,
 * no auth): anonymous org home renders → catalog → add to cart → cart
 * shows the line → checkout with name/phone → order confirmation + cart
 * cleared.
 *
 * This is the flow the storefront middleware must expose publicly. The
 * spec fails when the proxy redirects anonymous visitors away from
 * /{slug}, /{slug}/cart etc.
 */
const SEEDED_SLUG = "storefront-e2e-test";

test.use({ storageState: { cookies: [], origins: [] } });

/** True when the seeded org publishes at least one product. */
async function seededOrgHasCatalog(page: Page): Promise<boolean> {
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

test.describe("Guest checkout (seeded org, anonymous)", () => {
  test("anonymous visitor can browse and place an order", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    test.skip(
      !(await seededOrgHasCatalog(page)),
      `seed missing — run apps/zer/supabase/seed.sql on the local stack`,
    );

    // Anonymous org home renders (not redirected to /login)
    await page.goto(`/${SEEDED_SLUG}`, { waitUntil: "domcontentloaded" });
    await expect(
      page.getByRole("heading", { name: "Storefront E2E Shop" }),
    ).toBeVisible({ timeout: 15_000 });

    // Catalog → add to cart
    await page.goto(`/${SEEDED_SLUG}/products`, {
      waitUntil: "domcontentloaded",
    });
    await page
      .locator("main")
      .getByRole("button", { name: "Сагсанд нэмэх", exact: true })
      .first()
      .click();
    await expect(page.getByText("Сагсанд нэмэгдлээ")).toBeVisible({
      timeout: 10_000,
    });

    // Cart renders the line and totals
    await page.goto(`/${SEEDED_SLUG}/cart`, { waitUntil: "domcontentloaded" });
    await expect(page.getByText("Бүтээгдэхүүн 1").first()).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByText(/Нийт/).first()).toBeVisible();

    // Guest checkout with contact details only
    await page.locator('input[autocomplete="name"]').fill("Тест Хэрэглэгч");
    // Unique 8-digit phone: submit_shop_order flood-limits pending
    // orders per contact phone (5/hour) — fixed test phones would block
    // repeated runs.
    const phone = `99${String(Math.floor(Math.random() * 900000) + 100000)}`;
    await page.locator('input[autocomplete="tel"]').fill(phone);
    await page.getByRole("button", { name: "Худалдан авалт" }).click();

    await expect(page.getByText("Захиалга амжилттай үүслээ")).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByText(/Захиалгын дугаар:/)).toBeVisible();
    // Cart is empty after checkout (localStorage cleared)
    const cart = await page.evaluate(() =>
      localStorage.getItem("zer-storefront-cart"),
    );
    expect(cart).toContain('"items":[]');
  });
});
