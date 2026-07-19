"use client";

import * as Sentry from "@sentry/nextjs";
import { Button } from "@/components/ui/button";

export function TestGlitchTip() {
  const sendError = () => {
    // Manual capture — always works
    Sentry.captureException(new Error("Test GlitchTip error from Onoo"));

    // Unhandled via setTimeout — bypasses React's error handling
    setTimeout(() => {
      throw new Error("Test GlitchTip unhandled error from Onoo");
    }, 0);
  };

  return (
    <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-6">
      <h2 className="mb-2 font-display text-lg font-semibold">
        🛠️ GlitchTip Test
      </h2>
      <p className="mb-4 text-sm text-muted-foreground">
        Click the button to send a test error to GlitchTip.
      </p>
      <Button variant="destructive" onClick={sendError}>
        Send test error
      </Button>
    </div>
  );
}
