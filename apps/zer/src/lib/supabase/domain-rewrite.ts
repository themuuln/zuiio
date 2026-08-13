import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/**
 * Resolves the effective org slug for a public storefront request that
 * arrived on a custom domain or an org subdomain, and returns a rewrite
 * to the /[slug] route when applicable.
 *
 * Three cases:
 * 1. Host IS the app's primary host → no rewrite.
 * 2. Host is a subdomain of the primary host (`{slug}.example.com`) →
 *    rewrite to `/{slug}{path}` directly (wildcard DNS required at the host).
 * 3. Host is a verified custom domain → resolve via the domain-resolve API
 *    route, then rewrite to `/{slug}{path}`.
 *
 * Rewrites preserve the original host, so `[slug]` pages render under the
 * custom domain and generateMetadata sees the canonical host.
 */
export async function maybeRewriteStorefrontHost(
  request: NextRequest,
): Promise<NextResponse | null> {
  const pathname = request.nextUrl.pathname;

  // Never rewrite API, auth, static, share, or SEO routes.
  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/auth/") ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/r/") ||
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/manifest.json" ||
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    /\.(?:svg|png|jpg|jpeg|gif|webp)$/.test(pathname)
  ) {
    return null;
  }

  const host = request.headers?.get?.("host")?.toLowerCase() ?? "";
  if (!host) return null;

  // Skip the app's own host (localhost, Vercel URL, configured site URL).
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.toLowerCase() ?? "";
  const siteHost =
    (siteUrl || "https://zer.zuiiotech.com")
      .replace(/^https?:\/\//, "")
      .split("/")[0] ?? "";
  if (siteHost && host === siteHost) return null;
  if (host === "localhost:3000" || host === "localhost") return null;
  if (host.endsWith(".vercel.app")) return null;

  // Subdomain of the primary host: `{slug}.{siteHost}` → /{slug}/…
  if (siteHost) {
    const subdomainSuffix = `.${siteHost}`;
    if (host.endsWith(subdomainSuffix)) {
      const sub = host.slice(0, -subdomainSuffix.length);
      if (sub && !sub.includes(".") && /^[a-z0-9-]+$/.test(sub)) {
        const rewriteUrl = request.nextUrl.clone();
        rewriteUrl.pathname = `/${sub}${pathname === "/" ? "" : pathname}`;
        return NextResponse.rewrite(rewriteUrl, { request });
      }
    }
  }

  // Custom domain: resolve org slug via the domain-resolve route.
  try {
    const baseUrl = request.nextUrl.origin;
    const res = await fetch(
      `${baseUrl}/api/domain-resolve?host=${encodeURIComponent(host)}`,
      { next: { revalidate: 60 } },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { slug?: string };
    if (!data.slug) return null;

    const rewriteUrl = request.nextUrl.clone();
    rewriteUrl.pathname = `/${data.slug}${pathname === "/" ? "" : pathname}`;
    return NextResponse.rewrite(rewriteUrl, { request });
  } catch {
    // Domain resolution unavailable (edge / offline) — let routing proceed.
    return null;
  }
}
