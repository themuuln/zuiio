import { NextResponse } from "next/server";
import { isCustomHost, SITE_URL } from "@/lib/storefront-seo";

/**
 * Host-aware robots.txt.
 *
 * The sitemap URL must point at the requesting host: on a custom domain the
 * storefront serves its own per-org sitemap (https://bujin.mn/sitemap.xml),
 * while the primary host references the global one. Search engines verify
 * sitemaps per origin, so a static robots.txt would break custom-domain
 * submission in Search Console.
 */
export async function GET(request: Request) {
  const host = request.headers.get("host") ?? "";
  const base = isCustomHost(host) ? `https://${host}` : SITE_URL;
  const body = [
    "User-agent: *",
    "Allow: /",
    "Disallow: /(dashboard)/",
    "Disallow: /(auth)/",
    "Disallow: /api/",
    `Sitemap: ${base}/sitemap.xml`,
    "",
  ].join("\n");
  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
