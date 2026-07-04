/**
 * Structured logger interface.
 *
 * Framework-agnostic base that can be backed by pino on the server
 * or console in browser/RN environments.
 *
 * @module
 */

export interface Logger {
  trace?(...args: unknown[]): void;
  debug(...args: unknown[]): void;
  info(...args: unknown[]): void;
  warn(...args: unknown[]): void;
  error(...args: unknown[]): void;
  child?(bindings: Record<string, unknown>): Logger;
}

/**
 * Create a child logger with bound context.
 */
export function createChildLogger(
  parent: Logger,
  context: Record<string, unknown>,
): Logger {
  if (parent.child) {
    return parent.child(context);
  }

  const prefix = `[${Object.entries(context)
    .map(([k, v]) => `${k}=${String(v)}`)
    .join(" ")}]`;

  return {
    trace: parent.trace
      ? (...args: unknown[]) =>
          (parent.trace as (...args: unknown[]) => void)(prefix, ...args)
      : undefined,
    debug: (...args: unknown[]) => parent.debug(prefix, ...args),
    info: (...args: unknown[]) => parent.info(prefix, ...args),
    warn: (...args: unknown[]) => parent.warn(prefix, ...args),
    error: (...args: unknown[]) => parent.error(prefix, ...args),
  };
}

/**
 * Default console-based logger.
 * Suitable for browser, RN, and simple server environments.
 */
export const defaultLogger: Logger = console;
