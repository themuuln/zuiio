import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    process.setMaxListeners?.(20);
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
