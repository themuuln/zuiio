# zuiio — Web Stack (Next.js)

Essential Next.js 16.3 features, patterns, and first-party Skills for all zuiio Next.js projects.

> Based on the Next.js 16.3 release series: Instant Navigations, AI Improvements, and Turbopack.

---

## Core Config (next.config.ts)

```ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Enable Cache Components — dynamic by default, no hidden caching.
  // Required for Instant Navigations. Will become default in a future major.
  cacheComponents: true,

  // Prefetch a reusable loading shell per route instead of per link.
  // Dramatically reduces prefetch requests. Will become default in a future major.
  partialPrefetching: true,

  experimental: {
    // Persist Turbopack cache to disk for faster `next build` (CI-friendly)
    turbopackFileSystemCacheForBuild: true,

    // Use Rust-native React Compiler instead of Babel (20-50% faster compilation)
    // Requires reactCompiler: true
    turbopackRustReactCompiler: true,

    // Resolve PostCSS config closest to each CSS file (monorepo-friendly)
    turbopackLocalPostcssConfig: true,
  },
};

export default nextConfig;
```

---

## Instant Navigations

Three patterns for making navigations feel SPA-fast:

| Pattern | Mechanism | Use Case |
|---------|-----------|----------|
| **Stream** | `<Suspense>` boundary | Data that can show a loading state first, then resolve |
| **Cache** | `'use cache'` directive | Data that can be cached and reused between requests |
| **Block** | `export const instant = false` | Routes that should always wait for the full server response |

### Per-link prefetching

By default, Next.js prefetches one reusable shell per route. Opt into deeper per-link prefetching:

```tsx
<Link prefetch={true}> {/* prefetches more content down to sync or 'use cache' */}
```

For request-time cached content beyond build time:

```ts
export const prefetch = 'allow-runtime';
```

### Testing instant routes

```ts
import { expect, test } from '@playwright/test';
import { instant } from '@next/playwright';

test('navigation is instant', async ({ page }) => {
  await page.goto('/products/shoes');
  await instant(page, async () => {
    await page.click('a[href="/products/hats"]');
    await expect(page.locator('h1')).toContainText('Baseball Cap');
  });
});
```

### DevTools

- **Navigation Inspector** — pause navigations at the shell to see what prefetches per route
- **Instant Insights** — surfaces slow navigations as actionable errors with fix prompts

---

## First-Party Skills

Official Vercel Skills for agent-driven development workflows. Install with `npx skills add`.

### next-dev-loop

Full development feedback loop for coding agents. Drives the browser, reads console, follows network requests, inspects React tree.

```
npx skills add vercel/next.js --skill next-dev-loop
```

Requires `agent-browser@^0.27` (`npm install -g agent-browser@^0.27`).

### next-cache-components-adoption

Walks through enabling Cache Components and adopting routes one feature at a time. Two modes:

- **Incremental** — single mechanical PR opting all routes out, ship features in follow-ups
- **Direct** — adopt every route in place on one branch

```
npx skills add vercel/next.js --skill next-cache-components-adoption
```

### next-cache-components-optimizer

Optimizes a Cache Components route for instant navigation by growing the static shell. Runs an observe-fix-iterate loop with before/after screenshots.

```
npx skills add vercel/next.js --skill next-cache-components-optimizer
```

Two modes:

- **Page-render** — increase how much of a single page renders statically
- **Nav** — ensure navigations between pages are instant

---

## Turbopack Highlights

### Memory & Performance

- Dev server memory usage reduced by up to **90%** (memory eviction on by default)
- Persistent file system cache for `next build` — 1.4x to 5.5x faster builds
- Smaller runtime — only ships code for features actually used (WASM, workers, top-level async)
- HMR cold start reduced by 15%+ (consolidated chunk subscriptions)

### Rust React Compiler

Experimental native Rust port of the React Compiler. 20-50% compilation wins over the Babel version.

```ts
const nextConfig = {
  reactCompiler: true,
  experimental: {
    turbopackRustReactCompiler: true,
  },
};
```

### import.meta.glob

Vite-compatible glob imports, powered by Turbopack's file watcher. Recompiles on file add/remove.

```ts
const posts = import.meta.glob('./posts/*.mdx');
// Eager variant:
const posts = import.meta.glob('./posts/*.mdx', { eager: true });
```

Supports named imports, multiple patterns, negative patterns, query strings, and generated TypeScript types. Only works with Turbopack (not `--webpack`).

### Local PostCSS Config

Resolve PostCSS config closest to each CSS file (not just project root). Monorepo-friendly.

```ts
experimental: {
  turbopackLocalPostcssConfig: true,
};
```

---

## Agent & AI Tooling

### Bundled Docs (AGENTS.md)

`next dev` automatically inserts agent rules into `AGENTS.md` pointing to version-matched docs in `node_modules/next/dist/docs/`. Opt out with `agentRules: false` in config.

### Error Pages as Markdown

Append `.md` to any `nextjs.org/docs` URL for plain Markdown. Full index at `/docs/llms.txt`.

### DevTools MCP Server

Add `next-devtools-mcp` to `.mcp.json` for compilation tools:

- `get_compilation_issues` — check the whole project from the dev server
- `compile_route` — compile a single route (faster than `next build`)

### Actionable Errors

Errors in dev overlay and terminal show labeled fixes (Stream / Cache / Block) with a **Copy as prompt** button for agents. Each error links to a per-rule docs page with Patterns, Trade-offs, and Gotchas.
