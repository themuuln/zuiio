import type { Page } from "@playwright/test";
import { expect, test } from "@playwright/test";

/**
 * Custom-domain storefront E2E (regression for the doubled-slug 404).
 *
 * The seeded org (apps/zer/supabase/seed.sql, slug `storefront-e2e-test`)
 * owns the verified custom domain `e2e-custom.localhost`. macOS resolves
 * `*.localhost` to loopback, so navigating to that origin against the local
 * dev server exercises the real proxy path: the middleware resolves the
 * Host header through /api/domain-resolve and rewrites the domain root to
 * /{slug} (host preserved).
 *
 * Because the browser host is a custom domain, every storefront link must be
 * root-relative ("/cart", "/products") — NOT "/{slug}/cart". A slug-prefixed
 * href would be rewritten to /{slug}/{slug}/cart and 404. That is the bug
 * this suite guards: bujin.mn → add to cart → header cart → 404.
 */

const CUSTOM_DOMAIN = "e2e-custom.localhost";
const SEEDED_SLUG = "storefront-e2e-test";

/** Custom-domain origin on the same port as the Playwright dev server. */
function customOrigin(): string {
  const base = new URL(
    process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000",
  );
  return `http://${CUSTOM_DOMAIN}${base.port ? `:${base.port}` : ""}`;
}

/** True when the seeded org publishes at least one product. */
async function seededOrgHasCatalog(page: Page): Promise<boolean> {
  return page.evaluate(async (slug) => {
    const url =
      (window as unknown as Record<string, string | undefined>)
        .NEXT_PUBLIC_SUPABASE_URL ?? "http://127.0.0.1:54326";
    const anonKey =
      (window as unknown as Record<string, string | undefined>)
        .NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
    const res = await fetch(`${url}/rest/v1/rpc/get_public_products`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: anonKey },
      body: JSON.stringify({ p_slug: slug, p_page: 1, p_page_size: 1 }),
    });
    if (!res.ok) return false;
    const data = (await res.json()) as {
      products: unknown[];
      total?: number;
    };
    return (data.total ?? 0) > 0;
  }, SEEDED_SLUG);
}

/** The storefront header chrome (rendered once by the [slug] layout). */
function headerCartLink(page: Page) {
  return page.locator("header").getByRole("link", { name: /Сагс/ }).first();
}

test.describe("Custom-domain storefront (host rewrite)", () => {
  test("header cart link is root-relative and opens the cart after adding a product", async ({
    page,
  }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    test.skip(
      !(await seededOrgHasCatalog(page)),
      `seed missing — run apps/zer/supabase/seed.sql on the local stack`,
    );

    const origin = customOrigin();
    // A fresh dev server compiles /api/domain-resolve on first hit; the
    // middleware's self-fetch would race that compile and skip the rewrite
    // (landing page fallback). Prime the route so the flow is deterministic.
    await page.request.get(
      `${origin}/api/domain-resolve?host=${CUSTOM_DOMAIN}`,
    );

    // The reported flow: add a product on the custom domain, then open the
    // cart from the header. The storefront home renders the catalog grid
    // with AddToCartButton on every card.
    await page.goto(`${origin}/`, { waitUntil: "domcontentloaded" });

    // The proxy rewrite rendered the storefront under the custom domain.
    await expect(page.getByText("Storefront E2E Shop").first()).toBeVisible({
      timeout: 15_000,
    });

    // Header links must NOT carry the doubled slug — the cart link is
    // root-relative, otherwise clicking it 404s.
    await expect(headerCartLink(page)).toHaveAttribute("href", "/cart");

    // Add the first product to the cart (localStorage-backed). The storefront
    // home renders no <main> landmark, so the button is queried unscoped.
    await page
      .getByRole("button", { name: "Сагсанд нэмэх", exact: true })
      .first()
      .click();
    await expect(page.getByText("Сагсанд нэмэгдлээ")).toBeVisible({
      timeout: 10_000,
    });

    // Click the header cart → must land on /cart (no 404, no redirect loop).
    await headerCartLink(page).click();
    await page.waitForURL(`${origin}/cart`);
    await expect(page.getByText("Бүтээгдэхүүн 1").first()).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByText(/Нийт/).first()).toBeVisible();
  });

  test("primary host keeps the slug-prefixed cart link (regression)", async ({
    page,
  }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    test.skip(
      !(await seededOrgHasCatalog(page)),
      `seed missing — run apps/zer/supabase/seed.sql on the local stack`,
    );

    await page.goto(`/${SEEDED_SLUG}`, { waitUntil: "domcontentloaded" });
    await expect(page.getByText("Storefront E2E Shop").first()).toBeVisible({
      timeout: 15_000,
    });
    await expect(headerCartLink(page)).toHaveAttribute(
      "href",
      `/${SEEDED_SLUG}/cart`,
    );
  });
});
