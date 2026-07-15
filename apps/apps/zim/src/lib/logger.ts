interface LogEntry {
  timestamp: string;
  level: "info" | "warn" | "error";
  component: string;
  action: string;
  provider?: string;
  orderId?: string;
  duration?: number;
  error?: string;
  meta?: Record<string, unknown>;
}

type LogMethod = (action: string, meta?: Record<string, unknown>) => void;
type ErrorLogMethod = (
  action: string,
  error: Error | unknown,
  meta?: Record<string, unknown>,
) => void;
type TimerMethod = (action: string) => () => number;

interface Logger {
  info: LogMethod;
  warn: LogMethod;
  error: ErrorLogMethod;
  timer: TimerMethod;
}

function serializeError(err: unknown): string {
  if (err instanceof Error) {
    const parts = [err.message];
    if (err.stack) parts.push(err.stack);
    return parts.join(" | ");
  }
  return String(err);
}

function emit(entry: LogEntry): void {
  try {
    console.log(JSON.stringify(entry));
  } catch {
    // Logger failures are silent
  }
}

export function createLogger(component: string): Logger {
  function log(level: LogEntry["level"], action: string, meta?: Record<string, unknown>, error?: string): void {
    emit({ timestamp: new Date().toISOString(), level, component, action, ...(error !== undefined && { error }), ...(meta && { meta }) });
  }

  return {
    info(action, meta) {
      log("info", action, meta);
    },

    warn(action, meta) {
      log("warn", action, meta);
    },

    error(action, err, meta) {
      log("error", action, meta, serializeError(err));
    },

    timer(_action) {
      const start = performance.now();
      return () => Math.round(performance.now() - start);
    },
  };
}
