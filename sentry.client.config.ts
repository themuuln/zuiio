import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Adjust this value in production, or use tracesSampler for fine-grained control
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1,

  // Capture Replay on 10% of sessions, plus all sessions that had an error
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  // Only enable in production
  enabled: process.env.NODE_ENV === "production",

  // Ignore common noise
  ignoreErrors: [
    "ResizeObserver loop completed with undelivered notifications.",
    "Non-Error promise rejection captured",
  ],
});
