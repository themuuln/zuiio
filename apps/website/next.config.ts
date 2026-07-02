import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	experimental: {
		turbopackFileSystemCacheForBuild: true,
		turbopackLocalPostcssConfig: true,
	},
};

export default nextConfig;
