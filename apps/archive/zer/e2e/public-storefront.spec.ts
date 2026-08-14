import type { Page } from "@playwright/test";
import { expect, test } from "@playwright/test";

/**
 * Public storefront E2E for reviews + blog.
 *
 * Exercises the public (unauthenticated) pages:
 *  - /[slug]/blog — blog list renders, posts are visible
 *  - /[slug]/products/[id] — product detail renders the reviews section
 *
 * These are public routes, so they work regardless of auth state. If the
 * E2E org has no published blog posts or public catalog, the tests assert
 * the page shell still renders (rather than hard-failing).
 */

// Resolve the E2E org slug via the authenticated session (reuses the same
// storage state the main chromium project logs in with).
async function resolveOrgSlug(page: Page): Promise<string | null> {
  return page.evaluate(async () => {
    const url =
      (window as unknown as Record<string, string | undefined>)
        .NEXT_PUBLIC_SUPABASE_URL ?? "http://127.0.0.1:54326";
    const anonKey =
      (window as unknown as Record<string, string | undefined>)
        .NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
    const token = (() => {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.includes("auth-token")) {
          try {
            const raw = localStorage.getItem(key);
            if (!raw) continue;
            const parsed = JSON.parse(raw) as { access_token?: string } | null;
            if (parsed?.access_token) return parsed.access_token;
          } catch {
            // skip
          }
        }
      }
      return "";
    })();
    if (!token) return null;
    const res = await fetch(
      `${url}/rest/v1/profiles?select=organizations(slug)&limit=1`,
      { headers: { apikey: anonKey, Authorization: `Bearer ${token}` } },
    );
    if (!res.ok) return null;
    const rows = (await res.json()) as Array<{
      organizations: { slug: string } | Array<{ slug: string }> | null;
    }>;
    const orgs = rows[0]?.organizations;
    if (!orgs) return null;
    return Array.isArray(orgs) ? (orgs[0]?.slug ?? null) : orgs.slug;
  });
}

test.describe("Public storefront (reviews + blog)", () => {
  test("blog list page renders for the org", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const slug = await resolveOrgSlug(page);
    test.skip(!slug, "no org slug resolvable");

    await page.goto(`/${slug}/blog`, { waitUntil: "domcontentloaded" });
    // Shell must render: heading + either posts or empty state
    await expect(page.getByText("Блог").first()).toBeVisible({
      timeout: 15_000,
    });
  });

  test("blog detail page renders for a published post", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const slug = await resolveOrgSlug(page);
    test.skip(!slug, "no org slug resolvable");

    // Query a published post via the public RPC
    const postSlug = await page.evaluate(
      async ({ orgSlug }) => {
        const url =
          (window as unknown as Record<string, string | undefined>)
            .NEXT_PUBLIC_SUPABASE_URL ?? "http://127.0.0.1:54326";
        const anonKey =
          (window as unknown as Record<string, string | undefined>)
            .NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
        const res = await fetch(`${url}/rest/v1/rpc/get_public_blog_posts`, {
          method: "POST",
          headers: { "Content-Type": "application/json", apikey: anonKey },
          body: JSON.stringify({ p_slug: orgSlug }),
        });
        if (!res.ok) return null;
        const posts = (await res.json()) as Array<{ slug: string }>;
        return posts[0]?.slug ?? null;
      },
      { orgSlug: slug },
    );
    test.skip(!postSlug, "no published blog posts");

    await page.goto(`/${slug}/blog/${postSlug}`, {
      waitUntil: "domcontentloaded",
    });
    await expect(page.locator("article").first()).toBeVisible({
      timeout: 15_000,
    });
  });

  test("product detail page renders the reviews section", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const slug = await resolveOrgSlug(page);
    test.skip(!slug, "no org slug resolvable");

    const productId = await page.evaluate(
      async ({ orgSlug }) => {
        const url =
          (window as unknown as Record<string, string | undefined>)
            .NEXT_PUBLIC_SUPABASE_URL ?? "http://127.0.0.1:54326";
        const anonKey =
          (window as unknown as Record<string, string | undefined>)
            .NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
        const res = await fetch(`${url}/rest/v1/rpc/get_public_products`, {
          method: "POST",
          headers: { "Content-Type": "application/json", apikey: anonKey },
          body: JSON.stringify({ p_slug: orgSlug }),
        });
        if (!res.ok) return null;
        const products = (await res.json()) as Array<{ id: string }>;
        return products[0]?.id ?? null;
      },
      { orgSlug: slug },
    );
    test.skip(!productId, "no public products");

    await page.goto(`/${slug}/products/${productId}`, {
      waitUntil: "domcontentloaded",
    });
    // Reviews section is part of the product detail page
    await expect(page.getByText("Сэтгэгдэл").first()).toBeVisible({
      timeout: 15_000,
    });
  });
});

