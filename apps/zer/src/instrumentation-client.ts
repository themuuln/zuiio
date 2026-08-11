import * as Sentry from "@sentry/nextjs";
import { supabaseIntegration } from "@supabase/sentry-js-integration";
import { SupabaseClient } from "@supabase/supabase-js";
import { setCaptureHandler } from "@zuiio/capture";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Disable PII in production to prevent leaking user data.
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.05 : 1.0,

  // Session Replay: 10% of sessions, 100% of error sessions
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  // Enable logs to be sent to Sentry
  enableLogs: true,

  // Only send PII in non-production environments.
  sendDefaultPii: process.env.NODE_ENV !== "production",

  // Only propagate trace headers to our own origins (never third parties).
  tracePropagationTargets: [/^\//],

  integrations: [
    supabaseIntegration(SupabaseClient, Sentry, {
      tracing: true,
      breadcrumbs: true,
      errors: true,
    }),
    Sentry.browserTracingIntegration({
      shouldCreateSpanForRequest: (url) => {
        return !url.startsWith(`${supabaseUrl}/rest`);
      },
    }),
    Sentry.replayIntegration(),
  ],
});

// Wire Sentry into @zuiio/capture so every capture() call reaches Sentry
setCaptureHandler((error, ctx) => {
  Sentry.captureException(
    error instanceof Error ? error : new Error(String(error)),
    { extra: ctx },
  );
});

// Instrument router navigations (Next.js 15.2+, Sentry 9.12+)
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
