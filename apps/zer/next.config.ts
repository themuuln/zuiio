import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["*"],
  cacheComponents: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "hitec.pl" },
      { protocol: "https", hostname: "*.supabase.co" },
    ],
  },
  reactCompiler: process.env.NODE_ENV === "development",
  experimental: {
    inlineCss: true,
    staleTimes: {
      dynamic: 30,
      static: 300,
    },
    optimizePackageImports: [
      "@phosphor-icons/react",
      "@tanstack/react-query",
      "date-fns",
      "lucide-react",
    ],
    turbopackFileSystemCacheForBuild: true,
    viewTransition: true,
  },
  cacheLife: {
    realtime: { stale: 120, revalidate: 60, expire: 300 },
    frequent: { stale: 60, revalidate: 30, expire: 300 },
    standard: { stale: 300, revalidate: 60, expire: 600 },
    reference: { stale: 3600, revalidate: 600, expire: 7200 },
  },
  transpilePackages: [],
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
      {
        source: "/sw.js",
        headers: [
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
        ],
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  org: "zer-erp",
  project: "javascript-nextjs",

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // Upload a larger set of source maps for prettier stack traces
  widenClientFileUpload: true,

  // Bypass ad-blockers by proxying Sentry events through a Next.js route
  tunnelRoute: "/monitoring",

  webpack: {
    // Enables automatic instrumentation of Vercel Cron Monitors
    automaticVercelMonitors: true,

    // Tree-shaking Sentry logger statements to reduce bundle size
    treeshake: {
      removeDebugLogging: true,
    },
  },
});
