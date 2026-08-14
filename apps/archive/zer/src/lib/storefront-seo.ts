import type { Metadata } from "next";
import { headers } from "next/headers";
import { isCustomHost, storefrontBasePath } from "@/lib/storefront-host";

export { isCustomHost, storefrontBasePath };

/**
 * Shared storefront SEO helpers.
 *
 * Canonical rules:
 * - Primary host (zer.zuiiotech.com): storefront pages live under /{slug},
 *   so the canonical keeps the slug:
 *   https://zer.zuiiotech.com/bujin-beauty/products.
 * - Custom domain / org subdomain: the middleware rewrites the domain root
 *   to /{slug}, so the slug prefix is dropped and canonicals point at the
 *   clean origin path: https://bujin.mn/products.
 */

/** Primary site origin used as the canonical fallback for storefront pages. */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://zer.zuiiotech.com"
).replace(/\/$/, "");

/** The request host (Host header), or null when no HTTP request is active. */
export async function requestHost(): Promise<string | null> {
  try {
    return (await headers()).get("host") ?? null;
  } catch {
    // No request context (tests, static generation) — callers fall back.
    return null;
  }
}

/**
 * Canonical URL for a storefront page.
 *
 * `subpath` is the storefront-relative path starting with "/"; "" (or "/")
 * is the org profile page itself.
 */
export function storefrontCanonical(
  host: string | null,
  slug: string,
  subpath = "",
): string {
  const path = subpath || "/";
  if (isCustomHost(host)) return `https://${host}${path}`;
  return `${SITE_URL}/${slug}${path === "/" ? "" : path}`;
}

/** Absolute URL for a possibly-relative image (og:image, logo, …). */
export function absoluteImageUrl(
  url: string | null | undefined,
): string | null {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith("//")) return `https:${url}`;
  return `${SITE_URL}${url.startsWith("/") ? "" : "/"}${url}`;
}

/** OG image blocks with the standard 1200×630 share dimensions. */
export function ogImages(
  urls: Array<string | null | undefined>,
): Array<{ url: string; width: number; height: number }> {
  return urls
    .map(absoluteImageUrl)
    .filter((url): url is string => url !== null)
    .map((url) => ({ url, width: 1200, height: 630 }));
}

export interface StorefrontSocialOptions {
  title: string;
  description: string;
  canonical: string;
  siteName?: string | null;
  images?: Array<string | null | undefined>;
  publishedTime?: string | null;
  /** Open Graph type; defaults to "website". Use "article" for blog posts. */
  type?: "website" | "article";
}

/**
 * Shared open-graph + twitter scaffolding for storefront pages (locale,
 * site_name, summary_large_image card). Spread into the page's Metadata.
 */
export function storefrontSocialMetadata(
  options: StorefrontSocialOptions,
): Pick<Metadata, "openGraph" | "twitter"> {
  const images = ogImages(options.images ?? []);
  return {
    openGraph: {
      title: options.title,
      description: options.description,
      url: options.canonical,
      ...(options.siteName ? { siteName: options.siteName } : {}),
      locale: "mn_MN",
      type: options.type ?? "website",
      ...(options.publishedTime
        ? { publishedTime: options.publishedTime }
        : {}),
      ...(images.length ? { images } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: options.title,
      description: options.description,
      ...(images.length ? { images: images.map((image) => image.url) } : {}),
    },
  };
}
