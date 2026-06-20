import { createClient } from "@/lib/supabase/server";
import { APP_DESCRIPTION, APP_NAME } from "@/lib/constants";

export async function GET() {
  const icons: {
    src: string;
    sizes: string;
    type?: string;
    purpose?: string;
  }[] = [];

  // Try to use the org's logo as the primary icon
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("organizations(brand_config)")
      .eq("id", user.id)
      .single();

    if (profile) {
      const org = profile.organizations as {
        brand_config: Record<string, string> | null;
      } | null;
      const logoUrl = org?.brand_config?.logo_url;
      if (logoUrl) {
        icons.push({
          src: logoUrl,
          sizes: "512x512",
          purpose: "any",
        });
      }
    }
  }

  // Fallback SVG icons always included
  icons.push(
    {
      src: "/pwa/icon-192.svg",
      sizes: "192x192",
      type: "image/svg+xml",
      purpose: "any",
    },
    {
      src: "/pwa/icon-512.svg",
      sizes: "512x512",
      type: "image/svg+xml",
      purpose: "any",
    },
    {
      src: "/pwa/icon-192-maskable.svg",
      sizes: "192x192",
      type: "image/svg+xml",
      purpose: "maskable",
    },
    {
      src: "/pwa/icon-512-maskable.svg",
      sizes: "512x512",
      type: "image/svg+xml",
      purpose: "maskable",
    },
  );

  const manifest = {
    name: APP_NAME,
    short_name: APP_NAME,
    description: APP_DESCRIPTION,
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#09090b",
    theme_color: "#09090b",
    categories: ["business", "productivity"],
    lang: "mn",
    icons,
  };

  return Response.json(manifest, {
    headers: {
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
  });
}
