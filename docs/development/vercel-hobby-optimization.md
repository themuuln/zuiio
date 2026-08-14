# Vercel Hobby Tier — Optimization Guide

## Hobby Plan Limits (2026)

| Resource | Limit | Risk When Exceeded |
|---|---|---|
| **Function Invocations** | 1,000,000 / month | Pauses for 30 days |
| **Active CPU** | 4 CPU-hrs / month | Pauses for 30 days |
| **Provisioned Memory** | 360 GB-hrs / month | Pauses for 30 days |
| **Edge Requests** | 1,000,000 / month | Pauses for 30 days |
| **Image Transformations** | 5,000 / month | Images return 402 — show alt text |
| **Image Cache Reads** | 300,000 / month | Pauses for 30 days |
| **Image Cache Writes** | 100,000 / month | Pauses for 30 days |
| **Bandwidth** | 100 GB / month | Pauses for 30 days |
| **Builds** | 2 vCPU, 8 GB RAM | Slow but not strictly capped |
| **Function Duration** | 300s max | Fine for most cases |
| **Speed Insights** | 10,000 events / month | Pauses for 30 days |
| **Web Analytics** | 50,000 events / month | Pauses for 7 days |
| **Runtime Logs** | 1 hour retention | — |

> Single page load can trigger 3–10 invocations (page render + API routes + middleware + image optimization). At ~50K pageviews/month you're approaching the 1M invocation cap.

---

## 1. Middleware Optimization (Biggest Impact)

**Problem:** Middleware runs on EVERY request — including static assets, crawlers, API routes. Each run counts as an invocation and consumes Active CPU.

**Cookie Guard — skip auth checks for guests:**
```ts
// middleware.ts
export async function updateSession(request: NextRequest) {
  const response = NextResponse.next({ request });

  // Guard: skip auth refresh if no session cookies exist
  const hasAuthCookie = request.cookies.getAll().some((c) =>
    c.name.startsWith('sb-')
  );

  if (hasAuthCookie) {
    await refreshUserSession(request, response); // expensive
  }

  return response;
}
```

**Tighten matcher — exclude static assets & metadata:**
```ts
export const config = {
  matcher: [
    // Exclude _next/static, _next/image, favicon, robots, sitemap, all static files
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.*\\.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|css|js|woff2?|ttf|txt|xml|json)$).*)',
  ],
};
```

**If you have no middleware** — even better. Zer currently has **no middleware.ts**, which is already optimal for Hobby tier.

---

## 2. Rendering Strategy (Next Biggest Impact)

**Avoid `force-dynamic` on public pages.** Each `force-dynamic` page runs a Serverless Function on EVERY visit. Search engine crawlers and bots each count toward invocation limits.

**Instead use ISR (Incremental Static Regeneration):**
```ts
// ✅ Instead of: export const dynamic = 'force-dynamic'
export const revalidate = 60;   // regenerate in background every 60s
export const dynamicParams = true; // allow on-demand generation for new paths
```

**Balance revalidate intervals:**
| Content Type | `revalidate` |
|---|---|
| Dashboard / realtime metrics | 30–60s |
| Page content (static) | 300–600s |
| Reference data (categories, units) | 3600s (1 hr) |
| Marketing / public pages | 86400s (24 hr) |
| Sitemaps / metadata | 86400s (24 hr) |

**Zer already has this right:**
- `cacheComponents: true` enabled
- `cacheLife` profiles defined (`realtime`, `frequent`, `standard`, `reference`)
- No `force-dynamic` usage found
- `staleTimes: { dynamic: 30, static: 180 }` configured

**Unused `force-dynamic` discovered?** Run:
```bash
grep -r "force-dynamic" apps/*/src --include="*.ts" --include="*.tsx" -l
```

---

## 3. Image Optimization

**Current Zer config:** `images.unoptimized: true` — this is the nuclear option. It zeroes out image transformation usage but serves full-resolution images (higher bandwidth).

**Tradeoff:**
| Strategy | Transformations | Bandwidth | Best for |
|---|---|---|---|
| `unoptimized: true` (current) | 0/month | Higher | Apps with few images or icons |
| Vercel optimization (default) | 5,000/month limit | Lower | Image-heavy marketing pages |
| External CDN (Cloudinary, imgix) | 0/month | Lower | Image-heavy apps needing Vercel limits bypass |

**Hobby tier has only 5,000 image transformations/month.** If you need optimization, tighten the format/quality to stretch quota:

```ts
// next.config.ts — when NOT using unoptimized: true
images: {
  formats: ['image/webp'],      // drop AVIF — one format = fewer transforms
  deviceSizes: [640, 1080, 1920], // only sizes you actually use
  imageSizes: [16, 32, 64, 128],
  minimumCacheTTL: 86400,       // cache aggressively
}
```

**If you do have a few hero/product images, selectively optimize those only:**
```tsx
// Per-image override (on the ones that matter)
<Image src="/hero.jpg" width={1200} height={600} unoptimized={false} />
```

---

## 4. CDN Caching for API Routes

Public API routes that return data (not user-specific) should set cache headers. Vercel's CDN caches at the edge — zero function invocations on cache hits.

```ts
// API route — cache public data
export async function GET() {
  const data = await fetchPublicData();
  return Response.json(data, {
    headers: {
      'Cache-Control': 's-maxage=300, stale-while-revalidate=30',
    },
  });
}
```

**Server Actions** use POST and are not cacheable. If you have many Server Actions, consider batching or consolidating.

---

## 5. Partial Prerendering (PPR) with Cache Components

**Zer already has `cacheComponents: true`.** This enables PPR — the static HTML shell is served from CDN (zero invocations), only dynamic parts invoke functions.

