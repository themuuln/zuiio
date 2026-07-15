import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // cacheComponents: true,
  partialPrefetching: true,
  // typedRoutes: true,   /* enable once route type inference stabilizes */
  reactCompiler: true,
  experimental: {
    turbopackFileSystemCacheForBuild: true,
    turbopackRustReactCompiler: true,
  },
  allowedDevOrigins: ["127.0.0.1"],
};

export default nextConfig;
