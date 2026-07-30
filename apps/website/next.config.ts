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
  experimental: {
    useTypeScriptCli: true,
    turbopackFileSystemCacheForBuild: true,
    turbopackLocalPostcssConfig: true,
  },
};

export default withNextIntl(nextConfig);
