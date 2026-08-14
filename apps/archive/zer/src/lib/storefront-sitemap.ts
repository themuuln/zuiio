/**
 * Storefront sitemap building blocks (pure — no Supabase).
 *
 * A storefront org contributes the same URLs on both hosts, but rooted
 * differently:
 * - Primary host: https://zer.zuiiotech.com/{slug}, /{slug}/products, …
 * - Custom domain: https://bujin.mn/ , /products, … (slug prefix dropped —
 *   the middleware rewrites the domain root to /{slug}).
 */

export interface SitemapEntry {
  url: string;
  lastModified?: string;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** Serialize entries to a sitemap XML document. */
export function sitemapXml(entries: SitemapEntry[]): string {
  const body = entries
    .map((entry) => {
      const lastmod = entry.lastModified
        ? `<lastmod>${escapeXml(new Date(entry.lastModified).toISOString())}</lastmod>`
        : "";
      return `<url><loc>${escapeXml(entry.url)}</loc>${lastmod}</url>`;
    })
    .join("");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${body}</urlset>`;
}

export interface OrgSitemapData {
  products: Array<{ id: string }>;
  posts: Array<{ slug: string; published_at?: string | null }>;
}

/**
 * Storefront URLs for one org. `base` is the origin ("https://bujin.mn") and
 * `pathPrefix` the org slug on the primary host ("" on a custom domain).
 * lastModified uses the blog post's real published_at where available;
 * products have no public timestamp, so their entries carry none.
 */
export function orgSiteEntries(
  base: string,
  pathPrefix: string,
  data: OrgSitemapData,
): SitemapEntry[] {
  const prefix = pathPrefix ? `/${pathPrefix}` : "";
  const entries: SitemapEntry[] = [
    { url: `${base}${prefix || "/"}` },
    { url: `${base}${prefix}/products` },
    { url: `${base}${prefix}/blog` },
  ];
  for (const product of data.products) {
    entries.push({ url: `${base}${prefix}/products/${product.id}` });
  }
  for (const post of data.posts) {
    entries.push({
      url: `${base}${prefix}/blog/${post.slug}`,
      ...(post.published_at ? { lastModified: post.published_at } : {}),
    });
  }
  return entries;
}
