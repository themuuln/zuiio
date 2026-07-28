import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@zuiio/core": path.resolve(__dirname, "./src/lib/zuiio/core.ts"),
      "@zuiio/hooks": path.resolve(__dirname, "./src/lib/zuiio/hooks.ts"),
      "@zuiio/query": path.resolve(__dirname, "./src/lib/zuiio/query.ts"),
    },
  },
  test: {
    globals: true,
    // ── Two projects: Node (fast) for pure TS, jsdom for React/component tests
    projects: [
      {
        resolve: {
          alias: {
            "@": path.resolve(__dirname, "./src"),
            "@zuiio/core": path.resolve(__dirname, "./src/lib/zuiio/core.ts"),
            "@zuiio/hooks": path.resolve(__dirname, "./src/lib/zuiio/hooks.ts"),
            "@zuiio/query": path.resolve(__dirname, "./src/lib/zuiio/query.ts"),
          },
        },
        test: {
          name: "node",
          environment: "node",
          include: ["src/**/*.test.ts"],
          exclude: ["src/**/*.test.tsx"],
          globals: true,
          css: false,
          setupFiles: ["./src/test/setup-node.ts"],
          unstubEnvs: true,
        },
      },
      {
        resolve: {
          alias: {
            "@": path.resolve(__dirname, "./src"),
            "@zuiio/core": path.resolve(__dirname, "./src/lib/zuiio/core.ts"),
            "@zuiio/hooks": path.resolve(__dirname, "./src/lib/zuiio/hooks.ts"),
            "@zuiio/query": path.resolve(__dirname, "./src/lib/zuiio/query.ts"),
          },
        },
        test: {
          name: "dom",
          environment: "jsdom",
          include: ["src/**/*.test.tsx"],
          globals: true,
          css: true,
          setupFiles: ["./src/test/setup-tests.ts"],
        },
      },
    ],
    coverage: {
      provider: "v8",
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/test/**",
        "src/**/*.test.*",
        "src/**/*.spec.*",
        "src/lib/database.types.ts",
        "src/**/*.d.ts",
        "src/hooks/**",
        "src/lib/hooks/**",
        "src/lib/offline/**",
        "src/lib/email/**",
        "src/lib/cache/**",
        "src/lib/utils/email.ts",
        "src/lib/utils/pdf.ts",
      ],
      thresholds: {
        statements: 37,
        branches: 30,
        functions: 30,
        lines: 38,
      },
    },
  },
});
