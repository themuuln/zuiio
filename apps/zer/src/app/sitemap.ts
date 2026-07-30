import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://zuiio.mn";

  const supabase = await createClient();

  const { data: profiles } = await supabase
    .from("organization_public_profiles")
    .select("organization_id, catalog_enabled")
    .eq("catalog_enabled", true);

  const orgIds = profiles?.map((p) => p.organization_id) ?? [];

  const { data: organizations } = orgIds.length
    ? await supabase
        .from("organizations")
        .select("slug")
        .in("id", orgIds)
        .not("slug", "is", null)
    : { data: [] };

  const orgEntries: MetadataRoute.Sitemap = (organizations ?? []).flatMap(
    (org) => {
      if (!org.slug) return [];
      return [
        {
          url: `${baseUrl}/${org.slug}`,
          lastModified: new Date(),
          changeFrequency: "weekly" as const,
          priority: 0.7,
        },
        {
          url: `${baseUrl}/${org.slug}/products`,
          lastModified: new Date(),
          changeFrequency: "daily" as const,
          priority: 0.6,
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
