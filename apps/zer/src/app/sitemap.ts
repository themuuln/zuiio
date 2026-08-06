import type { MetadataRoute } from "next";
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

  const orgEntries: MetadataRoute.Sitemap = (organizations ?? []).flatMap(
    (org) => {
      if (!org.slug) return [];
      const orgBase = domainByOrg[org.id] ?? baseUrl;
      return [
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
      ];
    },
  );

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
