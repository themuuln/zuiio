/**
 * Minimal structured logger — replaces pino.
 *
 * Production: JSON to stdout (Vercel captures this natively).
 * Development: formatted text to stdout.
 * No worker threads, no external transports, no build fragility.
 */

const isProduction = process.env.NODE_ENV === "production";

/** Fields to redact from structured output. */
const REDACTED_FIELDS: Record<string, true> = {
  authorization: true,
  cookie: true,
  password: true,
  token: true,
  secret: true,
};

function redactValue(value: unknown): unknown {
  if (typeof value !== "object" || value === null) return value;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    out[k] = REDACTED_FIELDS[k] ? "[REDACTED]" : v;
  }
  return out;
}

function formatMessage(
  level: string,
  context: Record<string, unknown> | undefined,
  message: string,
): string {
  if (isProduction) {
    // Structured JSON — Vercel runtime logs parse this
    const entry: Record<string, unknown> = {
      level,
      time: new Date().toISOString(),
      msg: message,
    };
    if (context && Object.keys(context).length > 0) {
      Object.assign(entry, redactValue(context));
    }
    return JSON.stringify(entry);
  }

  // Dev: human-readable
  const prefix = level === "info" ? "" : `[${level.toUpperCase()}] `;
  const ctx = context ? ` ${JSON.stringify(redactValue(context))}` : "";
  return `${prefix}${message}${ctx}`;
}

type LogFn = (
  contextOrMessage: Record<string, unknown> | string,
  message?: string,
) => void;

interface Logger {
  info: LogFn;
  warn: LogFn;
  error: LogFn;
  debug: LogFn;
  child: (context: Record<string, unknown>) => Logger;
}

function createLogger(baseContext?: Record<string, unknown>): Logger {
  const merge = (ctx: Record<string, unknown> | undefined) =>
    baseContext ? { ...baseContext, ...ctx } : ctx;

  const log = (
    level: string,
    fn: typeof console.log,
  ): LogFn =>
    (ctxOrMsg, msg?) => {
      if (typeof ctxOrMsg === "string") {
        fn(formatMessage(level, baseContext, ctxOrMsg));
      } else {
        fn(formatMessage(level, merge(ctxOrMsg), msg ?? ""));
      }
    };

  return {
    info: log("info", console.log),
    warn: log("warn", console.warn),
    error: log("error", console.error),
    debug: log("debug", console.debug),
    child: (context) => createLogger(merge(context)),
  };
}

/**
 * Singleton logger instance.
 *
 * Production: structured JSON to stdout.
 * Development: formatted text to stdout.
 */
export const logger: Logger = createLogger();

export { createLogger };
