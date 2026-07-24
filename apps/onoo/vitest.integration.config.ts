import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/test/*.integration.test.ts"],
    testTimeout: 30_000,
    hookTimeout: 60_000,
    fileParallelism: false,
    pool: "forks",
  },
  resolve: {
    alias: {
      "@": "/src",
    },
  },
});
