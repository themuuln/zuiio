import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	serverExternalPackages: ["@zuiio/ai-agent"],
	experimental: {
		useTypeScriptCli: true,
	},
};

export default nextConfig;
