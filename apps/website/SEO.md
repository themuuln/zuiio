# SEO — zuiio.com
Next.js 16 + next-intl. `mn` default (no prefix), `en` at `/en/`. Base: `https://zuiio.com`.
## 1. Metadata & hreflang

Root layout has `metadataBase`, `title.template`, `openGraph`. Each page has `generateMetadata`. Add per-page:

```ts
alternates: { canonical: "/privacy", languages: { mn: "/privacy", en: "/en/privacy" } },
openGraph: { locale: resolvedLocale === "mn" ? "mn_MN" : "en_US" },
```

Legal pages (privacy, terms, data-deletion) must set `robots: { index: true, follow: true }` explicitly.

## 2. Open Graph Images

Place `app/opengraph-image.png` (1200×630) at root. For dynamic per-page images, use `next/og` `ImageResponse` in an `opengraph-image.tsx` file convention.

## 3. Sitemap

Create `app/sitemap.ts` listing both locales per route:

```ts
import type { MetadataRoute } from "next";
const base = "https://zuiio.com";
const routes = ["", "/about", "/pricing", "/products", "/blog", "/privacy", "/terms", "/data-deletion"];
export default function sitemap(): MetadataRoute.Sitemap {
  return routes.flatMap((p) => [
    { url: `${base}${p}`, lastModified: new Date(), changeFrequency: "monthly", priority: p === "" ? 1 : 0.7 },
    { url: `${base}/en${p}`, lastModified: new Date(), changeFrequency: "monthly", priority: p === "" ? 1 : 0.7 },
  ]);
}
```

## 4. Robots

Create `app/robots.ts`. Allow search + AI citation bots, block Bytespider:

```ts
import type { MetadataRoute } from "next";
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "Bytespider", disallow: "/" }, { userAgent: "*", allow: "/" }],
    sitemap: "https://zuiio.com/sitemap.xml",
  };
}
```

## 5. Structured Data (JSON-LD)

Add `Organization` schema (`name: "Zuiio"`, `url`, `logo`) in root layout via `<script type="application/ld+json">`. Add `WebPage` schema (with `datePublished`, `publisher`) inline in each legal page component.

## 6. Developer Verification

Add to root layout's `metadata.other`: `"apple-domain-verification": "<TOKEN>"` and `"facebook-domain-verification": "<TOKEN>"`.

## 7. Mongolian SEO

- `<html lang="mn">` ✓ — `hreflang` alternates on every page (§1) ensure correct locale serving.
- Submit sitemap to Google Search Console with `mn` as default language.
- `openGraph.locale: "mn_MN"` on mn pages. Keyword-rich descriptions in `mn.json`.
