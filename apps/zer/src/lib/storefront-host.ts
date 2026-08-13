/**
 * Storefront host classification shared by the edge proxy (domain-rewrite),
 * server pages (storefront-seo) and the [slug] layout.
 *
 * The classification drives two things:
 * - The proxy rewrite: custom domains / org subdomains are rewritten to the
 *   /{slug} routes (host preserved).
 * - Storefront link generation: on the primary host links carry the slug
 *   prefix (/{slug}/cart), on custom hosts they are root-relative (/cart) —
 *   the rewrite already resolved the domain to the org, so the doubled slug
 *   would 404.
 */

/** Primary site host used as the fallback origin for storefront pages. */
export const DEFAULT_SITE_HOST = "zer.zuiiotech.com";

/** Primary site host (Host-header form: no scheme, no port). */
export function siteHost(): string {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL || `https://${DEFAULT_SITE_HOST}`;
  const host =
    raw.replace(/^https?:\/\//, "").split("/")[0] ?? DEFAULT_SITE_HOST;
  return host.replace(/:\d+$/, "");
}

/** Host header without scheme and port (production hosts carry neither). */
export function normalizeHost(host: string | null): string | null {
  if (!host) return null;
  return host.toLowerCase().replace(/:\d+$/, "");
}

/**
 * True when `host` is not the app's primary host — a verified custom domain
 * or an org subdomain. Localhost and preview hosts (vercel.app) are excluded
 * so canonicals never point at throwaway origins.
 */
export function isCustomHost(host: string | null): boolean {
  const normalized = normalizeHost(host);
  if (!normalized) return false;
  if (normalized === siteHost()) return false;
  if (normalized === "localhost") return false;
  if (normalized.endsWith(".vercel.app")) return false;
  return true;
}

/**
 * Storefront link base path for a request host:
 * - Primary host → "/{slug}" (storefront pages live under /{slug}).
 * - Custom domain / org subdomain → "" (the proxy rewrites the domain root
 *   to /{slug}, so links are root-relative: "/cart", "/products", …).
 */
export function storefrontBasePath(host: string | null, slug: string): string {
  return isCustomHost(host) ? "" : `/${slug}`;
}

/** Host of an origin URL, or null when it cannot be parsed. */
function hostOfOrigin(origin: string): string | null {
  try {
    return new URL(origin).host;
  } catch {
    return null;
  }
}

/**
 * Storefront URL under a base origin (e.g. the origin a chat widget runs
 * on). Appends the host-aware storefront base — "" on custom hosts,
 * "/{slug}" on the primary host — so AI-generated product/blog links never
 * carry a doubled slug on custom domains.
 */
export function storefrontUrl(
  origin: string,
  slug: string,
  subpath: string,
): string {
  return `${origin}${storefrontBasePath(hostOfOrigin(origin), slug)}${subpath}`;
}
