import withPWAInit from "@ducanh2912/next-pwa";
import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin({
  requestConfig: "./src/lib/i18n/request.ts",
  experimental: {
    createMessagesDeclaration: "./src/messages/en.json",
  },
});

const nextConfig: NextConfig = {
  // @zuiio/* packages export raw .ts source — transpile them.
  transpilePackages: [
    "@zuiio/branding",
    "@zuiio/core",
    "@zuiio/hooks",
    "@zuiio/offline",
    "@zuiio/query",
    "@zuiio/realtime",
    "@zuiio/ui",
    "@zuiio/capture",
    "@zuiio/export",
    "@zuiio/config",
    "@zuiio/hr",
  ],

  // Allow Tailscale IP for phone testing from mobile devices
  allowedDevOrigins: [
    "100.102.22.106",
    "192.168.1.121",
    "192.168.1.126",
    "127.0.0.1",
    "localhost",
  ],

  // TypeScript validation is handled by `pnpm validate` before build.
  typescript: {
    ignoreBuildErrors: true,
  },
  reactCompiler: true,
  experimental: {
    // Use native Rust React Compiler instead of Babel — faster dev builds
    turbopackRustReactCompiler: true,
    // Next.js 16.3+ requires this for TypeScript 7.x compatibility
    useTypeScriptCli: true,
  },

  // ── Next.js 16.3: Instant Navigations ──────────────────────
  cacheComponents: true,

  // ── Cache lifetime profiles (used with 'use cache' directive) ──
  cacheLife: {
    fifteenMinutes: { revalidate: 900, stale: 3600, expire: 86400 },
    hourly: { revalidate: 3600, stale: 14400, expire: 86400 },
    daily: { revalidate: 86400, stale: 604800, expire: 2592000 },
  },

  serverExternalPackages: ["@zuiio/ai-agent"],

  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
  // ── Security Headers ──────────────────────────────────────────
  async headers() {
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' 'wasm-unsafe-eval' https://va.vercel-scripts.com https://vitals.vercel-insights.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://*.supabase.co https://lh3.googleusercontent.com",
      "font-src 'self' data:",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://vitals.vercel-insights.com https://o4507894414827520.ingest.us.sentry.io",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; ");

    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          { key: "Content-Security-Policy", value: csp },
        ],
      },
    ];
  },
};

const withPWA = withPWAInit({
  dest: "public",
  register: true,
  disable: process.env.NODE_ENV === "development",
});

export default withPWA(
  withSentryConfig(withNextIntl(nextConfig), {
    org: process.env.SENTRY_ORG,
    project: process.env.SENTRY_PROJECT,
    silent: true,
    widenClientFileUpload: false,
  }),
);
