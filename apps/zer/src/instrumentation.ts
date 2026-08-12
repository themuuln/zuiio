import { setMaxListeners } from "node:events";
import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Next 16.3.0 attaches ~11 close listeners to each per-request
    // ServerResponse (internals + middleware + instrumentation); the count
    // resets per request and is not a leak (vercel/next.js discussion
    // #96973). Raise the per-instance default so dev logs stay quiet —
    // process.setMaxListeners() only covers the process emitter, not
    // ServerResponse instances.
    setMaxListeners(20);

    // ── Patch console.error to suppress EPIPE storms ────────────
    // Next.js DevTools' console interceptor can create an infinite
    // error loop when the stdout pipe breaks (EPIPE). This suppresses
    // the loop by filtering EPIPE errors.
    const origConsoleError = console.error.bind(console);
    console.error = (...args: unknown[]) => {
      if (
        args.length === 1 &&
        args[0] instanceof Error &&
        (args[0] as Error).message?.includes?.("write EPIPE")
      ) {
        return;
      }
      origConsoleError(...args);
    };

    // Sentry.init for the Node runtime. The SDK no longer auto-loads
    // sentry.server.config.ts (webpack entry injection was removed in
    // SDK v10; Turbopack never supported it) — dispatch is required.
    await import("../sentry.server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    // Sentry.init for the Edge runtime (middleware, edge routes).
    await import("../sentry.edge.config");
  }
}

export const onRequestError = Sentry.captureRequestError;
