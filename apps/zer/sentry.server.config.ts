import * as Sentry from "@sentry/nextjs";
import { supabaseIntegration } from "@supabase/sentry-js-integration";
import { SupabaseClient } from "@supabase/supabase-js";
import { setCaptureHandler } from "@zuiio/capture";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // 5% in production (reduced from 15% to cut CPU overhead), 100% in dev.
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.05 : 1.0,

  // Enable logs to be sent to Sentry
  enableLogs: true,

  // Enable sending user PII (Personally Identifiable Information)
  sendDefaultPii: process.env.NODE_ENV !== "production",

  integrations: [
    supabaseIntegration(SupabaseClient, Sentry, {
      tracing: false,
      breadcrumbs: true,
      errors: true,
    }),
    Sentry.nativeNodeFetchIntegration({
      ignoreOutgoingRequests: (url) => {
        return url.startsWith(`${supabaseUrl}/rest`);
      },
    }),
  ],
});

// Wire Sentry into @zuiio/capture so every capture() call reaches Sentry
setCaptureHandler((error, ctx) => {
  Sentry.captureException(
    error instanceof Error ? error : new Error(String(error)),
    { extra: ctx },
  );
});
