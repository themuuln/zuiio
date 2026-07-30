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
  allowedDevOrigins: ["192.168.1.126", "m5.local"],
  cacheComponents: true,
  reactCompiler: true,
  cacheLife: {
    realtime: { stale: 120, revalidate: 60, expire: 300 },
    frequent: { stale: 60, revalidate: 30, expire: 300 },
    standard: { stale: 300, revalidate: 60, expire: 600 },
    reference: { stale: 3600, revalidate: 600, expire: 7200 },
  },
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
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
    // Single format to stay within Hobby tier's 5K image transformations/month
    formats: ["image/webp"],
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
