import { NextResponse } from "next/server";
import { getPublicCatalog } from "@/lib/public-catalog";
import { isCustomHost, SITE_URL } from "@/lib/storefront-seo";
import {
  orgSiteEntries,
  type SitemapEntry,
  sitemapXml,
} from "@/lib/storefront-sitemap";
import { createClient } from "@/lib/supabase/server";

const XML_HEADERS = {
  "Content-Type": "application/xml; charset=utf-8",
  "Cache-Control":
    "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400",
};

/** Supabase server client used by this route. */
type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

function xmlResponse(entries: SitemapEntry[]): NextResponse {
  return new NextResponse(sitemapXml(entries), { headers: XML_HEADERS });
}

/** Products for one org (paginated through the public RPC, capped at 300). */
async function collectProducts(
  supabase: SupabaseClient,
  slug: string,
): Promise<Array<{ id: string }>> {
  const products: Array<{ id: string }> = [];
  for (let page = 1; page <= 3; page++) {
    const catalog = await getPublicCatalog(supabase, slug, {
      page,
      pageSize: 100,
    });
    const rows = catalog?.products ?? [];
    for (const product of rows) products.push({ id: product.id });
    if (rows.length < 100) break;
  }
  return products;
}

/** Published blog posts for one org. */
async function collectPosts(
  supabase: SupabaseClient,
  slug: string,
): Promise<Array<{ slug: string; published_at?: string | null }>> {
  const { data } = await supabase.rpc("get_public_blog_posts", {
    p_slug: slug,
  });
  return (
    (data ?? []) as Array<{
      slug: string;
      published_at?: string | null;
    }>
  ).filter((post) => post.slug);
}

/** Sitemap entries for one org on `base` (custom domain root or primary host). */
async function orgEntries(
  supabase: SupabaseClient,
  slug: string,
  base: string,
  pathPrefix: string,
): Promise<SitemapEntry[]> {
  const [products, posts] = await Promise.all([
    collectProducts(supabase, slug),
    collectPosts(supabase, slug),
  ]);
  return orgSiteEntries(base, pathPrefix, { products, posts });
}

/**
 * Host-aware sitemap.
 *
 * - Custom domain / org subdomain → only that org's URLs, rooted at the
 *   domain (no slug prefix). Search engines reject sitemaps that list
 *   foreign origins, so a per-org sitemap is required for custom domains.
 * - Primary host → the global sitemap: base site entries plus every
 *   catalog-enabled org (each org on its own verified domain when set).
 */
export async function GET(request: Request) {
  const host = request.headers.get("host")?.toLowerCase() ?? "";
  const supabase = await createClient();

  if (isCustomHost(host)) {
    const base = `https://${host}`;
    let slug: string | null = null;

    // Org subdomain of the primary host: {slug}.zer.zuiiotech.com → slug.
    const siteHost = SITE_URL.replace(/^https?:\/\//, "").split("/")[0] ?? "";
    if (host.endsWith(`.${siteHost}`)) {
      const sub = host.slice(0, -`.${siteHost}`.length);
      if (sub && !sub.includes(".") && /^[a-z0-9-]+$/.test(sub)) {
        slug = sub;
      }
    }

    // Verified custom domain → resolve org via the public profile.
    if (!slug) {
      const { data: profile } = await supabase
        .from("organization_public_profiles")
        .select("organization_id")
        .eq("custom_domain", host)
        .eq("domain_verified", true)
        .maybeSingle();
      if (profile) {
        const { data: org } = await supabase
          .from("organizations")
          .select("slug")
          .eq("id", profile.organization_id)
          .maybeSingle();
        slug = org?.slug ?? null;
      }
    }

    if (!slug) return xmlResponse([]);
    return xmlResponse(await orgEntries(supabase, slug, base, ""));
  }

  // Primary host → global sitemap.
  const { data: profiles } = await supabase
    .from("organization_public_profiles")
    .select("organization_id, catalog_enabled, custom_domain, domain_verified")
    .eq("catalog_enabled", true);

  const orgIds = profiles?.map((p) => p.organization_id) ?? [];
  const domainByOrg: Record<string, string> = {};
  for (const p of profiles ?? []) {
    if (p.custom_domain && p.domain_verified) {
      domainByOrg[p.organization_id] = `https://${p.custom_domain}`;
    }
  }

  const { data: organizations } = orgIds.length
    ? await supabase
        .from("organizations")
        .select("id, slug")
        .in("id", orgIds)
        .not("slug", "is", null)
    : { data: [] };

  const entries: SitemapEntry[] = [
    { url: SITE_URL },
    { url: `${SITE_URL}/landing` },
  ];

  for (const org of organizations ?? []) {
    if (!org.slug) continue;
    const orgBase = domainByOrg[org.id] ?? SITE_URL;
    // On a verified custom domain the storefront lives at the domain root —
    // list those entries without the slug prefix.
    const orgPrefix = domainByOrg[org.id] ? "" : org.slug;
    entries.push(...(await orgEntries(supabase, org.slug, orgBase, orgPrefix)));
  }

  return xmlResponse(entries);
}
