import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		environment: "node",
		globals: true,
		setupFiles: ["./vitest.setup.ts"],
		include: ["tests/**/*.test.ts"],
		exclude: ["node_modules", ".next"],
		coverage: {
			provider: "v8",
			reporter: ["text", "json", "html"],
			include: ["src/**/*.ts"],
			exclude: ["src/**/*.d.ts", "src/**/*.test.ts", "src/**/__tests__/**"],
			thresholds: {
				lines: 60,
				functions: 60,
				statements: 60,
				branches: 40,
			},
		},
		testTimeout: 30_000,
		hookTimeout: 30_000,
	},
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src"),
		},
	},
});
