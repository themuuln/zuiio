import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "hitec.pl" },
      { protocol: "https", hostname: "*.supabase.co" },
    ],
  },
  reactCompiler: true,
  experimental: {
    inlineCss: true,
    staleTimes: {
      dynamic: 30,
      static: 300,
    },
    optimizePackageImports: ["@phosphor-icons/react"],
  },
  transpilePackages: [
    "@zer/branding",
    "@zer/export",
    "@zer/i18n",
    "@zer/supabase",
  ],
  async headers() {
    return [
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
  org: process.env.SENTRY_ORG || "themuuln",
  project: process.env.SENTRY_PROJECT || "javascript-nextjs",

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // Upload a larger set of source maps for prettier stack traces
  widenClientFileUpload: true,

  webpack: {
    // Enables automatic instrumentation of Vercel Cron Monitors
    automaticVercelMonitors: true,

    // Tree-shaking Sentry logger statements to reduce bundle size
    treeshake: {
      removeDebugLogging: true,
    },
  },
});
