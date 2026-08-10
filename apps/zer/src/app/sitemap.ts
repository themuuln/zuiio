import type { MetadataRoute } from "next";
import { getPublicCatalog } from "@/lib/public-catalog";
import { createClient } from "@/lib/supabase/server";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://zuiio.mn";

  const supabase = await createClient();

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

  const orgEntries: MetadataRoute.Sitemap = [];

  for (const org of organizations ?? []) {
    if (!org.slug) continue;
    const orgBase = domainByOrg[org.id] ?? baseUrl;

    orgEntries.push(
      {
        url: `${orgBase}/${org.slug}`,
        lastModified: new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.7,
      },
      {
        url: `${orgBase}/${org.slug}/products`,
        lastModified: new Date(),
        changeFrequency: "daily" as const,
        priority: 0.6,
      },
      {
        url: `${orgBase}/${org.slug}/blog`,
        lastModified: new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.5,
      },
    );

    // Product deep links: paginate the public catalog, cap at 300/org.
    for (let page = 1; page <= 3; page++) {
      const catalog = await getPublicCatalog(supabase, org.slug, {
        page,
        pageSize: 100,
      });
      const products = catalog?.products ?? [];
      for (const product of products) {
        orgEntries.push({
          url: `${orgBase}/${org.slug}/products/${product.id}`,
          lastModified: new Date(),
          changeFrequency: "weekly" as const,
          priority: 0.5,
        });
      }
      if (products.length < 100) break;
    }

    // Blog post deep links.
    const { data: blogPosts } = await supabase.rpc("get_public_blog_posts", {
      p_slug: org.slug,
    });
    const posts = (blogPosts ?? []) as Array<{ slug: string }>;
    for (const post of posts) {
      if (!post.slug) continue;
      orgEntries.push({
        url: `${orgBase}/${org.slug}/blog/${post.slug}`,
        lastModified: new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.4,
      });
    }
  }

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: `${baseUrl}/landing`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    ...orgEntries,
  ];
}
