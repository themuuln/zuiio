"use client";

import { capture } from "@zuiio/capture";
import { useEffect } from "react";

/**
 * Global client-side error handler.
 *
 * Catches unhandled promise rejections that would otherwise be silently
 * swallowed. Included in the root layout to ensure coverage from the
 * earliest render.
 */
export function ErrorHandler() {
  useEffect(() => {
    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      capture(event.reason, {
        context: "global unhandledrejection",
      });
    };

    const onError = (event: ErrorEvent) => {
      // Skip errors already captured by React error boundaries
      if (event.error && event.filename) {
        capture(event.error || event.message, {
          context: "global onerror",
          extra: {
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
          },
        });
      }
    };

    window.addEventListener("unhandledrejection", onUnhandledRejection);
    window.addEventListener("error", onError);

    return () => {
      window.removeEventListener("unhandledrejection", onUnhandledRejection);
      window.removeEventListener("error", onError);
    };
  }, []);

  return null;
}
