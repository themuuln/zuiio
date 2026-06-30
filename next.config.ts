import withPWAInit from "@ducanh2912/next-pwa";
import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/lib/i18n/request.ts");

const nextConfig: NextConfig = {
  // Allow Tailscale IP for phone testing from mobile devices
  allowedDevOrigins: ["100.102.22.106", "192.168.1.121"],

  // TypeScript validation is handled by `pnpm validate` before build.
  // Enable build-time type checking to catch issues that slip through.
  typescript: {
    ignoreBuildErrors: false,
  },
  reactCompiler: true,

  // ── Next.js 16.3: Instant Navigations ──────────────────────
  cacheComponents: true,
  partialPrefetching: true,

  // Point Turbopack at this project's root so it doesn't get confused
  // by the parent monorepo (zuiio/) having its own pnpm-workspace.yaml.
  turbopack: {
    root: process.cwd(),
  },

  serverExternalPackages: ["playwright-core"],

  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  experimental: {
    optimizePackageImports: ["lucide-react", "@tanstack/react-table"],
    // Turbopack: persistent cache for faster successive builds
    turbopackFileSystemCacheForBuild: true,
    // Experimental Rust React Compiler (faster than Babel variant)
    turbopackRustReactCompiler: true,
  },

  // ── Security Headers ──────────────────────────────────────────
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value:
              "camera=(), microphone=(), geolocation=(), interest-cohort=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload",
          },
        ],
      },
      {
        source: "/dashboard/:path*",
        headers: [
          {
            key: "X-Robots-Tag",
            value: "noindex, nofollow",
          },
        ],
      },
    ];
  },
};

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  scope: "/",
  sw: "sw.js",
  cacheOnFrontEndNav: true,
  cacheStartUrl: true,
  reloadOnOnline: true,
  fallbacks: {
    document: "/offline",
    image: "/icon-512.png",
  },
  workboxOptions: {
    runtimeCaching: [
      {
        urlPattern: /^https?.*\/api\/(?!auth|trpc).*/,
        handler: "NetworkFirst",
        options: {
          cacheName: "api-cache",
          expiration: {
            maxEntries: 100,
            maxAgeSeconds: 60 * 60 * 24, // 24 hours
          },
          networkTimeoutSeconds: 5,
        },
      },
      {
        urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|avif|ico)$/,
        handler: "CacheFirst",
        options: {
          cacheName: "image-cache",
          expiration: {
            maxEntries: 200,
            maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
          },
        },
      },
      {
        urlPattern: /\.(?:woff|woff2|ttf|eot)$/,
        handler: "CacheFirst",
        options: {
          cacheName: "font-cache",
          expiration: {
            maxEntries: 50,
            maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
          },
        },
      },
    ],
  },
});

export default withPWA(
  withSentryConfig(withNextIntl(nextConfig), {
    // For all available options, see:
    // https://www.npmjs.com/package/@sentry/webpack-plugin#options

    org: "themuuln",

    project: "javascript-nextjs",

    // Only print logs for uploading source maps in CI
    silent: !process.env.CI,

    // For all available options, see:
    // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

    // Upload a larger set of source maps for prettier stack traces (increases build time)
    widenClientFileUpload: true,

    webpack: {
      // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
      // See the following for more information:
      // https://docs.sentry.io/product/crons/
      // https://vercel.com/docs/cron-jobs
      automaticVercelMonitors: true,

      // Tree-shaking options for reducing bundle size
      treeshake: {
        // Automatically tree-shake Sentry logger statements to reduce bundle size
        removeDebugLogging: true,
      },
    },
  }),
);
