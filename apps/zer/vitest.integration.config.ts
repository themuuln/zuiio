import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    pool: "forks",
    fileParallelism: false,
    globals: true,
    environment: "node",
    include: ["src/__integration__/**/*.{test,spec}.{ts,tsx}"],
    exclude: ["node_modules", ".next", "e2e"],
    testTimeout: 30_000,
    hookTimeout: 30_000,
    setupFiles: ["./vitest.integration.setup.ts"],
  },
});
