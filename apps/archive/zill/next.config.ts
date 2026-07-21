import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    useTypeScriptCli: true,
    turbopackFileSystemCacheForBuild: true,
  },
};

export default nextConfig;
