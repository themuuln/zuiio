import type { NextConfig } from "next";

const cspHeaders = [
  {
    key: "Content-Security-Policy",
    value: "frame-ancestors *",
  },
];

const fontPreconnectHeader = {
  key: "Link",
  value: `<https://fonts.gstatic.com>; rel=preconnect; crossorigin`,
};

const nextConfig: NextConfig = {
  reactCompiler: true,
  experimental: {
    useTypeScriptCli: true,
    cacheComponents: true,
    cacheLife: {
      minutes: { stale: 60, revalidate: 300 },
      hours: { stale: 3600, revalidate: 3600 },
      days: { stale: 86400, revalidate: 86400 },
    },
    optimizePackageImports: [
      "lucide-react",
      "recharts",
      "date-fns",
      "@tanstack/react-query",
    ],
    turbopackFileSystemCacheForBuild: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
      {
        protocol: "https",
        hostname: "*.supabase.in",
      },
    ],
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 2678400,
  },
  async headers() {
    return [
      {
        source: "/embed/:path*",
        headers: cspHeaders,
      },
      {
        source: "/:path*",
        headers: [
          fontPreconnectHeader,
          {
            key: "Link",
            value: `<https://qlzoctvlbkkvspayjpxq.supabase.co>; rel=preconnect`,
          },
        ],
      },
    ];
  },
};

export default nextConfig;
