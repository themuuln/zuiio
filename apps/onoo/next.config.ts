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
  reactCompiler: true,
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
