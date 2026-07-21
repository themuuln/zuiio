import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node", // No jsdom — these hit a real Postgres
    globals: true,
    include: ["src/**/*.integration.test.{ts,tsx}"],
    exclude: ["node_modules", ".next"],
    testTimeout: 30_000, // DB queries can be slow
    hookTimeout: 60_000,
    fileParallelism: false, // Integration tests share a DB — must run serially
    env: {
      INTEGRATION_DATABASE_URL:
        process.env.INTEGRATION_DATABASE_URL ||
        "postgresql://postgres:postgres@127.0.0.1:54322/postgres",
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
