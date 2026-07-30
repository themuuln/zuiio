import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
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
    optimizePackageImports: ["date-fns"],
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
