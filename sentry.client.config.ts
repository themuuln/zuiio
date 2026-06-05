// This file configures the initialization of Sentry on the client.
// The config you add here will be used whenever the browser loads a page.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://f432265ac8a6824ede3d3ee81b29ecc6@o4511472318939136.ingest.de.sentry.io/4511472327917648",

  // 15% in production, 100% in dev for full debugging.
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.15 : 1.0,

  // Enable logs to be sent to Sentry
  enableLogs: true,

  // Enable sending user PII (Personally Identifiable Information)
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/options/#sendDefaultPii
  sendDefaultPii: true,

  // If you want to set a uniform sample rate for all routes automatically,
  // you can use the `browserTracingIntegration` option.
  // integration: Sentry.browserTracingIntegration(),
});
