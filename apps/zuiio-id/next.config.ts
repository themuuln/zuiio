import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // typedRoutes: true,   /* enable once route type inference stabilizes */
  reactCompiler: true,
  experimental: {
    turbopackFileSystemCacheForBuild: true,
    turbopackRustReactCompiler: true,
    optimizePackageImports: [
      "@phosphor-icons/react",
      "@tanstack/react-query",
      "date-fns",
      "lucide-react",
    ],
  },
  allowedDevOrigins: ["127.0.0.1"],
  images: {
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
