import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup-tests.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    css: true,
    coverage: {
      provider: "v8",
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/test/**",
        "src/**/*.test.*",
        "src/**/*.spec.*",
        "src/lib/database.types.ts",
        "src/**/*.d.ts",
      ],
      thresholds: {
        statements: 40,
        branches: 30,
        functions: 50,
        lines: 40,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@zuiio/core": path.resolve(__dirname, "./src/lib/zuiio/core.ts"),
      "@zuiio/hooks": path.resolve(__dirname, "./src/lib/zuiio/hooks.ts"),
      "@zuiio/query": path.resolve(__dirname, "./src/lib/zuiio/query.ts"),
    },
  },
});
