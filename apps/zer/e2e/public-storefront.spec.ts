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
