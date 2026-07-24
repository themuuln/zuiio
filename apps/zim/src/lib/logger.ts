import "server-only";

interface LogEntry {
  timestamp: string;
  level: "info" | "warn" | "error";
  component: string;
  action: string;
  duration?: number;
  error?: string;
  stack?: string;
  meta?: Record<string, unknown>;
}

interface Logger {
  info: (action: string, meta?: Record<string, unknown>) => void;
  warn: (action: string, meta?: Record<string, unknown>) => void;
  error: (action: string, err: unknown, meta?: Record<string, unknown>) => void;
  timer: (action: string) => () => number;
}

function serializeError(err: unknown): { error: string; stack?: string } {
  if (err instanceof Error) {
    return { error: err.message, stack: err.stack };
  }
  return { error: String(err) };
}

function log(entry: LogEntry): void {
  try {
    console.log(JSON.stringify(entry));
  } catch {
    // silent — logger must never throw
  }
}

/**
 * Structured JSON logger. Outputs one JSON line per call to stdout.
 *
 * Usage:
 *   const logger = createLogger("provider:firsty");
 *   const elapsed = logger.timer("getCatalog");
 *   const data = await fetchCatalog();
 *   logger.info("getCatalog", { duration: elapsed(), count: data.length });
 */
export function createLogger(component: string): Logger {
  return {
    info(action, meta) {
      log({ timestamp: new Date().toISOString(), level: "info", component, action, meta });
    },
    warn(action, meta) {
      log({ timestamp: new Date().toISOString(), level: "warn", component, action, meta });
    },
    error(action, err, meta) {
      const { error, stack } = serializeError(err);
      log({ timestamp: new Date().toISOString(), level: "error", component, action, error, stack, meta });
    },
    timer(action) {
      const start = performance.now();
      return () => Math.round(performance.now() - start);
    },
  };
}
