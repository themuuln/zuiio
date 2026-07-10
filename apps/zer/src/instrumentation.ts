import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    process.setMaxListeners?.(20);

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
  }
  // sentry.server.config.ts and sentry.edge.config.ts at the project root
  // are auto-loaded by the Sentry webpack plugin — no manual dispatch needed.
}

export const onRequestError = Sentry.captureRequestError;
