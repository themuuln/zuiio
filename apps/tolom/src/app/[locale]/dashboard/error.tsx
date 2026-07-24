"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { reportError } from "@/lib/sentry-report";

export default function DashboardError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  const t = useTranslations() as (
    key: string,
    values?: Record<string, string | number>,
  ) => string;

  useEffect(() => {
    reportError(error, "dashboard");
  }, [error]);

  return (
    <div className="flex h-full items-center justify-center p-12">
      <div className="flex max-w-sm flex-col items-center gap-4 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10">
          <AlertTriangle className="size-6 text-destructive" />
        </div>
        <h2 className="text-lg font-semibold">
          {t("error.boundaryTitle") || "Something went wrong"}
        </h2>
        <p className="text-sm text-muted-foreground">
          {error.message ||
            t("error.boundaryDescription") ||
            "An unexpected error occurred. Please try again."}
        </p>
        <Button onClick={() => unstable_retry()}>
          <RefreshCw className="mr-2 size-4" />
          {t("common.retry") || "Try again"}
        </Button>
      </div>
    </div>
  );
}
