"use client";

import { useEffect } from "react";
import { PageErrorState } from "@/components/page-state";
import { reportError } from "@/lib/sentry-report";

export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    reportError(error, "[locale]");
  }, [error]);

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-5xl px-4 py-10 sm:px-6">
      <PageErrorState
        title="Something went wrong"
        description={error.message || "An unexpected error occurred."}
        onRetry={reset}
        className="my-auto"
      />
    </div>
  );
}
