import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ protocol: "https", hostname: "hitec.pl" }],
  },
  reactCompiler: true,
  cacheComponents: true,
  partialPrefetching: true,
  transpilePackages: [
    "@zer/branding",
    "@zer/export",
    "@zer/i18n",
    "@zer/supabase",
  ],
  experimental: {
    viewTransition: true,
    turbopackFileSystemCacheForBuild: true,
    turbopackRustReactCompiler: true,
  },
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

export default nextConfig;