**Optimize `cacheLife` for maximum CDN hits:**
```ts
// next.config.ts — fine-tune these
cacheLife: {
  realtime: { stale: 120, revalidate: 60, expire: 300 },    // ~20 reqs/hour/fetch
  frequent: { stale: 60, revalidate: 30, expire: 300 },     // ~30 reqs/hour
  standard: { stale: 300, revalidate: 60, expire: 600 },    // ~10 reqs/hour
  reference: { stale: 3600, revalidate: 600, expire: 7200 }, // ~1 req/hour
}
```

**Strategy:**
- Public pages → `"use cache"` with `cacheLife("standard")` or `cacheLife("reference")`
- Dynamic data per user → small Suspense boundary (not full page)
- Dashboard widgets → `cacheLife("frequent")` — still 97% CDN cache hit rate

**Never do this for public pages:**
```ts
// ❌ Drains invocation quota on every visit
export const dynamic = 'force-dynamic';
```

---

## 6. Bundle & Build Time Reduction

**Hobby tier builds:** 2 vCPU, 8 GB RAM. Slow builds burn no monetary cost but waste deployment slots (100 deploys/day).

**What Zer already does right:**
- `optimizePackageImports` for 5 packages ✓
- `turbopackFileSystemCacheForBuild: true` ✓
- `typescript.ignoreBuildErrors: true` (separate from `pnpm validate`) ✓
- `inlineCss: true` ✓

**Additional options:**
```ts
// next.config.ts — add if not present
experimental: {
  // ... existing
  webpackBuildWorker: true,          // parallelize webpack in build (if not using Turbopack in build)
  turbo: {
    resolveAlias: {                  // skip heavy deps in dev
      'react-dom/server': 'react-dom/server.browser',
    },
  },
}
```

**Reduce Sentry source map upload overhead (Hobby has no build minutes cap but slow builds waste deployment slots):**
```ts
// next.config.ts — sentry config
withSentryConfig(nextConfig, {
  // ... existing
  silent: process.env.CI !== 'true',         // only verbose in CI
  widenClientFileUpload: false,               // narrower uploads = faster build
  reactComponentAnnotation: { enabled: false }, // skip annotation
});
```

---

## 7. Remove Unnecessary Third-Party Scripts

Each third-party script (analytics, chat widgets, monitoring) can trigger additional function invocations or increase bandwidth.

| Service | Hobby Cost | Recommendation |
|---|---|---|
| Sentry | Free (5K events/mo limit) | Keep — Zer uses with `tunnelRoute` |
| FullStory / Hotjar | Bandwidth + invocations | Remove or limit to dev |
| Intercom / Chat | Bandwidth + function calls | Remove or lazy load |
| Google Analytics | Bandwidth only (GA4 free) | Fine, but use `gtag.js` not GTM |
| Facebook Pixel | Bandwidth only | Fine for marketing |

**Vercel Web Analytics** is included (50K events/mo) — prefer it over third-party if possible.

---

## 8. Monitoring Your Usage

**Check Hobby usage at any time:**
```bash
# Vercel CLI — current usage
v vercel billing

# Function logs (last 1 hour on Hobby)
v logs --project zer --level error --since 1h

# Usage dashboard (best view)
open https://vercel.com/zer-erp/~/usage
```

**Key metrics to watch:**
- **Function Invocations** — The #1 limit you'll hit. Track growth per deployment.
- **Active CPU** — Spikes when middleware or `force-dynamic` pages get crawled.
- **Image Transformations** — Only 5,000/month. `unoptimized: true` keeps this at 0.
- **Bandwidth** — 100 GB/month. Monitor if you serve large files or many images.

---

## 9. Quick Wins Checklist (Apply Now)

| Priority | Action | Impact |
|---|---|---|
| 🔴 | Check all apps for `force-dynamic` — replace with ISR | 50–80% invocation reduction |
| 🔴 | Add cookie guard to any middleware that does auth checks | 30–50% middleware invocation drop |
| 🔴 | Tighten middleware matcher to exclude static assets | 10–20% total invocation reduction |
| 🟡 | Add `Cache-Control: s-maxage=..., stale-while-revalidate=...` to public API routes | 50–90% API route invocations |
| 🟡 | Audit image strategy — keep `unoptimized: true` if image-light | 5K transforms/month quota safe |
| 🟡 | Review Cache Life profiles — maximize CDN cache for public pages | 30–70% page invocation reduction |
| 🟢 | Remove unused third-party scripts | Bandwidth savings |
| 🟢 | Monitor usage dashboard weekly | Catch limits before they hit |

---

## 10. App-by-App Assessment

### Zer ✅ (Already well-optimized)
- `cacheComponents: true` ✓ — PPR enabled
- `images.unoptimized: true` ✓ — no transform usage
- No middleware ✓ — zero middleware invocation overhead
- No `force-dynamic` ✓ — ISR/PPR friendly
- `cacheLife` profiles defined ✓
- Sentry with tunnel ✓

### Onoo / Tolom / Others — Check:
```bash
# 1. Check middleware exists
ls apps/onoo/src/middleware.ts apps/tolom/src/middleware.ts

# 2. Check force-dynamic usage
grep -rn "force-dynamic" apps/onoo/src apps/tolom/src

# 3. Check cacheComponents in next.config
grep "cacheComponents" apps/*/next.config.ts

# 4. Check images config
grep "unoptimized" apps/*/next.config.ts
```

---

## When to Upgrade to Pro

| Symptom | Signals you need Pro |
|---|---|
| Function invocations > 800K/month for 2+ months | Upgrade |
| Need > 5,000 image transformations/month | Upgrade or use external CDN |
| Need > 100 GB bandwidth/month | Upgrade |
| Need longer than 1-hour log retention | Upgrade |
| Commercial use (business app) | Upgrade required by ToS |
| Need team collaboration features | Upgrade |
