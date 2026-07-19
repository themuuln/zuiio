import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  cacheComponents: true,
  experimental: {
    optimizePackageImports: ["lucide-react"],
    turbopackFileSystemCacheForBuild: true,
  },
};

export default nextConfig;
