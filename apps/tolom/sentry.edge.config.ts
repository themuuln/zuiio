import * as Sentry from "@sentry/nextjs";
import { supabaseIntegration } from "@supabase/sentry-js-integration";
import { SupabaseClient } from "@supabase/supabase-js";
import { setCaptureHandler } from "@zuiio/capture";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

if (process.env.NODE_ENV === "production") {
  Sentry.init({
    dsn:
      process.env.NEXT_PUBLIC_SENTRY_DSN ||
      "https://f432265ac8a6824ede3d3ee81b29ecc6@o4511472318939136.ingest.de.sentry.io/4511472327917648",

    // 15% in production
    tracesSampleRate: 0.15,

    // Enable logs to be sent to Sentry
    enableLogs: true,

    // Enable sending user PII
    sendDefaultPii: true,

    integrations: [
      supabaseIntegration(SupabaseClient, Sentry, {
        tracing: true,
        breadcrumbs: true,
        errors: true,
      }),
      Sentry.winterCGFetchIntegration({
        breadcrumbs: true,
        shouldCreateSpanForRequest: (url) => {
          return !url.startsWith(`${supabaseUrl}/rest`);
        },
      }),
    ],
  });
}

// Wire Sentry into @zuiio/capture so every capture() call reaches Sentry
setCaptureHandler((error, ctx) => {
  Sentry.captureException(
    error instanceof Error ? error : new Error(String(error)),
    { extra: ctx },
  );
});
