"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";
import { reportError } from "@/lib/sentry-report";

export default function RootErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    reportError(error, "root");
  }, [error]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-4">
      <div className="text-center">
        <Typography.H1 className="text-6xl font-semibold text-destructive/30">
          500
        </Typography.H1>
        <Typography.H2 className="mt-4 text-xl font-semibold">
          Something went wrong
        </Typography.H2>
        <Typography.Muted className="mt-2 text-muted-foreground">
          An unexpected error occurred. Please try again.
        </Typography.Muted>
        <div className="mt-6 flex items-center justify-center gap-3">
          <Button onClick={reset} variant="default">
            Try again
          </Button>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
