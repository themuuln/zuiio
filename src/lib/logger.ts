/**
 * Structured server-side logger using pino.
 *
 * Provides request-scoped logging with context serialization.
 * Automatically picks the right transport based on NODE_ENV.
 */

import pino from "pino";

const isProduction = process.env.NODE_ENV === "production";
const isEdge = process.env.NEXT_RUNTIME === "edge";

/**
 * The singleton pino logger instance.
 *
 * In development: pretty-prints to stdout with color-coded levels.
 * In production: JSON-structured to stdout (compatible with Vercel/Logtail/Logflare).
 * On Edge Runtime: uses a simple browser-compatible transport.
 */
export const logger = pino({
  level: process.env.LOG_LEVEL ?? (isProduction ? "info" : "debug"),
  ...(isEdge
    ? {
        browser: {
          // Edge runtime uses a simpler serialization path
          asObject: true,
          serialize: true,
        },
      }
    : {}),
  ...(isProduction
    ? {}
    : {
        transport: {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "HH:MM:ss",
            ignore: "pid,hostname",
            singleLine: true,
          },
        },
      }),
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      "body.password",
      "body.token",
      "body.secret",
    ],
    censor: "[REDACTED]",
  },
  serializers: {
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res,
    err: pino.stdSerializers.err,
  },
});

/**
 * Create a child logger with bound context.
 *
 * Usage:
 *   const log = logger.child({ service: "customer-import" });
 *   log.info({ rows: 150 }, "import complete");
 */
export function createLogger(context: Record<string, unknown>) {
  return logger.child(context);
}
