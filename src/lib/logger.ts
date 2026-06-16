/**
 * Structured server-side logger using pino.
 *
 * Provides request-scoped logging with context serialization.
 * Automatically picks the right transport based on NODE_ENV.
 *
 * In all non-Edge server environments, error-level logs are persisted to
 * logs/error.log so agents can discover recent errors without
 * searching through full output.
 *
 * Browser safety: this module is also imported by client components
 * (via sentry-report-server → bay-drag-handlers). pino.transport()
 * only exists in the Node.js pino entry — browser bundles skip it.
 */

import path from "node:path";
import pino from "pino";

const isProduction = process.env.NODE_ENV === "production";
const isEdge = process.env.NEXT_RUNTIME === "edge";
const rootLevel = process.env.LOG_LEVEL ?? (isProduction ? "info" : "debug");

// pino.transport only exists on the server entry of pino.
// In browser bundles (pino/browser.js), it's a plain function without .transport.
const hasServerTransport = typeof pino.transport === "function";

/**
 * Error-level file transport destination.
 * Empty string when running on client/Edge — no file transport available.
 * Shared so other modules can write to the same file.
 */
export const ERROR_LOG_PATH =
  hasServerTransport && !isEdge
    ? (() => {
        try {
          return path.resolve(process.cwd(), "logs", "error.log");
        } catch {
          return "";
        }
      })()
    : "";

/**
 * Build the transport pipeline.
 *
 * Browser / Edge runtime → no transport (browser serialization in pinoOptions).
 * Server (production)    → JSON stdout + error file.
 * Server (development)   → pino-pretty stdout + error file.
 */
let transport: ReturnType<typeof pino.transport> | undefined;

if (hasServerTransport && !isEdge) {
  const targets: pino.TransportTargetOptions[] = [];

  // Persist error+ logs to a file so agents can discover recent errors
  // without scanning the full output stream.
  targets.push({
    target: "pino/file",
    level: "error",
    options: {
      destination: ERROR_LOG_PATH,
      mkdir: true,
    },
  });

  // Primary stdout output
  if (isProduction) {
    targets.push({ target: "pino/file", level: rootLevel });
  } else {
    targets.push({
      target: "pino-pretty",
      level: rootLevel,
      options: {
        colorize: true,
        translateTime: "HH:MM:ss",
        ignore: "pid,hostname",
        singleLine: true,
      },
    });
  }

  transport = pino.transport({ targets });
}

const pinoOptions: pino.LoggerOptions = {
  level: rootLevel,
  ...(isEdge
    ? {
        browser: {
          // Edge runtime uses a simpler serialization path
          asObject: true,
          serialize: true,
        },
      }
    : {}),
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
};

/**
 * The singleton pino logger instance.
 *
 * On the server: uses multi-transport (stdout + error file).
 * On client/Edge: uses browser-compatible pino (no transport).
 */
export const logger = pino(pinoOptions, transport);

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
