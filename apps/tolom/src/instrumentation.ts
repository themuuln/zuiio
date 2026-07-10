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
    await import("../sentry.server.config");

    // Use the existing logger singleton to avoid duplicating pino/file
    // WriteStreams, which caused MaxListenersExceededWarning.
    const { logger } = await import("./lib/logger");

    function handleProcessError(type: string, reason: unknown): void {
      logger.error({ err: reason }, `Process ${type}`);
      Sentry.withScope((scope) => {
        scope.setTag("source", "process");
        scope.setExtra("type", type);
        if (reason instanceof Error) {
          Sentry.captureException(reason);
        } else {
          Sentry.captureMessage(`Process ${type}: ${String(reason)}`, "fatal");
        }
      });
    }

    process.on("unhandledRejection", (reason) => {
      handleProcessError("unhandledRejection", reason);
    });

    process.on("uncaughtException", (error) => {
      // ECONNRESET / "aborted" is an expected HTTP lifecycle event:
      // the client disconnects mid-flight (e.g. navigating away from a
      // slow page). It is NOT a real crash — suppress it.
      if (
        error instanceof Error &&
        (error.code === "ECONNRESET" || error.message === "aborted")
      ) {
        return;
      }
      handleProcessError("uncaughtException", error);
      // Give Sentry a tick to flush, then let the process exit naturally.
      setImmediate(() => process.exit(1));
    });
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("../sentry.edge.config");
  }
}

export const onRequestError = Sentry.captureRequestError;
