import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.1.126", "m5.local"],
  cacheComponents: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
    unoptimized: true,
  },
  reactCompiler: true,
  // TypeScript validation is handled by `pnpm validate` before build.
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    useTypeScriptCli: true,
    inlineCss: true,
    staleTimes: {
      dynamic: 30,
      static: 180,
    },
    optimizePackageImports: [
      "@phosphor-icons/react",
      "lucide-react",
      "recharts",
      "date-fns",
      "cmdk",
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
        source: "/(.*?)",
        headers: [
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
      {
        source: "/embed(.*?)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
        ],
      },
      {
        source: "/monitoring",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
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
    // Hidden source maps are used for Sentry source maps upload
    // biome-ignore lint/style/noNonNullAssertion: this is next config
    hiddenSourceMap: !process.env.SENTRY_UPLOAD === true,
  },
});
