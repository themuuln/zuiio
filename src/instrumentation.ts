import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    process.setMaxListeners?.(20);
    await import("../sentry.server.config");

    // Setup process-wide error handlers (Node.js only).
    // Dynamic imports prevent Edge bundler warnings for node:path/pino.
    const path = await import("node:path");
    const pino = (await import("pino")).default;

    const errorLogPath = path.resolve(process.cwd(), "logs", "error.log");

    const processLogger = pino(
      { level: "error" },
      pino.transport({
        targets: [
          {
            target: "pino/file",
            level: "error",
            options: { destination: errorLogPath, mkdir: true },
          },
          ...(process.env.NODE_ENV === "production"
            ? [{ target: "pino/file", level: "error" }]
            : [
                {
                  target: "pino-pretty",
                  level: "error",
                  options: {
                    colorize: true,
                    translateTime: "HH:MM:ss",
                    ignore: "pid,hostname",
                    singleLine: true,
                  },
                },
              ]),
        ],
      }),
    );

    function handleProcessError(type: string, reason: unknown): void {
      processLogger.error({ err: reason }, `Process ${type}`);
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
