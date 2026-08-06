import path from "node:path";
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./lib/i18n/request.ts");

const nextConfig: NextConfig = {
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
  reactCompiler: true,
  images: {
    unoptimized: true,
  },
  turbopack: {
    // Monorepo: Next.js is hoisted to the pnpm workspace root (pnpm-workspace.yaml).
    // Without an explicit root, Turbopack treats apps/website as the filesystem root
    // and cannot resolve next/package.json from the hoisted .pnpm store.
    root: path.join(__dirname, "../.."),
  },
  experimental: {
    useTypeScriptCli: true,
    turbopackFileSystemCacheForBuild: true,
    turbopackLocalPostcssConfig: true,
  },
};

export default withNextIntl(nextConfig);
