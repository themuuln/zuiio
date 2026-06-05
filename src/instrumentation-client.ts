// This file configures the initialization of Sentry on the client.
// The added config here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://f432265ac8a6824ede3d3ee81b29ecc6@o4511472318939136.ingest.de.sentry.io/4511472327917648",

  integrations: [
    Sentry.replayIntegration(),
    Sentry.feedbackIntegration({
      autoInject: true,
      showBranding: false,
      theme: {
        dark: {
          background: "hsl(222.2 84% 4.9%)",
          Foreground: "hsl(210 40% 98%)",
          border: "hsl(217.2 32.6% 17.5%)",
        },
        light: {
          background: "hsl(0 0% 100%)",
          Foreground: "hsl(222.2 84% 4.9%)",
          border: "hsl(214.3 31.8% 91.4%)",
        },
      },
    }),
  ],

  // 15% in production, 100% in dev for full debugging.
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.15 : 1.0,
  // Enable logs to be sent to Sentry
  enableLogs: true,

  // Define how likely Replay events are sampled.
  // This sets the sample rate to be 10%. You may want this to be 100% while
  // in development and sample at a lower rate in production
  replaysSessionSampleRate: 0.1,

  // Define how likely Replay events are sampled when an error occurs.
  replaysOnErrorSampleRate: 1.0,

  // Enable sending user PII (Personally Identifiable Information)
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/options/#sendDefaultPii
  sendDefaultPii: true,
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
