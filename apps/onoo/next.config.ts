import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  cacheComponents: true,
  experimental: {
    useTypeScriptCli: true,
    optimizePackageImports: [
      "lucide-react",
      "recharts",
      "date-fns",
      "@tanstack/react-query",
    ],
    turbopackFileSystemCacheForBuild: true,
  },
};

export default nextConfig;
