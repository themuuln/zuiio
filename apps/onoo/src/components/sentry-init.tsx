"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

/**
 * Initialize Sentry/GlitchTip error tracking on the client.
 * Must be rendered inside a Client Component boundary.
 * Turbopack does not support withSentryConfig, so we init manually.
 */
export function SentryInit() {
  useEffect(() => {
    if ((Sentry as unknown as { isInitialized?: () => boolean }).isInitialized?.()) return;
    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_GLITCHTIP_DSN,
      tracesSampleRate: 0,
      replaysSessionSampleRate: 0,
      replaysOnErrorSampleRate: 0,
      enabled: true,
    });
  }, []);

  return null;
}
