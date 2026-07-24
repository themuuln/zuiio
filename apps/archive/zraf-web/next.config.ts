import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  experimental: {
    useTypeScriptCli: true,
    turbopackFileSystemCacheForBuild: true,
  },
};

export default nextConfig;
