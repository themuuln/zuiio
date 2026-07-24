import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  turbopack: {
    root: "../..",
  },
  experimental: {
    useTypeScriptCli: true,
  },
};

export default nextConfig;
