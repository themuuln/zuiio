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
          // Integration tests sign in against the local Supabase stack while
          // the full suite runs in parallel — 5s is too tight under load.
          testTimeout: 20_000,
          // RLS suites create orgs/users/branches in beforeAll — seeding can
          // exceed the default 10s hook window on a shared machine.
          hookTimeout: 60_000,
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
          // v8 coverage instrumentation slows jsdom + user-event suites ~2.5x.
          // Several form/drawer tests run 4-5s even at idle; the default 5s
          // boundary flakes the coverage gate under any machine load.
          testTimeout: 20_000,
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
        // Only genuinely untested code is excluded — dirs with passing tests
        // (hooks, email, cache) are measured so the gate is honest.
        "src/lib/offline/**",
        "src/lib/utils/email.ts",
        "src/lib/utils/pdf.ts",
      ],
      thresholds: {
        // Measured 2026-08-11 with exclusions narrowed: 75/67/67/76.
        // Buffer of ~5-6pts for normal drift on new code.
        statements: 70,
        branches: 60,
        functions: 60,
        lines: 70,
      },
    },
  },
});
