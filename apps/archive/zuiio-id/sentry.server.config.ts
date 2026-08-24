import * as Sentry from "@sentry/nextjs";
import { supabaseIntegration } from "@supabase/sentry-js-integration";
import { SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

Sentry.init({
  dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.05 : 1,
  enableLogs: true,
  sendDefaultPii: process.env.NODE_ENV !== "production",
  tracePropagationTargets: [/^\//u],
  integrations: [
    supabaseIntegration(SupabaseClient, Sentry, {
      tracing: false,
      breadcrumbs: true,
      errors: true,
    }),
    Sentry.nativeNodeFetchIntegration({
      ignoreOutgoingRequests: (url) => url.startsWith(`${supabaseUrl}/rest`),
    }),
  ],
});
