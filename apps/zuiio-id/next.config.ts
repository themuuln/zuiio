import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  // typedRoutes: true,   /* enable once route type inference stabilizes */
  reactCompiler: true,
  experimental: {
    useTypeScriptCli: true,
    turbopackFileSystemCacheForBuild: true,
    optimizePackageImports: ["date-fns"],
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