/**
 * Deterministic storefront flows backed by the committed fixture
 * (apps/zer/supabase/seed.sql — slug `storefront-e2e-test`). These tests
 * require the seed to be applied to the local stack; they skip with a clear
 * message otherwise. Covers the flows that historically regressed:
 * catalog pagination (RPC 42803), variant rendering (RPC column drift),
 * and guest checkout (trigger search_path 42P01).
 */
const SEEDED_SLUG = "storefront-e2e-test";
const VARIANT_PRODUCT_ID = "30000000-0000-4000-8000-000000000001";
const VARIANT_M_WHITE = "60000000-0000-4000-8000-000000000002";

test.describe("Storefront catalog + checkout (seeded org)", () => {
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

  test("catalog paginates server-side (page 2 has products)", async ({
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
    // Pagination bar renders with page 1 of N (seed has > pageSize products)
    await expect(page.getByText(/1 \/ \d+/)).toBeVisible({ timeout: 15_000 });

    await page.getByRole("button", { name: /Дараах/ }).click();
    await page.waitForURL(/page=2/);
    // Page 2 renders seeded products (lexicographic order: Бүтээгдэхүүн 4 …)
    await expect(page.getByText("Бүтээгдэхүүн 4").first()).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByText(/2 \/ \d+/)).toBeVisible();
  });

  test("variant product renders option labels + per-variant price", async ({
    page,
  }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    test.skip(
      !(await seededOrgHasCatalog(page)),
      `seed missing — run apps/zer/supabase/seed.sql on the local stack`,
    );

    await page.goto(`/${SEEDED_SLUG}/products/${VARIANT_PRODUCT_ID}`, {
      waitUntil: "domcontentloaded",
    });

    // Real variant labels from product_variant_options (not the broken
    // name/price columns the old RPC referenced)
    await expect(page.getByText("S / Хар").first()).toBeVisible();
    await expect(page.getByText("M / Цагаан").first()).toBeVisible();
    // Base price card
    await expect(page.getByText("₮ 12,000").first()).toBeVisible();
    // Stock is intentionally private on public pages — no Нөөц section
    await expect(page.getByText("Нөөц")).toHaveCount(0);
    // Attributes from product_attribute_definitions
    await expect(page.getByText("Материал").first()).toBeVisible();
    await expect(page.getByText("Хөвөн").first()).toBeVisible();

    // Selecting a variant switches price + URL
    await page.getByRole("button", { name: /M \/ Цагаан/ }).click();
    await page.waitForURL(new RegExp(`variant=${VARIANT_M_WHITE}`));
    await expect(page.getByText("₮ 12,500").first()).toBeVisible();
  });

  test("guest checkout creates an order and clears the cart", async ({
    page,
  }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    test.skip(
      !(await seededOrgHasCatalog(page)),
      `seed missing — run apps/zer/supabase/seed.sql on the local stack`,
    );

    // Add the base product (no variant) to the cart from the catalog list
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

    await page.goto(`/${SEEDED_SLUG}/cart`, { waitUntil: "domcontentloaded" });
    await expect(page.getByText("Бүтээгдэхүүн 1").first()).toBeVisible();
    await expect(page.getByText(/Нийт/).first()).toBeVisible();

    await page.locator('input[autocomplete="name"]').fill("Тест Хэрэглэгч");
    await page.locator('input[autocomplete="tel"]').fill("99887766");
    await page.getByRole("button", { name: "Худалдан авалт" }).click();

    // Success state: order id + cleared cart
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
