import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    useTypeScriptCli: true,
    // Disable Turbopack persistent build cache — known task_cache deadlock
    // (vercel/next.js #92210, #93880) hangs `next build` on Node 24/16.3.0.
    turbopackFileSystemCacheForBuild: false,
  },
};

export default withNextIntl(nextConfig);
