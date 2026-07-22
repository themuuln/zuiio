import type { NextConfig } from "next";

const cspHeaders = [
  {
    key: "Content-Security-Policy",
    value: "frame-ancestors *",
  },
];

const nextConfig: NextConfig = {
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
  async headers() {
    return [
      {
        source: "/embed/:path*",
        headers: cspHeaders,
      },
    ];
  },
};

export default nextConfig;
