import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  // One reusable App Shell per route, cached per session on the client —
  // auth-page navigation (login ↔ signup ↔ forgot-password) is instant.
  // Requires cacheComponents. PPR safety contract: prerender-safe public
  // client + cookies() fallback shipped in src/lib/supabase/.
  partialPrefetching: true,
  // typedRoutes: true,   /* enable once route type inference stabilizes */
  reactCompiler: true,
  cacheLife: {
    realtime: { stale: 120, revalidate: 60, expire: 300 },
    frequent: { stale: 60, revalidate: 30, expire: 300 },
    standard: { stale: 300, revalidate: 60, expire: 600 },
    reference: { stale: 3600, revalidate: 600, expire: 7200 },
  },
  experimental: {
    useTypeScriptCli: true,
    turbopackFileSystemCacheForBuild: true,
    // Client-side cache: repeated navigations and back/forward are instant.
    staleTimes: {
      dynamic: 30,
      static: 180,
    },
    // Inline imported CSS into HTML — no render-blocking CSS request on first load.
    inlineCss: true,
    // Barrel packages: rewrite named imports to direct subpath imports.
    optimizePackageImports: ["lucide-react"],
  },
  allowedDevOrigins: ["127.0.0.1"],
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "zer.zuiiotech.com",
      },
      {
        protocol: "https",
        hostname: "tolom.zuiiotech.com",
      },
    ],
  },
};

export default nextConfig;
